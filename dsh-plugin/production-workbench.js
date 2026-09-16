/**
 * P1 production-workbench contract.
 *
 * This module is intentionally framework-free: the future DSH web panel and
 * MediaGo adapter consume the same checked snapshot rather than each parsing
 * prose output differently.
 */

export const PRODUCTION_WORKBENCH_SCHEMA = 'us-vertical-drama-workbench/v1'

const assetKinds = new Set(['character', 'look', 'set', 'prop'])
const assetStatuses = new Set(['draft', 'pending_approval', 'approved', 'blocked'])
const shotStatuses = new Set(['draft', 'blocked', 'ready_to_generate', 'generating', 'review_required', 'approved'])

/**
 * Validate a production manifest and produce the status view used by P1.
 * Invalid entries remain visible, but are never declared generation-ready.
 */
export function buildProductionSnapshot(manifest) {
  const diagnostics = []
  const assets = Array.isArray(manifest?.assets) ? manifest.assets : []
  const shots = Array.isArray(manifest?.shots) ? manifest.shots : []
  const tasks = Array.isArray(manifest?.tasks) ? manifest.tasks : []

  if (manifest?.schema_version !== PRODUCTION_WORKBENCH_SCHEMA) {
    diagnostics.push(issue('error', 'invalid_schema', 'schema_version must be us-vertical-drama-workbench/v1'))
  }
  if (!string(manifest?.episode_id)) diagnostics.push(issue('error', 'missing_episode_id', 'episode_id is required'))

  const assetById = uniqueById(assets, 'asset', diagnostics)
  const shotById = uniqueById(shots, 'shot', diagnostics)
  const taskById = uniqueById(tasks, 'task', diagnostics)

  for (const asset of assets) {
    if (!assetKinds.has(asset.kind)) diagnostics.push(issue('error', 'invalid_asset_kind', `${asset.id ?? 'asset'} has an invalid kind`, asset.id))
    if (!assetStatuses.has(asset.status)) diagnostics.push(issue('error', 'invalid_asset_status', `${asset.id ?? 'asset'} has an invalid status`, asset.id))
  }

  const normalizedShots = shots.map(shot => normalizeShot(shot, assetById, diagnostics))
  for (const task of tasks) validateTask(task, assetById, shotById, taskById, diagnostics)

  const totalSeconds = normalizedShots.reduce((sum, shot) => sum + (shot.duration_seconds ?? 0), 0)
  const states = countStates(normalizedShots)
  return {
    schema_version: PRODUCTION_WORKBENCH_SCHEMA,
    episode_id: manifest?.episode_id ?? null,
    assets,
    shots: normalizedShots,
    tasks,
    diagnostics,
    summary: {
      assets: assets.length,
      approved_assets: assets.filter(asset => asset.status === 'approved').length,
      shots: normalizedShots.length,
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

function normalizeShot(shot, assetById, diagnostics) {
  const id = shot?.shot_id
  const references = Array.isArray(shot?.asset_ids) ? shot.asset_ids : []
  const duration = number(shot?.duration_seconds)
  let blocked = false
  if (!string(id)) { diagnostics.push(issue('error', 'missing_shot_id', 'shot_id is required')); blocked = true }
  if (!string(shot?.video_id) || !string(shot?.prompt_id)) { diagnostics.push(issue('error', 'missing_trace_id', `${id ?? 'shot'} requires video_id and prompt_id`, id)); blocked = true }
  if (!string(shot?.source_scene_id)) { diagnostics.push(issue('error', 'missing_source_scene', `${id ?? 'shot'} requires source_scene_id`, id)); blocked = true }
  if (duration === undefined || duration <= 0) { diagnostics.push(issue('error', 'invalid_duration', `${id ?? 'shot'} requires a positive duration_seconds`, id)); blocked = true }
  if (duration !== undefined && duration > 15) { diagnostics.push(issue('error', 'duration_over_15s', `${id ?? 'shot'} exceeds the V8-compatible 15-second limit`, id)); blocked = true }
  if (!string(shot?.asset_lock_prompt) || !string(shot?.shot_delta_prompt) || !string(shot?.negative_prompt)) {
    diagnostics.push(issue('error', 'missing_prompt_layers', `${id ?? 'shot'} requires asset_lock_prompt, shot_delta_prompt, and negative_prompt`, id)); blocked = true
  }
  for (const assetId of references) {
    const asset = assetById.get(assetId)
    if (asset === undefined) { diagnostics.push(issue('error', 'unknown_asset_reference', `${id ?? 'shot'} references unknown asset ${assetId}`, id)); blocked = true }
    else if (asset.status !== 'approved') { diagnostics.push(issue('warning', 'asset_not_approved', `${id ?? 'shot'} waits for ${assetId} approval`, id)); blocked = true }
  }
  if (!shotStatuses.has(shot?.status)) { diagnostics.push(issue('error', 'invalid_shot_status', `${id ?? 'shot'} has an invalid status`, id)); blocked = true }
  return { ...shot, duration_seconds: duration, status: blocked ? 'blocked' : shot.status, blocked }
}

function validateTask(task, assetById, shotById, taskById, diagnostics) {
  if (!string(task?.id)) { diagnostics.push(issue('error', 'missing_task_id', 'task id is required')); return }
  if (!['todo', 'in_progress', 'blocked', 'review', 'done'].includes(task.status)) diagnostics.push(issue('error', 'invalid_task_status', `${task.id} has an invalid status`, task.id))
  for (const target of Array.isArray(task.targets) ? task.targets : []) {
    if (!assetById.has(target) && !shotById.has(target) && !taskById.has(target)) diagnostics.push(issue('warning', 'unknown_task_target', `${task.id} targets unknown ${target}`, task.id))
  }
}

function uniqueById(values, label, diagnostics) {
  const byId = new Map()
  for (const value of values) {
    if (!string(value?.id ?? value?.shot_id)) continue
    const id = value.id ?? value.shot_id
    if (byId.has(id)) diagnostics.push(issue('error', 'duplicate_id', `duplicate ${label} ID: ${id}`, id))
    else byId.set(id, value)
  }
  return byId
}

function countStates(shots) {
  return shots.reduce((counts, shot) => ({ ...counts, [shot.status]: (counts[shot.status] ?? 0) + 1 }), {})
}
function issue(severity, code, message, target_id) { return { severity, code, message, ...(target_id === undefined ? {} : { target_id }) } }
function string(value) { return typeof value === 'string' && value.trim() !== '' }
function number(value) { return typeof value === 'number' && Number.isFinite(value) ? value : undefined }
