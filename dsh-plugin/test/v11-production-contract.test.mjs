import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, writeFileSync, renameSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { productionFixture } from './fixtures/production-v2.mjs'
import { runPromptQA } from '../../scripts/v9-prompt-qa-validation.mjs'
import { validateAdapterPackage } from '../../scripts/v9-seedance-adapter-validation.mjs'
import { buildProductionSnapshot } from '../production-workbench.js'
import { prepareControlledStage09Review } from '../controlled-review.js'
import { executeControlledStage09Review } from '../stage09-review-executor.js'
import { classifyProductionDefect } from '../../scripts/v11-production-policy.mjs'
import { validateReferenceBindings, compileReferenceBindings } from '../../scripts/v11-reference-bindings.mjs'
import { analyzeArtifactFreshness, fingerprintGraph, DEPENDENCY_SCHEMA, artifactDigest } from '../../scripts/v11-artifact-freshness.mjs'
import { buildMediaMcpPlan, bindGenerateCall, applyMediaMcpJobReceipt, applyMediaMcpJobStatus } from '../../integrations/media-mcp/index.mjs'

test('v2 passes all deterministic checks with host-verified synthetic review and real fixture bytes', t => {
  const { pkg, options } = productionFixture(t)
  const qa = runPromptQA(pkg, options)
  assert.deepEqual(qa.defects, [])
  assert.equal(qa.machine_gate, 'PASS')
  assert.equal(qa.generation_ready, true, JSON.stringify(qa))
  const snap = buildProductionSnapshot(pkg, options)
  assert.equal(snap.generation_ready, true, JSON.stringify(snap.diagnostics))
  assert.ok(snap.diagnostics.some(d => d.code === 'long_micro_shot_without_reason' && d.severity === 'warning'))
  assert.equal(snap.summary.ready_to_generate, 8)
})

test('v2 short inserts are advisory; invalid timing and missing assets still block', t => {
  const { pkg, options, seal } = productionFixture(t)
  pkg.shots[0].time_out = pkg.shots[0].timeline_out_seconds = pkg.shots[0].duration_seconds = 0.3
  pkg.shots[1].time_in = pkg.shots[1].timeline_in_seconds = 0.3; pkg.shots[1].duration_seconds = 14.7
  seal()
  const snap = buildProductionSnapshot(pkg, options)
  assert.equal(snap.generation_ready, true, JSON.stringify(snap.diagnostics))
  assert.ok(snap.diagnostics.some(d => d.code === 'short_micro_shot_without_reason' && d.severity === 'warning'))
  pkg.shots[0].duration_seconds = 5
  assert.equal(buildProductionSnapshot(pkg, options).generation_ready, false)
  pkg.assets[0].status = 'pending_approval'
  assert.equal(runPromptQA(pkg, options).machine_gate, 'BLOCKED')
})

test('heuristics and style tokens are advisory in v2 while unknown rules fail closed', t => {
  const { pkg, options, seal } = productionFixture(t)
  pkg.videos[0].video_master_prompt += ' cinematic ' + 'detail '.repeat(300)
  seal()
  const qa = runPromptQA(pkg, options)
  assert.equal(qa.machine_gate, 'PASS')
  assert.ok(qa.defects.every(d => d.rule_tier === 'craft_default' && d.severity === 'minor'))
  assert.equal(classifyProductionDefect({ rule: 'future_undefined_rule', severity: 'minor' }).gate_effect, 'block')
  assert.deepEqual(runPromptQA(pkg, options), qa)
})

test('machine pass never authorizes absent, forged, stale or self-authored review', t => {
  const { pkg, options } = productionFixture(t)
  assert.equal(runPromptQA(pkg, { mediaRoot: options.mediaRoot }).generation_ready, false)
  pkg.review_receipt.trusted = true
  assert.equal(runPromptQA(pkg, options).review_gate, 'PENDING')
  delete pkg.review_receipt.trusted
  pkg.review_receipt.reviewer_id = pkg.review_receipt.author_id
  assert.equal(runPromptQA(pkg, options).generation_ready, false)
})

