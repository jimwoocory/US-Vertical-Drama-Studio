import { createHash } from 'node:crypto'

export const WORKBENCH_SCHEMA = 'us-vertical-drama-workbench/v1'
export const MEDIA_EXECUTION_SCHEMA = 'usvd.media-execution/v1'

const ACTIVE_JOB_STATUSES = new Set([
  'queued',
  'submitting',
  'submitted',
  'running',
  'unknown',
  'reconciling',
  'cancel_requested',
])

export class MediaMcpAdapterError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'MediaMcpAdapterError'
    this.code = code
  }
}

/**
 * Adapt an MCP SDK-style callTool function to the narrow USVDS client port.
 * The caller owns transport/authentication. If the SDK returns
 * { structuredContent }, that decoded object is used as the tool output.
 */
export function createMediaMcpToolClient(callTool) {
  if (typeof callTool !== 'function') {
    throw new MediaMcpAdapterError('INVALID_MEDIA_MCP_CLIENT', 'callTool must be a function')
  }
  const call = async (name, input) => {
    const result = await callTool(name, input)
    return result?.structuredContent ?? result
  }
  return {
    quoteCreate: input => call('quote_create', input),
    generateImage: input => call('generate_image', input),
    generateVideo: input => call('generate_video', input),
    jobGet: input => call('job_get', input),
    assetGet: input => call('asset_get', input),
  }
}

export function workbenchRevision(manifest) {
  assertWorkbench(manifest)
  return sha256(stableJson({
    schema_version: manifest.schema_version,
    episode_id: manifest.episode_id,
    assets: (manifest.assets ?? []).map(asset => ({
      id: asset.id,
      kind: asset.kind,
      display_name_zh: asset.display_name_zh ?? null,
      image_prompt: asset.image_prompt ?? null,
      negative_prompt: asset.negative_prompt ?? null,
      aspect_ratio: asset.aspect_ratio ?? null,
      target_model: asset.target_model ?? null,
      public_model_id: asset.public_model_id ?? null,
      reference_media_asset_ids: normalizedStringArray(asset.reference_media_asset_ids),
      reference_media_asset_id: stringOrNull(asset.reference_media_asset_id),
    })),
    videos: (manifest.videos ?? []).map(video => ({
      video_id: video.video_id,
      source_scene_id: video.source_scene_id ?? null,
      duration_seconds: video.duration_seconds ?? null,
      video_prompt_id: video.video_prompt_id ?? null,
      video_master_prompt: video.video_master_prompt ?? null,
      video_negative_prompt: video.video_negative_prompt ?? null,
      media_prompt: video.media_prompt ?? null,
      media_negative_prompt: video.media_negative_prompt ?? null,
      media_mode: video.media_mode ?? null,
      aspect_ratio: video.aspect_ratio ?? null,
      target_model: video.target_model ?? null,
      public_model_id: video.public_model_id ?? null,
      video_resolution: video.video_resolution ?? null,
      reference_media_asset_ids: normalizedStringArray(video.reference_media_asset_ids),
    })),
    shots: (manifest.shots ?? []).map(shot => ({
      shot_id: shot.shot_id,
      video_id: shot.video_id,
      timeline_in_seconds: shot.timeline_in_seconds ?? null,
      timeline_out_seconds: shot.timeline_out_seconds ?? null,
      duration_seconds: shot.duration_seconds ?? null,
      generation_mode: shot.generation_mode ?? null,
      asset_ids: normalizedStringArray(shot.asset_ids),
      asset_lock_prompt: shot.asset_lock_prompt ?? null,
      shot_delta_prompt: shot.shot_delta_prompt ?? null,
      negative_prompt: shot.negative_prompt ?? null,
    })),
  }))
}

export function bindAssetGenerationSpec(manifest, assetId, spec) {
  assertWorkbench(manifest)
  const next = structuredClone(manifest)
  const asset = findAsset(next, assetId)
  asset.image_prompt = requiredString(spec?.image_prompt ?? spec?.prompt, `${assetId}.image_prompt`)
  if (typeof (spec?.negative_prompt) === 'string') asset.negative_prompt = spec.negative_prompt.trim()
  if (typeof spec?.aspect_ratio === 'string' && spec.aspect_ratio.trim() !== '') asset.aspect_ratio = spec.aspect_ratio.trim()
  asset.public_model_id = requiredString(spec?.public_model_id, `${assetId}.public_model_id`)
  if (Array.isArray(spec?.reference_media_asset_ids)) {
    asset.reference_media_asset_ids = normalizedStringArray(spec.reference_media_asset_ids)
  }
  return next
}

