/** Pure dependency analysis. Never deletes artifacts or submits generation jobs. */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { directorProductionSources } from './v11-autonomous-director.mjs'
import { voiceTimingDependencies } from './v11-voice-timing-local.mjs'

export const WORKBENCH_V2 = 'us-vertical-drama-workbench/v2'
export const DEPENDENCY_SCHEMA = 'usvds-artifact-dependencies/v2'
const registry = JSON.parse(readFileSync(new URL('../core/usvd-v9/contracts/production-policy-v2.json', import.meta.url), 'utf8'))
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().filter(k => value[k] !== undefined).map(k => [k, canonical(value[k])]))
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('non_finite_fingerprint_value')
  return value
}
export const artifactDigest = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')
const pick = (v, keys) => Object.fromEntries(keys.filter(k => v?.[k] !== undefined).map(k => [k, v[k]]))
const hashPattern = /^[a-f0-9]{64}$/

/** Media location is resolved independently; filenames/mtime never identify content. */
export function referenceContent(binding) {
  return pick(binding, ['binding_id', 'asset_id', 'asset_version_id', 'sha256', 'video_id', 'shot_ids', 'purpose', 'controls', 'must_not_control', 'input_slot', 'order', 'status', 'crop'])
}

export function buildArtifactGraph(pkg) {
  const nodes = []
  const add = (id, kind, payload, depends_on = []) => nodes.push({ id, kind, payload, depends_on: [...new Set(depends_on)] })
  const assets = pkg.assets ?? []
  const shots = pkg.shots ?? []
  const bindings = pkg.reference_bindings ?? []
  const director = directorProductionSources(pkg)
  const voiceEvidence = voiceTimingDependencies(pkg)
  const directions = new Map((pkg.director_shots ?? []).map(s => [s.shot_id, s]))
  add('project', 'policy', { ...pick(pkg, ['schema_version', 'episode_id', 'target_model', 'capability_profile', 'reference_profile', 'duration_policy', 'aspect_ratio', 'prompt_language', 'required_source_refs', 'approved_asset_ids', 'policy_version', 'endpoint_revision']), brief_duration_policy: pkg.project_brief?.duration_policy, registry_digest: artifactDigest(registry) })
  add('story', 'source', { ...pick(pkg, ['source_revision_id', 'story_bible_constraints', 'continuity_ledger']), revision: pick(pkg.director_revision, ['revision_id', 'source_revision_id', 'status', 'source_unit_ids', 'story_guards', 'episode_direction', 'cut_units']) })
  const sourceUnits = new Map((pkg.source_units ?? []).map(u => [u.source_unit_id, u]))
  for (const id of new Set([...(pkg.director_revision?.source_unit_ids ?? []), ...sourceUnits.keys()])) add(`source:${id}`, 'source', sourceUnits.get(id) ?? { source_unit_id: id, source_revision_id: pkg.director_revision?.source_revision_id }, ['story'])
  for (const u of director.units) add(`unit:${u.unit_id}`, 'source', u, ['story', ...(u.source_unit_ids ?? []).map(id => `source:${id}`)])
  for (const a of assets) add(`asset:${a.id}`, 'asset', pick(a, ['id', 'kind', 'status', 'asset_version_id', 'sha256', 'image_prompt', 'prompt', 'negative_prompt', 'aspect_ratio', 'reference_asset_ids', 'state']), (a.reference_asset_ids ?? []).map(id => `asset:${id}`))
  for (const b of bindings) add(`ref:${b.binding_id}`, 'reference', referenceContent(b), [`asset:${b.asset_id}`])
  let priorState = null
  for (const s of shots) {
    const d = directions.get(s.shot_id)
    const stateId = `state:${s.shot_id}`
    // Conservative state propagation across cuts. No unchecked reset flag can truncate it.
    add(stateId, 'continuity', { shot: pick(s, ['continuity_in', 'continuity_out', 'continuity_delta', 'source_scene_id']), direction: pick(d, ['continuity_in', 'continuity_out', 'approved_transition']) }, ['story', ...(priorState ? [priorState] : [])])
    priorState = stateId
    const refs = bindings.filter(b => b.video_id === s.video_id && (!b.shot_ids?.length || b.shot_ids.includes(s.shot_id)))
    add(`shot:${s.shot_id}`, 'shot', { shot: { ...pick(s, ['shot_id', 'video_id', 'source_scene_id', 'source_scene_refs', 'source_unit_ids', 'director_revision_id', 'director_unit_id', 'duration_seconds', 'asset_ids', 'asset_lock_prompt', 'shot_delta_prompt', 'negative_prompt', 'local_exclusions', 'shot_events', 'dialogue', 'inner_voice', 'camera_intent']), time_in: s.time_in ?? s.timeline_in_seconds, time_out: s.time_out ?? s.timeline_out_seconds }, direction: pick(d, ['blocking', 'eyeline', 'gesture', 'micro_expression', 'performance_transition', 'narrative_purpose', 'shot_size_composition', 'camera_height_angle', 'camera_movement', 'movement_motivation', 'focus_behavior', 'lighting_motivation', 'cut_motivation', 'dialogue_items']) }, ['project', 'story', stateId, ...(s.director_unit_id ? [`unit:${s.director_unit_id}`] : []), ...(s.source_unit_ids ?? []).map(id => `source:${id}`), ...(s.asset_ids ?? []).map(id => `asset:${id}`), ...refs.map(b => `ref:${b.binding_id}`)])
    add(`audio:${s.shot_id}`, 'audio', { events: s.shot_events, dialogue: s.dialogue, inner_voice: s.inner_voice, voice_assets: voiceEvidence.filter(a => a.shot_id === s.shot_id) }, ['story', `shot:${s.shot_id}`])
    add(`subtitle:${s.shot_id}`, 'subtitle', (pkg.subtitles ?? []).filter(a => a.shot_id === s.shot_id), [`audio:${s.shot_id}`])
  }
  for (let i = 1; i < shots.length; i++) add(`cut:${shots[i-1].shot_id}:${shots[i].shot_id}`, 'review', {}, [`shot:${shots[i-1].shot_id}`, `shot:${shots[i].shot_id}`])
  for (const v of pkg.videos ?? []) {
    const children = shots.filter(s => s.video_id === v.video_id)
    add(`video:${v.video_id}`, 'video', pick(v, ['video_id', 'video_prompt_id', 'prompt_id', 'video_master_prompt', 'video_negative_prompt', 'duration_seconds', 'aspect_ratio', 'source_scene_id', 'source_scene_refs', 'asset_ids', 'execution_features', 'event_execution_coverage', 'external_execution_notes', 'director_revision_id', 'director_unit_ids', 'parameters']), ['project', ...children.map(s => `shot:${s.shot_id}`), ...bindings.filter(b => b.video_id === v.video_id).map(b => `ref:${b.binding_id}`)])
    add(`result:${v.video_id}`, 'result', { generation_unit: 'VIDEO' }, [`video:${v.video_id}`])
  }
  add('dialogue', 'audio', pkg.dialogue_items ?? [], ['story'])
  add('episode_timing', 'timing', { timing: pkg.episode_timing, voice_timing: pkg.voice_timing_evidence, upstream_production_gate: pkg.production_gate }, ['dialogue', ...shots.flatMap(s => [`shot:${s.shot_id}`, `audio:${s.shot_id}`])])
  add('package_review', 'review', {}, nodes.map(n => n.id))
  return { schema_version: DEPENDENCY_SCHEMA, nodes }
}

