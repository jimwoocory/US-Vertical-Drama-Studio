import './fixtures/dsh-tools-contract-mock.mjs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { productionFixture } from './fixtures/production-v2.mjs'
import { runPromptQA } from '../../scripts/v9-prompt-qa-validation.mjs'
// Dynamic import ensures the explicit mock SDK resolver is installed first.
const { registerStage09ReviewTool } = await import('../stage09-review-tool.js')

test('v2 tool resolves only a host package reference and returns the exact scoped digest', async t => {
  const { pkg, options } = productionFixture(t)
  let tool; let starts = 0
  registerStage09ReviewTool({ tools: { register: d => { tool = d; return () => {} } }, subagents: { start: async () => {
    starts++
    return { id: 'MOCK-SDK-RUN', result: Promise.resolve({ stopReason: 'completed', structured: { review_status: 'PASS', defects: [], return_to_stage: 'none', evidence: ['Synthetic focused review.'] } }), dispose: async () => {} }
  } } }, { resolveProductionPackage: ref => ref === 'CURRENT' ? { package: pkg, mediaRoot: options.mediaRoot } : null })
  const qa = runPromptQA(pkg, options)
  const args = { production_package_ref: 'CURRENT', input_digest: qa.input_digest, qa_gate: 'PASS', qa_summary: {}, trigger: 'user_requested', review_question: 'Is the reaction readable?', stable_refs: ['SHOT-1-1'], required_evidence: ['Synthetic reaction.'] }
  const exec = { agent: {}, signal: new AbortController().signal }
  const result = await tool.execute(args, exec)
  assert.equal(result.input_digest, qa.input_digest)
  assert.deepEqual(result.review_scope, ['SHOT-1-1'])
  assert.equal(starts, 1)
  await assert.rejects(tool.execute({ ...args, input_digest: 'old' }, exec), /digest_mismatch/)
  await assert.rejects(tool.execute({ ...args, production_package_ref: 'UNKNOWN' }, exec), /package_unavailable/)
  assert.equal(starts, 1)
})
