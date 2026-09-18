import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { findForbiddenModelPromptFields, validateDirectorPackage, validateTimingClosure } from '../../scripts/v9-director-validation.mjs'

const validPackage = {
  videos: [
    { video_id: 'VIDEO-001', duration_seconds: 4 },
  ],
  shots: [
    { shot_id: 'SHOT-001-01', video_id: 'VIDEO-001', time_in: 0, time_out: 1.5, duration_seconds: 1.5 },
    { shot_id: 'SHOT-001-02', video_id: 'VIDEO-001', time_in: 1.5, time_out: 4, duration_seconds: 2.5 },
  ],
}

test('V9 Stage 06 timing closure accepts contiguous SHOT coverage', () => {
  assert.deepEqual(validateTimingClosure(validPackage), [])
})

test('V9 Stage 06 timing closure detects gaps and incomplete coverage', () => {
  const pkg = structuredClone(validPackage)
  pkg.shots[1].time_in = 2
  pkg.shots[1].duration_seconds = 2
  const diagnostics = validateTimingClosure(pkg)
  assert.ok(diagnostics.some(item => item.code === 'timing_gap'))
})

test('V9 Stage 06 timing closure detects overlaps', () => {
  const pkg = structuredClone(validPackage)
  pkg.shots[1].time_in = 1
  pkg.shots[1].duration_seconds = 3
  const diagnostics = validateTimingClosure(pkg)
  assert.ok(diagnostics.some(item => item.code === 'timing_overlap'))
})

test('V9 Stage 06/07 reject model prompt fields', () => {
  const pkg = structuredClone(validPackage)
  pkg.videos[0].video_master_prompt = 'should belong to Stage 08'
  pkg.shots[0].shot_delta_prompt = 'should belong to Stage 08'
  const diagnostics = findForbiddenModelPromptFields(pkg)
  assert.equal(diagnostics.filter(item => item.code === 'model_prompt_leakage').length, 2)
  assert.ok(validateDirectorPackage(pkg).some(item => item.code === 'model_prompt_leakage'))
})

test('V9 Stage 06 contract encodes VIDEO/SHOT closure and Stage 08 prompt ownership', () => {
  const contract = JSON.parse(readFileSync(new URL('../../core/usvd-v9/contracts/stage-06-storyboard.json', import.meta.url), 'utf8'))
  assert.equal(contract.timing_invariants.contiguous, true)
  assert.equal(contract.timing_invariants.allow_gaps, false)
  assert.equal(contract.timing_invariants.allow_overlaps, false)
  assert.equal(contract.model_prompt_owner, '08-seedance-2-mini-adapter')
  assert.ok(contract.forbidden_output_fields.includes('video_master_prompt'))
  assert.ok(contract.forbidden_output_fields.includes('shot_delta_prompt'))
})

test('V9 Stage 07 contract requires motivated direction and preserves Stage 06 timing', () => {
  const contract = JSON.parse(readFileSync(new URL('../../core/usvd-v9/contracts/stage-07-performance-cinematography.json', import.meta.url), 'utf8'))
  assert.ok(contract.output_per_shot.includes('movement_motivation'))
  assert.ok(contract.output_per_shot.includes('cut_motivation'))
  assert.ok(contract.immutable_from_stage_06.includes('time_in'))
  assert.ok(contract.immutable_from_stage_06.includes('time_out'))
  assert.equal(contract.model_prompt_owner, '08-seedance-2-mini-adapter')
})

test('V9 Stage 06/07 skill text is production-directing focused, not model prompt output', () => {
  const stage06 = readFileSync(new URL('../../core/usvd-v9/skills/06-storyboard/SKILL.md', import.meta.url), 'utf8')
  const stage07 = readFileSync(new URL('../../core/usvd-v9/skills/07-performance-cinematography/SKILL.md', import.meta.url), 'utf8')

  assert.match(stage06, /时间闭合硬规则/)
  assert.match(stage06, /连续性进/)
  assert.match(stage07, /Movement motivation/)
  assert.match(stage07, /Cut motivation/)
  assert.doesNotMatch(stage06, /【视频生成总提示词】|【视频生成提示词】/)
  assert.doesNotMatch(stage07, /【视频生成总提示词】|【视频生成提示词】/)
})