export function bindVideoGenerationSpec(manifest, videoId, spec) {
  assertWorkbench(manifest)
  const next = structuredClone(manifest)
  const video = findVideo(next, videoId)
  video.media_prompt = requiredString(spec?.video_master_prompt ?? spec?.prompt, `${videoId}.media_prompt`)
  if (typeof spec?.video_negative_prompt === 'string') video.media_negative_prompt = spec.video_negative_prompt.trim()
  video.public_model_id = requiredString(spec?.public_model_id, `${videoId}.public_model_id`)
  video.aspect_ratio = requiredString(spec?.aspect_ratio, `${videoId}.aspect_ratio`)
  video.video_resolution = requiredString(spec?.video_resolution, `${videoId}.video_resolution`)
  video.media_mode = typeof spec?.mode === 'string' && spec.mode.trim() !== '' ? spec.mode.trim() : 'text2video'
  if (Array.isArray(spec?.reference_media_asset_ids)) {
    video.reference_media_asset_ids = normalizedStringArray(spec.reference_media_asset_ids)
  }
  return next
}

export function prepareAssetImageGeneration(manifest, assetId, options = {}) {
  assertWorkbench(manifest)
  const asset = findAsset(manifest, assetId)
  if (asset.status === 'blocked') {
    throw new MediaMcpAdapterError('TARGET_BLOCKED', `${assetId} is blocked`)
  }

  const prompt = requiredString(options.imagePrompt ?? asset.image_prompt, `${assetId}.image_prompt`)
  const publicModelId = requiredString(
    options.publicModelId ?? asset.public_model_id,
    `${assetId}.public_model_id`,
  )
  const negativePrompt = options.negativePrompt ?? asset.negative_prompt
  const referenceMediaAssetIds = options.referenceMediaAssetIds
    ? normalizedStringArray(options.referenceMediaAssetIds)
    : normalizedStringArray(asset.reference_media_asset_ids)

  const request = {
    prompt: composePrompt(prompt, negativePrompt),
    ...((options.aspectRatio ?? asset.aspect_ratio) ? { aspect_ratio: options.aspectRatio ?? asset.aspect_ratio } : {}),
    ...(referenceMediaAssetIds.length > 0
      ? { input_asset_ids: referenceMediaAssetIds }
      : {}),
  }

  return prepare(manifest, {
    kind: 'image_generation',
    targetType: 'asset',
    targetId: asset.id,
    publicModelId,
    request,
    source: {
      episode_id: manifest.episode_id,
      asset_kind: asset.kind,
    },
  })
}

export function prepareVideoGeneration(manifest, videoId, options = {}) {
  assertWorkbench(manifest)
  const video = findVideo(manifest, videoId)
  if (video.status === 'blocked' || video.status === 'draft') {
    throw new MediaMcpAdapterError('TARGET_NOT_GENERATION_READY', `${videoId} is not generation-ready`)
  }

  const publicModelId = requiredString(
    options.publicModelId ?? video.public_model_id,
    `${videoId}.public_model_id`,
  )
  const ratio = requiredString(
    options.aspectRatio ?? video.aspect_ratio,
    `${videoId}.aspect_ratio`,
  )
  const videoResolution = requiredString(
    options.videoResolution ?? video.video_resolution,
    `${videoId}.video_resolution`,
  )
  const prompt = requiredString(
    options.videoMasterPrompt ?? video.media_prompt ?? video.video_master_prompt,
    `${videoId}.media_prompt/video_master_prompt`,
  )
  const negativePrompt = options.videoNegativePrompt ?? video.media_negative_prompt ?? video.video_negative_prompt
  const duration = finitePositive(options.durationSeconds ?? video.duration_seconds, `${videoId}.duration_seconds`)
  const usvdsAssetIds = unique(
    (manifest.shots ?? [])
      .filter(shot => shot.video_id === video.id || shot.video_id === video.video_id)
      .flatMap(shot => normalizedStringArray(shot.asset_ids)),
  )
  const inputAssetIds = options.inputAssetIds
    ? normalizedStringArray(options.inputAssetIds)
    : unique([
        ...normalizedStringArray(video.reference_media_asset_ids),
        ...usvdsAssetIds
          .map(id => (manifest.assets ?? []).find(asset => asset.id === id))
          .flatMap(asset => {
            if (!asset) return []
            return unique([
              ...normalizedStringArray(asset.reference_media_asset_ids),
              ...(typeof asset.reference_media_asset_id === 'string' ? [asset.reference_media_asset_id] : []),
            ])
          }),
      ])

  const request = {
    mode: options.mode ?? video.media_mode ?? 'text2video',
    prompt: composePrompt(prompt, negativePrompt),
    duration,
    ratio,
    video_resolution: videoResolution,
    ...(inputAssetIds.length > 0 ? { input_asset_ids: inputAssetIds } : {}),
  }

  return prepare(manifest, {
    kind: 'video_generation',
    targetType: 'video',
    targetId: video.video_id,
    publicModelId,
    request,
    source: {
      episode_id: manifest.episode_id,
      source_scene_id: video.source_scene_id ?? null,
      asset_ids: usvdsAssetIds,
    },
  })
}

