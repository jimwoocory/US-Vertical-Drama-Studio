import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runPromptQA, DIALOGUE_MAX_WORDS_PER_SECOND } from '../../scripts/v9-prompt-qa-validation.mjs'

function loadGolden(name) {
  return JSON.parse(readFileSync(new URL(`../../core/usvd-v9/golden-cases/${name}`, import.meta.url), 'utf8'))
}

const minimalPass = {
  target_model: 'Seedance 2.0 Mini',
  required_source_refs: ['SCENE-01'],
  approved_asset_ids: ['CHAR-01', 'LOOK-01', 'SET-01', 'PROP-01'],
  capability_profile: { audio: 'unsupported', lip_sync: 'unsupported', seed: 'unknown', start_frame: 'unknown', end_frame: 'unknown', reference_images: 'supported' },
  reference_bindings: [
    { asset_id: 'CHAR-01', reference_id: 'char-ref' },
    { asset_id: 'LOOK-01', reference_id: 'look-ref' },
    { asset_id: 'SET-01', reference_id: 'set-ref' },
    { asset_id: 'PROP-01', reference_id: 'prop-ref' },
  ],
  videos: [{
    video_id: 'VIDEO-01',
    prompt_id: 'VIDEO-PROMPT-01',
    source_scene_refs: ['SCENE-01'],
    duration_seconds: 4,
    asset_ids: ['CHAR-01', 'LOOK-01', 'SET-01', 'PROP-01'],
    video_master_prompt: 'VIDEO-01。0–2秒人物发现门外异常；2–4秒人物保持视线并做出决定。资产和空间连续。',
    video_negative_prompt: '不改变角色、服装、场景、道具和屏幕方向。',
    execution_features: { audio: 'unused', lip_sync: 'unused', seed: 'unused', start_frame: 'unused', end_frame: 'unused', reference_images: 'native' },
    external_execution_notes: [],
    degradation_log: [],
  }],
  shots: [
    { shot_id: 'SHOT-01', video_id: 'VIDEO-01', prompt_id: 'PROMPT-01', time_in: 0, time_out: 2, duration_seconds: 2, asset_ids: ['CHAR-01', 'LOOK-01', 'SET-01', 'PROP-01'], shot_delta_prompt: '0–2秒：人物停住并看向门。', local_exclusions: '不换装、不换场景。', degradation_log: [] },
    { shot_id: 'SHOT-02', video_id: 'VIDEO-01', prompt_id: 'PROMPT-02', time_in: 2, time_out: 4, duration_seconds: 2, asset_ids: ['CHAR-01', 'LOOK-01', 'SET-01', 'PROP-01'], shot_delta_prompt: '2–4秒：人物维持视线并握紧道具。', local_exclusions: '不改变道具持有状态。', degradation_log: [] },
  ],
  director_shots: [
    { shot_id: 'SHOT-01', video_id: 'VIDEO-01', time_in: 0, time_out: 2, narrative_purpose: '建立异常信息。', performance_transition: '正常 → 警觉', shot_size_composition: '中近景，门在视线方向。', camera_movement: 'STATIC', movement_motivation: '定机突出表演变化。', cut_motivation: '视线完成转向。', continuity_in: { screen_direction: 'left', eyeline_target: 'door', character_position: 'right', prop_state: 'held', look_state: 'LOOK-01', set_state: 'SET-01' }, continuity_out: { screen_direction: 'left', eyeline_target: 'door', character_position: 'right', prop_state: 'held', look_state: 'LOOK-01', set_state: 'SET-01' } },
    { shot_id: 'SHOT-02', video_id: 'VIDEO-01', time_in: 2, time_out: 4, narrative_purpose: '把警觉转成决定。', performance_transition: '警觉 → 决定', shot_size_composition: '近景，眼神优先。', camera_movement: 'STATIC', movement_motivation: '保持空间和视线稳定。', cut_motivation: '决定形成。', continuity_in: { screen_direction: 'left', eyeline_target: 'door', character_position: 'right', prop_state: 'held', look_state: 'LOOK-01', set_state: 'SET-01' }, continuity_out: { screen_direction: 'left', eyeline_target: 'door', character_position: 'right', prop_state: 'held', look_state: 'LOOK-01', set_state: 'SET-01' } },
  ],
}