test('v2 controlled review recomputes machine checks and binds the exact input digest', t => {
  const { pkg, options } = productionFixture(t)
  const qa = runPromptQA(pkg, options)
  const input = { qaResult: qa, productionPackage: pkg, mediaRoot: options.mediaRoot, trigger: 'user_requested', reviewQuestion: 'Is the reveal clear?', stableRefs: ['SHOT-1-1'], requiredEvidence: ['Synthetic reaction.'] }
  assert.equal(prepareControlledStage09Review(input).eligible, true)
  pkg.videos[0].duration_seconds = 16
  assert.equal(prepareControlledStage09Review(input).eligible, false)
  assert.equal(prepareControlledStage09Review({ ...input, productionPackage: undefined }).eligible, false)
})

test('reference scopes, real media, versions, pending plans and modes are enforced', t => {
  const { pkg, options, mediaRoot } = productionFixture(t)
  assert.deepEqual(validateReferenceBindings(pkg, options), [])
  const first = structuredClone(pkg.reference_bindings[0])
  for (const patch of [{ status: 'pending' }, { asset_version_id: 'old' }, { shot_ids: ['SHOT-2-1'] }, { controls: ['pose'], must_not_control: ['pose'] }, { media_path: '../outside.png' }, { input_slot: 'end_frame', purpose: 'last_frame' }]) {
    Object.assign(pkg.reference_bindings[0], patch)
    assert.ok(validateReferenceBindings(pkg, options).length, JSON.stringify(patch))
    pkg.reference_bindings[0] = structuredClone(first)
  }
  pkg.capability_profile.reference_images = 'unknown'
  assert.ok(validateReferenceBindings(pkg, options).some(d => d.code === 'reference_capability_unverified'))
  pkg.capability_profile.reference_images = 'supported'
  writeFileSync(join(mediaRoot, 'actor.png'), 'changed image bytes')
  assert.ok(validateReferenceBindings(pkg, options).some(d => d.code === 'reference_media_unverified'))
})

test('same image first/last is explicit, incompatible mixed modes and order collisions fail', t => {
  const { pkg, options } = productionFixture(t)
  const b = pkg.reference_bindings[0]
  b.purpose = 'first_frame'; b.input_slot = 'start_frame'
  pkg.reference_bindings.push({ ...b, binding_id: 'REF-END', purpose: 'last_frame', input_slot: 'end_frame' })
  assert.deepEqual(validateReferenceBindings(pkg, options), [])
  pkg.reference_profile.allow_same_first_last = false
  assert.ok(validateReferenceBindings(pkg, options).some(d => d.code === 'reference_media_duplicate'))
  pkg.reference_profile.allow_same_first_last = true
  pkg.reference_bindings.push({ ...b, binding_id: 'REF-MIX', purpose: 'appearance', input_slot: 'reference_images' })
  assert.ok(validateReferenceBindings(pkg, options).some(d => d.code === 'reference_modes_conflict'))
  const slots = compileReferenceBindings(pkg, 'VIDEO-1')
  assert.equal(slots.length, 3)
})

test('local camera changes invalidate parent VIDEO and adjoining cut review, not unrelated VIDEO', t => {
  const { pkg } = productionFixture(t)
  const before = structuredClone(pkg)
  pkg.director_shots[0].camera_height_angle = 'Low angle.'
  const result = analyzeArtifactFreshness(pkg)
  const state = id => result.artifacts.find(a => a.id === id).freshness
  assert.equal(state('shot:SHOT-1-1'), 'stale')
  assert.equal(state('result:VIDEO-1'), 'stale')
  assert.equal(state('cut:SHOT-1-1:SHOT-1-2'), 'stale')
  assert.equal(state('result:VIDEO-2'), 'current')
  assert.equal(state('package_review'), 'stale')
  assert.deepEqual(pkg.artifact_snapshot, before.artifact_snapshot)
  assert.deepEqual(pkg.review_receipt, before.review_receipt)
})

