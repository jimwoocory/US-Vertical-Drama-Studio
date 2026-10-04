import { resolveStageModel, stageRouteFor } from './routes.js'
import { safeError } from './deps.js'

export const ROUTING_SCHEMA = 'usvd.stage-model-routing/v1'

export function createSerializedStageRouter() {
  let tail = Promise.resolve()
  return input => {
    const operation = tail.then(() => routeStageModel(input))
    tail = operation.then(() => undefined, () => undefined)
    return operation
  }
}

export async function routeStageModel({ deps, skill, sessionId, baselineSession, log }) {
  const route = stageRouteFor(skill)
  if (route === undefined) {
    return decision({
      skill,
      target: null,
      status: 'unmapped',
      reason: 'SKILL_NOT_ROUTED',
      selected: null,
    })
  }

  const catalog = await deps.modelCatalog()
  const resolved = resolveStageModel(catalog, skill)
  if (resolved.kind !== 'resolved') {
    const result = decision({
      skill,
      target: route.target,
      status: 'blocked',
      reason: resolved.reason,
      selected: null,
    })
    log?.(result)
    return result
  }

  const baselineDefault = deps.currentDefault?.()
  let selected
  try {
    const response = await deps.selectModel({
      sessionId,
      provider: resolved.selected.provider,
      model: resolved.selected.model,
    })
    selected = response?.selected ?? resolved.selected
  } catch (error) {
    const result = decision({
      skill,
      target: route.target,
      status: 'blocked',
      reason: 'MODEL_SELECTION_FAILED',
      selected: null,
      error: safeError(error),
    })
    log?.(result)
    return result
  }

  // DSH selectModel arms the Session one-shot AND saves the global default.
  // Restore the global default immediately; the Session one-shot remains armed.
  if (baselineDefault !== undefined) {
    const now = deps.currentDefault?.()
    if (sameRoute(now, selected)) {
      try {
        await deps.saveDefault?.(baselineDefault)
      } catch (error) {
        const result = decision({
          skill,
          target: route.target,
          status: 'blocked',
          reason: 'DEFAULT_RESTORE_FAILED',
          selected: compactSelection(selected),
          error: safeError(error),
        })
        log?.(result)
        return result
      }
    }
  }

  const result = decision({
    skill,
    target: route.target,
    status: 'routed',
    reason: 'FIXED_STAGE_ROUTE',
    selected: {
      ...compactSelection(selected),
      name: resolved.selected.name,
    },
    baseline_session: compactSelection(baselineSession),
  })
  log?.(result)
  return result
}

function decision(fields) {
  return {
    schema: ROUTING_SCHEMA,
    ts: new Date().toISOString(),
    ...fields,
  }
}

export function sameRoute(a, b) {
  return Boolean(a && b && a.provider === b.provider && a.model === b.model)
}

function compactSelection(value) {
  if (!value?.provider || !value?.model) return null
  return {
    provider: value.provider,
    model: value.model,
    ...(value.reasoningEffort === undefined ? {} : { reasoningEffort: value.reasoningEffort }),
  }
}
