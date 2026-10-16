import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  inspectEpisodeDuration, isDirectorAdaptationAuthorized,
  validateDirectorAdaptation, validateEpisodeDuration,
} from '../../scripts/v9-director-validation.mjs'
import { buildProductionSnapshot, PRODUCTION_WORKBENCH_SCHEMA } from '../production-workbench.js'
import { runPromptQA } from '../../scripts/v9-prompt-qa-validation.mjs'

const POLICY = Object.freeze({
  scope: 'complete_episode', min_seconds: 60, max_seconds: 120, video_max_seconds: 15,
})
const GUARDS = ['core_promise', 'character_goals', 'causal_chain', 'emotional_setup_payoff', 'continuity', 'continuing_hook']
const DIRECTION = ['objective', 'situation_change', 'character_tactic', 'opponent_response', 'knowledge_sequence', 'emotional_payoff', 'continuing_hook']

// Synthetic material only. Its stated promises and guard declarations are
// machine-checkable metadata, NOT verified artistic or canonical truth.
function episode(seconds = 105) {
  const count = seconds / 15
  const ids = Array.from({ length: count }, (_, i) => 'SRC-' + (i + 1))
  const videos = ids.map((id, i) => ({
    video_id: 'VIDEO-' + (i + 1),
    duration_seconds: 15, display_name_zh: '导演合成视频包', source_scene_id: 'SCENE-01',
    director_revision_id: 'DREV-2', director_unit_ids: ['DU-' + (i + 1)],
    video_prompt_id: 'VP-' + (i + 1),
    video_master_prompt: 'Show the reaction and motivated response in a continuous setting.',
    video_negative_prompt: 'No identity or location drift.',
    status: 'ready_to_generate',
  }))
  const shots = videos.flatMap((v, i) => Array.from({ length: 5 }, (_, j) => ({
    video_id: v.video_id, shot_id: 'SHOT-' + (i + 1) + '-' + (j + 1),
    source_scene_id: 'SCENE-01',
    display_name_zh: '人物镜头',
    prompt_id: 'SP-' + (i + 1) + '-' + (j + 1),
    director_revision_id: 'DREV-2',
    director_unit_id: 'DU-' + (i + 1),
    time_in: j * 3, time_out: (j + 1) * 3,
    timeline_in_seconds: j * 3, timeline_out_seconds: (j + 1) * 3,
    duration_seconds: 3, asset_ids: ['CHAR-01'],
    asset_lock_prompt: 'Consistent character and costume',
    shot_delta_prompt: 'One readable action',
    negative_prompt: 'No identity changes',
    status: 'ready_to_generate',
  })))
  return {
    schema_version: PRODUCTION_WORKBENCH_SCHEMA, episode_id: 'SYNTH-EP01',
    project_brief: { duration_policy: structuredClone(POLICY) },
    assets: [{ id: 'CHAR-01', kind: 'character', status: 'approved' }],
    tasks: [], videos, shots,
    episode_timing: {
      total_duration_seconds: seconds,
      timeline: videos.map((v, i) => ({
        kind: 'video', video_id: v.video_id, start_seconds: i * 15, end_seconds: (i + 1) * 15,
      })),
    },
    director_revision: {
      revision_id: 'DREV-2', source_revision_id: 'SCREENPLAY-1', status: 'locked',
      // No creator_authorized field. V11 duration policy grants standing rights.
      source_unit_ids: ids,
      units: ids.map((id, i) => ({
        unit_id: 'DU-' + (i + 1),
        source_unit_ids: [id],
        operation: 'rewrite', text: 'Playable action and dialogue ' + (i + 1),
        reason: 'Remove duplicate explanation and leave emotion space',
      })),
      cut_units: [],
      story_guards: Object.fromEntries(GUARDS.map(k => [k, 'preserved'])),
      episode_direction: Object.fromEntries(DIRECTION.map(k => [k, 'Concrete playable change'])),
    },
  }
}

