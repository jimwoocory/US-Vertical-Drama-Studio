import assert from 'node:assert/strict'
import test from 'node:test'

import {
  bindAssetGenerationSpec,
  bindVideoGenerationSpec,
  createMediaMcpToolClient,
  MediaMcpAdapterError,
  prepareAssetImageGeneration,
  prepareVideoGeneration,
  submitAssetImage,
  submitVideo,
  syncMediaExecution,
  workbenchRevision,
} from '../../integrations/media-mcp/index.js'

function fixture() {
  return {
    schema_version: 'us-vertical-drama-workbench/v1',
    episode_id: 'EP-001',
    episode_display_name_zh: '第 1 集',
    assets: [
      {
        id: 'CHAR-EVE',
        display_name_zh: '伊芙',
        kind: 'character',
        status: 'draft',
        image_prompt: 'Adult woman Eve, neutral identity reference board.',
        negative_prompt: 'No text, no extra person.',
        aspect_ratio: '16:9',
        target_model: 'ChatGPT Image',
        public_model_id: 'chatgpt-web-image',
      },
      {
        id: 'SET-AUCTION',
        display_name_zh: '拍卖厅',
        kind: 'set',
        status: 'approved',
        reference_media_asset_id: 'media-input-set',
      },
    ],
    videos: [
      {
        video_id: 'VIDEO-001',
        display_name_zh: '伊芙发现入口异动',
        source_scene_id: 'EP01-SC01',
        duration_seconds: 8,
        video_prompt_id: 'VIDEO-PROMPT-001',
        video_master_prompt: '8 秒竖屏视频。伊芙抬眼看向入口，保持拍卖厅空间连续。',
        video_negative_prompt: '不改变人物身份，不改变拍卖厅方位。',
        target_model: 'Seedance 2.0 Mini',
        public_model_id: 'seedance2.0mini',
        aspect_ratio: '9:16',
        video_resolution: '720p',
        status: 'ready_to_generate',
      },
    ],
    shots: [
      {
        shot_id: 'SHOT-001',
        video_id: 'VIDEO-001',
        display_name_zh: '伊芙抬眼',
        prompt_id: 'PROMPT-001',
        source_scene_id: 'EP01-SC01',
        timeline_in_seconds: 0,
        timeline_out_seconds: 8,
        duration_seconds: 8,
        shot_type: '反应',
        generation_mode: 'independent',
        asset_ids: ['SET-AUCTION'],
        asset_lock_prompt: 'Keep approved set anchors.',
        shot_delta_prompt: 'Eve looks to entrance.',
        negative_prompt: 'No geography change.',
        status: 'ready_to_generate',
      },
    ],
    tasks: [],
  }
}

class FakeMediaMcpClient {
  constructor() {
    this.calls = []
    this.jobs = new Map()
    this.assets = new Map()
    this.next = 1
  }

  async quoteCreate(input) {
    this.calls.push(['quoteCreate', structuredClone(input)])
    return {
      quote_id: `quote-${this.next}`,
      request_hash: `media-request-hash-${this.next}`,
      max_charge: { currency: 'CREDIT', amount_minor: 1 },
      expires_at: '2030-01-01T00:00:00Z',
      pricing_rule_version: 'test',
      spend_mode: 'preauthorized_workspace_budget',
      confirmation_required: true,
    }
  }

  async generateImage(input) {
    this.calls.push(['generateImage', structuredClone(input)])
    const job_id = `job-image-${this.next++}`
    this.jobs.set(job_id, {
      job_id,
      kind: 'image_generation',
      status: 'queued',
      output_asset_ids: [],
      created_at: '2030-01-01T00:00:00Z',
      updated_at: '2030-01-01T00:00:00Z',
    })
    return {
      job_id,
      status: 'queued',
      quote_id: input.quote_id,
      request_hash: input.request_hash,
    }
  }

