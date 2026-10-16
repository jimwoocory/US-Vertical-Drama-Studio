/**
 * V11 autonomous director control loop.
 *
 * The language model is an injected, explicit dependency. Never substitute a
 * deterministic word trimmer for creative directing. This module will not make
 * network calls, invent a provider, auto-approve story truth or deploy media.
 */
import { createHash } from 'node:crypto'
import { planDirectorEpisode } from './v11-director-planner.mjs'

const REVIEW_DIMENSIONS = Object.freeze([
  'character_goal_and_strategy', 'opponent_response', 'causal_and_knowledge_order',
  'emotional_setup_and_payoff', 'cliffhanger_and_next_episode',
  'scene_geography_and_continuity',
])
const guardNames = Object.freeze([
  'core_promise', 'character_goals', 'causal_chain',
  'emotional_setup_payoff', 'continuity', 'continuing_hook',
])
const own = (v, k) => Object.prototype.hasOwnProperty.call(v ?? {}, k)
const nonempty = v => typeof v === 'string' && v.trim().length > 0
const fail = (code, message, details) => ({
  status: 'blocked',
  diagnostics: [{ code, message, ...(details === undefined ? {} : { details }) }],
})
const digest = v => createHash('sha256').update(JSON.stringify(v)).digest('hex')

export const DIRECTOR_CREATIVE_POLICY = Object.freeze({
  mode: 'autonomous_v11_episode_direction',
  complete_episode_seconds: [60, 120],
  max_video_seconds: 15,
  ordinary_rewrite_requires_human_approval: false,
  prohibited: [
    'new_canon', 'altering_protected_events', 'fast_forward_dialogue',
    'padding_with_empty_reactions', 'changing_knowledge_order',
    'inventing_assets', 'asserting_unperformed_tests_passed',
  ],
})

function validateSource(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return 'Source must be a structured screenplay package.'
  }
  if (!nonempty(source.source_revision_id) || !nonempty(source.director_revision_id)
    || source.source_revision_id === source.director_revision_id) {
    return 'Original and new director revision IDs must be present and distinct.'
  }
  if (!Array.isArray(source.source_units) || !source.source_units.length
    || !source.source_units.every(u => nonempty(u?.source_unit_id)
      && nonempty(u?.source_text) && nonempty(u?.scene_id)
      && Array.isArray(u?.known_events) && Array.isArray(u?.must_preserve)
      && !own(u, 'options'))) {
    return 'Source units must be traced screenplay facts, without prewritten candidate alternatives.'
  }
  const ids = source.source_units.map(u => u.source_unit_id)
  if (new Set(ids).size !== ids.length) return 'Source units must have unique IDs.'
  const known = new Set(source.source_units.flatMap(u => u.known_events))
  if (!Array.isArray(source.required_events)
    || source.required_events.some(e => !known.has(e))) {
    return 'Required dramatic events must be grounded in source units.'
  }
  return null
}

function assertSourceExcerpt(originalText, extracted) {
  const units = extracted?.source_units
  if (!Array.isArray(units) || !units.length) return false
  return units.every(u => nonempty(u?.source_text)
    && originalText.includes(u.source_text))
}

// The extraction model may annotate canonical facts, but it cannot manufacture
// literal source excerpts, bypass creator's protected-event inventory, or
// mark a screenplay review as approved.
export async function extractDirectorSource(raw, extractor) {
  if (!nonempty(raw?.raw_screenplay) || !raw?.protected_event_ids?.length
    || typeof extractor !== 'function') {
    return fail('director_extraction_missing_inputs',
      'Original screenplay, protected event IDs and a real extractor callback are required.')
  }
  let response
  try {
    response = await extractor({
      task: 'extract_screenplay_source_units',
      source_text: raw.raw_screenplay,
      story_bible: raw.story_bible ?? null,
      protected_event_ids: raw.protected_event_ids,
      instructions: [
        'Copy each source_text exactly from the original screenplay.',
        'List scene and chronological known event IDs with no invented canon.',
        'Mark all protected events with exact supplied stable IDs.',
        'Separate spoken dialogue from visual description; preserve speaker identity.',
        'Do not fabricate continuity CLEAR, Script Doctor PASS, assets or model capabilities.',
      ],
    })
  } catch (error) {
    return fail('director_extraction_model_error', 'Extractor could not produce a source analysis.',
      String(error?.message ?? error))
  }
  const value = response?.output
  if (!assertSourceExcerpt(raw.raw_screenplay, value)) {
    return fail('director_extraction_unverified_source',
      'Extractor output must provide exact, traceable excerpts from the original screenplay.')
  }
  const grounded = new Set(value.source_units.flatMap(u => u?.known_events ?? []))
  if (raw.protected_event_ids.some(e => !grounded.has(e))) {
    return fail('director_extraction_lost_protected_event',
      'Extractor lost one or more caller-supplied protected events.')
  }
  const result = {
    ...value, source_revision_id: raw.source_revision_id,
    director_revision_id: raw.director_revision_id,
    project_brief: raw.project_brief,
    required_events: [...raw.protected_event_ids],
    // User / upstream controls verification; the model cannot assert approval.
    source_approval: raw.source_approval ?? 'unverified',
    source_units: value.source_units.map(u => {
      const { options, ...rest } = u
      return rest
    }),
  }
  const error = validateSource(result)
  if (error) return fail('director_extraction_invalid', error)
  return { status: 'extracted_unverified', source: result,
    evidence: { source_sha256: digest(raw.raw_screenplay), extraction_run_id: response?.run_id ?? null } }
}