function codes(pkg) { return validateDirectorAdaptation(pkg).map(x => x.code) }
function fullErrors(pkg) { return inspectEpisodeDuration(pkg).diagnostics.map(x => x.code) }

test('V11 standing authority needs no per-episode manual authorization; legacy is unchanged', () => {
  const valid = episode()
  assert.equal(isDirectorAdaptationAuthorized(valid), true)
  assert.deepEqual(codes(valid), [])
  delete valid.project_brief.duration_policy
  assert.equal(isDirectorAdaptationAuthorized(valid), false)
  assert.ok(codes(valid).includes('director_revision_without_v11_policy'))
  const legacy = inspectEpisodeDuration({ videos: [{video_id:'LEGACY',duration_seconds:10}] })
  assert.equal(legacy.status, 'legacy_unverified')
  assert.equal(legacy.policy_active, false)
  assert.deepEqual(validateDirectorAdaptation({}), [])
  assert.deepEqual(validateEpisodeDuration({}), [])
})

for (const [seconds, expected] of [[45, false], [60, true], [105, true], [120, true], [135, false]]) {
  test('complete-episode gate enforces ' + seconds + ' seconds (inclusive 60–120)', () => {
    const pkg = episode(seconds)
    const time = inspectEpisodeDuration(pkg)
    assert.equal(time.status, expected ? 'compliant' : 'blocked')
    assert.equal(time.diagnostics.some(x => x.code === 'episode_duration_out_of_policy'), !expected)
    const snap = buildProductionSnapshot(pkg)
    assert.equal(snap.summary.total_seconds, seconds)
    assert.equal(snap.summary.model_video_seconds, seconds)
    assert.equal(snap.summary.episode_ready, expected)
    assert.equal(snap.summary.errors === 0, expected)
    assert.equal(snap.summary.ready_to_generate > 0, expected)
    if (!expected) {
      assert.ok(snap.shots.every(s => s.status === 'blocked'))
      assert.ok(snap.diagnostics.some(x => x.code === 'episode_duration_out_of_policy'))
    }
  })
}

test('opening, ending and audio tail contribute once on absolute overlapping timeline', () => {
  const pkg = episode(60)
  pkg.episode_timing.total_duration_seconds = 62
  pkg.episode_timing.timeline.push(
    { kind: 'opening', start_seconds: 0, end_seconds: 2 },
    { kind: 'ending', start_seconds: 56, end_seconds: 60 },
    { kind: 'audio_tail', start_seconds: 58, end_seconds: 62 },
  )
  assert.deepEqual(fullErrors(pkg), [])
  const snap = buildProductionSnapshot(pkg)
  assert.equal(snap.summary.model_video_seconds, 60)
  assert.equal(snap.summary.total_seconds, 62)
  assert.equal(snap.summary.episode_ready, true)
})

test('unknown time, gaps, model overlap, and missing VIDEO references block completeness', () => {
  const unknown = episode(60)
  delete unknown.episode_timing.total_duration_seconds
  assert.ok(fullErrors(unknown).includes('episode_total_duration_unknown'))
  const gap = episode(60)
  gap.episode_timing.timeline[1].start_seconds = 17
  assert.ok(fullErrors(gap).includes('episode_timeline_gap'))
  const overlap = episode(60)
  overlap.episode_timing.timeline[1].start_seconds = 14
  assert.ok(fullErrors(overlap).includes('episode_video_overlap'))
  const missing = episode(60)
  missing.episode_timing.timeline.pop()
  assert.ok(fullErrors(missing).includes('episode_video_not_in_timeline'))
})

