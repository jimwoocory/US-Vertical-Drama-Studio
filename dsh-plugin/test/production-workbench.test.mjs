import assert from 'node:assert/strict'
import test from 'node:test'
import { buildProductionSnapshot, PRODUCTION_WORKBENCH_SCHEMA } from '../production-workbench.js'

const ready = {
  schema_version: PRODUCTION_WORKBENCH_SCHEMA,
  episode_id: 'EP-001',
  assets: [
    { id: 'CHAR-EVE', kind: 'character', status: 'approved' },
    { id: 'LOOK-EVE-NIGHT', kind: 'look', status: 'approved' },
    { id: 'SET-AUCTION', kind: 'set', status: 'approved' },
    { id: 'PROP-BOTTLE', kind: 'prop', status: 'approved' },
  ],
  shots: [{ shot_id: 'SHOT-001', video_id: 'VIDEO-001', prompt_id: 'PROMPT-001', source_scene_id: 'EP01-SC01', duration_seconds: 8, asset_ids: ['CHAR-EVE', 'LOOK-EVE-NIGHT', 'SET-AUCTION', 'PROP-BOTTLE'], asset_lock_prompt: 'locked assets', shot_delta_prompt: 'Eve turns toward the door', negative_prompt: 'no wardrobe change', status: 'ready_to_generate' }],
  tasks: [{ id: 'TASK-001', status: 'todo', targets: ['SHOT-001'] }],
}

test('reports a generation-ready, traceable shot', () => {
  const snapshot = buildProductionSnapshot(ready)
  assert.equal(snapshot.summary.ready_to_generate, 1)
  assert.equal(snapshot.summary.blocked, 0)
  assert.equal(snapshot.summary.errors, 0)
})

test('blocks video work when an asset is not approved or a shot exceeds 15 seconds', () => {
  const manifest = structuredClone(ready)
  manifest.assets[0].status = 'pending_approval'
  manifest.shots[0].duration_seconds = 16
  const snapshot = buildProductionSnapshot(manifest)
  assert.equal(snapshot.shots[0].status, 'blocked')
  assert.ok(snapshot.diagnostics.some(item => item.code === 'asset_not_approved'))
  assert.ok(snapshot.diagnostics.some(item => item.code === 'duration_over_15s'))
})