export function fingerprintGraph(graph) {
  if (graph?.schema_version !== DEPENDENCY_SCHEMA || !Array.isArray(graph.nodes)) throw new Error('invalid_dependency_graph')
  const byId = new Map()
  for (const n of graph.nodes) {
    if (!n?.id || !n.kind || !Array.isArray(n.depends_on) || !Object.hasOwn(n, 'payload') || byId.has(n.id)) throw new Error('invalid_or_duplicate_dependency_node')
    byId.set(n.id, n)
  }
  const fingerprints = Object.create(null); const active = new Set()
  function visit(id) {
    if (Object.hasOwn(fingerprints, id)) return fingerprints[id]
    if (active.has(id)) throw new Error(`dependency_cycle:${id}`)
    const n = byId.get(id)
    if (!n) throw new Error(`missing_dependency:${id}`)
    active.add(id)
    const dependencies = [...n.depends_on].sort().map(d => [d, visit(d)])
    fingerprints[id] = artifactDigest({ kind: n.kind, payload: n.payload, dependencies })
    active.delete(id)
    return fingerprints[id]
  }
  for (const id of byId.keys()) visit(id)
  return Object.fromEntries(Object.entries(fingerprints))
}

export function captureArtifactSnapshot(pkg) {
  return { schema_version: DEPENDENCY_SCHEMA, fingerprints: fingerprintGraph(buildArtifactGraph(pkg)) }
}

