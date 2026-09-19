import assert from 'node:assert/strict'
import test from 'node:test'
import { executeControlledStage09Review } from '../stage09-review-executor.js'
import { registerStage09ReviewTool } from '../stage09-review-tool.js'

const validReview = {
  review_status: 'NEEDS_REVISION',
  defects: [{ stable_ref: 'SHOT-02', issue: 'The reaction beat is too subtle.' }],
  return_to_stage: '07',
  evidence: [{ stable_ref: 'SHOT-02', observation: 'The eyeline change is not visible enough.' }],
}

test('native Stage 09 executor delegates one tool-free, depth-one reviewer and disposes it', async () => {
  const starts = []
  let disposed = false
  const subagents = {
    getProvider: (name) => name === 'spawn' ? { name } : undefined,
    start: async (provider, request) => {
      starts.push({ provider, request })
      return {
        id: 'review-run-01',
        result: Promise.resolve({ stopReason: 'completed', structured: validReview }),
        dispose: async () => { disposed = true },
      }
    },
  }

  const result = await executeControlledStage09Review({
    subagents,
    parent: { id: 'parent-agent' },
    signal: new AbortController().signal,
    qaResult: { gate: 'PASS', summary: { blocker: 0, major: 0 } },
    trigger: 'user_requested',
    reviewQuestion: 'Is the reveal readable before the cut?',
    stableRefs: ['VIDEO-01', 'SHOT-02'],
    requiredEvidence: ['SHOT-02 2–4s eyeline change'],
  })

  assert.equal(result.executed, true)
  assert.equal(result.run_id, 'review-run-01')
  assert.deepEqual(result.review, validReview)
  assert.equal(starts.length, 1)
  assert.equal(starts[0].provider, 'spawn')
  assert.equal(starts[0].request.maxDepth, 1)
  assert.deepEqual(starts[0].request.toolFilter, { allow: [] })
  assert.match(starts[0].request.prompt[0].text, /Review packet/)
  assert.ok(result.estimated_tokens <= 6000)
  assert.equal(disposed, true)
})

test('native Stage 09 executor never starts a reviewer before machine QA passes or without a provider', async () => {
  let calls = 0
  const subagents = {
    getProvider: () => undefined,
    start: async () => { calls += 1 },
  }

  const rejected = await executeControlledStage09Review({
    subagents,
    qaResult: { gate: 'REVISE' },
    trigger: 'user_requested',
    reviewQuestion: 'Is this readable?',
  })
  assert.equal(rejected.executed, false)
  assert.equal(rejected.reason, 'machine_qa_must_pass_before_review')

  const unavailable = await executeControlledStage09Review({
    subagents,
    qaResult: { gate: 'PASS', summary: {} },
    trigger: 'user_requested',
    reviewQuestion: 'Is this readable?',
  })
  assert.equal(unavailable.executed, false)
  assert.equal(unavailable.reason, 'native_reviewer_provider_unavailable')
  assert.equal(calls, 0)
})

test('Stage 09 tool registers one exclusive entrypoint and preserves executor boundaries', async () => {
  const registered = []
  const subagents = {
    getProvider: () => ({ name: 'spawn' }),
    start: async () => ({
      id: 'review-run-02',
      result: Promise.resolve({ stopReason: 'completed', structured: validReview }),
      dispose: async () => {},
    }),
  }
  const dispose = registerStage09ReviewTool({
    subagents,
    tools: { register: (definition) => { registered.push(definition); return () => 'disposed' } },
  })

  assert.equal(typeof dispose, 'function')
  assert.equal(registered.length, 1)
  const [tool] = registered
  assert.equal(tool.name, 'dramago_stage09_review')
  assert.equal(tool.isConcurrencySafe(), false)
  const value = await tool.execute({
    qa_gate: 'PASS',
    qa_summary: { blocker: 0, major: 0 },
    trigger: 'user_requested',
    review_question: 'Is the reveal readable before the cut?',
    stable_refs: ['SHOT-02'],
    required_evidence: ['SHOT-02 2–4s eyeline change'],
  }, { agent: { id: 'parent-agent' }, signal: new AbortController().signal })
  assert.equal(value.review_status, 'NEEDS_REVISION')
  assert.equal(value.return_to_stage, '07')
})