export async function submitAssetImage({ client, manifest, assetId, workspaceId, options = {}, now = nowIso }) {
  const prepared = prepareAssetImageGeneration(manifest, assetId, options)
  return submitPrepared({ client, manifest, prepared, workspaceId, now })
}

export async function submitVideo({ client, manifest, videoId, workspaceId, options = {}, now = nowIso }) {
  const prepared = prepareVideoGeneration(manifest, videoId, options)
  return submitPrepared({ client, manifest, prepared, workspaceId, now })
}

export async function syncMediaExecution({ client, manifest, executionId, workspaceId, now = nowIso }) {
  assertClient(client)
  assertWorkbench(manifest)
  const executions = mediaExecutions(manifest)
  const current = executions.find(item => item.execution_id === executionId)
  if (!current) throw new MediaMcpAdapterError('EXECUTION_NOT_FOUND', `Unknown media execution ${executionId}`)

  const currentRevision = workbenchRevision(manifest)
  if (current.workbench_revision !== currentRevision) {
    throw new MediaMcpAdapterError(
      'STALE_WORKBENCH_REVISION',
      `Workbench changed after ${executionId} was submitted; refusing result writeback`,
    )
  }

  assertTargetStateAllowsWriteback(manifest, current)

  const job = await client.jobGet({
    ...(workspaceId ? { workspace_id: workspaceId } : {}),
    job_id: current.media_job_id,
  })
  if (!job || job.job_id !== current.media_job_id) {
    throw new MediaMcpAdapterError('INVALID_MEDIA_MCP_RESPONSE', 'job_get returned the wrong job')
  }

  const next = structuredClone(manifest)
  const execution = mediaExecutions(next).find(item => item.execution_id === executionId)
  execution.execution_status = job.status
  execution.output_asset_ids = normalizedStringArray(job.output_asset_ids)
  execution.updated_at = now()
  execution.error = job.error ?? null

  updateTargetExecutionState(next, execution, job.status)

  if (job.status === 'succeeded') {
    if (execution.output_asset_ids.length === 0) {
      throw new MediaMcpAdapterError(
        'INVALID_MEDIA_MCP_RESPONSE',
        'Succeeded Media MCP job returned no output_asset_ids',
      )
    }
    const outputAssets = []
    for (const assetId of execution.output_asset_ids) {
      const asset = await client.assetGet({
        ...(workspaceId ? { workspace_id: workspaceId } : {}),
        asset_id: assetId,
        include_access_url: false,
      })
      if (!asset || asset.asset_id !== assetId || asset.status !== 'ready') {
        throw new MediaMcpAdapterError(
          'ASSET_NOT_READY',
          `Media MCP asset ${assetId} is not ready`,
        )
      }
      outputAssets.push({
        asset_id: asset.asset_id,
        kind: asset.kind,
        status: asset.status,
        ...(asset.mime_type ? { mime_type: asset.mime_type } : {}),
        ...(asset.byte_size != null ? { byte_size: asset.byte_size } : {}),
        ...(asset.width != null ? { width: asset.width } : {}),
        ...(asset.height != null ? { height: asset.height } : {}),
        ...(asset.duration_ms != null ? { duration_ms: asset.duration_ms } : {}),
      })
    }
    execution.output_assets = outputAssets
    applySuccessfulResult(next, execution)
  }

  return {
    manifest: next,
    execution,
    job,
  }
}

