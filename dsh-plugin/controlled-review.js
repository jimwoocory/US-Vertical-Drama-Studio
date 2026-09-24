/**
 * Stage 09 controlled-review POC.
 *
 * This module deliberately prepares and validates a review hand-off only. It
 * never starts an agent itself: the host runtime must opt in and enforce the
 * returned execution envelope before native delegation can happen.
 */
export const CONTROLLED_REVIEW_POLICY = Object.freeze({
  stage: '09-prompt-qa',
  defaultEnabled: false,
  machineQaGateRequired: 'PASS',
  maxConcurrentReviewers: 1,
  maxDelegationDepth: 1,
  maxRunsPerGate: 1,
  contextTokenBudget: 6000,
  permittedTriggers: Object.freeze(['user_requested', 'subjective_open_question']),
  permissions: Object.freeze({
    readOnly: true,
    mayModifyProjectDocuments: false,
    maySpawnSubagents: false,
    mayInvokeDownstreamSkills: false,
    maySubmitMediaJobs: false,
  }),
  resultStatuses: Object.freeze(['PASS', 'NEEDS_REVISION', 'BLOCKED']),
  returnStages: Object.freeze(['06', '07', '08', 'upstream', 'none']),
});

const asTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');
const asUniqueStrings = (value) => [
  ...new Set((Array.isArray(value) ? value : []).map(asTrimmedString).filter(Boolean)),
];
const estimateTokens = (value) => Math.ceil(JSON.stringify(value).length / 4);
const rejected = (reason) => ({ eligible: false, reason, policy: CONTROLLED_REVIEW_POLICY });

/**
 * Create the smallest permissible packet for one Stage 09 read-only reviewer.
 * A caller must supply a focused question, so the reviewer never receives a
 * full chat or an unbounded project dump.
 */
export function prepareControlledStage09Review({
  qaResult,
  trigger,
  reviewQuestion,
  stableRefs,
  requiredEvidence,
} = {}) {
  if (qaResult?.gate !== CONTROLLED_REVIEW_POLICY.machineQaGateRequired) {
    return rejected('machine_qa_must_pass_before_review');
  }
  if (!CONTROLLED_REVIEW_POLICY.permittedTriggers.includes(trigger)) {
    return rejected('review_trigger_not_permitted');
  }

  const question = asTrimmedString(reviewQuestion);
  if (!question) return rejected('review_question_required');

  const contextPacket = {
    stage: CONTROLLED_REVIEW_POLICY.stage,
    current_gate_summary: `Stage 09 machine QA gate: ${qaResult.gate}`,
    machine_qa_summary: qaResult.summary ?? null,
    unresolved_subjective_questions: [question],
    stable_refs: asUniqueStrings(stableRefs),
    required_video_shot_asset_evidence: asUniqueStrings(requiredEvidence),
  };
  const estimatedTokens = estimateTokens(contextPacket);
  if (estimatedTokens > CONTROLLED_REVIEW_POLICY.contextTokenBudget) {
    return rejected('review_context_packet_exceeds_budget');
  }

  return {
    eligible: true,
    policy: CONTROLLED_REVIEW_POLICY,
    estimated_tokens: estimatedTokens,
    context_packet: contextPacket,
    execution: {
      reviewer_count: CONTROLLED_REVIEW_POLICY.maxConcurrentReviewers,
      delegation_depth: CONTROLLED_REVIEW_POLICY.maxDelegationDepth,
      read_only: CONTROLLED_REVIEW_POLICY.permissions.readOnly,
      release_on_completion: true,
    },
  };
}

/** Validate the narrow result shape returned by a configured native reviewer. */
export function validateControlledStage09ReviewResult(result = {}) {
  if (!CONTROLLED_REVIEW_POLICY.resultStatuses.includes(result.review_status)) {
    return { valid: false, reason: 'invalid_review_status' };
  }
  if (!CONTROLLED_REVIEW_POLICY.returnStages.includes(result.return_to_stage)) {
    return { valid: false, reason: 'invalid_return_to_stage' };
  }
  if (!Array.isArray(result.defects)) return { valid: false, reason: 'defects_must_be_an_array' };
  if (!Array.isArray(result.evidence)) return { valid: false, reason: 'evidence_must_be_an_array' };
  return { valid: true };
}
