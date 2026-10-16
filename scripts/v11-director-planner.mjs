/**
 * V11 director rehearsal planner.
 *
 * Input: a source screenplay annotated with canonical facts and director-authored
 * playable alternatives. The planner selects / cuts / merges already supplied
 * alternatives under the 60–120 second programme budget. It NEVER invents new
 * plot facts, replaces semantic review or claims to have measured spoken audio.
 *
 * Output is a director DRAFT and advisory VIDEO slots, never a ready-to-generate
 * VIDEO/SHOT manifest. An independent dramatic review plus real timing work
 * precede locking the director revision and creating production shots.
 */
const POLICY_MIN = 60
const POLICY_MAX = 120
const VIDEO_MAX = 15
const MAX_SOURCE_UNITS = 30
const MAX_OPTIONS_PER_UNIT = 12
const MAX_SEARCH_STATES = 45000
const DIRECTOR_FIELDS = [
  'objective', 'situation_change', 'character_tactic', 'opponent_response',
  'knowledge_sequence', 'emotional_payoff', 'continuing_hook',
]
const GUARD_FIELDS = [
  'core_promise', 'character_goals', 'causal_chain',
  'emotional_setup_payoff', 'continuity', 'continuing_hook',
]
const OPERATIONS = new Set(['retain', 'rewrite', 'merge', 'cut'])
const pos = x => typeof x === 'number' && Number.isFinite(x) && x >= 0
const str = x => typeof x === 'string' && x.trim().length > 0
const uniq = a => new Set(a).size === a.length
const tenth = x => Math.ceil(x * 10 - 1e-9)
const fromTicks = x => x / 10
const englishWords = text => (String(text).match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/gu) ?? []).length
const issue = (code, ref, message) => ({ code, ref, message })

function cost(take, speechRate) {
  const timing = take.timing ?? {}
  // Natural read estimate. Never fast-forward an English performance to fit.
  const words = englishWords(take.text)
  const estimatedSpeech = words / speechRate
  const spoken = Math.max(estimatedSpeech, timing.spoken_seconds ?? 0)
  const parallel = timing.parallel_action_seconds ?? 0
  return {
    words,
    speech_seconds: fromTicks(tenth(spoken)),
    seconds: fromTicks(tenth(Math.max(spoken, parallel) +
      (timing.sequential_action_seconds ?? 0) + (timing.reaction_seconds ?? 0))),
    // The reaction is separately budgeted only if it cannot happen while the
    // spoken line is being understood. Ordinary simultaneous action is free.
  }
}

function validatePolicy(spec, problems) {
  const policy = spec?.project_brief?.duration_policy ?? spec?.duration_policy
  if (!policy || typeof policy !== 'object' || policy.scope !== 'complete_episode'
    || policy.min_seconds !== POLICY_MIN || policy.max_seconds !== POLICY_MAX
    || !pos(policy.video_max_seconds) || policy.video_max_seconds === 0
    || policy.video_max_seconds > VIDEO_MAX) {
    problems.push(issue('director_planner_policy_invalid', 'duration_policy',
      'V11 planner requires the adopted complete-episode 60–120 second policy.'))
    return null
  }
  return policy
}

function validateFixed(spec, problems) {
  const fixed = spec.fixed_time ?? {}
  for (const [key, value] of Object.entries(fixed)) {
    if (!['opening_seconds', 'ending_seconds', 'audio_tail_seconds', 'scene_transition_seconds'].includes(key)
      || !pos(value)) problems.push(issue('director_planner_fixed_time_invalid', key, 'Invalid fixed programme duration.'))
  }
  return {
    opening: tenth(fixed.opening_seconds ?? 0),
    ending: tenth(fixed.ending_seconds ?? 0),
    audioTail: tenth(fixed.audio_tail_seconds ?? 0),
    transition: tenth(fixed.scene_transition_seconds ?? 0),
  }
}