  async generateVideo(input) {
    this.calls.push(['generateVideo', structuredClone(input)])
    const job_id = `job-video-${this.next++}`
    this.jobs.set(job_id, {
      job_id,
      kind: 'video_generation',
      status: 'queued',
      output_asset_ids: [],
      created_at: '2030-01-01T00:00:00Z',
      updated_at: '2030-01-01T00:00:00Z',
    })
    return {
      job_id,
      status: 'queued',
      quote_id: input.quote_id,
      request_hash: input.request_hash,
    }
  }

  async jobGet(input) {
    this.calls.push(['jobGet', structuredClone(input)])
    return structuredClone(this.jobs.get(input.job_id))
  }

  async assetGet(input) {
    this.calls.push(['assetGet', structuredClone(input)])
    return structuredClone(this.assets.get(input.asset_id))
  }

  succeed(jobId, asset) {
    this.assets.set(asset.asset_id, asset)
    const job = this.jobs.get(jobId)
    this.jobs.set(jobId, {
      ...job,
      status: 'succeeded',
      output_asset_ids: [asset.asset_id],
      updated_at: '2030-01-01T00:01:00Z',
    })
  }

  run(jobId) {
    const job = this.jobs.get(jobId)
    this.jobs.set(jobId, {
      ...job,
      status: 'running',
      updated_at: '2030-01-01T00:00:30Z',
    })
  }
}

test('MCP callTool adapter uses the frozen P0 tool names', async () => {
  const calls = []
  const client = createMediaMcpToolClient(async (name, input) => {
    calls.push([name, input])
    return { structuredContent: { name } }
  })

  assert.deepEqual(await client.quoteCreate({ a: 1 }), { name: 'quote_create' })
  assert.deepEqual(await client.generateImage({ b: 2 }), { name: 'generate_image' })
  assert.deepEqual(await client.generateVideo({ c: 3 }), { name: 'generate_video' })
  assert.deepEqual(await client.jobGet({ d: 4 }), { name: 'job_get' })
  assert.deepEqual(await client.assetGet({ e: 5 }), { name: 'asset_get' })
  assert.deepEqual(calls.map(([name]) => name), [
    'quote_create',
    'generate_image',
    'generate_video',
    'job_get',
    'asset_get',
  ])
})

test('bind helpers project Stage 05/08 execution facts into additive Workbench fields', () => {
  const source = fixture()
  delete source.assets[0].image_prompt
  delete source.assets[0].negative_prompt
  delete source.assets[0].aspect_ratio
  delete source.assets[0].public_model_id
  delete source.videos[0].public_model_id
  delete source.videos[0].aspect_ratio
  delete source.videos[0].video_resolution

  const withAsset = bindAssetGenerationSpec(source, 'CHAR-EVE', {
    image_prompt: 'Stage 05 identity board prompt.',
    negative_prompt: 'Do not change identity.',
    aspect_ratio: '16:9',
    public_model_id: 'chatgpt-web-image',
  })
  const withVideo = bindVideoGenerationSpec(withAsset, 'VIDEO-001', {
    video_master_prompt: 'English Stage 08 execution prompt.',
    video_negative_prompt: 'Do not change approved assets.',
    public_model_id: 'seedance2.0mini',
    aspect_ratio: '9:16',
    video_resolution: '720p',
  })

  assert.equal(source.assets[0].image_prompt, undefined)
  assert.equal(withVideo.assets[0].image_prompt, 'Stage 05 identity board prompt.')
  assert.equal(withVideo.assets[0].public_model_id, 'chatgpt-web-image')
  assert.equal(withVideo.videos[0].media_prompt, 'English Stage 08 execution prompt.')
  assert.equal(withVideo.videos[0].video_master_prompt.includes('伊芙抬眼'), true)
  assert.equal(withVideo.videos[0].public_model_id, 'seedance2.0mini')
  assert.equal(withVideo.videos[0].media_mode, 'text2video')
})

