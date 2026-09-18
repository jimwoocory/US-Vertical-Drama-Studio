export const TARGET_MODEL = 'Seedance 2.0 Mini'
export const FEATURE_KEYS = ['audio', 'lip_sync', 'seed', 'start_frame', 'end_frame', 'reference_images']
export const CAPABILITY_STATES = new Set(['supported', 'unsupported', 'unknown'])
export const EXECUTION_MODES = new Set(['native', 'external', 'unused'])

export const PROMPT_BUDGET = Object.freeze({
  video: { target: 1200, review: 1600 },
  shot: { target: 360, review: 520 },
})

export function countChars(text = '') {
  return Array.from(String(text)).length
}

export function assessPromptBudget(text, kind) {
  const budget = PROMPT_BUDGET[kind]
  if (!budget) throw new Error(`unknown prompt budget kind: ${kind}`)
  const chars = countChars(text)
  if (chars <= budget.target) return { status: 'OK', chars, ...budget }
  if (chars <= budget.review) return { status: 'REVIEW', chars, ...budget }
  return { status: 'OVER_BUDGET', chars, ...budget }
}

export function validateAdapterPackage(pkg) {
  const diagnostics = []
  if (pkg?.target_model !== TARGET_MODEL) {
    diagnostics.push({ code: 'wrong_target_model', expected: TARGET_MODEL, actual: pkg?.target_model })
  }

  const profile = pkg?.capability_profile ?? {}
  for (const feature of FEATURE_KEYS) {
    if (!CAPABILITY_STATES.has(profile[feature])) {
      diagnostics.push({ code: 'invalid_or_missing_capability', feature, actual: profile[feature] })
    }
  }

  const videos = Array.isArray(pkg?.videos) ? pkg.videos : []
  const shots = Array.isArray(pkg?.shots) ? pkg.shots : []
  const videoMap = new Map(videos.map(video => [video.video_id, video]))

  for (const video of videos) {
    requireTrace(video, ['video_id', 'prompt_id', 'source_scene_refs', 'asset_ids'], diagnostics, 'video')
    requireText(video, 'video_master_prompt', diagnostics, video.video_id)
    requireText(video, 'video_negative_prompt', diagnostics, video.video_id)
    checkQualityTokens(video.video_master_prompt, video.video_id, diagnostics)
    checkQualityTokens(video.video_negative_prompt, video.video_id, diagnostics)
    const budget = assessPromptBudget(video.video_master_prompt, 'video')
    if (budget.status === 'OVER_BUDGET') diagnostics.push({ code: 'video_prompt_over_budget', ref: video.video_id, chars: budget.chars, limit: budget.review })
    if (budget.status === 'REVIEW' && !Array.isArray(video.degradation_log)) diagnostics.push({ code: 'review_prompt_missing_degradation_log', ref: video.video_id })
    validateExecutionFeatures(video, profile, diagnostics)
  }

  for (const shot of shots) {
    requireTrace(shot, ['shot_id', 'video_id', 'prompt_id', 'asset_ids'], diagnostics, 'shot')
    requireText(shot, 'shot_delta_prompt', diagnostics, shot.shot_id)
    requireText(shot, 'local_exclusions', diagnostics, shot.shot_id)
    const parent = videoMap.get(shot.video_id)
    if (!parent) {
      diagnostics.push({ code: 'missing_parent_video', ref: shot.shot_id, video_id: shot.video_id })
      continue
    }
    checkQualityTokens(shot.shot_delta_prompt, shot.shot_id, diagnostics)
    const budget = assessPromptBudget(shot.shot_delta_prompt, 'shot')
    if (budget.status === 'OVER_BUDGET') diagnostics.push({ code: 'shot_prompt_over_budget', ref: shot.shot_id, chars: budget.chars, limit: budget.review })
    if (budget.status === 'REVIEW' && !Array.isArray(shot.degradation_log)) diagnostics.push({ code: 'review_prompt_missing_degradation_log', ref: shot.shot_id })
    if (normalizePrompt(shot.shot_delta_prompt) === normalizePrompt(parent.video_master_prompt)) {
      diagnostics.push({ code: 'shot_delta_duplicates_video_master', ref: shot.shot_id, video_id: shot.video_id })
    }
  }

  return diagnostics
}

function requireTrace(item, keys, diagnostics, kind) {
  for (const key of keys) {
    const value = item?.[key]
    const emptyArray = Array.isArray(value) && value.length === 0
    if (value === undefined || value === null || value === '' || emptyArray) {
      diagnostics.push({ code: 'missing_traceability_field', kind, ref: item?.video_id ?? item?.shot_id ?? 'unknown', field: key })
    }
  }
}

function requireText(item, key, diagnostics, ref) {
  if (typeof item?.[key] !== 'string' || item[key].trim() === '') {
    diagnostics.push({ code: 'missing_prompt_field', ref, field: key })
  }
}

function checkQualityTokens(text = '', ref, diagnostics) {
  const hits = []
  if (/\b8k\b/iu.test(text)) hits.push('8K')
  if (/\bmasterpiece\b/iu.test(text)) hits.push('masterpiece')
  if (/\bcinematic\b/iu.test(text)) hits.push('cinematic')
  if (hits.length) diagnostics.push({ code: 'forbidden_quality_token', ref, tokens: hits })
}

function validateExecutionFeatures(video, profile, diagnostics) {
  const modes = video?.execution_features ?? {}
  const externalNotes = Array.isArray(video?.external_execution_notes) ? video.external_execution_notes : []
  for (const feature of FEATURE_KEYS) {
    const mode = modes[feature] ?? 'unused'
    if (!EXECUTION_MODES.has(mode)) {
      diagnostics.push({ code: 'invalid_execution_mode', ref: video.video_id, feature, mode })
      continue
    }
    if (mode === 'native' && profile[feature] !== 'supported') {
      diagnostics.push({ code: 'unsupported_native_capability_claim', ref: video.video_id, feature, capability: profile[feature] })
    }
    if (mode === 'external' && !externalNotes.some(note => note?.feature === feature && note?.owner)) {
      diagnostics.push({ code: 'external_execution_note_missing', ref: video.video_id, feature })
    }
  }
}

function normalizePrompt(text = '') {
  return String(text).toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '')
}
