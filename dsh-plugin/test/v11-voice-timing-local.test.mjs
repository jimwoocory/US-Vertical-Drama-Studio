import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { reconcileV11VoiceTiming, wavDurationSeconds } from '../../scripts/v11-voice-timing-local.mjs'

function wav(seconds = 4) {
  const rate = 8000
  const bytes = Buffer.alloc(44 + Math.round(rate * seconds) * 2)
  bytes.write('RIFF', 0, 4, 'ascii')
  bytes.writeUInt32LE(bytes.length - 8, 4)
  bytes.write('WAVE', 8, 4, 'ascii')
  bytes.write('fmt ', 12, 4, 'ascii')
  bytes.writeUInt32LE(16, 16)
  bytes.writeUInt16LE(1, 20) // PCM
  bytes.writeUInt16LE(1, 22)
  bytes.writeUInt32LE(rate, 24)
  bytes.writeUInt32LE(rate * 2, 28)
  bytes.writeUInt16LE(2, 32)
  bytes.writeUInt16LE(16, 34)
  bytes.write('data', 36, 4, 'ascii')
  bytes.writeUInt32LE(bytes.length - 44, 40)
  return bytes
}

function fixture(audioSeconds = 4) {
  const folder = mkdtempSync(join(tmpdir(), 'v11-voice-local-'))
  mkdirSync(join(folder, 'lines'))
  const bytes = wav(audioSeconds)
  writeFileSync(join(folder, 'lines', 'line.wav'), bytes)
  const text = 'This is a natural English test line.'
  const item = {
    line_id: 'LINE-01', text, character: 'Narrator', source: 'LOCAL_USER_IMPORT',
    voice: 'Local offline test', engine:'windows_sapi_offline_proxy',
    format: 'wav', path: 'lines/line.wav', duration_seconds: audioSeconds,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    asset_version_id: 'asset-v1',
    asset_text_sha256: createHash('sha256').update(text, 'utf8').digest('hex'),
  }
  const manifest = {
    schema_version: 1, project_id:'test', language_code:'en-US',
    audio_origin:'offline_asset_or_external_provider_output', items:[item],
  }
  const source = {source_units:[{
    options:[{
      take_id:'TAKE-1', text:'A visual action', spoken_text:text,
      timing:{parallel_action_seconds:6,sequential_action_seconds:2,reaction_seconds:1},
    }],
  }]}
  const draft = {
    status:'draft',selected_take_ids:['TAKE-1'],
    director_revision:{revision_id:'DIR-REV-1',units:[
      {unit_id:'DU-01',scene_id:'SC-01',estimate:{seconds:7.1}},
    ]},
    episode_timing:{total_duration_seconds:80,
      timeline:[
        {kind:'opening',start_seconds:0,end_seconds:62},
        {kind:'director_unit',director_unit_id:'DU-01',start_seconds:62,end_seconds:69.1},
        {kind:'ending',start_seconds:69.1,end_seconds:80},
      ],
    },
  }
  const bindings=[{line_id:'LINE-01',director_unit_id:'DU-01',text}]
  return { folder, manifest, source, draft, bindings }
}

test('WAV parser returns actual PCM frame duration', () => {
  assert.equal(wavDurationSeconds(wav(4.25)),4.25)
  assert.throws(() => wavDurationSeconds(Buffer.alloc(48)),/WAV_RIFF_HEADER_INVALID/)
})

test('voice timing bridge verifies hashes and audio, does not add concurrent action twice', () => {
  const f=fixture(4)
  try {
    const result=reconcileV11VoiceTiming({
      source:f.source,draft:f.draft,manifest:f.manifest,audioRoot:f.folder,bindings:f.bindings,
    })
    assert.equal(result.status,'offline_audio_proxy_within_policy')
    assert.equal(result.verified_asset_hashes,1)
    assert.equal(result.unit_timing[0].measured_audio_seconds,4)
    assert.equal(result.unit_timing[0].adjusted_unit_seconds,9)
    assert.equal(result.adjusted_seconds,81.9)
    assert.equal(result.quality_evidence.actual_google_cloud_tts,false)
    assert.equal(result.production_gate,'BLOCKED')
  } finally {rmSync(f.folder,{recursive:true,force:true})}
})

test('measured audio duration above parallel action expands the actual programme', () => {
  const f=fixture(8)
  try {
    const r=reconcileV11VoiceTiming({
      source:f.source,draft:f.draft,manifest:f.manifest,audioRoot:f.folder,bindings:f.bindings,
    })
    assert.equal(r.unit_timing[0].adjusted_unit_seconds,11)
    assert.equal(r.adjusted_seconds,83.9)
  }finally{rmSync(f.folder,{recursive:true,force:true})}
})

test('stale text, missing bindings, and corrupt hashes fail closed',()=>{
  const f=fixture()
  try {
    const args={source:f.source,draft:f.draft,manifest:f.manifest,audioRoot:f.folder,bindings:f.bindings}
    assert.equal(reconcileV11VoiceTiming({...args,bindings:[]}).diagnostics[0].code,'VOICE_BINDING_INCOMPLETE')
    assert.equal(reconcileV11VoiceTiming({...args,bindings:[{...f.bindings[0],text:'changed'}]}).diagnostics[0].code,'VOICE_DIRECTOR_TEXT_STALE')
    f.manifest.items[0].sha256='a'.repeat(64)
    assert.equal(reconcileV11VoiceTiming(args).diagnostics[0].code,'AUDIO_HASH_MISMATCH')
  }finally{rmSync(f.folder,{recursive:true,force:true})}
})

test('immutable audio-text snapshot detects stale versions rather than trusting current transcript metadata',()=>{
  const f=fixture()
  try {
    const args={source:f.source,draft:f.draft,manifest:f.manifest,audioRoot:f.folder,bindings:f.bindings}
    delete f.manifest.items[0].asset_version_id
    assert.equal(reconcileV11VoiceTiming(args).diagnostics[0].code,'AUDIO_IMMUTABLE_TEXT_SNAPSHOT_MISSING')
    f.manifest.items[0].asset_version_id='asset-v1'
    f.manifest.items[0].asset_text_sha256='b'.repeat(64)
    assert.equal(reconcileV11VoiceTiming(args).diagnostics[0].code,'AUDIO_TEXT_VERSION_STALE')
  } finally {rmSync(f.folder,{recursive:true,force:true})}
})

test('unsupported mock or fraudulent Google audio cannot pass local audio validation',()=>{
  const f=fixture()
  try {
    f.manifest.items[0].source='MOCK_ONLY'
    assert.equal(reconcileV11VoiceTiming({
      source:f.source,draft:f.draft,manifest:f.manifest,audioRoot:f.folder,bindings:f.bindings,
    }).diagnostics[0].code,'UNTRUSTED_OR_UNSUPPORTED_AUDIO_METADATA')
  }finally{rmSync(f.folder,{recursive:true,force:true})}
})
