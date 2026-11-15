import { readFileSync } from 'node:fs'
import { analyzeArtifactFreshness, productionInputDigest, WORKBENCH_V2 } from './v11-artifact-freshness.mjs'

export const PRODUCTION_POLICY = JSON.parse(readFileSync(new URL('../core/usvd-v9/contracts/production-policy-v2.json', import.meta.url), 'utf8'))
export const isProductionV2 = pkg => pkg?.schema_version === WORKBENCH_V2

export function validateProductionEnvelope(pkg) {
  const errors = []
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v)
  const strings = v => Array.isArray(v) && v.every(s => typeof s === 'string' && s.trim())
  for (const key of ['episode_id', 'endpoint_revision']) if (typeof pkg?.[key] !== 'string' || !pkg[key].trim()) errors.push(key)
  for (const key of ['assets', 'videos', 'shots', 'director_shots', 'reference_bindings']) {
    if (!Array.isArray(pkg?.[key]) || pkg[key].some(v => !object(v))) errors.push(key)
  }
  for (const key of ['approved_asset_ids', 'required_source_refs']) if (!strings(pkg?.[key]) || !pkg[key].length) errors.push(key)
  for (const [key, ids] of [['assets', 'id'], ['videos', 'video_id'], ['shots', 'shot_id'], ['director_shots', 'shot_id'], ['reference_bindings', 'binding_id']]) {
    if (!Array.isArray(pkg?.[key])) continue
    const seen = new Set()
    for (const row of pkg[key]) {
      if (!object(row) || typeof row[ids] !== 'string' || !row[ids].trim() || seen.has(row[ids])) errors.push(`${key}.${ids}`)
      seen.add(row?.[ids])
      if (['videos', 'shots'].includes(key) && !strings(row?.asset_ids)) errors.push(`${key}.asset_ids`)
      for (const field of ['shot_events', 'dialogue', 'dialogue_items', 'simultaneous_actions', 'event_execution_coverage', 'external_execution_notes']) if (row?.[field] !== undefined && (!Array.isArray(row[field]) || row[field].some(v => !object(v)))) errors.push(`${key}.${field}`)
      if (key === 'assets' && row?.reference_asset_ids !== undefined && !strings(row.reference_asset_ids)) errors.push('assets.reference_asset_ids')
    }
  }
  for (const key of ['voice_assets', 'subtitles', 'source_units', 'dialogue_items']) if (pkg?.[key] !== undefined && (!Array.isArray(pkg[key]) || pkg[key].some(v => !object(v)))) errors.push(key)
  if (pkg?.director_revision?.units !== undefined && (!Array.isArray(pkg.director_revision.units) || pkg.director_revision.units.some(u => !object(u)))) errors.push('director_revision.units')
  return [...new Set(errors)]
}

export function classifyProductionDefect(item) {
  const rule = PRODUCTION_POLICY.rules[item.rule ?? item.code]
  if (!rule) return { ...item, severity: 'blocker', rule_tier: 'structural_invariant', gate_effect: 'block', policy_error: 'unknown_rule' }
  return { ...item, ...rule, severity: rule.gate_effect === 'warn' || rule.gate_effect === 'none' ? 'minor' : item.severity ?? 'blocker' }
}

/** The host supplies verification, never a package's self-declared trusted flag. */
export function assessProductionEvidence(pkg, { verifyReview } = {}) {
  const freshness = analyzeArtifactFreshness(pkg)
  const receipt = pkg.review_receipt
  let review_gate = 'PENDING'
  let verified = false
  if (freshness.input_digest && receipt?.input_digest === freshness.input_digest && receipt.policy_version === PRODUCTION_POLICY.version && typeof receipt.run_id === 'string' && receipt.run_id && typeof receipt.author_id === 'string' && receipt.author_id && typeof receipt.reviewer_id === 'string' && receipt.reviewer_id && receipt.reviewer_id !== receipt.author_id && Array.isArray(receipt.evidence) && receipt.evidence.length && Array.isArray(receipt.rule_ids) && PRODUCTION_POLICY.reviewed_rules.every(id => receipt.rule_ids.includes(id))) {
    try { verified = typeof verifyReview === 'function' && verifyReview(structuredClone(receipt), freshness.input_digest) === true } catch { verified = false }
    if (verified) review_gate = ['PASS', 'NEEDS_REVISION', 'BLOCKED'].includes(receipt.status) ? receipt.status : 'PENDING'
  }
  return { review_gate, review_verified: verified, freshness, input_digest: freshness.input_digest }
}

export function currentProductionDigest(pkg) { return productionInputDigest(pkg) }
