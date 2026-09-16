/**
 * Production workbench contract.
 *
 * The v1 envelope remains compatible with the original manifest. The
 * additive videos + time-coded shots model turns each VIDEO into an assembly
 * package and each SHOT into a small, independently adjustable generation
 * unit. This lets a production operator correct one reaction or insert
 * without regenerating a whole 15-second package.
 */

export const PRODUCTION_WORKBENCH_SCHEMA = 'us-vertical-drama-workbench/v1'

const assetKinds = new Set(['character', 'look', 'set', 'prop'])
const assetStatuses = new Set(['draft', 'pending_approval', 'approved', 'blocked'])
const shotStatuses = new Set(['draft', 'blocked', 'ready_to_generate', 'generating', 'review_required', 'approved'])
const taskStatuses = new Set(['todo', 'in_progress', 'blocked', 'review', 'done'])
const timelineTolerance = 0.05

/** Validate a manifest and produce the UI-ready production snapshot. */
export function buildProductionSnapshot(manifest) {
  const diagnostics = []
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : []
  const shots = Array.isArray(manifest?.shots) ? manifest.shots : []
  const tasks = Array.isArray(manifest?.tasks) ? manifest.tasks : []
  const suppliedVideos = Array.isArray(manifest?.videos) ? manifest.videos : []

  if (manifest?.schema_version !== PRODUCTION_WORKBENCH_SCHEMA) diagnostics.push(issue('error', 'invalid_schema', '清单版本必须为 us-vertical-drama-workbench/v1'))
  if (!string(manifest?.episode_id)) diagnostics.push(issue('error', 'missing_episode_id', '缺少集编号'))

  const assetById = uniqueById(assets, 'asset', diagnostics)
  const suppliedVideoById = uniqueById(suppliedVideos, 'video', diagnostics)
  const shotById = uniqueById(shots, 'shot', diagnostics)
  const taskById = uniqueById(tasks, 'task', diagnostics)

  for (const asset of assets) {
    if (!assetKinds.has(asset.kind)) diagnostics.push(issue('error', 'invalid_asset_kind', `${asset.id ?? 'asset'} 的资产类型无效`, asset.id))
    if (!assetStatuses.has(asset.status)) diagnostics.push(issue('error', 'invalid_asset_status', `${asset.id ?? 'asset'} 的资产状态无效`, asset.id))
  }

  const normalizedShots = shots.map(shot => normalizeShot(shot, assetById, suppliedVideoById, diagnostics))
  const videos = normalizeVideos(suppliedVideos, normalizedShots, diagnostics)
  const videoById = new Map(videos.map(video => [video.video_id, video]))
  validateMicroShotTimelines(normalizedShots, videoById, diagnostics, suppliedVideos.length > 0)
  applyTimelineBlocks(normalizedShots, diagnostics)
  for (const task of tasks) validateTask(task, assetById, shotById, taskById, videoById, diagnostics)

  const totalSeconds = videos.reduce((sum, video) => sum + (video.duration_seconds ?? 0), 0)
  const states = countStates(normalizedShots)
  return {
    schema_version: PRODUCTION_WORKBENCH_SCHEMA,
    episode_id: manifest?.episode_id ?? null,
    episode_display_name_zh: manifest?.episode_display_name_zh ?? null,
    assets,
    videos,
    shots: normalizedShots,
    tasks,
    diagnostics,
    summary: {
      assets: assets.length,
      approved_assets: assets.filter(asset => asset.status === 'approved').length,
      videos: videos.length,
      shots: normalizedShots.length,
      micro_shots: normalizedShots.filter(shot => hasTimeline(shot)).length,
      total_seconds: totalSeconds,
      ready_to_generate: states.ready_to_generate ?? 0,
      generating: states.generating ?? 0,
      review_required: states.review_required ?? 0,
      blocked: states.blocked ?? 0,
      errors: diagnostics.filter(item => item.severity === 'error').length,
      warnings: diagnostics.filter(item => item.severity === 'warning').length,
    },
  }
}