async function submitPrepared({ client, manifest, prepared, workspaceId, now }) {
  assertClient(client)
  const existing = mediaExecutions(manifest).find(item => item.request_key === prepared.requestKey)
  if (existing) {
    return {
      manifest: structuredClone(manifest),
      execution: structuredClone(existing),
      reused: true,
    }
  }

  const quote = await client.quoteCreate({
    idempotency_key: prepared.quoteIdempotencyKey,
    ...(workspaceId ? { workspace_id: workspaceId } : {}),
    public_model_id: prepared.publicModelId,
    request: prepared.request,
  })

  if (!quote?.quote_id || !quote?.request_hash) {
    throw new MediaMcpAdapterError('INVALID_MEDIA_MCP_RESPONSE', 'quote_create returned an invalid quote')
  }

  const generated = prepared.kind === 'image_generation'
    ? await client.generateImage({
        idempotency_key: prepared.generateIdempotencyKey,
        ...(workspaceId ? { workspace_id: workspaceId } : {}),
        quote_id: quote.quote_id,
        request_hash: quote.request_hash,
        confirm_quote: true,
        request: prepared.request,
      })
    : await client.generateVideo({
        idempotency_key: prepared.generateIdempotencyKey,
        ...(workspaceId ? { workspace_id: workspaceId } : {}),
        quote_id: quote.quote_id,
        request_hash: quote.request_hash,
        confirm_quote: true,
        request: prepared.request,
      })

  if (!generated?.job_id) {
    throw new MediaMcpAdapterError('INVALID_MEDIA_MCP_RESPONSE', 'generate_* returned no job_id')
  }

  const timestamp = now()
  const execution = {
    schema: MEDIA_EXECUTION_SCHEMA,
    execution_id: `MEDIA-EXEC-${prepared.requestKey.slice(-24)}`,
    target_type: prepared.targetType,
    target_id: prepared.targetId,
    kind: prepared.kind,
    public_model_id: prepared.publicModelId,
    source: prepared.source,
    workbench_revision: prepared.workbenchRevision,
    request_hash: prepared.requestHash,
    request_key: prepared.requestKey,
    quote_id: quote.quote_id,
    media_job_id: generated.job_id,
    execution_status: generated.status ?? 'queued',
    output_asset_ids: [],
    error: null,
    created_at: timestamp,
    updated_at: timestamp,
  }

  const next = structuredClone(manifest)
  next.media_executions = [...mediaExecutions(next), execution]
  updateTargetExecutionState(next, execution, execution.execution_status)

  return {
    manifest: next,
    execution,
    reused: false,
    quote,
    job: generated,
  }
}

function prepare(manifest, { kind, targetType, targetId, publicModelId, request, source }) {
  const revision = workbenchRevision(manifest)
  const requestHash = sha256(stableJson(request))
  const requestKey = sha256(stableJson({
    episode_id: manifest.episode_id,
    target_type: targetType,
    target_id: targetId,
    workbench_revision: revision,
    request_hash: requestHash,
    kind,
    public_model_id: publicModelId,
  }))

  return {
    kind,
    targetType,
    targetId,
    publicModelId,
    request,
    source,
    requestHash,
    requestKey,
    workbenchRevision: revision,
    quoteIdempotencyKey: `usvds:q:${requestKey}`,
    generateIdempotencyKey: `usvds:g:${requestKey}`,
  }
}

function updateTargetExecutionState(manifest, execution, status) {
  if (execution.target_type === 'video') {
    const video = findVideo(manifest, execution.target_id)
    video.generation_status = status
    if (ACTIVE_JOB_STATUSES.has(status) && video.status === 'ready_to_generate') {
      video.status = 'generating'
    }
    if ((status === 'failed' || status === 'cancelled') && video.status === 'generating') {
      video.status = 'ready_to_generate'
    }
    return
  }

  const asset = findAsset(manifest, execution.target_id)
  asset.generation_status = status
}

