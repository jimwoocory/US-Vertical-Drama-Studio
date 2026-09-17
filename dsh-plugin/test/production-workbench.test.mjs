import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { buildProductionSnapshot, parseStoryboardText, PRODUCTION_WORKBENCH_SCHEMA } from '../production-workbench.js'
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
  manifest.videos[0].video_prompt_id = 'VIDEO-PROMPT-001'
  manifest.videos[0].video_master_prompt = '4 秒视频总提示词：伊芙发现拍卖厅入口异动，依次展示手部、抬眼和吊灯冷光。'
  manifest.videos[0].video_negative_prompt = '不改变角色、服装、场景和道具。'
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
  manifest.videos[0].video_prompt_id = 'VIDEO-PROMPT-001'
  manifest.videos[0].video_master_prompt = '5 秒视频总提示词。'
  manifest.videos[0].video_negative_prompt = '不改变角色。'
  manifest.shots[0] = { ...manifest.shots[0], display_name_zh: '过长切片', duration_seconds: 4, timeline_in_seconds: 0, timeline_out_seconds: 4 }
  const snapshot = buildProductionSnapshot(manifest)
  assert.equal(snapshot.shots[0].status, 'blocked')
  assert.ok(snapshot.diagnostics.some(item => item.code === 'long_micro_shot_without_reason'))
  assert.ok(snapshot.diagnostics.some(item => item.code === 'micro_shot_timeline_not_full_coverage'))
})

test('blocks micro-shots when their VIDEO master prompt is absent', () => {
  const manifest = structuredClone(ready)
  manifest.videos = [{ video_id: 'VIDEO-001', display_name_zh: '缺少视频提示词的包', duration_seconds: 8, status: 'draft' }]
  manifest.shots[0] = { ...manifest.shots[0], display_name_zh: '测试微镜头', duration_seconds: 2, timeline_in_seconds: 0, timeline_out_seconds: 2 }
  const snapshot = buildProductionSnapshot(manifest)
  assert.equal(snapshot.videos[0].status, 'blocked')
  assert.equal(snapshot.shots[0].status, 'blocked')
  assert.ok(snapshot.diagnostics.some(item => item.code === 'missing_video_prompt_layers'))
})

test('automatically maps readable storyboard text into video and micro-shot records', () => {
  const source = `【视频编号】VIDEO-001
【中文显示名】伊芙发现入口异动
【总时长】4秒
【视频生成总提示词】4 秒竖屏视频：伊芙先停住手，再抬眼看向入口；服装、拍卖厅与酒杯连续。
【视频级负面约束】不改变角色、服装、地点或酒杯。
【镜头编号】SHOT-001-01
【包内时间】0–1.5秒
【时长】1.5秒
【视频生成提示词】伊芙的手停在酒杯旁，手部特写。
【负面约束】不改变晚礼服。
【镜头编号】SHOT-001-02
【包内时间】1.5–4秒
【时长】2.5秒
【视频生成提示词】伊芙抬眼看向入口，近景，冷白吊灯光。
【负面约束】不新增人物。`
  const manifest = parseStoryboardText(source, '第 1 集.md')
  const snapshot = buildProductionSnapshot(manifest)
  assert.equal(snapshot.videos[0].video_id, 'VIDEO-001')
  assert.equal(snapshot.videos[0].video_master_prompt.includes('伊芙先停住手'), true)
  assert.equal(snapshot.shots[1].video_id, 'VIDEO-001')
  assert.equal(snapshot.shots[1].timeline_in_seconds, 1.5)
  assert.equal(snapshot.summary.errors, 0)
})

test('accepts the V8-style compact video and shot headings', () => {
  const source = `【视频编号05】
总时长：3.0秒
【场景与连续状态】深夜拍卖厅，伊芙握着酒杯。
【镜头01】 1.0s｜特写
【画面】伊芙手指停在酒杯边。
【镜头02】 2.0s｜近景
【画面】伊芙抬眼看向入口。`
  const snapshot = buildProductionSnapshot(parseStoryboardText(source, 'V8 分镜.txt'))
  assert.equal(snapshot.videos.length, 1)
  assert.equal(snapshot.shots.length, 2)
  assert.equal(snapshot.shots[1].timeline_in_seconds, 1)
  assert.match(snapshot.videos[0].video_master_prompt, /伊芙抬眼/)
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