function normalizeShot(shot, assetById, suppliedVideoById, diagnostics) {
  const id = shot?.shot_id
  const references = Array.isArray(shot?.asset_ids) ? shot.asset_ids : []
  const duration = number(shot?.duration_seconds)
  let blocked = false
  if (!string(id)) { diagnostics.push(issue('error', 'missing_shot_id', '微镜头缺少 shot_id')); blocked = true }
  if (!string(shot?.video_id) || !string(shot?.prompt_id)) { diagnostics.push(issue('error', 'missing_trace_id', `${id ?? 'shot'} 缺少 video_id 或 prompt_id`, id)); blocked = true }
  if (!string(shot?.source_scene_id)) { diagnostics.push(issue('error', 'missing_source_scene', `${id ?? 'shot'} 缺少 source_scene_id`, id)); blocked = true }
  if (duration === undefined || duration <= 0) { diagnostics.push(issue('error', 'invalid_duration', `${id ?? 'shot'} 的时长必须大于 0`, id)); blocked = true }
  if (duration !== undefined && duration > 15) { diagnostics.push(issue('error', 'duration_over_15s', `${id ?? 'shot'} 超过 V8 兼容的 15 秒上限`, id)); blocked = true }
  if (!string(shot?.asset_lock_prompt) || !string(shot?.shot_delta_prompt) || !string(shot?.negative_prompt)) {
    diagnostics.push(issue('error', 'missing_prompt_layers', `${id ?? 'shot'} 缺少资产锁定、镜头变化或负面约束提示词`, id)); blocked = true
  }
  if (!shotStatuses.has(shot?.status)) { diagnostics.push(issue('error', 'invalid_shot_status', `${id ?? 'shot'} 的镜头状态无效`, id)); blocked = true }
  if (!string(shot?.display_name_zh)) diagnostics.push(issue('warning', 'missing_chinese_display_name', `${id ?? 'shot'} 未提供中文显示名`, id))
  if (suppliedVideoById.size > 0 && !suppliedVideoById.has(shot?.video_id)) { diagnostics.push(issue('error', 'unknown_parent_video', `${id ?? 'shot'} 关联了不存在的视频包 ${shot?.video_id}`, id)); blocked = true }
  for (const assetId of references) {
    const asset = assetById.get(assetId)
    if (asset === undefined) { diagnostics.push(issue('error', 'unknown_asset_reference', `${id ?? 'shot'} 引用了不存在的资产 ${assetId}`, id)); blocked = true }
    else if (asset.status !== 'approved') { diagnostics.push(issue('warning', 'asset_not_approved', `${id ?? 'shot'} 等待资产 ${assetId} 审核`, id)); blocked = true }
  }
  return { ...shot, duration_seconds: duration, status: blocked ? 'blocked' : shot.status, blocked }
}

function normalizeVideos(suppliedVideos, shots, diagnostics) {
  const grouped = groupBy(shots, shot => shot.video_id)
  const videos = suppliedVideos.length > 0 ? suppliedVideos.map(video => ({ ...video })) : [...grouped.keys()].filter(Boolean).map(video_id => ({
    video_id,
    display_name_zh: video_id,
    duration_seconds: grouped.get(video_id).reduce((sum, shot) => sum + (shot.duration_seconds ?? 0), 0),
    status: 'draft',
    derived: true,
  }))
  for (const video of videos) {
    const id = video?.video_id
    const duration = number(video?.duration_seconds)
    video.duration_seconds = duration
    if (!string(id)) diagnostics.push(issue('error', 'missing_video_id', '视频包缺少 video_id'))
    if (!string(video?.display_name_zh)) diagnostics.push(issue('warning', 'missing_chinese_display_name', `${id ?? 'video'} 未提供中文显示名`, id))
    if (duration === undefined || duration <= 0) diagnostics.push(issue('error', 'invalid_video_duration', `${id ?? 'video'} 的视频包时长必须大于 0`, id))
    if (duration !== undefined && duration > 15) diagnostics.push(issue('error', 'video_duration_over_15s', `${id ?? 'video'} 超过 V8 兼容的 15 秒上限`, id))
    if (video.status !== undefined && !shotStatuses.has(video.status)) diagnostics.push(issue('error', 'invalid_video_status', `${id ?? 'video'} 的视频包状态无效`, id))
  }
  return videos
}