test('state changes propagate beyond neighbours; shared asset updates reach every reference', t => {
  const { pkg } = productionFixture(t)
  pkg.shots[0].continuity_out.prop_state = 'dropped'
  assert.equal(analyzeArtifactFreshness(pkg).artifacts.find(a => a.id === 'state:SHOT-4-2').freshness, 'stale')
  const { pkg: other } = productionFixture(t)
  other.assets[0].asset_version_id = 'CHAR-1-V2'
  assert.ok(analyzeArtifactFreshness(other).artifacts.filter(a => a.kind === 'video').every(a => a.freshness === 'stale'))
})

test('dialogue edits invalidate audio/subtitles/timing, display names do not; reference order matters', t => {
  const { pkg } = productionFixture(t)
  pkg.videos[0].display_name_zh = '修改显示名'
  pkg.assets[0].display_name_zh = '演员'
  assert.equal(analyzeArtifactFreshness(pkg).freshness, 'current')
  pkg.shots[0].dialogue = [{ text: 'A new line.' }]
  const result = analyzeArtifactFreshness(pkg)
  for (const id of ['audio:SHOT-1-1', 'subtitle:SHOT-1-1', 'episode_timing']) assert.equal(result.artifacts.find(a => a.id === id).freshness, 'stale')
  const { pkg: other } = productionFixture(t)
  other.reference_bindings[0].controls.push('wardrobe')
  assert.equal(analyzeArtifactFreshness(other).artifacts.find(a => a.id === 'video:VIDEO-1').freshness, 'stale')
  assert.notEqual(artifactDigest(['one', 'two']), artifactDigest(['two', 'one']))
  assert.equal(artifactDigest({ a: 1, b: 2 }), artifactDigest({ b: 2, a: 1 }))
})

test('missing snapshots, malformed graphs and cycles cannot claim freshness', t => {
  const { pkg } = productionFixture(t)
  delete pkg.artifact_snapshot
  assert.equal(analyzeArtifactFreshness(pkg).freshness, 'unknown')
  for (const nodes of [[{ id: 'a', kind: 'x', payload: {}, depends_on: ['missing'] }], [{ id: 'a', kind: 'x', payload: {}, depends_on: ['a'] }]]) assert.throws(() => fingerprintGraph({ schema_version: DEPENDENCY_SCHEMA, nodes }), /missing_dependency|dependency_cycle/)
  pkg.shots[0].asset_ids.push('UNKNOWN')
  assert.equal(analyzeArtifactFreshness(pkg).freshness, 'unknown')
})

test('v2 quote binding rechecks bytes, current review, request identity and transport support', t => {
  const { pkg, options, mediaRoot } = productionFixture(t)
  assert.ok(buildMediaMcpPlan(pkg, { ...options, mediaMcpContract: undefined }).targets.every(a => a.state === 'blocked'))
  const plan = buildMediaMcpPlan(pkg, options)
  assert.ok(plan.targets.every(a => a.state === 'ready'), JSON.stringify(plan.production_qa))
  const target = plan.targets[0]
  const quote = { quote_id: 'MOCK-QUOTE', request_hash: `MOCK:${target.request_hash_local}` }
  assert.equal(bindGenerateCall(pkg, target, quote, options).tool, 'generate_video')
  assert.equal(bindGenerateCall(pkg, target, quote, options).arguments.idempotency_key, target.generate_idempotency_key)
  assert.throws(() => bindGenerateCall(pkg, target, { ...quote, request_hash: 'wrong' }, options), /quote_confirmation_unverified/)
  const forged = structuredClone(target); forged.request.prompt = 'Different request.'
  assert.throws(() => bindGenerateCall(pkg, forged, quote, options), /stale_or_modified/)
  writeFileSync(join(mediaRoot, 'actor.png'), 'changed bytes')
  assert.throws(() => bindGenerateCall(pkg, target, quote, options), /stale_or_modified/)
})