function applySuccessfulResult(manifest, execution) {
  if (execution.target_type === 'video') {
    const video = findVideo(manifest, execution.target_id)
    if (video.status === 'approved') {
      throw new MediaMcpAdapterError(
        'TARGET_STATE_CHANGED',
        `${video.video_id} was approved while generation was running; refusing to replace approval`,
      )
    }
    video.status = 'review_required'
    video.generation_status = 'succeeded'
    video.generation_result_id = execution.output_asset_ids[0]
    video.generated_media_asset_ids = [...execution.output_asset_ids]
    return
  }

  const asset = findAsset(manifest, execution.target_id)
  if (asset.status === 'approved') {
    throw new MediaMcpAdapterError(
      'TARGET_STATE_CHANGED',
      `${asset.id} was approved while generation was running; refusing to replace approval`,
    )
  }
  asset.status = 'review_required'
  asset.generation_status = 'succeeded'
  asset.generation_result_id = execution.output_asset_ids[0]
  asset.candidate_media_asset_ids = [...execution.output_asset_ids]
}

function assertTargetStateAllowsWriteback(manifest, execution) {
  if (execution.target_type === 'video') {
    const status = findVideo(manifest, execution.target_id).status
    if (status === 'approved' || status === 'blocked' || status === 'draft') {
      throw new MediaMcpAdapterError(
        'TARGET_STATE_CHANGED',
        `${execution.target_id} changed to ${status}; refusing Media MCP result writeback`,
      )
    }
    return
  }

  const status = findAsset(manifest, execution.target_id).status
  if (status === 'approved' || status === 'blocked') {
    throw new MediaMcpAdapterError(
      'TARGET_STATE_CHANGED',
      `${execution.target_id} changed to ${status}; refusing Media MCP result writeback`,
    )
  }
}

function assertWorkbench(manifest) {
  if (!manifest || manifest.schema_version !== WORKBENCH_SCHEMA) {
    throw new MediaMcpAdapterError(
      'INVALID_WORKBENCH_SCHEMA',
      `Expected ${WORKBENCH_SCHEMA}`,
    )
  }
  requiredString(manifest.episode_id, 'episode_id')
  if (!Array.isArray(manifest.assets) || !Array.isArray(manifest.videos) || !Array.isArray(manifest.shots)) {
    throw new MediaMcpAdapterError('INVALID_WORKBENCH', 'assets/videos/shots must be arrays')
  }
}

function assertClient(client) {
  for (const name of ['quoteCreate', 'generateImage', 'generateVideo', 'jobGet', 'assetGet']) {
    if (typeof client?.[name] !== 'function') {
      throw new MediaMcpAdapterError('INVALID_MEDIA_MCP_CLIENT', `Media MCP client is missing ${name}()`)
    }
  }
}

function mediaExecutions(manifest) {
  if (manifest.media_executions === undefined) return []
  if (!Array.isArray(manifest.media_executions)) {
    throw new MediaMcpAdapterError('INVALID_WORKBENCH', 'media_executions must be an array')
  }
  return manifest.media_executions
}

function findAsset(manifest, id) {
  const asset = manifest.assets.find(item => item.id === id)
  if (!asset) throw new MediaMcpAdapterError('TARGET_NOT_FOUND', `Unknown asset ${id}`)
  return asset
}

function findVideo(manifest, id) {
  const video = manifest.videos.find(item => item.video_id === id)
  if (!video) throw new MediaMcpAdapterError('TARGET_NOT_FOUND', `Unknown video ${id}`)
  return video
}

function composePrompt(prompt, negativePrompt) {
  if (typeof negativePrompt !== 'string' || negativePrompt.trim() === '') return prompt.trim()
  return `${prompt.trim()}\n\nNegative constraints / do not change:\n${negativePrompt.trim()}`
}

function finitePositive(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new MediaMcpAdapterError('MISSING_GENERATION_INPUT', `${field} must be a positive number`)
  }
  return value
}

function requiredString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new MediaMcpAdapterError('MISSING_GENERATION_INPUT', `${field} is required`)
  }
  return value.trim()
}

function stringOrNull(value) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function normalizedStringArray(value) {
  if (!Array.isArray(value)) return []
  return value.filter(item => typeof item === 'string' && item.trim() !== '').map(item => item.trim())
}

function unique(values) {
  return [...new Set(values)]
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function nowIso() {
  return new Date().toISOString()
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}
