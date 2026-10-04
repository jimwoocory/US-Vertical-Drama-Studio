/** DSH public-service adapter for V10 stage model routing. */

export function createDshRoutingDeps(ctx) {
  const sessionController = ctx.get('sessionController')
  const agentDefaultModel = ctx.get('agentDefaultModel')
  const sessionProjections = ctx.get('sessionProjections')

  if (typeof sessionController?.selectModel !== 'function'
      || typeof sessionController?.modelCatalog !== 'function') {
    throw new Error('USVDS routing requires DSH sessionController.selectModel/modelCatalog')
  }

  return {
    async modelCatalog() {
      return sessionController.modelCatalog()
    },

    async selectModel({ sessionId, provider, model, reasoningEffort }) {
      return sessionController.selectModel({
        sessionId,
        provider,
        model,
        ...(reasoningEffort === undefined ? {} : { reasoningEffort }),
      })
    },

    currentDefault() {
      return agentDefaultModel?.currentSelection?.()
    },

    async saveDefault(selection) {
      await agentDefaultModel?.saveSelection?.(selection)
    },

    currentSessionSelection(agent) {
      const projection = sessionProjections?.stateOf?.(agent?.session, 'modelSelection')
      const pending = projection?.pending
      if (pending && typeof pending.provider === 'string' && typeof pending.model === 'string') {
        return {
          provider: pending.provider,
          model: pending.model,
          ...(pending.reasoningEffort === undefined ? {} : { reasoningEffort: pending.reasoningEffort }),
        }
      }

      const header = agent?.session?.requestHeader?.()
      if (header?.config?.provider && header?.config?.model) {
        return {
          provider: header.config.provider,
          model: header.config.model,
          ...(header.config.reasoningEffort === undefined || header.adapterDefaults?.reasoningEffort === true
            ? {}
            : { reasoningEffort: header.config.reasoningEffort }),
        }
      }

      return agentDefaultModel?.currentSelection?.()
    },
  }
}

export function safeError(error) {
  const code = typeof error?.code === 'string' ? error.code : 'routing/error'
  const message = error instanceof Error ? error.message : String(error)
  return {
    code,
    message: redactText(message),
  }
}

function redactText(value) {
  return String(value)
    .replace(/Bearer\s+\S+/giu, 'Bearer [REDACTED]')
    .replace(/sk-[A-Za-z0-9_-]+/gu, '[REDACTED]')
    .replace(/[A-Za-z]:[\\/](?:Users|Documents and Settings)[\\/][^\s"'<>]+/giu, '[REDACTED_PATH]')
}