function validateInput(spec) {
  const problems = []
  const policy = validatePolicy(spec, problems)
  const fixed = validateFixed(spec, problems)
  if (!str(spec?.source_revision_id) || !str(spec?.director_revision_id)
    || spec.source_revision_id === spec.director_revision_id) {
    problems.push(issue('director_planner_revision_invalid', 'source_revision_id', 'New director revision must identify a distinct source revision.'))
  }
  const direction = spec?.episode_direction
  for (const k of DIRECTOR_FIELDS) {
    if (!str(direction?.[k])) problems.push(issue('director_planner_direction_missing', k, 'Director must identify a concrete dramatic function.'))
  }
  const units = spec?.source_units
  if (!Array.isArray(units) || units.length === 0 || units.length > MAX_SOURCE_UNITS) {
    problems.push(issue('director_planner_units_invalid', 'source_units', 'Provide 1–30 source screenplay units.'))
    return { problems, policy, fixed, units: [], allEvents: new Set() }
  }
  const ids = units.map(x => x?.source_unit_id)
  if (!ids.every(str) || !uniq(ids)) problems.push(issue('director_planner_source_ids_invalid', 'source_units', 'Source unit IDs must be unique and nonempty.'))
  const locations = new Map(ids.map((id, i) => [id, i]))
  const sourceEvents = new Map()
  const eventOwners = new Map()
  for (const [index, unit] of units.entries()) {
    const ref = 'source_units[' + index + ']'
    if (!str(unit?.scene_id)) problems.push(issue('director_planner_scene_missing', ref, 'Each source unit needs a stable scene identity.'))
    if (!str(unit?.source_text)) problems.push(issue('director_planner_source_text_missing', ref, 'Each source unit must have a readable source line or action; the planner cannot reconstruct unknown original content.'))
    const events = unit?.known_events
    if (!Array.isArray(events) || !events.every(str) || !uniq(events)) {
      problems.push(issue('director_planner_events_invalid', ref, 'Each source unit must list distinct known canonical event IDs.'))
      continue
    }
    sourceEvents.set(unit.source_unit_id, new Set(events))
    for (const e of events) {
      if (eventOwners.has(e)) problems.push(issue('director_planner_duplicate_event', e, 'Only one source unit may own a source event.'))
      eventOwners.set(e, index)
    }
    const must = unit?.must_preserve ?? []
    if (!Array.isArray(must) || must.some(e => !events.includes(e))) {
      problems.push(issue('director_planner_protected_event_invalid', ref, 'Protected events must already exist in the source.'))
    }
  }
  const dependencies = spec?.event_dependencies ?? []
  if (!Array.isArray(dependencies)) {
    problems.push(issue('director_planner_dependencies_invalid', 'event_dependencies', 'Dependencies must be an array.'))
  } else for (const [i, dep] of dependencies.entries()) {
    const ref = 'event_dependencies[' + i + ']'
    if (!eventOwners.has(dep?.before) || !eventOwners.has(dep?.after)
      || dep.before === dep.after || eventOwners.get(dep.before) >= eventOwners.get(dep.after)) {
      problems.push(issue('director_planner_dependency_invalid', ref, 'Protected event order must be supported by source chronology.'))
    }
  }
  const allEvents = new Set(eventOwners.keys())
  const candidates = new Map()
  for (const [index, unit] of units.entries()) {
    const key = unit?.source_unit_id
    const options = unit?.options
    const ref = 'source_units[' + index + '].options'
    if (!Array.isArray(options) || options.length === 0 || options.length > MAX_OPTIONS_PER_UNIT) {
      problems.push(issue('director_planner_options_missing', ref, 'Director must supply playable alternatives and cuts.'))
      continue
    }
    const arr = []
    const seenIds = new Set()
    for (const [j, take] of options.entries()) {
      const loc = ref + '[' + j + ']'
      if (!str(take?.take_id) || seenIds.has(take.take_id)) {
        problems.push(issue('director_planner_take_id_invalid', loc, 'Take ID is missing or duplicated.'))
        continue
      }
      seenIds.add(take.take_id)
      const spans = take.source_unit_ids
      if (!Array.isArray(spans) || !spans.length || spans[0] !== key
        || spans.some((id, offset) => ids[index + offset] !== id)) {
        problems.push(issue('director_planner_span_invalid', loc, 'Merged takes must cover consecutive source units starting here.'))
        continue
      }
      if (!OPERATIONS.has(take.operation) || (take.operation === 'merge') !== (spans.length > 1)) {
        problems.push(issue('director_planner_operation_invalid', loc, 'Use merge only for multiple adjacent units.'))
        continue
      }
      const included = units.slice(index, index + spans.length)
      if (included.some(x => x?.scene_id !== unit.scene_id)) {
        problems.push(issue('director_planner_cross_scene_merge', loc, 'A single take cannot silently merge distinct scene geography.'))
        continue
      }
      const known = new Set(spans.flatMap(id => [...(sourceEvents.get(id) ?? [])]))
      const protectedEvents = included.flatMap(x => x?.must_preserve ?? [])
      const delivers = take.delivers
      if (!Array.isArray(delivers) || delivers.some(e => !known.has(e)) || !uniq(delivers)) {
        problems.push(issue('director_planner_new_fact_or_invalid_delivery', loc, 'A take may only claim canonical events from its covered sources.'))
        continue
      }
      if (protectedEvents.some(e => !delivers.includes(e))) {
        problems.push(issue('director_planner_protected_event_lost', loc, 'A take cannot erase an indispensable story event.'))
        continue
      }
      if (take.operation === 'retain' && take.text !== unit.source_text) {
        problems.push(issue('director_planner_retain_changed_text', loc, 'A retain take must match the exact source unit text.'))
        continue
      }
      if (take.operation === 'cut' && take.quality_score !== 0) {
        problems.push(issue('director_planner_cut_score_invalid', loc, 'Cutting optional exposition cannot earn an artificial positive dramatic score.'))
        continue
      }
      if (take.operation === 'cut' && (str(take.text) || delivers.length || included.some(x => x?.required))) {
        problems.push(issue('director_planner_cut_not_allowed', loc, 'Cut must be optional, silent, and non-protected.'))
        continue
      }
      if (take.operation !== 'cut' && !str(take.text)) {
        problems.push(issue('director_planner_text_missing', loc, 'Non-cut takes require playable English dialogue or action text.'))
        continue
      }
      if (take.operation !== 'retain' && !str(take.reason)) {
        problems.push(issue('director_planner_reason_missing', loc, 'Every substantive edit needs a dramatic reason.'))
        continue
      }
      if (!pos(take.quality_score) || take.quality_score > 10
        || !Object.values(take.timing ?? {}).every(pos)
        || Object.keys(take.timing ?? {}).some(k => !['spoken_seconds','parallel_action_seconds','sequential_action_seconds','reaction_seconds'].includes(k))) {
        problems.push(issue('director_planner_timing_or_score_invalid', loc, 'Take timing and quality need finite bounded, nonnegative values.'))
        continue
      }
      arr.push({ ...take, scene_id: unit.scene_id, spans, advance: spans.length })
    }
    candidates.set(key, arr)
  }
  const mandatory = units.flatMap(u => u?.must_preserve ?? [])
  if (spec?.required_events !== undefined) {
    if (!Array.isArray(spec.required_events) || spec.required_events.some(e => !allEvents.has(e))) {
      problems.push(issue('director_planner_required_events_invalid', 'required_events', 'Required story events must exist in the source.'))
    }
  }
  return { problems, policy, fixed, units, ids, candidates, mandatory: new Set([...mandatory, ...(Array.isArray(spec.required_events) ? spec.required_events : [])]), dependencies: Array.isArray(dependencies) ? dependencies : [] }
}

