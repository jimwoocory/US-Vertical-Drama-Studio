import { defineTool } from '@deepseek-ai/dsh-tools'
import { executeControlledStage09Review } from './stage09-review-executor.js'

const TOOL_OUTPUT = {
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      provider: { type: 'string', required: true },
      run_id: { type: 'string', required: true },
      estimated_tokens: { type: 'integer', required: true },
      review_status: { type: 'string', required: true, enum: ['PASS', 'NEEDS_REVISION', 'BLOCKED'] },
      defects: { type: 'array', required: true, items: { type: 'json' } },
      return_to_stage: { type: 'string', required: true, enum: ['06', '07', '08', 'upstream', 'none'] },
      evidence: { type: 'array', required: true, items: { type: 'json' } },
      input_digest: { type: 'string' },
      policy_version: { type: 'string' },
      review_scope: { type: 'array', items: { type: 'string' } },
    },
  },
  render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
}

/** Register the opt-in model-facing entrypoint for the controlled reviewer. */
export function registerStage09ReviewTool(ctx, { provider = 'spawn', resolveProductionPackage } = {}) {
  return ctx.tools.register(defineTool({
    name: 'dramago_stage09_review',
    description: 'Run exactly one read-only Stage 09 reviewer after machine QA has passed. Call only when the user explicitly requests a second review or a specific subjective QA question remains. Never call for other stages, deterministic defects, broad project inspection, or parallel review. The reviewer receives only the supplied focused packet and no tools.',
    parameters: {
      qa_gate: { type: 'string', required: true, enum: ['PASS'], description: 'The completed machine QA gate. Only PASS is permitted.' },
      qa_summary: { type: 'json', required: true, description: 'Machine QA summary only.' },
      trigger: { type: 'string', required: true, enum: ['user_requested', 'subjective_open_question'] },
      review_question: { type: 'string', required: true, description: 'One focused subjective review question.' },
      stable_refs: { type: 'array', required: true, items: { type: 'string' }, description: 'Only stable references relevant to the question.' },
      required_evidence: { type: 'array', required: true, items: { type: 'string' }, description: 'Only the necessary VIDEO, SHOT, or asset evidence.' },
      production_package_ref: { type: 'string', description: 'Host-resolved v2 package reference; never an arbitrary file path.' },
      input_digest: { type: 'string', description: 'Exact current v2 machine-input digest.' },
    },
    output: TOOL_OUTPUT,
    isConcurrencySafe: () => false,
    async execute(args, exec) {
      const resolved = args.production_package_ref && typeof resolveProductionPackage === 'function' ? await resolveProductionPackage(args.production_package_ref) : null
      if (args.production_package_ref && !resolved) throw new Error('production_package_unavailable')
      const result = await executeControlledStage09Review({
        subagents: ctx.subagents,
        parent: exec.agent,
        signal: exec.signal,
        provider,
        qaResult: { gate: args.qa_gate, summary: args.qa_summary, ...(resolved ? { contract_version: 2, input_digest: args.input_digest } : {}) },
        ...(resolved ? { productionPackage: resolved.package, mediaRoot: resolved.mediaRoot } : {}),
        trigger: args.trigger,
        reviewQuestion: args.review_question,
        stableRefs: args.stable_refs,
        requiredEvidence: args.required_evidence,
      })
      if (!result.executed) throw new Error(`Stage 09 controlled review was not started: ${result.reason}`)
      return {
        provider: result.provider,
        run_id: result.run_id,
        estimated_tokens: result.estimated_tokens,
        ...(resolved ? { input_digest: result.input_digest, policy_version: result.policy_version, review_scope: result.review_scope } : {}),
        ...result.review,
      }
    },
  }))
}