test('maps Asset Creation Pack fields to ChatGPT Web image Media MCP request', () => {
  const manifest = fixture()
  const prepared = prepareAssetImageGeneration(manifest, 'CHAR-EVE')

  assert.equal(prepared.kind, 'image_generation')
  assert.equal(prepared.publicModelId, 'chatgpt-web-image')
  assert.match(prepared.request.prompt, /Adult woman Eve/)
  assert.match(prepared.request.prompt, /No text, no extra person/)
  assert.equal(prepared.request.aspect_ratio, '16:9')
  assert.equal(prepared.request.usvds, undefined)
  assert.equal(prepared.source.asset_kind, 'character')
  assert.equal(prepared.quoteIdempotencyKey.length >= 16, true)
  assert.equal(prepared.quoteIdempotencyKey.length <= 128, true)
  assert.equal(prepared.generateIdempotencyKey.length <= 128, true)
})

test('maps VIDEO package to current Dreamina-consumable request and linked Media MCP assets', () => {
  const manifest = fixture()
  manifest.videos[0].media_prompt = 'English Stage 08 prompt for Seedance execution.'
  manifest.videos[0].media_negative_prompt = 'Do not change approved identities or set geography.'
  const prepared = prepareVideoGeneration(manifest, 'VIDEO-001')

  assert.equal(prepared.kind, 'video_generation')
  assert.equal(prepared.publicModelId, 'seedance2.0mini')
  assert.equal(prepared.request.mode, 'text2video')
  assert.equal(prepared.request.duration, 8)
  assert.equal(prepared.request.ratio, '9:16')
  assert.equal(prepared.request.video_resolution, '720p')
  assert.deepEqual(prepared.request.input_asset_ids, ['media-input-set'])
  assert.equal(prepared.request.usvds, undefined)
  assert.deepEqual(prepared.source.asset_ids, ['SET-AUCTION'])
  assert.match(prepared.request.prompt, /English Stage 08 prompt/)
  assert.match(prepared.request.prompt, /Do not change approved identities/)
})

test('target_model display label never substitutes for Media MCP public_model_id', () => {
  const manifest = fixture()
  delete manifest.videos[0].public_model_id
  assert.throws(
    () => prepareVideoGeneration(manifest, 'VIDEO-001'),
    error => error instanceof MediaMcpAdapterError
      && error.code === 'MISSING_GENERATION_INPUT'
      && /public_model_id/.test(error.message),
  )
})

test('repeated image submission reuses media_executions and does not create another paid job', async () => {
  const client = new FakeMediaMcpClient()
  const first = await submitAssetImage({
    client,
    manifest: fixture(),
    assetId: 'CHAR-EVE',
    workspaceId: 'ws-usvds',
    now: () => '2030-01-01T00:00:00Z',
  })
  const second = await submitAssetImage({
    client,
    manifest: first.manifest,
    assetId: 'CHAR-EVE',
    workspaceId: 'ws-usvds',
    now: () => '2030-01-01T00:00:01Z',
  })

  assert.equal(first.reused, false)
  assert.equal(second.reused, true)
  assert.equal(first.execution.execution_id, second.execution.execution_id)
  assert.equal(client.calls.filter(([name]) => name === 'quoteCreate').length, 1)
  assert.equal(client.calls.filter(([name]) => name === 'generateImage').length, 1)
  assert.equal(first.manifest.media_executions.length, 1)
  assert.equal(first.manifest.assets[0].generation_status, 'queued')
})

