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

test('validates a V8-style video package made from contiguous micro-shots', () => {
  const manifest = structuredClone(ready)
  manifest.videos = [{ video_id: 'VIDEO-001', display_name_zh: '伊芙发现入口异动', source_scene_id: 'EP01-SC01', duration_seconds: 4, status: 'ready_to_generate' }]
  manifest.shots = [
    { ...manifest.shots[0], shot_id: 'SHOT-001-01', display_name_zh: '伊芙手指停在酒杯上', duration_seconds: 1, timeline_in_seconds: 0, timeline_out_seconds: 1, shot_type: '特写插入', generation_mode: 'independent' },
    { ...manifest.shots[0], shot_id: 'SHOT-001-02', display_name_zh: '伊芙抬眼看向入口', duration_seconds: 1.5, timeline_in_seconds: 1, timeline_out_seconds: 2.5, shot_type: '反应', generation_mode: 'independent' },
    { ...manifest.shots[0], shot_id: 'SHOT-001-03', display_name_zh: '吊灯闪烁照亮入口', duration_seconds: 1.5, timeline_in_seconds: 2.5, timeline_out_seconds: 4, shot_type: '信息揭示', generation_mode: 'independent' },
  ]
  const snapshot = buildProductionSnapshot(manifest)
  assert.equal(snapshot.summary.videos, 1)
  assert.equal(snapshot.summary.micro_shots, 3)
  assert.equal(snapshot.summary.total_seconds, 4)
  assert.equal(snapshot.summary.errors, 0)
})

test('blocks a non-contiguous or unjustifiably long micro-shot', () => {
  const manifest = structuredClone(ready)
  manifest.videos = [{ video_id: 'VIDEO-001', display_name_zh: '测试视频包', duration_seconds: 5, status: 'draft' }]
  manifest.shots[0] = { ...manifest.shots[0], display_name_zh: '过长切片', duration_seconds: 4, timeline_in_seconds: 0, timeline_out_seconds: 4 }
  const snapshot = buildProductionSnapshot(manifest)
  assert.equal(snapshot.shots[0].status, 'blocked')
  assert.ok(snapshot.diagnostics.some(item => item.code === 'long_micro_shot_without_reason'))
  assert.ok(snapshot.diagnostics.some(item => item.code === 'micro_shot_timeline_not_full_coverage'))
})

test('P1 uses only its declared slot-service injection surface', () => {
  const slots = { inject() {}, register() {} }
  const guardedContext = new Proxy({ slots }, { get(target, key) {
    if (key === 'slots') return target.slots
    throw new Error(`unexpected undeclared injection: ${String(key)}`)
  } })
  assert.doesNotThrow(() => assertP1Compatibility(guardedContext))
  assert.throws(() => assertP1Compatibility({}), /slot service/)
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
