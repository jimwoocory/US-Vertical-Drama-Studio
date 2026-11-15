/** Versioned reference intent and real local-media verification; no network access. */
import { readFileSync, realpathSync } from 'node:fs'
import { resolve, relative, isAbsolute } from 'node:path'
import { createHash } from 'node:crypto'
import { referenceContent } from './v11-artifact-freshness.mjs'

export const REFERENCE_SCHEMA = JSON.parse(readFileSync(new URL('../core/usvd-v9/contracts/reference-binding-v2.schema.json', import.meta.url), 'utf8'))
export const REFERENCE_PURPOSES = REFERENCE_SCHEMA.properties.purpose.enum
export const REFERENCE_LABELS = ['外貌', '主体', '造型状态', '空间布局', '构图', '尺度', '效果', '起始帧', '结束帧', '风格']
const filled = v => typeof v === 'string' && v.trim().length > 0
const list = v => Array.isArray(v) && v.every(filled)
const digest = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v)

export function validateReferenceBindings(pkg, { mediaRoot, verifyMedia = true } = {}) {
  const diagnostics = []
  const fail = (code, ref, detail = '') => diagnostics.push({ code, ref, detail })
  if (!Array.isArray(pkg.reference_bindings)) return [{ code: 'reference_bindings_missing', ref: 'PACKAGE' }]
  const assets = new Map((pkg.assets ?? []).map(a => [a.id, a]))
  const videos = new Map((pkg.videos ?? []).map(v => [v.video_id, v]))
  const shots = new Map((pkg.shots ?? []).map(s => [s.shot_id, s]))
  const ids = new Set(); const slots = new Set()
  for (const b of pkg.reference_bindings) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) { fail('invalid_reference_binding', 'PACKAGE'); continue }
    const ref = b.binding_id ?? 'REFERENCE'
    if (REFERENCE_SCHEMA.required.some(k => !Object.hasOwn(b, k)) || Object.keys(b).some(k => !Object.hasOwn(REFERENCE_SCHEMA.properties, k))) fail('reference_schema_invalid', ref)
    if (!filled(b.binding_id) || ids.has(b.binding_id)) fail('reference_id_invalid_or_duplicate', ref)
    ids.add(b.binding_id)
    const asset = assets.get(b.asset_id)
    if (!asset || asset.status !== 'approved') fail('reference_asset_not_approved', ref)
    if (!filled(b.asset_version_id) || !digest(b.sha256) || !asset || b.asset_version_id !== asset.asset_version_id || b.sha256 !== asset.sha256) fail('reference_version_mismatch', ref)
    if (!REFERENCE_PURPOSES.includes(b.purpose) || !list(b.controls) || !b.controls.length || !list(b.must_not_control) || !b.must_not_control.length || b.controls.some(c => b.must_not_control.includes(c))) fail('reference_control_invalid', ref)
    if (!videos.has(b.video_id) || !Array.isArray(b.shot_ids) || !b.shot_ids.length || new Set(b.shot_ids).size !== b.shot_ids.length || b.shot_ids.some(id => !shots.has(id) || shots.get(id).video_id !== b.video_id || !shots.get(id).asset_ids?.includes(b.asset_id))) fail('reference_scope_invalid', ref)
    if (!Number.isInteger(b.order) || b.order < 1 || !['reference_images', 'start_frame', 'end_frame'].includes(b.input_slot)) fail('reference_slot_invalid', ref)
    const slot = `${b.video_id}:${b.input_slot}:${b.order}`
    if (slots.has(slot)) fail('reference_slot_duplicate', ref)
    slots.add(slot)
    if (b.status !== 'resolved' || !filled(b.media_path)) fail('reference_pending', ref)
    if (b.purpose === 'first_frame' && b.input_slot !== 'start_frame' || b.purpose === 'last_frame' && b.input_slot !== 'end_frame') fail('reference_purpose_slot_mismatch', ref)
    if (pkg.capability_profile?.[b.input_slot] !== 'supported') fail('reference_capability_unverified', ref)
    if (verifyMedia && b.status === 'resolved') {
      try {
        if (!mediaRoot || !filled(b.media_path) || isAbsolute(b.media_path)) throw new Error('media_root_or_relative_path_required')
        const root = realpathSync(mediaRoot)
        const file = realpathSync(resolve(root, b.media_path))
        const rel = relative(root, file)
        if (!rel || rel === '..' || rel.startsWith('..\\') || rel.startsWith('../') || isAbsolute(rel)) throw new Error('reference_path_outside_media_root')
        const bytes = readFileSync(file)
        const image = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])) || bytes.toString('ascii', 0, 6).startsWith('GIF8') || bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
        if (!image) throw new Error('reference_image_header_invalid')
        if (createHash('sha256').update(bytes).digest('hex') !== b.sha256) throw new Error('reference_content_changed')
      } catch (error) { fail('reference_media_unverified', ref, error.message) }
    }
  }
  for (const video of pkg.videos ?? []) {
    const bound = pkg.reference_bindings.filter(b => b?.video_id === video.video_id)
    const profile = pkg.reference_profile
    if (!profile || !Number.isInteger(profile.max_images) || profile.max_images < 0 || typeof profile.allow_mixed_frames_and_references !== 'boolean' || typeof profile.allow_same_first_last !== 'boolean') { fail('reference_profile_missing', video.video_id); continue }
    if (bound.length > profile.max_images) fail('reference_limit_exceeded', video.video_id)
    for (const slot of ['reference_images', 'start_frame', 'end_frame']) {
      const entries = bound.filter(b => b.input_slot === slot).sort((a, b) => a.order - b.order)
      if (entries.some((b, i) => b.order !== i + 1) || slot !== 'reference_images' && entries.length > 1) fail('reference_slot_order_invalid', video.video_id)
    }
    if (bound.some(b => b.input_slot === 'end_frame') && !bound.some(b => b.input_slot === 'start_frame')) fail('reference_end_without_start', video.video_id)
    if (bound.some(b => b.input_slot === 'reference_images') && bound.some(b => b.input_slot !== 'reference_images') && !profile.allow_mixed_frames_and_references) fail('reference_modes_conflict', video.video_id)
    for (let i = 0; i < bound.length; i++) for (let j = i + 1; j < bound.length; j++) {
      if (bound[i].sha256 === bound[j].sha256 && !(profile.allow_same_first_last && new Set([bound[i].input_slot, bound[j].input_slot]).size === 2 && [bound[i].input_slot, bound[j].input_slot].every(s => ['start_frame', 'end_frame'].includes(s)))) fail('reference_media_duplicate', video.video_id)
    }
    const requiredAssets = new Set((pkg.shots ?? []).filter(s => s.video_id === video.video_id).flatMap(s => s.asset_ids ?? []))
    if (video.generation_mode !== 'text' && [...requiredAssets].some(id => !bound.some(b => b.asset_id === id))) fail('reference_asset_coverage_missing', video.video_id)
    if (video.generation_mode === 'text' && bound.length) fail('reference_text_mode_conflict', video.video_id)
    if (!['text', 'reference'].includes(video.generation_mode)) fail('reference_generation_mode_missing', video.video_id)
  }
  return diagnostics
}

export function compileReferenceBindings(pkg, videoId) {
  return pkg.reference_bindings.filter(b => b.video_id === videoId).toSorted((a, b) => a.input_slot.localeCompare(b.input_slot) || a.order - b.order).map(b => ({ ...referenceContent(b), media_path: b.media_path }))
}