test('changed execution uses a new key; old in-flight results remain traceable and stale', t => {
  const { pkg, options, seal } = productionFixture(t)
  const original = buildMediaMcpPlan(pkg, options).targets[0]
  let withJob = applyMediaMcpJobReceipt(pkg, { target_ref: original.target_ref, job_id: 'OLD-JOB', quote_id: 'OLD-QUOTE', request_hash: 'remote', request_fingerprint: original.request_hash_local, public_model_id: original.public_model_id })
  const stable = buildMediaMcpPlan(pkg, options).targets[0]
  assert.equal(original.generate_idempotency_key, stable.generate_idempotency_key)
  pkg.videos[0].video_master_prompt += ' Hold the door in view.'
  seal()
  const changed = buildMediaMcpPlan(pkg, options).targets[0]
  assert.notEqual(original.generate_idempotency_key, changed.generate_idempotency_key)
  withJob.videos[0].video_master_prompt = pkg.videos[0].video_master_prompt
  const status = applyMediaMcpJobStatus(withJob, original.target_ref, { job_id: 'OLD-JOB', status: 'succeeded', output_asset_ids: ['OLD-ASSET'] })
  assert.equal(status.videos[0].media_mcp.freshness, 'stale')
  assert.notEqual(status.videos[0].status, 'review_required')
  assert.equal(withJob.videos[0].media_mcp.last_observed_job_status, 'queued')
  assert.throws(() => applyMediaMcpJobStatus(withJob, original.target_ref, { job_id: 'UNKNOWN', status: 'succeeded' }), /unknown_job/)
})

test('v1 remains readable and original QA/adapter behavior is preserved', () => {
  const golden = JSON.parse(readFileSync(new URL('../../core/usvd-v9/golden-cases/gc-01-archive-key.json', import.meta.url))).v9
  assert.equal(runPromptQA(golden).gate, 'PASS')
  assert.equal(runPromptQA(golden).machine_gate, undefined)
  const legacy = { schema_version: 'us-vertical-drama-workbench/v1', episode_id: 'LEGACY', videos: [], shots: [], assets: [] }
  assert.equal(buildProductionSnapshot(legacy).freshness.freshness, 'unknown')
  assert.equal(buildMediaMcpPlan(legacy).schema_version, 'usvds-media-mcp-plan/v1')
  assert.throws(() => buildMediaMcpPlan({ ...legacy, schema_version: 'us-vertical-drama-workbench/v3' }), /requires/)
})

test('director-unit edits remain local while original whole-package review becomes stale', t => {
  const { pkg } = productionFixture(t)
  pkg.director_revision.units[0].text = 'A corrected playable line.'
  const result = analyzeArtifactFreshness(pkg)
  for (const id of ['shot:SHOT-1-1', 'audio:SHOT-1-1', 'subtitle:SHOT-1-1', 'episode_timing', 'package_review']) assert.equal(result.artifacts.find(a => a.id === id).freshness, 'stale')
  assert.equal(result.artifacts.find(a => a.id === 'result:VIDEO-2').freshness, 'current')
})

test('timeline aliases hash identically and conflicting forms cannot bypass workbench checks', t => {
  const { pkg, options } = productionFixture(t)
  for (const shot of pkg.shots) { delete shot.time_in; delete shot.time_out }
  assert.equal(buildProductionSnapshot(pkg, options).generation_ready, true)
  pkg.shots[0].time_out = 2
  assert.equal(buildProductionSnapshot(pkg, options).generation_ready, false)
})

test('malformed v2 envelopes and unknown schema attributes do not throw or become ready', t => {
  const { pkg, options } = productionFixture(t)
  for (const key of ['assets', 'videos', 'shots', 'director_shots', 'reference_bindings']) {
    const invalid = structuredClone(pkg); invalid[key] = [null]
    assert.equal(runPromptQA(invalid, options).machine_gate, 'BLOCKED')
    assert.equal(buildProductionSnapshot(invalid, options).generation_ready, false)
  }
  pkg.reference_bindings[0].assume_supported = true
  assert.ok(validateReferenceBindings(pkg, options).some(d => d.code === 'reference_schema_invalid'))
  assert.equal(runPromptQA(pkg, options).generation_ready, false)
})