const keyFor = s => [s.ticks, s.lastScene ?? '', [...s.delivered].sort().join('|')].join('#')
const better = (next, existing) => !existing || next.score > existing.score + 1e-9
  || (Math.abs(next.score - existing.score) < 1e-9 && next.editCount < existing.editCount)

// No artificial 90-second target. Quality and narrative necessity choose the
// length; ties favour concision instead of restoring redundant exposition.
export function planDirectorEpisode(spec, options = {}) {
  const { problems, fixed, units, candidates, mandatory, dependencies } = validateInput(spec)
  if (problems.length) return { status: 'blocked', diagnostics: problems }
  const speechRate = options.speech_words_per_second ?? 2.3
  if (!pos(speechRate) || speechRate < 1.4 || speechRate > 2.8) {
    return { status: 'blocked', diagnostics: [issue('director_planner_speech_rate_invalid', 'options', 'Only bounded natural read estimates 1.4–2.8 words/s are accepted.')] }
  }
  const maxTicks = POLICY_MAX * 10
  const fixedTicks = fixed.opening + fixed.ending + fixed.audioTail
  const required = mandatory
  let states = [new Map([[keyFor({ ticks: fixedTicks, lastScene: null, delivered: new Set() }), {
    ticks: fixedTicks, lastScene: null, delivered: new Set(), score: 0, editCount: 0, selected: [],
  }]])]
  let everOverBudget = false
  for (let i = 0; i < units.length; i++) {
    if (!states[i]) continue
    for (const state of states[i].values()) {
      for (const take of candidates.get(units[i].source_unit_id) ?? []) {
        const skip = take.operation === 'cut'
        const estimate = skip ? { words: 0, speech_seconds: 0, seconds: 0 } : cost(take, speechRate)
        const transitionTicks = !skip && state.lastScene && state.lastScene !== take.scene_id ? fixed.transition : 0
        const ticks = state.ticks + tenth(estimate.seconds) + transitionTicks
        if (ticks > maxTicks) { everOverBudget = true; continue }
        const delivered = new Set(state.delivered)
        let causal = true
        for (const event of take.delivers) {
          if (dependencies.some(dep => dep.after === event && !delivered.has(dep.before))) causal = false
          delivered.add(event)
        }
        if (!causal) continue
        const next = {
          ticks, lastScene: skip ? state.lastScene : take.scene_id,
          delivered, score: state.score + take.quality_score,
          editCount: state.editCount + (take.operation === 'retain' ? 0 : 1),
          selected: [...state.selected, { take, estimate }],
        }
        const at = i + take.advance
        states[at] ??= new Map()
        const key = keyFor(next)
        const existing = states[at].get(key)
        if (better(next, existing)) states[at].set(key, next)
      }
    }
    if ((states[i + 1]?.size ?? 0) > MAX_SEARCH_STATES) {
      return { status: 'blocked', diagnostics: [issue('director_planner_search_limit', 'source_units', 'Too many combinations; reduce alternative takes rather than silently approximating.')] }
    }
  }
  const terminal = [...(states[units.length]?.values() ?? [])]
  const valid = terminal.filter(s => s.ticks >= POLICY_MIN * 10
    && [...required].every(e => s.delivered.has(e)))
  const sorted = valid.sort((a, b) => b.score - a.score
    || a.editCount - b.editCount || a.ticks - b.ticks
    || a.selected.map(x => x.take.take_id).join('|').localeCompare(b.selected.map(x => x.take.take_id).join('|')))
  if (!sorted.length) {
    let code = terminal.length ? 'director_planner_below_minimum_or_missing_beats' : 'director_planner_overload_or_causal_conflict'
    if (!terminal.length && !everOverBudget) code = 'director_planner_no_causal_selection'
    return { status: 'blocked', diagnostics: [issue(code, 'episode', 'No supported, naturally timed director selection preserves all required events within 60–120 seconds. Rewrite the alternatives; do not pad with empty shots or accelerate speech.')], candidate_count: terminal.length }
  }
  const best = sorted[0]
  const rawSeconds = fromTicks(units.reduce((ticks, unit, i) => ticks
    + tenth(cost({text:unit.source_text, timing:unit.raw_timing}, speechRate).seconds)
    + (i > 0 && units[i-1].scene_id !== unit.scene_id ? fixed.transition : 0), fixedTicks))
  const sourceIds = units.map(x => x.source_unit_id)
  const assembled = []
  const revised = []
  const cutUnits = []
  const selectedIds = []
  let cursor = 0
  const append = (kind, seconds, extra = {}) => {
    if (!seconds) return
    assembled.push({ kind, start_seconds: fromTicks(cursor), end_seconds: fromTicks(cursor + seconds), ...extra })
    cursor += seconds
  }
  append('opening', fixed.opening)
  let lastScene = null
  for (const {take, estimate} of best.selected) {
    selectedIds.push(take.take_id)
    if (take.operation === 'cut') {
      cutUnits.push({ source_unit_id: take.spans[0], reason: take.reason })
      continue
    }
    if (lastScene && lastScene !== take.scene_id) append('transition', fixed.transition, { between_scenes: [lastScene, take.scene_id] })
    const unitId = 'DU-' + String(revised.length + 1).padStart(3,'0')
    revised.push({
      unit_id: unitId, source_unit_ids: [...take.spans],
      operation: take.operation, text: take.text,
      ...(take.operation === 'retain' ? {} : { reason: take.reason }),
      scene_id: take.scene_id, delivered_event_ids: [...take.delivers],
      estimate: { ...estimate, status: 'heuristic_unverified' },
    })
    append('director_unit', tenth(estimate.seconds), { director_unit_id: unitId, scene_id: take.scene_id })
    lastScene = take.scene_id
  }
  append('ending', fixed.ending)
  append('audio_tail', fixed.audioTail)
  const total = fromTicks(cursor)
  // Fixed-point reconstruction is cross-checked, never quietly rounded into the
  // valid range.
  if (total < POLICY_MIN || total > POLICY_MAX || total !== fromTicks(best.ticks)) {
    return { status:'blocked', diagnostics:[issue('director_planner_internal_budget_mismatch','episode_timing','Planned time and emitted timeline differ.')] }
  }
  const slots = []
  for (let start = 0; start < cursor; start += VIDEO_MAX * 10) {
    const end = Math.min(start + VIDEO_MAX * 10, cursor)
    const covered = assembled.filter(a => a.kind === 'director_unit'
      && a.start_seconds < fromTicks(end) && a.end_seconds > fromTicks(start))
    slots.push({
      slot_id: 'SLOT-' + String(slots.length + 1).padStart(3,'0'),
      start_seconds: fromTicks(start), end_seconds: fromTicks(end),
      director_unit_ids: covered.map(x => x.director_unit_id),
      // An episode slot is not a model video: the director must author the cut,
      // shot continuity, assets, prompt and natural voice performance.
      status: 'planning_only', continuity_handoff_required: covered.some(a =>
        a.start_seconds < fromTicks(start) || a.end_seconds > fromTicks(end)),
    })
  }
  const revision = {
    revision_id: spec.director_revision_id,
    source_revision_id: spec.source_revision_id,
    status: 'draft',
    source_unit_ids: sourceIds,
    units: revised,
    cut_units: cutUnits,
    episode_direction: { ...spec.episode_direction },
    story_guards: Object.fromEntries(GUARD_FIELDS.map(x => [x, 'unverified'])),
  }
  return {
    status: 'draft', director_revision: revision,
    episode_timing: { status: 'heuristic_unverified', total_duration_seconds: total, timeline: assembled },
    selected_take_ids: selectedIds,
    video_slots: slots,
    score: best.score, edit_count: best.editCount, candidate_count: sorted.length,
    estimates: {
      source_raw_heuristic_seconds: rawSeconds,
      selected_heuristic_seconds: total,
      relative_change_seconds: fromTicks(tenth(total - rawSeconds)),
      speaking_rate_words_per_second: speechRate,
      method: 'word-count and explicit playable sequential/parallel/reaction budgets',
      measured_readthrough: false, animatic_verified: false, rendered_verified: false,
    },
    diagnostics: [],
  }
}