export function creativeDirectorRequest(source, prior = null) {
  const permitted = source.source_units.map(u => ({
    source_unit_id: u.source_unit_id,
    scene_id: u.scene_id,
    source_text: u.source_text,
    source_spoken_text: u.source_spoken_text ?? '',
    known_events: u.known_events,
    must_preserve: u.must_preserve,
    minimum_reaction_seconds: u.minimum_reaction_seconds ?? 0,
  }))
  return {
    task: 'author_director_playable_alternatives',
    policy: DIRECTOR_CREATIVE_POLICY,
    source_revision_id: source.source_revision_id,
    required_events: source.required_events,
    event_dependencies: source.event_dependencies ?? [],
    episode_direction: source.episode_direction,
    source_units: permitted,
    previous_failure: prior?.diagnostics ?? null,
    instructions: [
      'You are the V11 director. Create alternate playable performances without needing per-episode human rewrite approval.',
      'For every source unit provide 1–12 options, including at least one genuine rewrite unless protected canon makes rewriting impossible.',
      'Preserve source IDs, character agency, causal and audience knowledge order, critical setup/payoff and cliffhanger.',
      'For spoken English supply spoken_text; for action supply concise visual text; do not time written visual descriptions as speech.',
      'Explicitly budget sequential actions, meaningful reactions and action concurrent with speech without double counting.',
      'Reason about the protagonist tactic, opponent response and audience inference, not just removing words.',
      'Never invent new facts, character identities or offscreen scene events not provided in source.',
      'Return structured unit options; do not claim the edited script is automatically production approved.',
    ],
  }
}

function mapModelOptions(source, response) {
  const entries = response?.output?.units
  if (!Array.isArray(entries) || entries.length !== source.source_units.length) {
    return fail('director_alternatives_count_invalid', 'Creative model must return options for every original screenplay unit.')
  }
  const target = new Map(source.source_units.map(u => [u.source_unit_id, u]))
  const options = new Map()
  for (const item of entries) {
    if (!target.has(item?.source_unit_id) || options.has(item?.source_unit_id)
      || !Array.isArray(item?.options) || !item.options.length) {
      return fail('director_alternatives_mapping_invalid',
        'The candidate list must have one nonempty set per original source unit.')
    }
    for (const take of item.options) {
      if (typeof take !== 'object' || take === null) {
        return fail('director_alternatives_invalid_take', 'Every authored take must be a structured record.')
      }
    }
    // The callback can author options only; it cannot rewrite source canon,
    // protected beat IDs, scene ID, or the approved screenplay revision.
    options.set(item.source_unit_id, structuredClone(item.options))
  }
  return { status: 'mapped', source_units: source.source_units.map(u => ({
    ...structuredClone(u),
    options: options.get(u.source_unit_id),
  })) }
}

function validateReviewEvidence(draft, creative, response) {
  if (!response || response.status !== 'pass'
    || !nonempty(response.reviewer_id) || !nonempty(response.run_id)
    || response.reviewer_id === creative.generator_id
    || response.run_id === creative.run_id
    || response.director_revision_id !== draft.director_revision.revision_id
    || response.source_revision_id !== draft.director_revision.source_revision_id
    || response.reviewed_hash !== digest({
      source: creative.source_revision_digest,
      director_revision: draft.director_revision,
      episode_timing: draft.episode_timing,
    })) return false
  if (!REVIEW_DIMENSIONS.every(k => response?.checks?.[k]?.result === 'pass'
    && nonempty(response?.checks?.[k]?.evidence))) return false
  return true
}

