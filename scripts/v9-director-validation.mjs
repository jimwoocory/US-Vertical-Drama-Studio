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
    ...validateEpisodeDuration(pkg),
    ...validateDirectorAdaptation(pkg),
    ...validateShotLevelFields(pkg),
    ...findForbiddenModelPromptFields(pkg),
  ]
}

// An episode is an assembled programme, not the sum of model requests. Absolute
// timeline intervals include titles, transitions and audio tails; their union
// counts simultaneous picture/audio once. Legacy packages without a policy keep
// their original validation behavior and are never labelled duration-compliant.
export function validateEpisodeDuration(pkg) {
  return inspectEpisodeDuration(pkg).diagnostics
}

export function inspectEpisodeDuration(pkg) {
  const diagnostics = []
  const policies = [pkg?.project_brief?.duration_policy, pkg?.duration_policy].filter(value => value !== undefined)
  if (!policies.length) return { diagnostics, total_seconds: null, policy_active: false, status: 'legacy_unverified' }
  const parsed = policies.map(parseDurationPolicy)
  if (parsed.every(value => value === 'legacy')) return { diagnostics, total_seconds: null, policy_active: false, status: 'legacy_unverified' }
  if (parsed.some(value => !value)) diagnostics.push({ code: 'episode_duration_policy_invalid', ref: 'duration_policy' })
  const policy = parsed.find(value => value && value !== 'legacy')
  if (policy && parsed.some(value => value === 'legacy' || (value && JSON.stringify(value) !== JSON.stringify(policy)))) {
    diagnostics.push({ code: 'episode_duration_policy_conflict', ref: 'duration_policy' })
  }
  const timing = pkg?.episode_timing
  const total = timing?.total_duration_seconds
  const totalValid = finiteNumber(total) && total > 0
  if (!totalValid) diagnostics.push({ code: 'episode_total_duration_unknown', ref: 'episode_timing.total_duration_seconds' })
  if (totalValid && policy && (total < policy.min_seconds || total > policy.max_seconds)) {
    diagnostics.push({ code: 'episode_duration_out_of_policy', ref: 'episode_timing', actual_duration: total, min_duration: policy.min_seconds, max_duration: policy.max_seconds })
  }
  const videos = Array.isArray(pkg?.videos) ? pkg.videos : []
  const byId = new Map()
  for (const video of videos) {
    if (typeof video?.video_id !== 'string' || !video.video_id.trim() || byId.has(video.video_id)) {
      diagnostics.push({ code: 'episode_video_id_invalid_or_duplicate', ref: video?.video_id })
    }
    byId.set(video?.video_id, video)
    if (!finiteNumber(video?.duration_seconds) || video.duration_seconds <= 0 || video.duration_seconds > MAX_VIDEO_DURATION_SECONDS) {
      diagnostics.push({ code: 'episode_video_duration_invalid', ref: video?.video_id, max_duration: MAX_VIDEO_DURATION_SECONDS })
    } else if (policy && video.duration_seconds > policy.video_max_seconds) {
      diagnostics.push({ code: 'episode_video_duration_exceeds_policy', ref: video.video_id, max_duration: policy.video_max_seconds })
    }
  }
  const timeline = timing?.timeline
  if (!Array.isArray(timeline) || !timeline.length) {
    diagnostics.push({ code: 'episode_timeline_missing', ref: 'episode_timing.timeline' })
  } else {
    const seenVideos = new Set()
    const intervals = []
    const visualIntervals = []
    const kinds = new Set(['video', 'opening', 'ending', 'transition', 'audio_tail'])
    for (const [index, item] of timeline.entries()) {
      const ref = `episode_timing.timeline[${index}]`
      const start = item?.start_seconds
      const end = item?.end_seconds
      if (!kinds.has(item?.kind)) diagnostics.push({ code: 'episode_timeline_kind_invalid', ref })
      if (!finiteNumber(start) || !finiteNumber(end) || start < 0 || end <= start) {
        diagnostics.push({ code: 'episode_timeline_range_invalid', ref })
        continue
      }
      intervals.push([start, end])
      if (totalValid && end > total + EPSILON) diagnostics.push({ code: 'episode_timeline_outside_total', ref, actual_end: end, expected_end: total })
      if (item.kind === 'video') {
        visualIntervals.push([start, end, ref])
        const video = byId.get(item.video_id)
        if (!video || seenVideos.has(item.video_id)) diagnostics.push({ code: 'episode_timeline_video_missing_or_duplicate', ref, video_id: item.video_id })
        seenVideos.add(item.video_id)
        if (video && (!finiteNumber(video.duration_seconds) || Math.abs(end - start - video.duration_seconds) > EPSILON)) {
          diagnostics.push({ code: 'episode_timeline_video_duration_mismatch', ref, video_id: item.video_id })
        }
      }
    }
    // Ordinary VIDEO packages occupy the picture track sequentially. Overlay
    // titles, transitions and audio tails may share programme time, but two
    // model requests cannot silently hide footage by occupying the same slot.
    let visualEnd = 0
    for (const [start, end, ref] of visualIntervals.toSorted((a, b) => a[0] - b[0])) {
      if (start < visualEnd - EPSILON) diagnostics.push({ code: 'episode_video_overlap', ref })
      visualEnd = Math.max(visualEnd, end)
    }
    for (const video of videos) {
      if (!seenVideos.has(video?.video_id)) diagnostics.push({ code: 'episode_video_not_in_timeline', ref: video?.video_id })
    }
    let coveredEnd = 0
    for (const [start, end] of intervals.toSorted((a, b) => a[0] - b[0])) {
      if (start > coveredEnd + EPSILON) diagnostics.push({ code: 'episode_timeline_gap', ref: 'episode_timing.timeline', expected_in: coveredEnd, actual_in: start })
      coveredEnd = Math.max(coveredEnd, end)
    }
    if (totalValid && Math.abs(coveredEnd - total) > EPSILON) diagnostics.push({ code: 'episode_total_duration_mismatch', ref: 'episode_timing', declared_duration: total, timeline_end: coveredEnd })
  }
  if (!videos.length) diagnostics.push({ code: 'episode_has_no_videos', ref: 'videos' })
  return { diagnostics, total_seconds: totalValid ? total : null, policy_active: true, status: diagnostics.length ? 'blocked' : 'compliant' }
}

