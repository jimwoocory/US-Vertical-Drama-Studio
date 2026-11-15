import { createHash } from 'node:crypto'
import { WORKBENCH_V2, artifactDigest, captureArtifactSnapshot } from '../../scripts/v11-artifact-freshness.mjs'
import { compileReferenceBindings } from '../../scripts/v11-reference-bindings.mjs'
import { buildProductionSnapshot } from '../../dsh-plugin/production-workbench.js'

const IMAGE_KINDS = new Set(['character', 'set', 'prop'])
const GENERATABLE_STATUS = new Set(['ready_to_generate'])
const TERMINAL_JOB_STATUS = new Set(['succeeded', 'failed', 'cancelled'])

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
  }
  return value
}

function stableHash(value) {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')
}

function idempotencyKey(kind, episodeId, targetRef, phase) {
  return `usvds:${kind}:${episodeId}:${targetRef}:${phase}`
}

function requireWorkbench(workbench) {
  if (!workbench || !['us-vertical-drama-workbench/v1', WORKBENCH_V2].includes(workbench.schema_version)) {
    throw new Error('USVDS Media MCP adapter requires us-vertical-drama-workbench/v1')
  }
  if (!workbench.episode_id) throw new Error('production-workbench episode_id is required')
}

function assetRequest(asset) {
  const prompt = asset.image_prompt ?? asset.prompt
  if (!prompt) return { blocked: 'missing_asset_image_prompt' }
  return {
    prompt,
    negative_prompt: asset.negative_prompt ?? '',
    aspect_ratio: asset.aspect_ratio,
    reference_asset_ids: asset.reference_asset_ids ?? [],
    usvds: {
      source_asset_id: asset.id,
      source_asset_kind: asset.kind,
      display_name_zh: asset.display_name_zh,
    },
  }
}

function videoAssetIds(workbench, videoId) {
  const ids = new Set()
  for (const shot of workbench.shots ?? []) {
    if (shot.video_id !== videoId) continue
    for (const id of shot.asset_ids ?? []) ids.add(id)
  }
  return [...ids]
}

function videoRequest(workbench, video) {
  if (!video.video_master_prompt) return { blocked: 'missing_video_master_prompt' }
  if (!video.video_negative_prompt) return { blocked: 'missing_video_negative_prompt' }
  if (!(video.duration_seconds > 0 && video.duration_seconds <= 15)) return { blocked: 'invalid_video_duration' }

  return {
    prompt: video.video_master_prompt,
    negative_prompt: video.video_negative_prompt,
    duration_seconds: video.duration_seconds,
    aspect_ratio: video.aspect_ratio ?? '9:16',
    reference_asset_ids: videoAssetIds(workbench, video.video_id),
    source_scene_id: video.source_scene_id,
    ...(workbench.schema_version === WORKBENCH_V2 ? { reference_bindings: compileReferenceBindings(workbench, video.video_id), generation_mode: video.generation_mode, parameters: video.parameters ?? {} } : {}),
    usvds: {
      video_id: video.video_id,
      video_prompt_id: video.video_prompt_id,
      display_name_zh: video.display_name_zh,
    },
  }
}

function targetPlan({ episodeId, targetRef, capability, publicModelId, request, blocked }) {
  if (blocked) {
    return {
      target_ref: targetRef,
      capability,
      state: 'blocked',
      blocked_reason: blocked,
    }
  }

  const quoteInput = {
    idempotency_key: idempotencyKey(capability, episodeId, targetRef, 'quote'),
    public_model_id: publicModelId,
    request,
  }

  return {
    target_ref: targetRef,
    capability,
    state: 'ready',
    request,
    request_hash_local: stableHash(request),
    quote_call: {
      tool: 'quote_create',
      arguments: quoteInput,
    },
  }
}