test('Golden Case 01: legacy archive-key baseline is blocked and V9 passes', () => {
  const golden = loadGolden('gc-01-archive-key.json')
  const baseline = runPromptQA(golden.baseline)
  const v9 = runPromptQA(golden.v9)
  assert.equal(baseline.gate, golden.expected.baseline_gate)
  assert.equal(v9.gate, golden.expected.v9_gate)
  assert.ok(baseline.defects.some(item => item.rule === 'adapter_missing_prompt_field'))
  assert.ok(baseline.defects.some(item => item.rule === 'camera_movement_without_motivation'))
  assert.equal(v9.summary.blocker, 0)
  assert.equal(v9.summary.major, 0)
})

test('Golden Case 02: legacy auction reaction package requires Stage 07 revision and V9 passes', () => {
  const golden = loadGolden('gc-02-auction-entry.json')
  const baseline = runPromptQA(golden.baseline)
  const v9 = runPromptQA(golden.v9)
  assert.equal(baseline.gate, golden.expected.baseline_gate)
  assert.equal(v9.gate, golden.expected.v9_gate)
  assert.ok(baseline.defects.some(item => item.rule === 'missing_director_field_narrative_purpose'))
  assert.ok(baseline.defects.some(item => item.rule === 'missing_director_field_cut_motivation'))
  assert.equal(v9.summary.blocker, 0)
  assert.equal(v9.summary.major, 0)
})

test('Prompt QA detects asset drift and returns a stable defect reference', () => {
  const pkg = structuredClone(minimalPass)
  pkg.shots[0].asset_ids.push('PROP-UNAPPROVED')
  const result = runPromptQA(pkg)
  const defect = result.defects.find(item => item.rule === 'unapproved_asset_reference')
  assert.equal(result.gate, 'BLOCKED')
  assert.equal(defect.stable_ref, 'SHOT-01')
  assert.match(defect.defect_id, /^QA-SHOT-01-UNAPPROVED-ASSET-REFERENCE/)
  assert.equal(defect.return_to_stage, 'upstream')
})

test('Prompt QA detects continuity and camera contradictions', () => {
  const pkg = structuredClone(minimalPass)
  pkg.director_shots[0].camera_movement = 'STATIC + push in'
  pkg.director_shots[1].continuity_in.screen_direction = 'right'
  const result = runPromptQA(pkg)
  assert.equal(result.gate, 'REVISE')
  assert.ok(result.defects.some(item => item.rule === 'camera_directive_contradiction'))
  assert.ok(result.defects.some(item => item.rule === 'continuity_screen_direction_mismatch'))
})

test('Prompt QA detects dialogue that exceeds the internal timing heuristic', () => {
  const pkg = structuredClone(minimalPass)
  pkg.director_shots[1].dialogue_items = [{ text: 'I know exactly what you did to my family tonight', start_seconds: 2, end_seconds: 3 }]
  const result = runPromptQA(pkg)
  const defect = result.defects.find(item => item.rule === 'dialogue_too_dense_for_planned_time')
  assert.equal(DIALOGUE_MAX_WORDS_PER_SECOND, 3)
  assert.equal(result.gate, 'REVISE')
  assert.ok(defect)
  assert.equal(defect.return_to_stage, '06')
})

test('Prompt QA propagates Seedance capability and prompt-overload defects', () => {
  const pkg = structuredClone(minimalPass)
  pkg.videos[0].execution_features.audio = 'native'
  pkg.videos[0].video_master_prompt = '动作。'.repeat(900)
  const result = runPromptQA(pkg)
  assert.equal(result.gate, 'BLOCKED')
  assert.ok(result.defects.some(item => item.rule === 'adapter_unsupported_native_capability_claim'))
  assert.ok(result.defects.some(item => item.rule === 'adapter_video_prompt_over_budget'))
})

test('Stage 09 contract and checklist expose the machine/human QA boundary', () => {
  const contract = JSON.parse(readFileSync(new URL('../../core/usvd-v9/contracts/stage-09-prompt-qa.json', import.meta.url), 'utf8'))
  const checklist = readFileSync(new URL('../../core/usvd-v9/references/prompt-qa-human-checklist.md', import.meta.url), 'utf8')
  assert.equal(contract.machine_validator, 'scripts/v9-prompt-qa-validation.mjs')
  assert.equal(contract.stable_refs_required, true)
  assert.equal(contract.dialogue_heuristic.english_max_words_per_second, 3)
  assert.match(checklist, /0–3s/)
  assert.match(checklist, /generated-video review as `pending`/i)
})
