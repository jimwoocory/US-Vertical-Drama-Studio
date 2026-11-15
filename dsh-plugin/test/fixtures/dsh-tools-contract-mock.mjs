// Offline registration-contract test only. This is never imported by production.
// It does not test the installed DSH SDK or a live model/runtime connection.
import { registerHooks } from 'node:module'
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '@deepseek-ai/dsh-tools' && context.parentURL?.endsWith('/dsh-plugin/stage09-review-tool.js')) return { url: 'data:text/javascript,export const defineTool = definition => definition;', shortCircuit: true }
    return next(specifier, context)
  },
})