export function buildMediaMcpPlan(workbench, {
  imageModelId = 'chatgpt-web-image',
  videoModelId = 'seedance2.0mini',
  mediaRoot,
  verifyReview,
  mediaMcpContract,
} = {}) {
  requireWorkbench(workbench)
  if (workbench.schema_version === WORKBENCH_V2) {
    // A v2 plan only represents ready VIDEO requests. Assets are resolved upstream.
    // No v2 fields are sent to an unverified v1 Media MCP transport.
    const snapshot = buildProductionSnapshot(workbench, { mediaRoot, verifyReview })
    const qa = snapshot.production_qa
    const reason = !snapshot.generation_ready ? 'production_v2_not_ready' : videoModelId !== 'seedance2.0mini' ? 'unsupported_public_model' : mediaMcpContract !== 'usvds-media-mcp-request/v2' ? 'transport_contract_unverified' : null
    const targets = (workbench.videos ?? []).filter(v => GENERATABLE_STATUS.has(v.status)).map(video => {
      if (reason) return { target_ref: video.video_id, capability: 'video_generation', state: 'blocked', blocked_reason: reason }
      const request = videoRequest(workbench, video)
      if (request.blocked) return { target_ref: video.video_id, state: 'blocked', blocked_reason: request.blocked }
      const request_fingerprint = executionFingerprint(workbench, video, videoModelId)
      const key = phase => `usvds:v2:${artifactDigest({ episode: workbench.episode_id, target: video.video_id, model: videoModelId, request_fingerprint, phase })}`
      return { target_ref: video.video_id, capability: 'video_generation', state: 'ready', public_model_id: videoModelId, request, request_hash_local: request_fingerprint, input_digest: qa.input_digest, generate_idempotency_key: key('generate'), quote_call: { tool: 'quote_create', arguments: { idempotency_key: key('quote'), public_model_id: videoModelId, request } } }
    })
    return { schema_version: 'usvds-media-mcp-plan/v2', source_workbench_schema: workbench.schema_version, episode_id: workbench.episode_id, production_qa: qa, targets }
  }
  const targets = []

  for (const asset of workbench.assets ?? []) {
    if (!IMAGE_KINDS.has(asset.kind)) continue
    if (asset.status !== 'approved') {
      targets.push({
        target_ref: asset.id,
        capability: 'image_generation',
        state: 'blocked',
        blocked_reason: 'asset_not_approved',
      })
      continue
    }
    const request = assetRequest(asset)
    targets.push(targetPlan({
      episodeId: workbench.episode_id,
      targetRef: asset.id,
      capability: 'image_generation',
      publicModelId: imageModelId,
      request: request.blocked ? undefined : request,
      blocked: request.blocked,
    }))
  }

  for (const video of workbench.videos ?? []) {
    if (!GENERATABLE_STATUS.has(video.status)) continue
    const request = videoRequest(workbench, video)
    targets.push(targetPlan({
      episodeId: workbench.episode_id,
      targetRef: video.video_id,
      capability: 'video_generation',
      publicModelId: videoModelId,
      request: request.blocked ? undefined : request,
      blocked: request.blocked,
    }))
  }

  return {
    schema_version: 'usvds-media-mcp-plan/v1',
    source_workbench_schema: workbench.schema_version,
    episode_id: workbench.episode_id,
    targets,
  }
}

export function bindGenerateCall(workbench, target, quoteOutput, options = {}) {
  requireWorkbench(workbench)
  if (target.state !== 'ready') throw new Error(`Target ${target.target_ref} is not ready`)
  if (!quoteOutput?.quote_id || !quoteOutput?.request_hash) throw new Error('quote_create output is incomplete')
  if (workbench.schema_version === WORKBENCH_V2) {
    const current = buildMediaMcpPlan(workbench, { ...options, videoModelId: target.public_model_id }).targets.find(t => t.target_ref === target.target_ref)
    if (current?.state !== 'ready' || current.request_hash_local !== target.request_hash_local || current.input_digest !== target.input_digest || artifactDigest(current.request) !== artifactDigest(target.request) || current.generate_idempotency_key !== target.generate_idempotency_key) throw new Error('stale_or_modified_generation_plan')
    if (typeof options.verifyQuote !== 'function' || options.verifyQuote(structuredClone(quoteOutput), structuredClone(current)) !== true) throw new Error('quote_confirmation_unverified')
    return { tool: 'generate_video', arguments: { idempotency_key: current.generate_idempotency_key, quote_id: quoteOutput.quote_id, request_hash: quoteOutput.request_hash, confirm_quote: true, request: current.request } }
  }

  const tool = target.capability === 'image_generation' ? 'generate_image' : 'generate_video'
  return {
    tool,
    arguments: {
      idempotency_key: idempotencyKey(target.capability, workbench.episode_id, target.target_ref, 'generate'),
      quote_id: quoteOutput.quote_id,
      request_hash: quoteOutput.request_hash,
      confirm_quote: true,
      request: target.request,
    },
  }
}

function clone(value) {
  return structuredClone(value)
}

