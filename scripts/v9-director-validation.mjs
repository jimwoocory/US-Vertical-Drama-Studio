const EPSILON = 0.01
const MAX_VIDEO_DURATION_SECONDS = 15
const SHOT_AUDIO_FIELDS = ['dialogue', 'inner_voice', 'environment_sound', 'sfx', 'music_cue']

export const FORBIDDEN_MODEL_PROMPT_FIELDS = new Set([
  'video_master_prompt',
  'video_negative_prompt',
  'shot_delta_prompt',
  'final_model_prompt',
  'model_prompt',
  'seedance_prompt',
])

export function validateDirectorPackage(pkg) {
  return [
    ...validateTimingClosure(pkg),
    ...validateShotLevelFields(pkg),
    ...findForbiddenModelPromptFields(pkg),
  ]
}

export function validateShotLevelFields(pkg) {
  const videos = Array.isArray(pkg?.videos) ? pkg.videos : []
  const shots = Array.isArray(pkg?.shots) ? pkg.shots : []
  const shotLevel = pkg?.audio_schema_version === 'shot-level-2'
    || videos.some(video => video?.audio_schema_version === 'shot-level-2')
    || shots.some(shot => Array.isArray(shot?.shot_events))
  if (!shotLevel) return []

  const diagnostics = []
  for (const shot of shots) {
    for (const field of SHOT_AUDIO_FIELDS) {
      if (!Object.hasOwn(shot ?? {}, field)) diagnostics.push({ code: 'shot_audio_field_missing', ref: shot?.shot_id, field })
    }
    if (!String(shot?.camera_movement ?? '').trim() && !shot?.camera_movement?.type) {
      diagnostics.push({ code: 'camera_movement_missing', ref: shot?.shot_id })
    }
    const movement = typeof shot?.camera_movement === 'string' ? shot.camera_movement : shot?.camera_movement?.type
    const dynamic = /push|pull|pan|tilt|dolly|track|orbit|zoom|handheld|crane|横移|推|拉|摇|移|跟拍|环绕|变焦|手持|升降/u.test(String(movement ?? '').toLowerCase())
    if (dynamic && !String(shot?.camera_movement_motivation ?? shot?.camera_movement?.motivation ?? '').trim()) {
      diagnostics.push({ code: 'camera_movement_without_motivation', ref: shot?.shot_id })
    }
  }
  return diagnostics
}

export function validateTimingClosure(pkg) {
  const diagnostics = []
  const videos = Array.isArray(pkg?.videos) ? pkg.videos : []
  const shots = Array.isArray(pkg?.shots) ? pkg.shots : []

  for (const video of videos) {
    const videoId = video.video_id
    const duration = Number(video.duration_seconds)
    const children = shots
      .filter(shot => shot.video_id === videoId)
      .toSorted((a, b) => Number(a.time_in) - Number(b.time_in))

    if (!Number.isFinite(duration) || duration <= 0) {
      diagnostics.push({ code: 'invalid_video_duration', ref: videoId })
      continue
    }
    if (duration > MAX_VIDEO_DURATION_SECONDS + EPSILON) {
      diagnostics.push({ code: 'video_duration_exceeds_max', ref: videoId, max_duration: MAX_VIDEO_DURATION_SECONDS, actual_duration: duration })
    }
    if (children.length === 0) {
      diagnostics.push({ code: 'video_has_no_shots', ref: videoId })
      continue
    }

    let expectedIn = 0
    for (const shot of children) {
      const start = Number(shot.time_in)
      const end = Number(shot.time_out)
      const declared = Number(shot.duration_seconds)

      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        diagnostics.push({ code: 'invalid_shot_range', ref: shot.shot_id })
        continue
      }

      if (Math.abs(start - expectedIn) > EPSILON) {
        diagnostics.push({
          code: start > expectedIn ? 'timing_gap' : 'timing_overlap',
          ref: shot.shot_id,
          expected_in: expectedIn,
          actual_in: start,
        })
      }

      const computed = end - start
      if (!Number.isFinite(declared) || Math.abs(declared - computed) > EPSILON) {
        diagnostics.push({
          code: 'shot_duration_mismatch',
          ref: shot.shot_id,
          expected_duration: computed,
          actual_duration: shot.duration_seconds,
        })
      }
      expectedIn = end
    }

    if (Math.abs(expectedIn - duration) > EPSILON) {
      diagnostics.push({
        code: 'video_duration_not_fully_covered',
        ref: videoId,
        expected_end: duration,
        actual_end: expectedIn,
      })
    }
  }

  return diagnostics
}

export function findForbiddenModelPromptFields(value, path = '$', diagnostics = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findForbiddenModelPromptFields(item, `${path}[${index}]`, diagnostics))
    return diagnostics
  }
  if (value === null || typeof value !== 'object') return diagnostics

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`
    if (FORBIDDEN_MODEL_PROMPT_FIELDS.has(key)) {
      diagnostics.push({ code: 'model_prompt_leakage', ref: childPath, field: key })
    }
    findForbiddenModelPromptFields(child, childPath, diagnostics)
  }
  return diagnostics
}