function validateMicroShotTimelines(shots, videoById, diagnostics, requireTimelines) {
  for (const shot of shots) {
    if (!hasTimeline(shot)) {
      if (requireTimelines) markBlocked(shot, diagnostics, 'missing_micro_shot_timeline', `${shot.shot_id ?? 'shot'} 缺少包内起止时间`, shot.shot_id)
      continue
    }
    const inTime = number(shot.timeline_in_seconds)
    const outTime = number(shot.timeline_out_seconds)
    if (inTime === undefined || outTime === undefined || inTime < 0 || outTime <= inTime) {
      markBlocked(shot, diagnostics, 'invalid_micro_shot_timeline', `${shot.shot_id ?? 'shot'} 的包内时间无效`, shot.shot_id)
      continue
    }
    if (Math.abs((outTime - inTime) - shot.duration_seconds) > timelineTolerance) markBlocked(shot, diagnostics, 'micro_shot_duration_mismatch', `${shot.shot_id ?? 'shot'} 的时长与包内时间不一致`, shot.shot_id)
    const video = videoById.get(shot.video_id)
    if (video?.duration_seconds !== undefined && outTime > video.duration_seconds + timelineTolerance) markBlocked(shot, diagnostics, 'micro_shot_outside_video', `${shot.shot_id ?? 'shot'} 超出父视频包时长`, shot.shot_id)
    if (shot.duration_seconds > 3 && !string(shot.duration_exception_reason_zh)) markBlocked(shot, diagnostics, 'long_micro_shot_without_reason', `${shot.shot_id ?? 'shot'} 超过 3 秒，必须填写中文例外原因`, shot.shot_id)
    if (shot.duration_seconds < 0.5 && !string(shot.short_duration_reason_zh)) markBlocked(shot, diagnostics, 'short_micro_shot_without_reason', `${shot.shot_id ?? 'shot'} 少于 0.5 秒，必须填写中文例外原因`, shot.shot_id)
  }
  for (const [videoId, items] of groupBy(shots.filter(hasTimeline), shot => shot.video_id)) {
    let cursor = 0
    for (const shot of [...items].sort((a, b) => a.timeline_in_seconds - b.timeline_in_seconds)) {
      if (Math.abs(shot.timeline_in_seconds - cursor) > timelineTolerance) markBlocked(shot, diagnostics, 'micro_shot_timeline_gap_or_overlap', `${videoId} 的微镜头时间线存在空档或重叠`, shot.shot_id)
      cursor = shot.timeline_out_seconds
    }
    const video = videoById.get(videoId)
    if (video?.duration_seconds !== undefined && Math.abs(cursor - video.duration_seconds) > timelineTolerance) diagnostics.push(issue('warning', 'micro_shot_timeline_not_full_coverage', `${videoId} 的微镜头未完全覆盖视频包时长`, videoId))
  }
}

function applyTimelineBlocks(shots, diagnostics) {
  const blockedIds = new Set(diagnostics.filter(item => item.severity === 'error' && item.target_id !== undefined).map(item => item.target_id))
  for (const shot of shots) if (blockedIds.has(shot.shot_id)) { shot.blocked = true; shot.status = 'blocked' }
}

function validateTask(task, assetById, shotById, taskById, videoById, diagnostics) {
  if (!string(task?.id)) { diagnostics.push(issue('error', 'missing_task_id', '任务缺少 id')); return }
  if (!taskStatuses.has(task.status)) diagnostics.push(issue('error', 'invalid_task_status', `${task.id} 的任务状态无效`, task.id))
  for (const target of Array.isArray(task.targets) ? task.targets : []) {
    if (!assetById.has(target) && !shotById.has(target) && !taskById.has(target) && !videoById.has(target)) diagnostics.push(issue('warning', 'unknown_task_target', `${task.id} 关联了不存在的对象 ${target}`, task.id))
  }
}

function uniqueById(values, label, diagnostics) {
  const byId = new Map()
  for (const value of values) {
    const id = value?.id ?? value?.shot_id ?? value?.video_id
    if (!string(id)) continue
    if (byId.has(id)) diagnostics.push(issue('error', 'duplicate_id', `重复的 ${label} ID：${id}`, id))
    else byId.set(id, value)
  }
  return byId
}
function groupBy(values, key) { return values.reduce((groups, value) => { const id = key(value); if (!groups.has(id)) groups.set(id, []); groups.get(id).push(value); return groups }, new Map()) }
function hasTimeline(shot) { return number(shot?.timeline_in_seconds) !== undefined && number(shot?.timeline_out_seconds) !== undefined }
function markBlocked(shot, diagnostics, code, message, target_id) { diagnostics.push(issue('error', code, message, target_id)); shot.blocked = true; shot.status = 'blocked' }
function countStates(shots) { return shots.reduce((counts, shot) => ({ ...counts, [shot.status]: (counts[shot.status] ?? 0) + 1 }), {}) }
function issue(severity, code, message, target_id) { return { severity, code, message, ...(target_id === undefined ? {} : { target_id }) } }
function string(value) { return typeof value === 'string' && value.trim() !== '' }
function number(value) { return typeof value === 'number' && Number.isFinite(value) ? value : undefined }
