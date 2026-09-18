import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { assessPromptBudget, TARGET_MODEL, validateAdapterPackage } from '../../scripts/v9-seedance-adapter-validation.mjs'

const valid = {
  target_model: TARGET_MODEL,
  capability_profile: {
    audio: 'unsupported',
    lip_sync: 'unknown',
    seed: 'unsupported',
    start_frame: 'supported',
    end_frame: 'supported',
    reference_images: 'supported',
  },
  videos: [{
    video_id: 'VIDEO-001',
    prompt_id: 'VIDEO-PROMPT-001',
    source_scene_refs: ['EP01-SC01'],
    asset_ids: ['CHAR-EVE', 'LOOK-EVE-NIGHT', 'SET-AUCTION', 'PROP-GLASS'],
    video_master_prompt: 'VIDEO-001。伊芙站在拍卖厅左侧，手握酒杯。0.0–1.5秒她停住动作并看向入口；1.5–4.0秒她抬眼确认来者，保持原服装、场景和道具状态。镜头按批准计划从手部信息切到面部反应。',
    video_negative_prompt: '不改变角色身份、服装、拍卖厅空间、酒杯状态和既定屏幕方向。',
    execution_features: { audio: 'external', lip_sync: 'external', seed: 'unused', start_frame: 'native', end_frame: 'native', reference_images: 'native' },
    external_execution_notes: [
      { feature: 'audio', owner: 'post-audio' },
      { feature: 'lip_sync', owner: 'external-lip-sync' },
    ],
    degradation_log: [],
  }],
  shots: [{
    shot_id: 'SHOT-001-01',
    video_id: 'VIDEO-001',
    prompt_id: 'PROMPT-001-01',
    asset_ids: ['CHAR-EVE', 'LOOK-EVE-NIGHT', 'SET-AUCTION', 'PROP-GLASS'],
    shot_delta_prompt: '0.0–1.5秒：伊芙手指停在酒杯边，视线仍压在入口方向；仅执行手部停顿和细微呼吸变化。',
    local_exclusions: '不换装、不改变酒杯位置、不新增人物。',
    degradation_log: [],
  }],
}

test('V9 Stage 08 accepts a traceable Seedance 2.0 Mini package', () => {
  assert.deepEqual(validateAdapterPackage(valid), [])
})

test('V9 Stage 08 rejects other target models', () => {
  const pkg = structuredClone(valid)
  pkg.target_model = 'Seedance 2.5'
  assert.ok(validateAdapterPackage(pkg).some(item => item.code === 'wrong_target_model'))
})

test('V9 Stage 08 rejects unsupported or unknown features claimed as native', () => {
  const pkg = structuredClone(valid)
  pkg.videos[0].execution_features.audio = 'native'
  pkg.videos[0].execution_features.lip_sync = 'native'
  const diagnostics = validateAdapterPackage(pkg)
  assert.equal(diagnostics.filter(item => item.code === 'unsupported_native_capability_claim').length, 2)
})

test('V9 Stage 08 requires external execution ownership', () => {
  const pkg = structuredClone(valid)
  pkg.videos[0].external_execution_notes = []
  assert.ok(validateAdapterPackage(pkg).some(item => item.code === 'external_execution_note_missing'))
})

test('V9 Stage 08 enforces internal prompt budgets', () => {
  assert.equal(assessPromptBudget('a'.repeat(1200), 'video').status, 'OK')
  assert.equal(assessPromptBudget('a'.repeat(1300), 'video').status, 'REVIEW')
  assert.equal(assessPromptBudget('a'.repeat(1601), 'video').status, 'OVER_BUDGET')
  assert.equal(assessPromptBudget('a'.repeat(521), 'shot').status, 'OVER_BUDGET')
})

test('V9 Stage 08 rejects quality-token padding and copied master prompts', () => {
  const pkg = structuredClone(valid)
  pkg.videos[0].video_master_prompt += ' 8K cinematic masterpiece'
  pkg.shots[0].shot_delta_prompt = pkg.videos[0].video_master_prompt
  const diagnostics = validateAdapterPackage(pkg)
  assert.ok(diagnostics.some(item => item.code === 'forbidden_quality_token'))
  assert.ok(diagnostics.some(item => item.code === 'shot_delta_duplicates_video_master'))
})

test('V9 Stage 08 contract fixes model, budget, capability and traceability boundaries', () => {
  const contract = JSON.parse(readFileSync(new URL('../../core/usvd-v9/contracts/stage-08-seedance-2-mini-adapter.json', import.meta.url), 'utf8'))
  assert.equal(contract.target_model, 'Seedance 2.0 Mini')
  assert.equal(contract.capability_profile.unknown_policy, 'treat_as_unsupported')
  assert.equal(contract.prompt_budget.video_master_target_chars, 1200)
  assert.equal(contract.prompt_budget.shot_delta_target_chars, 360)
  assert.ok(contract.output_per_video.includes('reference_bindings'))
  assert.ok(contract.output_per_shot.includes('prompt_id'))
})