export function analyzeArtifactFreshness(pkg, snapshot = pkg.artifact_snapshot) {
  try {
    const graph = buildArtifactGraph(pkg)
    const current = fingerprintGraph(graph)
    const old = snapshot?.schema_version === DEPENDENCY_SCHEMA ? snapshot.fingerprints : null
    const validOld = old && typeof old === 'object' && !Array.isArray(old) && Object.values(old).every(v => typeof v === 'string' && hashPattern.test(v))
    const artifacts = graph.nodes.map(n => ({ id: n.id, kind: n.kind, freshness: !validOld || !Object.hasOwn(old, n.id) ? 'unknown' : old[n.id] === current[n.id] ? 'current' : 'stale', fingerprint: current[n.id], causes: n.depends_on.filter(id => !validOld || old[id] !== current[id]), recommended_action: n.kind === 'result' ? 'regenerate_or_verified_reedit' : n.kind === 'review' ? 'review' : 'revalidate_or_recompile' }))
    // A new compilation snapshot must never bless an old generated result.
    for (const video of pkg.videos ?? []) {
      const item = artifacts.find(a => a.id === `result:${video.video_id}`)
      if (!item) continue
      item.availability = video.media_mcp?.job_id ? 'submitted' : 'not_generated'
      if (video.media_mcp?.job_id) {
        const recorded = video.media_mcp.dependency_fingerprint
        if (!recorded || !hashPattern.test(recorded)) item.freshness = 'unknown'
        else if (recorded !== current[`video:${video.video_id}`]) { item.freshness = 'stale'; item.causes = ['submitted_result_dependency_changed'] }
      }
    }
    for (const item of artifacts) if (item.freshness !== 'current' && !item.causes.length) item.causes = [item.freshness === 'unknown' ? 'snapshot_missing' : 'own_content_or_contract_changed']
    const removed = validOld ? Object.keys(old).filter(id => !Object.hasOwn(current, id)) : []
    const freshness = !validOld || artifacts.some(a => a.freshness === 'unknown') ? 'unknown' : removed.length || artifacts.some(a => a.freshness === 'stale') ? 'stale' : 'current'
    const inputs = artifacts.filter(a => a.kind !== 'result')
    const input_freshness = !validOld || inputs.some(a => a.freshness === 'unknown') ? 'unknown' : removed.length || inputs.some(a => a.freshness === 'stale') ? 'stale' : 'current'
    return { freshness, input_freshness, artifacts, removed, errors: [], input_digest: artifactDigest(current) }
  } catch (error) {
    return { freshness: 'unknown', artifacts: [], removed: [], errors: [error.message], input_digest: null }
  }
}

export function productionInputDigest(pkg) { return artifactDigest(fingerprintGraph(buildArtifactGraph(pkg))) }
