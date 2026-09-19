import {
  CONTROLLED_REVIEW_POLICY,
  prepareControlledStage09Review,
  validateControlledStage09ReviewResult,
} from './controlled-review.js'

export const STAGE09_REVIEW_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    review_status: { type: 'string', enum: ['PASS', 'NEEDS_REVISION', 'BLOCKED'] },
    defects: { type: 'array', items: { type: 'json' } },
    return_to_stage: { type: 'string', enum: ['06', '07', '08', 'upstream', 'none'] },
    evidence: { type: 'array', items: { type: 'json' } },
  },
  required: ['review_status', 'defects', 'return_to_stage', 'evidence'],
}

export function buildStage09ReviewPrompt(contextPacket) {
  return [
    'You are the sole Stage 09 reviewer for a vertical-drama prompt QA gate.',
    'Review only the supplied packet. You are read-only: do not edit files, submit jobs, call tools, create agents, or request more project material.',
    'Assess the focused subjective question using stable references and evidence in the packet.',
    'Return only the configured structured result. Use PASS only when no revision is needed; otherwise use NEEDS_REVISION or BLOCKED and identify the return stage.',
    'Review packet:',
    JSON.stringify(contextPacket),
  ].join('\n\n')
}

const unavailable = (reason) => ({ executed: false, reason, policy: CONTROLLED_REVIEW_POLICY })

/**
 * Execute the one allowed native delegation: a fresh, one-shot, tool-free
 * Stage 09 reviewer. The caller owns the parent Agent and cancellation signal;
 * this helper always disposes the child after collecting its final result.
 */
export async function executeControlledStage09Review({
  subagents,
  parent,
  signal,
  provider = 'spawn',
  ...reviewInput
} = {}) {
  const prepared = prepareControlledStage09Review(reviewInput)
  if (!prepared.eligible) return unavailable(prepared.reason)
  if (subagents === undefined || typeof subagents.start !== 'function') {
    return unavailable('native_subagent_runtime_unavailable')
  }
  if (typeof subagents.getProvider === 'function' && subagents.getProvider(provider) === undefined) {
    return unavailable('native_reviewer_provider_unavailable')
  }

  const run = await subagents.start(provider, {
    label: 'DramaGo Stage 09 controlled review',
    prompt: [{ type: 'text', text: buildStage09ReviewPrompt(prepared.context_packet) }],
    parent,
    signal,
    maxDepth: CONTROLLED_REVIEW_POLICY.maxDelegationDepth,
    // The reviewer receives no global tools, so it cannot change the project,
    // invoke a downstream workflow, or start another subagent.
    toolFilter: { allow: [] },
    persona: 'Act as a concise read-only Stage 09 reviewer. Return evidence-backed structured findings only.',
    outputSchema: STAGE09_REVIEW_OUTPUT_SCHEMA,
  })

  try {
    const outcome = await run.result
    if (outcome.stopReason !== 'completed') {
      throw new Error(`Controlled reviewer ended with ${outcome.stopReason}`)
    }
    const validation = validateControlledStage09ReviewResult(outcome.structured)
    if (!validation.valid) {
      throw new Error(`Controlled reviewer returned an invalid result: ${validation.reason}`)
    }
    return {
      executed: true,
      provider,
      run_id: run.id,
      estimated_tokens: prepared.estimated_tokens,
      review: outcome.structured,
    }
  } finally {
    await run.dispose()
  }
}