test('v2 reviewer returns scoped digest evidence and never promotes a focused review to full approval', async t => {
  const { pkg, options } = productionFixture(t)
  let disposed = false
  const input = { productionPackage: pkg, mediaRoot: options.mediaRoot, qaResult: runPromptQA(pkg, options), trigger: 'subjective_open_question', reviewQuestion: 'Is this reaction clear?', stableRefs: ['SHOT-1-1'], requiredEvidence: ['Synthetic reaction.'], subagents: { start: async (_provider, request) => {
    assert.deepEqual(request.toolFilter, { allow: [] })
    return { id: 'MOCK-FOCUSED-REVIEW', result: Promise.resolve({ stopReason: 'completed', structured: { review_status: 'PASS', defects: [], return_to_stage: 'none', evidence: ['Synthetic focus only.'] } }), dispose: async () => { disposed = true } }
  } } }
  const result = await executeControlledStage09Review(input)
  assert.equal(result.input_digest, input.qaResult.input_digest)
  assert.deepEqual(result.review_scope, ['SHOT-1-1'])
  assert.equal(disposed, true)
  pkg.review_receipt = result.review
  assert.equal(runPromptQA(pkg, options).generation_ready, false)
})

test('receipt replay preserves terminal history and collection of older jobs cannot overwrite active jobs', t => {
  const { pkg, options } = productionFixture(t)
  const target = buildMediaMcpPlan(pkg, options).targets[0]
  const receipt = { target_ref: target.target_ref, job_id: 'JOB-A', request_fingerprint: target.request_hash_local, public_model_id: target.public_model_id }
  const first = applyMediaMcpJobReceipt(pkg, receipt)
  const done = applyMediaMcpJobStatus(first, target.target_ref, { job_id: 'JOB-A', status: 'succeeded', output_asset_ids: ['A'] })
  assert.equal(applyMediaMcpJobReceipt(done, receipt).videos[0].media_mcp.last_observed_job_status, 'succeeded')
  const next = applyMediaMcpJobReceipt(done, { ...receipt, job_id: 'JOB-B' })
  const collected = applyMediaMcpJobStatus(next, target.target_ref, { job_id: 'JOB-A', status: 'succeeded', output_asset_ids: ['A'] })
  assert.equal(collected.videos[0].media_mcp.job_id, 'JOB-B')
  assert.equal(collected.videos[0].media_mcp.last_observed_job_status, 'queued')
  assert.equal(collected.videos[0].media_mcp_history[0].job_id, 'JOB-A')
})

test('voice proxy BLOCKED and adopted episode limits cannot be cleared by a new contract', t => {
  const { pkg, options, seal } = productionFixture(t)
  pkg.voice_timing_evidence = { production_gate: 'BLOCKED', adjusted_seconds: 126 }
  seal()
  assert.equal(runPromptQA(pkg, options).machine_gate, 'BLOCKED')
  delete pkg.voice_timing_evidence
  pkg.episode_timing.total_duration_seconds = 126
  seal()
  assert.equal(runPromptQA(pkg, options).generation_ready, false)
})