function finiteNumber(value) { return typeof value === 'number' && Number.isFinite(value) }

function parseDurationPolicy(value) {
  if (typeof value === 'string') {
    // Only an unambiguous approved range is normalized; prose such as an
    // illustrative target or contradictory numbers cannot certify readiness.
    const text = value.trim()
    const range = text.match(/^(?:complete[_ ]episode[:： ]*)?(60\s*(?:[-~～–—]|至|到)\s*120\s*(?:s|sec(?:onds)?|秒)|1\s*(?:[-~～–—]|至|到)\s*2\s*(?:min(?:utes)?|分钟))(?:\s*[;；,，]\s*(?:video|单包|视频包)\s*(?:<=|≤)\s*15\s*(?:s|秒))?$/iu)
    if (range) return { scope: 'complete_episode', min_seconds: 60, max_seconds: 120, video_max_seconds: 15 }
    // Historical free text never certified episode duration. Preserve it as
    // unverified; malformed attempts to opt into the V11 range fail closed.
    return /complete[_ ]episode|60\s*(?:[-~～–—]|至|到)\s*120|1\s*(?:[-~～–—]|至|到)\s*2\s*(?:min|分钟)/iu.test(text) ? null : 'legacy'
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const { min_seconds: min, max_seconds: max, video_max_seconds: videoMax, scope } = value
  if (Object.keys(value).some(key => !['scope', 'min_seconds', 'max_seconds', 'video_max_seconds'].includes(key))) return null
  if (scope !== 'complete_episode' || min !== 60 || max !== 120 || !finiteNumber(videoMax) || videoMax <= 0 || videoMax > 15) return null
  return { scope, min_seconds: min, max_seconds: max, video_max_seconds: videoMax }
}

const DIRECTOR_OPERATIONS = new Set(['retain', 'rewrite', 'merge', 'split'])
const DIRECTOR_STORY_GUARDS = [
  'core_promise', 'character_goals', 'causal_chain',
  'emotional_setup_payoff', 'continuity', 'continuing_hook',
]
const DIRECTOR_DIRECTION_FIELDS = [
  'objective', 'situation_change', 'character_tactic', 'opponent_response',
  'knowledge_sequence', 'emotional_payoff', 'continuing_hook',
]
const nonempty = value => typeof value === 'string' && value.trim().length > 0

// An adopted V11 complete-episode duration policy grants standing director
// authority to revise expression. No per-episode human approval or token is
// needed. Protected-canon changes still fail semantic review separately.
export function isDirectorAdaptationAuthorized(pkg) {
  const result = inspectEpisodeDuration(pkg)
  return result.policy_active && !result.diagnostics.some(item =>
    item.code === 'episode_duration_policy_invalid' ||
    item.code === 'episode_duration_policy_conflict')
}

// This is a structural proof of revision lineage and declared guard review,
// not an automated judgment of acting quality or story meaning.
// In legacy mode previous SCRIPT DOCTOR / approved-dialogue gates stay intact.
export function validateDirectorAdaptation(pkg) {
  const active = inspectEpisodeDuration(pkg).policy_active
  const revision = pkg?.director_revision
  if (!active && revision === undefined) return []
  const diagnostics = []
  const add = (code, ref = 'director_revision') => diagnostics.push({ code, ref })
  if (!active) { add('director_revision_without_v11_policy'); return diagnostics }
  if (!revision || typeof revision !== 'object' || Array.isArray(revision)) {
    add('director_revision_missing')
    return diagnostics
  }
  if (!isDirectorAdaptationAuthorized(pkg)) add('director_adaptation_policy_invalid')
  if (!nonempty(revision.revision_id) || !nonempty(revision.source_revision_id)
    || revision.revision_id === revision.source_revision_id) add('director_revision_ids_invalid')
  if (revision.status !== 'locked') add('director_revision_not_locked')

  const sourceIds = Array.isArray(revision.source_unit_ids) ? revision.source_unit_ids : []
  const sourceSet = new Set(sourceIds)
  if (!sourceIds.length || sourceSet.size !== sourceIds.length || sourceIds.some(id => !nonempty(id))) {
    add('director_source_units_invalid')
  }
  const unitIds = new Set()
  const covered = new Set()
  const units = Array.isArray(revision.units) ? revision.units : []
  if (!units.length) add('director_revision_units_missing')
  for (const [index, unit] of units.entries()) {
    const ref = 'director_revision.units[' + index + ']'
    if (!nonempty(unit?.unit_id) || unitIds.has(unit.unit_id)) add('director_unit_id_invalid_or_duplicate', ref)
    else unitIds.add(unit.unit_id)
    const refs = unit?.source_unit_ids
    if (!Array.isArray(refs) || refs.length === 0 || refs.some(id => !sourceSet.has(id))
      || new Set(refs).size !== refs.length) add('director_unit_source_mapping_invalid', ref)
    else for (const id of refs) covered.add(id)
    if (!DIRECTOR_OPERATIONS.has(unit?.operation)) add('director_unit_operation_invalid', ref)
    if (!nonempty(unit?.text)) add('director_unit_text_missing', ref)
    if (unit?.operation !== 'retain' && !nonempty(unit?.reason)) add('director_unit_change_reason_missing', ref)
    if (unit?.operation === 'merge' && refs?.length < 2) add('director_unit_merge_requires_sources', ref)
    if ((unit?.operation === 'retain' || unit?.operation === 'split') && refs?.length !== 1) {
      add('director_unit_operation_mapping_invalid', ref)
    }
  }
  const cutIds = new Set()
  const cuts = Array.isArray(revision.cut_units) ? revision.cut_units : []
  if (revision.cut_units !== undefined && !Array.isArray(revision.cut_units)) add('director_cut_units_invalid')
  for (const [index, cut] of cuts.entries()) {
    const ref = 'director_revision.cut_units[' + index + ']'
    if (!sourceSet.has(cut?.source_unit_id) || cutIds.has(cut.source_unit_id)
      || covered.has(cut.source_unit_id)) add('director_cut_mapping_invalid', ref)
    else { cutIds.add(cut.source_unit_id); covered.add(cut.source_unit_id) }
    if (!nonempty(cut?.reason)) add('director_cut_reason_missing', ref)
  }
  for (const id of sourceSet) if (!covered.has(id)) add('director_source_unit_unaccounted', id)

  // Guard declarations are review evidence, not a replacement for independent
  // dramaturgical QA or a license to alter protected canon.
  for (const field of DIRECTOR_STORY_GUARDS) {
    if (revision?.story_guards?.[field] !== 'preserved') add('director_story_guard_unresolved', field)
  }
  for (const field of DIRECTOR_DIRECTION_FIELDS) {
    if (!nonempty(revision?.episode_direction?.[field])) add('director_direction_field_missing', field)
  }

  const videos = Array.isArray(pkg?.videos) ? pkg.videos : []
  const byVideo = new Map(videos.map(video => [video?.video_id, video]))
  const mapped = new Set()
  for (const video of videos) {
    const ref = video?.video_id ?? 'VIDEO'
    if (video?.director_revision_id !== revision.revision_id) add('director_video_revision_stale', ref)
    if (!Array.isArray(video?.director_unit_ids) || video.director_unit_ids.length === 0) {
      add('director_video_units_missing', ref)
    } else {
      for (const id of video.director_unit_ids) {
        if (!unitIds.has(id)) add('director_video_unknown_unit', ref)
        else mapped.add(id)
      }
    }
  }
  for (const id of unitIds) if (!mapped.has(id)) add('director_unit_not_in_video', id)

  const shotCollections = [
    ...(Array.isArray(pkg?.shots) ? pkg.shots : []),
    ...(Array.isArray(pkg?.director_shots) ? pkg.director_shots : []),
  ]
  for (const shot of shotCollections) {
    const ref = shot?.shot_id ?? 'SHOT'
    if (shot?.director_revision_id !== revision.revision_id) add('director_shot_revision_stale', ref)
    if (!unitIds.has(shot?.director_unit_id)) add('director_shot_unit_missing_or_unknown', ref)
    if (byVideo.has(shot?.video_id)
      && !byVideo.get(shot.video_id)?.director_unit_ids?.includes(shot?.director_unit_id)) {
      add('director_shot_not_in_parent_unit', ref)
    }
  }
  const dialogue = [
    ...(Array.isArray(pkg?.dialogue_items) ? pkg.dialogue_items : []),
    ...shotCollections.flatMap(shot => Array.isArray(shot?.dialogue_items) ? shot.dialogue_items : []),
  ]
  for (const item of dialogue) {
    const ref = item?.shot_id ?? 'DIALOGUE'
    if (item?.director_revision_id !== revision.revision_id
      || !unitIds.has(item?.director_unit_id)
      || item?.source_revision_id === revision.source_revision_id) {
      add('director_dialogue_stale_or_unmapped', ref)
    }
  }
  return diagnostics
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
