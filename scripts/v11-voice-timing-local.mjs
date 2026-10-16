/**
 * Read-only Voice Timing Engine POC for a Google-TTS-Local offline media manifest.
 *
 * This is an *offline* audio bridge, never Google Cloud TTS dispatch. It accepts
 * user-imported WAV assets only, checks SHA-256 and actual RIFF duration, and
 * recalculates sequential-vs-parallel dramatic time. No approval or invoice
 * is implied. Results are preliminary until actor audio and animatic pass.
 */
import { createHash } from 'node:crypto'
import { readFileSync, realpathSync, lstatSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'

const finite = v => typeof v === 'number' && Number.isFinite(v) && v >= 0
const requiredText = v => typeof v === 'string' && v.trim().length > 0
const tenth = seconds => Math.ceil(seconds * 10 - 1e-8) / 10
const reason = (code, detail) => ({ code, detail })
const block = (code, detail) => ({ status: 'blocked', diagnostics: [reason(code, detail)] })

export function wavDurationSeconds(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 44 ||
      bytes.toString('ascii', 0, 4) !== 'RIFF' ||
      bytes.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('WAV_RIFF_HEADER_INVALID')
  }
  const riffSize = bytes.readUInt32LE(4)
  if (riffSize + 8 > bytes.length) throw new Error('WAV_RIFF_TRUNCATED')
  let sampleRate = 0; let bytesPerSecond = 0; let dataBytes = -1
  for (let pos = 12; pos + 8 <= bytes.length;) {
    const kind = bytes.toString('ascii', pos, pos + 4)
    const length = bytes.readUInt32LE(pos + 4)
    const from = pos + 8
    if (from + length > bytes.length) throw new Error('WAV_CHUNK_TRUNCATED')
    if (kind === 'fmt ') {
      if (length < 16 || bytes.readUInt16LE(from) !== 1) throw new Error('WAV_NOT_PCM')
      sampleRate = bytes.readUInt32LE(from + 4)
      bytesPerSecond = bytes.readUInt32LE(from + 8)
    }
    if (kind === 'data') dataBytes = length
    pos = from + length + (length % 2)
  }
  if (!sampleRate || !bytesPerSecond || dataBytes <= 0) {
    throw new Error('WAV_MISSING_PCM_DATA')
  }
  return dataBytes / bytesPerSecond
}

function sourceTake(source, takeId) {
  for (const unit of source?.source_units ?? []) {
    const take = unit?.options?.find(x => x.take_id === takeId)
    if (take) return take
  }
  return null
}

function checkedAudio(item, root, expectedText) {
  if (item?.source !== 'LOCAL_USER_IMPORT' ||
    typeof item.path !== 'string' || item.format !== 'wav' ||
    !/^[a-f0-9]{64}$/i.test(item.sha256 ?? '') ||
    !finite(item.duration_seconds) || item.duration_seconds === 0) {
    throw new Error('UNTRUSTED_OR_UNSUPPORTED_AUDIO_METADATA')
  }
  if (item.text !== expectedText) throw new Error('AUDIO_TEXT_STALE')
  if (!requiredText(item.asset_version_id) || !/^[a-f0-9]{64}$/i.test(item.asset_text_sha256 ?? '')) {
    throw new Error('AUDIO_IMMUTABLE_TEXT_SNAPSHOT_MISSING')
  }
  const snapshot = createHash('sha256').update(expectedText, 'utf8').digest('hex')
  if (snapshot !== item.asset_text_sha256.toLowerCase()) {
    throw new Error('AUDIO_TEXT_VERSION_STALE')
  }
  const folder = realpathSync(root)
  const path = resolve(folder, item.path)
  const rel = relative(folder, path)
  if (!rel || rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel)) {
    throw new Error('AUDIO_PATH_OUTSIDE_PROJECT')
  }
  if (lstatSync(path).isSymbolicLink() || realpathSync(path) !== path) {
    throw new Error('AUDIO_PATH_SYMLINK')
  }
  const bytes = readFileSync(path)
  const hash = createHash('sha256').update(bytes).digest('hex')
  if (hash !== item.sha256.toLowerCase()) throw new Error('AUDIO_HASH_MISMATCH')
  const seconds = wavDurationSeconds(bytes)
  if (Math.abs(seconds - item.duration_seconds) > 0.02) {
    throw new Error('AUDIO_DURATION_MISMATCH')
  }
  return seconds
}

/**
 * source: the annotated episode with alternatives, NOT the user-unmodified
 * screenplay. draft: planDirectorEpisode result.
 * manifest: output of Google-TTS-Local OfflineMediaStore.manifest().
 * audioRoot: dirname(OfflineMediaStore.write_manifest()).
 * bindings: [{ director_unit_id, line_id, text }] with each dialogue line
 * provided exactly once. Multiple lines per unit are sequential by default.
 */
