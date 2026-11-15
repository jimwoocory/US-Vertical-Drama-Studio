// Synthetic contract fixtures. No real model, reviewer, provider or media generation.
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import { WORKBENCH_V2, captureArtifactSnapshot, productionInputDigest, artifactDigest } from '../../../scripts/v11-artifact-freshness.mjs'
import { PRODUCTION_POLICY } from '../../../scripts/v11-production-policy.mjs'

export function productionFixture(t) {
  const mediaRoot = mkdtempSync(join(tmpdir(), 'usvds-v2-'))
  t.after(() => { const rel = relative(tmpdir(), mediaRoot); if (!rel.startsWith('usvds-v2-') || rel.includes('..')) throw new Error('unsafe_test_cleanup'); rmSync(mediaRoot, { recursive: true }) })
  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZxkAAAAASUVORK5CYII=', 'base64')
  writeFileSync(join(mediaRoot, 'actor.png'), bytes)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const pkg = {
    schema_version: WORKBENCH_V2, episode_id: 'SYNTHETIC-V2', policy_version: PRODUCTION_POLICY.version,
    target_model: 'Seedance 2.0 Mini', endpoint_revision: 'TEST-ENDPOINT-1',
    duration_policy: { scope: 'complete_episode', min_seconds: 60, max_seconds: 120, video_max_seconds: 15 },
    capability_profile: { audio: 'unsupported', lip_sync: 'unsupported', seed: 'unknown', start_frame: 'supported', end_frame: 'supported', reference_images: 'supported' },
    reference_profile: { max_images: 8, allow_mixed_frames_and_references: false, allow_same_first_last: true },
    required_source_refs: ['SCENE-1'], approved_asset_ids: ['CHAR-1'],
    assets: [{ id: 'CHAR-1', kind: 'character', status: 'approved', asset_version_id: 'CHAR-1-V1', sha256 }],
    videos: [], shots: [], director_shots: [], reference_bindings: [], tasks: [],
    director_revision: {
      revision_id: 'DREV-2', source_revision_id: 'SCRIPT-1', status: 'locked',
      source_unit_ids: [1, 2, 3, 4].map(i => `SRC-${i}`),
      units: [1, 2, 3, 4].map(i => ({ unit_id: `DU-${i}`, source_unit_ids: [`SRC-${i}`], operation: 'retain', text: `A playable response ${i}.` })),
      story_guards: Object.fromEntries(['core_promise', 'character_goals', 'causal_chain', 'emotional_setup_payoff', 'continuity', 'continuing_hook'].map(k => [k, 'preserved'])),
      episode_direction: Object.fromEntries(['objective', 'situation_change', 'character_tactic', 'opponent_response', 'knowledge_sequence', 'emotional_payoff', 'continuing_hook'].map(k => [k, 'Synthetic purpose'])),
    },
    episode_timing: { total_duration_seconds: 60, timeline: [] },
  }
  for (let i = 1; i <= 4; i++) {
    const video_id = `VIDEO-${i}`
    pkg.videos.push({ video_id, prompt_id: `VP-${i}`, video_prompt_id: `VP-${i}`, display_name_zh: '测试视频', duration_seconds: 15, asset_ids: ['CHAR-1'], source_scene_id: 'SCENE-1', source_scene_refs: ['SCENE-1'], director_revision_id: 'DREV-2', director_unit_ids: [`DU-${i}`], video_master_prompt: `0-4s: the character looks toward the door. 4-15s: the character considers a reply in scene ${i}.`, video_negative_prompt: 'No identity changes.', generation_mode: 'reference', status: 'ready_to_generate', execution_features: { reference_images: 'native' } })
    pkg.episode_timing.timeline.push({ kind: 'video', video_id, start_seconds: (i-1)*15, end_seconds: i*15 })
    for (let j = 1; j <= 2; j++) {
      const shot_id = `SHOT-${i}-${j}`; const start = j === 1 ? 0 : 4; const end = j === 1 ? 4 : 15
      pkg.shots.push({ shot_id, video_id, prompt_id: `SP-${i}-${j}`, display_name_zh: '测试镜头', source_scene_id: 'SCENE-1', source_scene_refs: ['SCENE-1'], director_revision_id: 'DREV-2', director_unit_id: `DU-${i}`, time_in: start, time_out: end, timeline_in_seconds: start, timeline_out_seconds: end, duration_seconds: end-start, asset_ids: ['CHAR-1'], asset_lock_prompt: 'Approved actor.', shot_delta_prompt: `The actor holds a readable reaction ${j}.`, local_exclusions: 'No identity drift.', negative_prompt: 'No identity drift.', status: 'ready_to_generate', continuity_in: { prop_state: 'held' }, continuity_out: { prop_state: 'held' } })
      pkg.director_shots.push({ shot_id, video_id, time_in: start, time_out: end, director_revision_id: 'DREV-2', director_unit_id: `DU-${i}`, narrative_purpose: 'Hold the response.', performance_transition: 'Concern to decision.', shot_size_composition: 'Medium close-up.', cut_motivation: 'The decision lands.', camera_movement: 'STATIC', continuity_in: { prop_state: 'held' }, continuity_out: { prop_state: 'held' } })
    }
    pkg.reference_bindings.push({ binding_id: `REF-${i}`, asset_id: 'CHAR-1', asset_version_id: 'CHAR-1-V1', sha256, video_id, shot_ids: [1, 2].map(j => `SHOT-${i}-${j}`), purpose: 'appearance', controls: ['face', 'hair'], must_not_control: ['pose', 'composition'], input_slot: 'reference_images', order: 1, media_path: 'actor.png', status: 'resolved' })
  }
  const receipts = new Map()
  const seal = () => {
    pkg.artifact_snapshot = captureArtifactSnapshot(pkg)
    pkg.review_receipt = { input_digest: productionInputDigest(pkg), policy_version: pkg.policy_version, author_id: 'MOCK-WRITER', reviewer_id: 'MOCK-INDEPENDENT-REVIEWER', run_id: randomUUID(), status: 'PASS', rule_ids: PRODUCTION_POLICY.reviewed_rules, evidence: ['SYNTHETIC CONTRACT TEST ONLY'] }
    receipts.set(pkg.review_receipt.run_id, artifactDigest(pkg.review_receipt))
  }
  const options = { mediaRoot, verifyReview: r => receipts.get(r.run_id) === artifactDigest(r), mediaMcpContract: 'usvds-media-mcp-request/v2', verifyQuote: (quote, target) => quote.request_hash === `MOCK:${target.request_hash_local}` }
  seal()
  return { pkg, mediaRoot, options, seal, bytes }
}