test('invalid or ambiguous policy cannot silently grant standing revision rights', () => {
  const pkg = episode(60)
  pkg.duration_policy = '95–115 seconds'
  assert.equal(isDirectorAdaptationAuthorized(pkg), false)
  assert.ok(fullErrors(pkg).includes('episode_duration_policy_conflict'))
  const bad = episode(60)
  bad.project_brief.duration_policy = { ...POLICY, max_seconds: 140 }
  assert.equal(isDirectorAdaptationAuthorized(bad), false)
  assert.ok(fullErrors(bad).includes('episode_duration_policy_invalid'))
})

test('director revision must trace every source through retained, revised, merged or cut units', () => {
  const pkg = episode(60)
  pkg.director_revision.units[0].operation = 'merge'
  pkg.director_revision.units[0].source_unit_ids = ['SRC-1', 'SRC-2']
  pkg.director_revision.units.splice(1, 1)
  pkg.videos[1].director_unit_ids = ['DU-1']
  for (const shot of pkg.shots.filter(x => x.video_id === 'VIDEO-2')) shot.director_unit_id = 'DU-1'
  assert.deepEqual(codes(pkg), [])
  const missing = episode(60)
  missing.director_revision.units.splice(1, 1)
  assert.ok(codes(missing).includes('director_source_unit_unaccounted'))
  const cut = episode(60)
  cut.director_revision.units.splice(1, 1)
  cut.videos[1].director_unit_ids = ['DU-1']
  for (const shot of cut.shots.filter(x => x.video_id === 'VIDEO-2')) shot.director_unit_id = 'DU-1'
  cut.director_revision.cut_units.push({ source_unit_id: 'SRC-2', reason: 'Duplicated exposition' })
  assert.deepEqual(codes(cut), [])
})

test('stale downstream VIDEO/SHOT/dialogue and unreviewed story guards block release', () => {
  const pkg = episode(60)
  pkg.videos[0].director_revision_id = 'SCREENPLAY-1'
  pkg.shots[0].director_unit_id = 'NOT-AN-ACTIVE-UNIT'
  pkg.director_revision.story_guards.causal_chain = 'unknown'
  pkg.dialogue_items = [{ shot_id: pkg.shots[0].shot_id, text: 'I will meet them, not marry.', director_unit_id: 'DU-1', source_revision_id: 'SCREENPLAY-1' }]
  const observed = codes(pkg)
  for (const rule of [
    'director_video_revision_stale', 'director_shot_unit_missing_or_unknown',
    'director_story_guard_unresolved', 'director_dialogue_stale_or_unmapped',
  ]) assert.ok(observed.includes(rule), rule)
  assert.equal(buildProductionSnapshot(pkg).summary.episode_ready, false)
  const qa = runPromptQA(pkg)
  assert.equal(qa.gate, 'BLOCKED')
  assert.ok(qa.defects.some(x => x.rule === 'director_video_revision_stale'))
})

test('V11 overloaded dialogue QA returns a director-side correction, not routine human review', () => {
  const pkg = episode(60)
  pkg.dialogue_items = [{
    director_revision_id: 'DREV-2', director_unit_id: 'DU-1',
    text: 'The bank called and said we must pay every single dollar before Friday and I already tried every person I know.',
    start_seconds: 0, end_seconds: 1,
  }]
  const qa = runPromptQA(pkg)
  const dense = qa.defects.find(x => x.rule === 'dialogue_too_dense_for_planned_time')
  assert.ok(dense)
  assert.match(dense.requested_action, /directly cut, merge, or rewrite/)
  assert.doesNotMatch(dense.requested_action, /per-episode human rewrite approval is required/i)
  assert.equal(qa.episode_duration.status, 'compliant')
})

test('project brief schema remains backward-compatible with structured V11 policy', () => {
  const schema = JSON.parse(readFileSync(new URL('../../plugins/us-vertical-drama-studio/contracts/project-brief.schema.json', import.meta.url), 'utf8'))
  assert.ok(schema.properties.duration_policy.oneOf.some(x => x.type === 'string'))
  assert.ok(schema.properties.duration_policy.oneOf.some(x => x.type === 'object'))
})