test('reference order changes request identity; relocating identical bytes preserves dependency identity', t => {
  const { pkg, options, mediaRoot, bytes, seal } = productionFixture(t)
  renameSync(join(mediaRoot, 'actor.png'), join(mediaRoot, 'renamed.png'))
  pkg.reference_bindings.forEach(b => { b.media_path = 'renamed.png' })
  assert.equal(analyzeArtifactFreshness(pkg).freshness, 'current')
  assert.equal(buildProductionSnapshot(pkg, options).generation_ready, true)
  const second = Buffer.concat([bytes, Buffer.from('SECOND-SYNTHETIC-ASSET')])
  writeFileSync(join(mediaRoot, 'second.png'), second)
  const sha256 = createHash('sha256').update(second).digest('hex')
  pkg.assets.push({ id: 'PROP-2', kind: 'prop', status: 'approved', asset_version_id: 'PROP-2-V1', sha256 })
  pkg.approved_asset_ids.push('PROP-2')
  pkg.shots.filter(s => s.video_id === 'VIDEO-1').forEach(s => s.asset_ids.push('PROP-2'))
  pkg.reference_bindings.push({ ...pkg.reference_bindings[0], binding_id: 'REF-PROP', asset_id: 'PROP-2', asset_version_id: 'PROP-2-V1', sha256, media_path: 'second.png', order: 2 })
  seal()
  const first = buildMediaMcpPlan(pkg, options).targets[0]
  assert.equal(first.state, 'ready')
  pkg.reference_bindings[0].order = 2; pkg.reference_bindings.at(-1).order = 1
  seal()
  assert.notEqual(buildMediaMcpPlan(pkg, options).targets[0].request_hash_local, first.request_hash_local)
  assert.ok(buildMediaMcpPlan(pkg, { ...options, videoModelId: 'unverified-other-model' }).targets.every(a => a.blocked_reason === 'unsupported_public_model'))
})

test('all three contract resources ship with each affected skill and schemas match executable enums', async () => {
  const { buildDistributionPlan } = await import('../../scripts/sync-v9-distributions.mjs')
  const { REFERENCE_SCHEMA, REFERENCE_PURPOSES } = await import('../../scripts/v11-reference-bindings.mjs')
  assert.deepEqual(REFERENCE_SCHEMA.properties.purpose.enum, REFERENCE_PURPOSES)
  const plan = buildDistributionPlan()
  for (const stage of ['05-asset-lock', '06-storyboard', '07-performance-cinematography', '08-seedance-2-mini-adapter', '09-prompt-qa']) {
    const skill = plan.skills.find(s => s.id === stage)
    for (const file of ['production-policy-v2.json', 'reference-binding-v2.schema.json', 'artifact-dependencies-v2.schema.json']) assert.ok(plan.files.has(`plugins/us-vertical-drama-studio-v9/skills/${skill.name}/references/${file}`))
  }
})

test('standalone v2 adapter checks references and tags advisory budgets before QA', t => {
  const { pkg, options } = productionFixture(t)
  assert.deepEqual(validateAdapterPackage(pkg, options), [])
  pkg.videos[0].video_master_prompt += ' detail'.repeat(300)
  assert.ok(validateAdapterPackage(pkg, options).some(d => d.rule === 'adapter_video_prompt_over_budget' && d.gate_effect === 'warn'))
  pkg.reference_bindings[0].status = 'pending'
  assert.ok(validateAdapterPackage(pkg, options).some(d => d.rule === 'reference_pending' && d.gate_effect === 'block'))
})

test('a fresh compilation snapshot cannot relabel old media current or prevent an authorized regeneration', t => {
  const fixture = productionFixture(t)
  const { pkg, options, seal } = fixture
  const target = buildMediaMcpPlan(pkg, options).targets[0]
  const running = applyMediaMcpJobReceipt(pkg, { target_ref: target.target_ref, job_id: 'OLD', request_fingerprint: target.request_hash_local, public_model_id: target.public_model_id })
  pkg.videos[0].media_mcp = running.videos[0].media_mcp
  pkg.director_shots[0].camera_height_angle = 'Low angle.'
  seal()
  const checked = analyzeArtifactFreshness(pkg)
  assert.equal(checked.input_freshness, 'current')
  assert.equal(checked.artifacts.find(a => a.id === 'result:VIDEO-1').freshness, 'stale')
  assert.equal(runPromptQA(pkg, options).generation_ready, true)
  const collected = applyMediaMcpJobStatus(pkg, target.target_ref, { job_id: 'OLD', status: 'succeeded' })
  assert.equal(collected.videos[0].media_mcp.freshness, 'stale')
})
