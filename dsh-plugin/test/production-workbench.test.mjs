import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { buildProductionSnapshot, PRODUCTION_WORKBENCH_SCHEMA } from '../production-workbench.js'
import { assertP1Compatibility, P1_DSH_VERSION } from '../compatibility.js'

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

test('P1 accepts the pinned DSH slot service and rejects an exposed incompatible host version', () => {
  const slots = { inject() {}, register() {} }
  assert.doesNotThrow(() => assertP1Compatibility({ slots, dshVersion: P1_DSH_VERSION }))
  assert.throws(
    () => assertP1Compatibility({ slots, dshVersion: '0.1.6-alpha.1' }),
    /requires DeepSeek Harness 0\.1\.5-rc\.1/,
  )
})

test('P1 declares exact rc.1 peers and ships a DSH module-loader bundle', () => {
  const packageUrl = new URL('../../package.json', import.meta.url)
  const pkg = JSON.parse(readFileSync(packageUrl, 'utf8'))
  assert.equal(pkg.peerDependencies['@deepseek-ai/dsh'], P1_DSH_VERSION)
  assert.equal(pkg.peerDependencies['@deepseek-ai/dsh-client-ui-slots'], P1_DSH_VERSION)
  assert.equal(pkg.peerDependencies['@deepseek-ai/dsh-skill'], P1_DSH_VERSION)
  assert.equal(pkg.exports['./client'], './dsh-plugin/client.bundle.cjs')
  const bundle = readFileSync(fileURLToPath(new URL('../client.bundle.cjs', import.meta.url)), 'utf8')
  assert.match(bundle, /window\.__ModuleLoader__\.load/)
})