function updateTarget(workbench, targetRef, updater) {
  const asset = (workbench.assets ?? []).find(item => item.id === targetRef)
  if (asset) {
    updater(asset, 'asset')
    return
  }
  const video = (workbench.videos ?? []).find(item => item.video_id === targetRef)
  if (video) {
    updater(video, 'video')
    return
  }
  throw new Error(`Unknown workbench target: ${targetRef}`)
}

export function applyMediaMcpJobReceipt(workbench, {
  target_ref,
  job_id,
  quote_id,
  request_hash,
  request_fingerprint,
  public_model_id,
}) {
  requireWorkbench(workbench)
  if (!target_ref || !job_id) throw new Error('target_ref and job_id are required')
  const next = clone(workbench)

  updateTarget(next, target_ref, (record, kind) => {
    if (workbench.schema_version === WORKBENCH_V2) {
      if (kind !== 'video' || request_fingerprint !== executionFingerprint(workbench, record, public_model_id)) throw new Error('receipt_request_fingerprint_mismatch')
      if (record.media_mcp?.job_id === job_id) {
        if (record.media_mcp.request_fingerprint !== request_fingerprint) throw new Error('job_id_reused_for_different_request')
        return // Replaying a receipt cannot reset succeeded/failed history to queued.
      }
      if (record.media_mcp?.job_id && record.media_mcp.job_id !== job_id) record.media_mcp_history = [...(record.media_mcp_history ?? []), structuredClone(record.media_mcp)]
    }
    record.media_mcp = {
      ...(record.media_mcp ?? {}),
      job_id,
      quote_id,
      request_hash,
      ...(workbench.schema_version === WORKBENCH_V2 ? { request_fingerprint, public_model_id, dependency_fingerprint: captureArtifactSnapshot(workbench).fingerprints[`video:${target_ref}`] } : {}),
      last_observed_job_status: 'queued',
    }
    if (kind === 'video') record.status = 'generating'
    else record.generation_state = 'generating'
  })

  return next
}

export function applyMediaMcpJobStatus(workbench, targetRef, jobOutput) {
  requireWorkbench(workbench)
  if (!jobOutput?.job_id || !jobOutput?.status) throw new Error('job_get output is incomplete')
  const next = clone(workbench)

  updateTarget(next, targetRef, (record, kind) => {
    if (workbench.schema_version === WORKBENCH_V2) {
      const receipt = record.media_mcp?.job_id === jobOutput.job_id ? record.media_mcp : record.media_mcp_history?.find(r => r.job_id === jobOutput.job_id)
      if (!receipt) throw new Error('unknown_job_receipt')
      Object.assign(receipt, { last_observed_job_status: jobOutput.status, output_asset_ids: jobOutput.output_asset_ids ?? [], error: jobOutput.error })
      if (receipt !== record.media_mcp || receipt.request_fingerprint !== executionFingerprint(workbench, record, receipt.public_model_id) || receipt.dependency_fingerprint !== captureArtifactSnapshot(workbench).fingerprints[`video:${targetRef}`]) {
        receipt.freshness = 'stale'
        return
      }
    }
    record.media_mcp = {
      ...(record.media_mcp ?? {}),
      job_id: jobOutput.job_id,
      last_observed_job_status: jobOutput.status,
      output_asset_ids: jobOutput.output_asset_ids ?? [],
      error: jobOutput.error,
    }

    if (jobOutput.status === 'succeeded') {
      if (kind === 'video') record.status = 'review_required'
      else record.generation_state = 'review_required'
    } else if (jobOutput.status === 'failed' || jobOutput.status === 'cancelled') {
      if (kind === 'video') record.status = 'blocked'
      else record.generation_state = 'blocked'
    } else if (!TERMINAL_JOB_STATUS.has(jobOutput.status)) {
      if (kind === 'video') record.status = 'generating'
      else record.generation_state = 'generating'
    }
  })

  return next
}

function executionFingerprint(workbench, video, model) {
  if (!model) throw new Error('public_model_id_required')
  const request = videoRequest(workbench, video)
  if (request.blocked) throw new Error(request.blocked)
  const clean = structuredClone(request)
  delete clean.usvds
  if (clean.reference_bindings) clean.reference_bindings = clean.reference_bindings.map(({ media_path, ...b }) => b)
  return artifactDigest({ version: 2, model, endpoint_revision: workbench.endpoint_revision, capability_profile: workbench.capability_profile, reference_profile: workbench.reference_profile, policy_version: workbench.policy_version, request: clean })
}