test('video job progresses through generating and succeeds only to review_required', async () => {
  const client = new FakeMediaMcpClient()
  const submitted = await submitVideo({
    client,
    manifest: fixture(),
    videoId: 'VIDEO-001',
    workspaceId: 'ws-usvds',
    now: () => '2030-01-01T00:00:00Z',
  })

  assert.equal(submitted.manifest.videos[0].status, 'generating')
  assert.equal(submitted.execution.execution_status, 'queued')

  client.run(submitted.execution.media_job_id)
  const running = await syncMediaExecution({
    client,
    manifest: submitted.manifest,
    executionId: submitted.execution.execution_id,
    workspaceId: 'ws-usvds',
    now: () => '2030-01-01T00:00:30Z',
  })
  assert.equal(running.execution.execution_status, 'running')
  assert.equal(running.manifest.videos[0].status, 'generating')

  client.succeed(submitted.execution.media_job_id, {
    asset_id: 'media-video-001',
    kind: 'generated_video',
    status: 'ready',
    mime_type: 'video/mp4',
    byte_size: 123456,
    duration_ms: 8042,
  })
  const completed = await syncMediaExecution({
    client,
    manifest: running.manifest,
    executionId: submitted.execution.execution_id,
    workspaceId: 'ws-usvds',
    now: () => '2030-01-01T00:01:00Z',
  })

  assert.equal(completed.execution.execution_status, 'succeeded')
  assert.deepEqual(completed.execution.output_asset_ids, ['media-video-001'])
  assert.equal(completed.execution.output_assets[0].mime_type, 'video/mp4')
  assert.equal(completed.manifest.videos[0].status, 'review_required')
  assert.notEqual(completed.manifest.videos[0].status, 'approved')
  assert.equal(completed.manifest.videos[0].generation_result_id, 'media-video-001')
})

test('image success becomes review_required and never auto-approves the USVDS asset', async () => {
  const client = new FakeMediaMcpClient()
  const submitted = await submitAssetImage({
    client,
    manifest: fixture(),
    assetId: 'CHAR-EVE',
    workspaceId: 'ws-usvds',
  })

  client.succeed(submitted.execution.media_job_id, {
    asset_id: 'media-image-001',
    kind: 'generated_image',
    status: 'ready',
    mime_type: 'image/png',
    byte_size: 9876,
    width: 1024,
    height: 1024,
  })

  const completed = await syncMediaExecution({
    client,
    manifest: submitted.manifest,
    executionId: submitted.execution.execution_id,
    workspaceId: 'ws-usvds',
  })

  const target = completed.manifest.assets.find(item => item.id === 'CHAR-EVE')
  assert.equal(target.status, 'review_required')
  assert.notEqual(target.status, 'approved')
  assert.deepEqual(target.candidate_media_asset_ids, ['media-image-001'])
})

test('stale generation result is rejected after creative generation inputs change', async () => {
  const client = new FakeMediaMcpClient()
  const submitted = await submitVideo({
    client,
    manifest: fixture(),
    videoId: 'VIDEO-001',
    workspaceId: 'ws-usvds',
  })

  const edited = structuredClone(submitted.manifest)
  edited.videos[0].video_master_prompt += ' NEW CREATIVE CHANGE'

  client.succeed(submitted.execution.media_job_id, {
    asset_id: 'media-video-old',
    kind: 'generated_video',
    status: 'ready',
    mime_type: 'video/mp4',
  })

  await assert.rejects(
    syncMediaExecution({
      client,
      manifest: edited,
      executionId: submitted.execution.execution_id,
      workspaceId: 'ws-usvds',
    }),
    error => error instanceof MediaMcpAdapterError && error.code === 'STALE_WORKBENCH_REVISION',
  )

  assert.equal(edited.videos[0].generation_result_id, undefined)
})

test('workbench revision ignores execution-owned state but changes with creative inputs', async () => {
  const original = fixture()
  const revision = workbenchRevision(original)

  const executionOnly = structuredClone(original)
  executionOnly.videos[0].status = 'generating'
  executionOnly.videos[0].generation_status = 'running'
  executionOnly.media_executions = [{
    schema: 'usvd.media-execution/v1',
    execution_id: 'x',
  }]
  assert.equal(workbenchRevision(executionOnly), revision)

  const creativeEdit = structuredClone(original)
  creativeEdit.shots[0].shot_delta_prompt = 'Different action'
  assert.notEqual(workbenchRevision(creativeEdit), revision)
})
