import { createDshRoutingDeps, safeError } from './deps.js'
import { createSerializedStageRouter, sameRoute } from './router.js'
import { stageRouteFor } from './routes.js'

export const ROUTING_MARKER = 'USVD_STAGE_MODEL_ROUTE_V1'

export function registerStageModelRoutingHook(ctx, { log } = {}) {
  const deps = createDshRoutingDeps(ctx)
  const route = createSerializedStageRouter()

  return ctx.on('tools/post-execute', async (exec, result, next) => {
    const downstream = await next()
    if (downstream.kind !== 'accept' || result.isError || exec.name !== 'skill') return downstream

    const skill = exec.arguments?.name
    if (typeof skill !== 'string' || stageRouteFor(skill) === undefined) return downstream

    const agent = exec.agent
    if (!agent?.id || !agent.session) {
      return {
        kind: 'block',
        feedback: [{ type: 'text', text: 'USVDS stage routing requires a live DSH session.' }],
      }
    }

    exec.signal?.throwIfAborted?.()
    const baselineSession = deps.currentSessionSelection(agent)
    const baselineDefault = deps.currentDefault?.()
    const routed = await route({
      deps,
      skill,
      sessionId: agent.id,
      baselineSession,
      log,
    })

    if (routed.status !== 'routed') {
      return {
        kind: 'block',
        feedback: [{
          type: 'text',
          text: routed.reason === 'REQUIRED_MODEL_UNAVAILABLE'
            ? `USVDS model routing blocked: ${routed.target} is not available in the current DSH model catalog.`
            : `USVDS model routing blocked: ${routed.reason}.`,
        }],
      }
    }

    if (baselineSession && routed.selected && !sameRoute(baselineSession, routed.selected)) {
      scheduleSessionRevert({
        deps,
        agent,
        routedSelection: routed.selected,
        baselineSession,
        baselineDefault,
        log,
      })
    }

    return appendDecision(downstream, result, routed)
  })
}

function appendDecision(decision, result, routed) {
  if (Object.hasOwn(decision, 'value')) return decision
  const base = decision.content !== undefined ? decision.content : result.content
  return {
    ...decision,
    content: [
      ...(base ?? []),
      { type: 'text', text: `${ROUTING_MARKER}\n${JSON.stringify(routed)}` },
    ],
  }
}

/**
 * When the routed request header commits, arm one request with the Session's
 * original route so normal chat resumes on its prior model. Because
 * selectModel also writes the global default, immediately restore that global
 * default after arming the Session revert.
 */
export function scheduleSessionRevert({
  deps,
  agent,
  routedSelection,
  baselineSession,
  baselineDefault,
  log,
}) {
  const observe = agent.ctx
  if (!observe?.on) return

  const dispose = observe.on('session/event', (session, event) => {
    if (session !== agent.session || event.type !== 'request/header') return
    const header = event.data?.header?.config
    if (!sameRoute(header, routedSelection)) return
    dispose()

    void (async () => {
      try {
        await deps.selectModel({
          sessionId: agent.id,
          ...baselineSession,
        })

        if (baselineDefault !== undefined) {
          const now = deps.currentDefault?.()
          if (sameRoute(now, baselineSession)) await deps.saveDefault?.(baselineDefault)
        }

        log?.({
          schema: 'usvd.stage-model-routing-revert/v1',
          event: 'session_revert_armed',
          session_id: agent.id,
          restored: baselineSession,
        })
      } catch (error) {
        log?.({
          schema: 'usvd.stage-model-routing-revert/v1',
          event: 'session_revert_failed',
          session_id: agent.id,
          error: safeError(error),
        })
      }
    })()
  })
}
