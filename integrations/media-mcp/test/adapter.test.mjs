import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyMediaMcpJobReceipt,
  applyMediaMcpJobStatus,
  bindGenerateCall,
  buildMediaMcpPlan,
} from '../index.mjs'

const workbench = {
  schema_version: 'us-vertical-drama-workbench/v1',
  episode_id: 'EP-001',
  assets: [
    {
      id: 'CHAR-EVE',
      kind: 'character',
      status: 'approved',
      image_prompt: 'Adult woman character reference on white background.',
      negative_prompt: 'No text.',
      aspect_ratio: '16:9',
    },
    {
      id: 'LOOK-EVE-NIGHT',
      kind: 'look',
      status: 'approved',
    },
    {
      id: 'PROP-BOTTLE',
      kind: 'prop',
      status: 'approved',
      image_prompt: 'Plain prop bottle reference on white background.',
    },
  ],
  videos: [
    {
      video_id: 'VIDEO-001',
      display_name_zh: '入口异动',
      source_scene_id: 'EP01-SC01',
      duration_seconds: 8,
      video_prompt_id: 'VIDEO-PROMPT-001',
      video_master_prompt: 'Eight-second vertical dramatic scene.',
      video_negative_prompt: 'Do not change identity or geography.',
      status: 'ready_to_generate',
    },
  ],
  shots: [
    {
      shot_id: 'SHOT-001',
      video_id: 'VIDEO-001',
      asset_ids: ['CHAR-EVE', 'LOOK-EVE-NIGHT', 'PROP-BOTTLE'],
    },
  ],
  tasks: [],
}

test('maps approved CHAR/PROP and ready VIDEO into Media MCP quote calls', () => {
  const plan = buildMediaMcpPlan(workbench)
  assert.equal(plan.targets.length, 3)

  const character = plan.targets.find(item => item.target_ref === 'CHAR-EVE')
  assert.equal(character.capability, 'image_generation')
  assert.equal(character.quote_call.tool, 'quote_create')
  assert.equal(character.quote_call.arguments.public_model_id, 'chatgpt-web-image')
  assert.ok(character.quote_call.arguments.idempotency_key.length >= 16)

  assert.equal(plan.targets.some(item => item.target_ref === 'LOOK-EVE-NIGHT'), false)

  const video = plan.targets.find(item => item.target_ref === 'VIDEO-001')
  assert.equal(video.capability, 'video_generation')
  assert.equal(video.quote_call.arguments.public_model_id, 'seedance2.0mini')
  assert.deepEqual(video.request.reference_asset_ids, ['CHAR-EVE', 'LOOK-EVE-NIGHT', 'PROP-BOTTLE'])
})

test('binds a confirmed quote into generate_image/video without changing the frozen request', () => {
  const plan = buildMediaMcpPlan(workbench)
  const video = plan.targets.find(item => item.target_ref === 'VIDEO-001')
  const call = bindGenerateCall(workbench, video, {
    quote_id: 'QUOTE-001',
    request_hash: 'server-hash-001',
  })

  assert.equal(call.tool, 'generate_video')
  assert.equal(call.arguments.quote_id, 'QUOTE-001')
  assert.equal(call.arguments.request_hash, 'server-hash-001')
  assert.equal(call.arguments.confirm_quote, true)
  assert.deepEqual(call.arguments.request, video.request)
})

test('keeps approval state separate from generation state for visual assets', () => {
  const withJob = applyMediaMcpJobReceipt(workbench, {
    target_ref: 'CHAR-EVE',
    job_id: 'JOB-IMAGE-001',
    quote_id: 'QUOTE-IMAGE-001',
    request_hash: 'hash-image',
  })

  const character = withJob.assets.find(item => item.id === 'CHAR-EVE')
  assert.equal(character.status, 'approved')
  assert.equal(character.generation_state, 'generating')
  assert.equal(character.media_mcp.job_id, 'JOB-IMAGE-001')

  const completed = applyMediaMcpJobStatus(withJob, 'CHAR-EVE', {
    job_id: 'JOB-IMAGE-001',
    status: 'succeeded',
    output_asset_ids: ['MEDIA-ASSET-001'],
  })
  const completedCharacter = completed.assets.find(item => item.id === 'CHAR-EVE')
  assert.equal(completedCharacter.status, 'approved')
  assert.equal(completedCharacter.generation_state, 'review_required')
  assert.deepEqual(completedCharacter.media_mcp.output_asset_ids, ['MEDIA-ASSET-001'])
})

test('moves VIDEO through generating to review_required from Media MCP Job state', () => {
  const queued = applyMediaMcpJobReceipt(workbench, {
    target_ref: 'VIDEO-001',
    job_id: 'JOB-VIDEO-001',
    quote_id: 'QUOTE-VIDEO-001',
    request_hash: 'hash-video',
  })
  assert.equal(queued.videos[0].status, 'generating')

  const done = applyMediaMcpJobStatus(queued, 'VIDEO-001', {
    job_id: 'JOB-VIDEO-001',
    status: 'succeeded',
    output_asset_ids: ['MEDIA-VIDEO-001'],
  })
  assert.equal(done.videos[0].status, 'review_required')
  assert.deepEqual(done.videos[0].media_mcp.output_asset_ids, ['MEDIA-VIDEO-001'])
})