// This result is a reviewer *claim*, not verified independent dramatic truth.
// If review is missing, contradictory, stale, or references the authoring run,
// the director remains in DRAFT with guards unverified.
export async function runAutonomousDirector(source, callbacks, opts = {}) {
  const sourceError = validateSource(source)
  if (sourceError) return fail('director_source_invalid', sourceError)
  if (typeof callbacks?.generateAlternatives !== 'function') {
    return fail('director_model_not_connected',
      'A live creative-model adapter is required; do not substitute prepared options as autonomous generation.')
  }
  const attempts = Math.max(1, Math.min(3, Math.floor(opts.attempts ?? 2)))
  let last = null
  let creative = null
  let draft
  for (let attempt = 1; attempt <= attempts; attempt++) {
    let response
    try {
      response = await callbacks.generateAlternatives(creativeDirectorRequest(source, last), { attempt })
    } catch (error) {
      return fail('director_generation_model_error',
        'The creative model could not complete the director take generation.',
        String(error?.message ?? error))
    }
    if (!nonempty(response?.generator_id) || !nonempty(response?.run_id)) {
      return fail('director_generation_evidence_missing',
        'A live model run ID and model identity are required; a canned response is not proof of live inference.')
    }
    const mapped = mapModelOptions(source, response)
    if (mapped.status === 'blocked') return mapped
    draft = planDirectorEpisode({
      ...structuredClone(source),
      source_units: mapped.source_units,
    }, opts.planner_options ?? {})
    creative = {
      generator_id: response.generator_id, run_id: response.run_id,
      source_revision_digest: digest(source),
    }
    if (draft.status === 'draft') break
    last = draft
  }
  if (draft?.status !== 'draft') {
    return { status: 'blocked', diagnostics: draft?.diagnostics ?? [], generation: creative,
      attempted_models: attempts }
  }
  const output = {
    status: 'director_draft_unverified',
    director_revision: draft.director_revision,
    episode_timing: draft.episode_timing,
    planning_slots: draft.video_slots,
    selected_take_ids: draft.selected_take_ids,
    estimates: draft.estimates,
    generation: creative,
    story_review: { status: 'not_run' },
    production_gate: 'BLOCKED',
    media_validation: { voice_readthrough: 'NOT_RUN', animatic: 'NOT_RUN', video: 'NOT_RUN', audience: 'NOT_RUN' },
  }
  if (typeof callbacks?.reviewDrama !== 'function') return output
  let response
  const request = {
    task: 'independent_director_dramatic_review',
    source,
    director_revision: draft.director_revision,
    episode_timing: draft.episode_timing,
    reference_digest: digest({
      source: creative.source_revision_digest,
      director_revision: draft.director_revision,
      episode_timing: draft.episode_timing,
    }),
    checklist: REVIEW_DIMENSIONS,
    instructions: [
      'This must be a separate, externally recorded model run from the creative generator.',
      'Challenge character goals, opponent actions, protected plot facts, scene continuity, comprehension and payoff.',
      'Do not accept self-asserted story_guards as proof of dramatic truth.',
      'Quote concrete source and director unit IDs for every review decision.',
    ],
  }
  try { response = await callbacks.reviewDrama(request) }
  catch (error) {
    output.story_review = { status: 'failed', reason: String(error?.message ?? error) }
    return output
  }
  if (!validateReviewEvidence(draft, creative, response)) {
    output.story_review = { status: 'unverified', reason: 'Missing independent run proof, stale digest, reviewer conflict, or failed dimensions.' }
    return output
  }
  output.story_review = {
    status: 'model_review_pass_claim', reviewer_id: response.reviewer_id,
    run_id: response.run_id, reviewed_hash: response.reviewed_hash,
    checks: response.checks,
  }
  output.director_revision = {
    ...output.director_revision,
    status: 'locked',
    story_guards: Object.fromEntries(guardNames.map(key => [key, 'preserved'])),
    // Real independent human or media evidence is NOT implied.
    review_evidence: { type: 'model_report', run_id: response.run_id },
  }
  output.status = 'director_revision_model_reviewed'
  return output
}

export function directorStoryboardHandoff(director, source) {
  if (!director?.director_revision || !Array.isArray(director.planning_slots)
    || director.status === 'blocked') {
    return fail('director_handoff_unavailable', 'The director revision and its timed candidate slots are required.')
  }
  const result = {
    status: 'planning_only',
    ready_to_generate: false,
    director_revision: structuredClone(director.director_revision),
    scene_assets: structuredClone(source?.assets ?? []),
    slots: director.planning_slots.map(s => ({
      ...s, status: 'awaiting_creative_shot_design',
      needs_asset_lock: true,
      needs_camera_continuity_validation: Boolean(s.continuity_handoff_required),
      needs_natural_voice_timing: true,
    })),
    warnings: [
      'No generated VIDEO or SHOT is production-ready until asset references, cut continuity and English reading time are verified.',
      'Do not infer media, audience or independent-human-QA PASS from a model review.',
    ],
  }
  return result
}