export function reconcileV11VoiceTiming({ source, draft, manifest, audioRoot, bindings }) {
  if (draft?.status !== 'draft' ||
      !Array.isArray(draft?.director_revision?.units) ||
      !Array.isArray(draft.selected_take_ids) ||
      draft.director_revision.units.length !== draft.selected_take_ids.length) {
    return block('DIRECTOR_DRAFT_INVALID', 'A valid unapproved director planning draft is required.')
  }
  if (manifest?.schema_version !== 1 || manifest?.language_code !== 'en-US' ||
      manifest?.audio_origin !== 'offline_asset_or_external_provider_output' ||
      !Array.isArray(manifest.items) || !requiredText(audioRoot)) {
    return block('GOOGLE_LOCAL_MANIFEST_INVALID', 'Expected an offline audio manifest and en-US language.')
  }
  if (!Array.isArray(bindings) || !bindings.every(b =>
      requiredText(b.director_unit_id) && requiredText(b.line_id) && typeof b.text === 'string')) {
    return block('VOICE_BINDINGS_INVALID', 'Each line must have an exact director unit and text binding.')
  }

  const byLine = new Map()
  for (const item of manifest.items) {
    if (!requiredText(item?.line_id) || byLine.has(item.line_id)) {
      return block('VOICE_LINE_DUPLICATED', 'The offline asset manifest contains duplicate line IDs.')
    }
    byLine.set(item.line_id, item)
  }
  const bindingsByUnit = new Map()
  const seenLine = new Set()
  for (const bind of bindings) {
    if (seenLine.has(bind.line_id)) return block('VOICE_BINDING_DUPLICATED', bind.line_id)
    seenLine.add(bind.line_id)
    const entries = bindingsByUnit.get(bind.director_unit_id) ?? []
    entries.push(bind)
    bindingsByUnit.set(bind.director_unit_id, entries)
  }
  if (seenLine.size !== byLine.size || [...seenLine].some(id => !byLine.has(id))) {
    return block('VOICE_BINDING_INCOMPLETE', 'Every imported audio line must have a single binding.')
  }

  const adjusted = []
  const consumed = new Set()
  for (const [index, unit] of draft.director_revision.units.entries()) {
    const take = sourceTake(source, draft.selected_take_ids[index])
    if (!take) return block('DIRECTOR_TAKE_NOT_FOUND', unit.unit_id)
    const spokenText = take.spoken_text ?? ''
    const lines = bindingsByUnit.get(unit.unit_id) ?? []
    const combined = lines.map(x => x.text).join(' ').trim()
    if (combined !== spokenText.trim()) {
      return block('VOICE_DIRECTOR_TEXT_STALE', unit.unit_id)
    }
    let audio = 0
    const provenance = new Set()
    for (const bind of lines) {
      const item = byLine.get(bind.line_id)
      try {
        audio += checkedAudio(item, audioRoot, bind.text)
      } catch (error) {
        return block(String(error?.message ?? 'VOICE_ASSET_INVALID'), bind.line_id)
      }
      consumed.add(bind.line_id)
      provenance.add(String(item.engine ?? 'unknown'))
    }
    const timing = take.timing ?? {}
    const parallel = timing.parallel_action_seconds ?? 0
    const sequential = timing.sequential_action_seconds ?? 0
    const reaction = timing.reaction_seconds ?? 0
    if (![parallel, sequential, reaction].every(finite) || (spokenText.trim() && !lines.length)) {
      return block('VOICE_DURATION_OR_TRACK_MISSING', unit.unit_id)
    }
    const computed = tenth(Math.max(audio, parallel) + sequential + reaction)
    adjusted.push({
      director_unit_id: unit.unit_id,
      selected_take_id: draft.selected_take_ids[index],
      scene_id: unit.scene_id,
      estimated_unit_seconds: unit.estimate.seconds,
      measured_audio_seconds: Math.round(audio * 1000) / 1000,
      adjusted_unit_seconds: computed,
      seconds_delta: Math.round((computed - unit.estimate.seconds) * 10) / 10,
      local_voice_engine: [...provenance],
      source: 'LOCAL_USER_IMPORT',
    })
  }
  if (consumed.size !== byLine.size || [...bindingsByUnit.keys()].some(id =>
      !adjusted.some(row => row.director_unit_id === id))) {
    return block('VOICE_UNEXPECTED_OR_UNBOUND_UNITS', 'Unmatched director unit or unexpected audio import.')
  }
  const programTimeline = []
  let cursor = 0; let unitIndex = 0
  for (const event of draft.episode_timing?.timeline ?? []) {
    const duration = event.end_seconds - event.start_seconds
    if (!finite(duration)) return block('PROGRAM_TIMELINE_INVALID', String(event.kind))
    const newDuration = event.kind === 'director_unit' ? adjusted[unitIndex++]?.adjusted_unit_seconds : duration
    if (!finite(newDuration)) return block('PROGRAM_UNIT_NOT_MATCHED', String(event.kind))
    programTimeline.push({ kind: event.kind, start_seconds:Math.round(cursor * 10)/10,
      end_seconds:Math.round((cursor + newDuration) * 10)/10,
      ...(event.director_unit_id ? { director_unit_id:event.director_unit_id } : {}) })
    cursor += newDuration
  }
  if (unitIndex !== adjusted.length) return block('VOICE_TIMELINE_INCOMPLETE', 'Missing director units.')
  const total = Math.round(cursor * 10) / 10
  const margin = Math.round((120 - total) * 10) / 10
  return {
    status: total > 120 || total < 60 ? 'blocked_out_of_policy' : 'offline_audio_proxy_within_policy',
    draft_revision_id: draft.director_revision.revision_id,
    planned_seconds: draft.episode_timing.total_duration_seconds,
    adjusted_seconds: total,
    margin_to_120_seconds: margin,
    audio_line_count: consumed.size,
    verified_asset_hashes: consumed.size,
    unit_timing: adjusted,
    timeline: programTimeline,
    quality_evidence: {
      actual_google_cloud_tts: false, actual_cast_voices: false,
      human_readthrough: 'NOT_RUN', animatic: 'NOT_RUN',
      provider_source: 'LOCAL_USER_IMPORT',
      inference: 'OFFLINE_AUDIO_PROXY_ONLY',
    },
    // Even an in-range offline proxy cannot clear the final production gate.
    production_gate: 'BLOCKED',
    recommended_action: margin < 0 ?
      'Director must revise dramatic expression and/or concurrency, generate fresh audio versions and recompute. Do not increase speech speed merely to pass.' :
      'Rehearse with actual cast voices, verify emotion and spatial continuity, then create model-ready VIDEO/SHOT packages.',
  }
}
