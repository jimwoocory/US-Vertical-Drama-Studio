import { validateTimingClosure } from './v9-director-validation.mjs'
import { validateAdapterPackage } from './v9-seedance-adapter-validation.mjs'

export const DIALOGUE_MAX_WORDS_PER_SECOND = 3.0

const CONTINUITY_FIELDS = [
  'screen_direction',
  'eyeline_target',
  'character_position',
  'prop_state',
  'look_state',
  'set_state',
  'time_weather_state',
]

const ADAPTER_BLOCKERS = new Set([
  'wrong_target_model',
  'invalid_or_missing_capability',
  'unsupported_native_capability_claim',
  'missing_parent_video',
  'missing_traceability_field',
  'missing_prompt_field',
])

export function runPromptQA(pkg) {
  const raw = []
  raw.push(...checkRequiredEvidence(pkg))
  raw.push(...mapTimingDiagnostics(validateTimingClosure(pkg)))
  raw.push(...mapAdapterDiagnostics(validateAdapterPackage(pkg)))
  raw.push(...checkSourceCoverage(pkg))
  raw.push(...checkAssetIntegrity(pkg))
  raw.push(...checkDirectorEvidence(pkg))
  raw.push(...checkDialogueDuration(pkg))
  raw.push(...checkUnapprovedStoryFacts(pkg))

  const defects = assignStableDefectIds(raw)
  const blockers = defects.filter(item => item.severity === 'blocker').length
  const majors = defects.filter(item => item.severity === 'major').length
  const minors = defects.filter(item => item.severity === 'minor').length
  const gate = blockers > 0 ? 'BLOCKED' : majors > 0 ? 'REVISE' : 'PASS'

  return {
    gate,
    summary: { blocker: blockers, major: majors, minor: minors, total: defects.length },
    defects,
  }
}

function checkRequiredEvidence(pkg) {
  const diagnostics = []
  if (!Array.isArray(pkg?.required_source_refs) || pkg.required_source_refs.length === 0) {
    diagnostics.push(defect('blocker', 'PACKAGE', 'missing_required_source_refs', 'required_source_refs is missing or empty', 'Provide the approved source coverage list.', 'upstream'))
  }
  if (!Array.isArray(pkg?.approved_asset_ids) || pkg.approved_asset_ids.length === 0) {
    diagnostics.push(defect('blocker', 'PACKAGE', 'missing_approved_asset_ids', 'approved_asset_ids is missing or empty', 'Provide the approved Asset Ledger IDs.', 'upstream'))
  }
  if (!Array.isArray(pkg?.director_shots) || pkg.director_shots.length === 0) {
    diagnostics.push(defect('blocker', 'PACKAGE', 'missing_stage07_director_evidence', 'director_shots is missing or empty', 'Provide the Stage 07 shot-direction package.', '07'))
  }
  return diagnostics
}

function mapTimingDiagnostics(items) {
  return items.map(item => defect(
    'blocker',
    item.ref ?? 'PACKAGE',
    `timing_${item.code}`,
    JSON.stringify(item),
    'Repair VIDEO/SHOT timing closure in Stage 06.',
    '06',
  ))
}

function mapAdapterDiagnostics(items) {
  return items.map(item => {
    const severity = ADAPTER_BLOCKERS.has(item.code) ? 'blocker' : 'major'
    return defect(
      severity,
      item.ref ?? item.video_id ?? 'PACKAGE',
      `adapter_${item.code}`,
      JSON.stringify(item),
      'Repair the Seedance 2.0 Mini adapter package without changing approved story/directing.',
      '08',
    )
  })
}

function checkSourceCoverage(pkg) {
  if (!Array.isArray(pkg?.required_source_refs)) return []
  const covered = new Set()
  for (const video of pkg?.videos ?? []) {
    for (const ref of video?.source_scene_refs ?? []) covered.add(ref)
  }
  const diagnostics = []
  for (const ref of pkg.required_source_refs) {
    if (!covered.has(ref)) {
      diagnostics.push(defect('major', ref, 'source_coverage_missing', `Approved source ref ${ref} is not covered by any VIDEO.`, 'Restore the missing source coverage without inventing new story.', '06'))
    }
  }
  return diagnostics
}

function checkAssetIntegrity(pkg) {
  if (!Array.isArray(pkg?.approved_asset_ids)) return []
  const approved = new Set(pkg.approved_asset_ids)
  const diagnostics = []
  const items = [...(pkg?.videos ?? []), ...(pkg?.shots ?? [])]
  for (const item of items) {
    const ref = item.shot_id ?? item.video_id ?? 'PACKAGE'
    for (const assetId of item?.asset_ids ?? []) {
      if (!approved.has(assetId)) {
        diagnostics.push(defect('blocker', ref, 'unapproved_asset_reference', `${assetId} is not present in approved_asset_ids.`, `Remove ${assetId} or approve it upstream; do not invent assets in prompts.`, 'upstream'))
      }
    }
  }
  for (const binding of pkg?.reference_bindings ?? []) {
    if (binding?.asset_id && !approved.has(binding.asset_id)) {
      diagnostics.push(defect('blocker', binding.asset_id, 'unapproved_reference_binding', `${binding.asset_id} has a reference binding but is not approved.`, 'Repair Asset Ledger/reference binding.', 'upstream'))
    }
  }
  return diagnostics
}

function checkDirectorEvidence(pkg) {
  if (!Array.isArray(pkg?.director_shots)) return []
  const diagnostics = []
  const byVideo = new Map()
  const stage08ShotIds = new Set((pkg?.shots ?? []).map(shot => shot.shot_id).filter(Boolean))
  const directorShotIds = new Set(pkg.director_shots.map(shot => shot.shot_id).filter(Boolean))
  for (const shotId of stage08ShotIds) {
    if (!directorShotIds.has(shotId)) {
      diagnostics.push(defect('major', shotId, 'missing_stage07_shot_direction', `No Stage 07 director evidence exists for ${shotId}.`, 'Create the missing Stage 07 performance/cinematography package before QA.', '07'))
    }
  }
  for (const shot of pkg.director_shots) {
    const list = byVideo.get(shot.video_id) ?? []
    list.push(shot)
    byVideo.set(shot.video_id, list)

    const requiredDirectionFields = ['narrative_purpose', 'performance_transition', 'shot_size_composition', 'cut_motivation']
    for (const field of requiredDirectionFields) {
      if (!String(shot?.[field] ?? '').trim()) {
        diagnostics.push(defect('major', shot.shot_id, `missing_director_field_${field}`, `${field} is missing for ${shot.shot_id}.`, `Return to Stage 07 and define ${field} from the shot's narrative purpose.`, '07'))
      }
    }

    const movement = String(shot.camera_movement ?? '')
    const movementLower = movement.toLowerCase()
    const staticRequested = /\b(static|locked)\b/u.test(movementLower) || /定机|锁定/u.test(movement)
    const motionRequested = /\b(push|pull|pan|tilt|dolly|orbit|zoom|handheld|track)\b/u.test(movementLower) || /推近|拉远|摇摄|横移|跟拍|环绕|变焦|手持/u.test(movement)
    if (staticRequested && motionRequested) {
      diagnostics.push(defect('major', shot.shot_id, 'camera_directive_contradiction', `camera_movement contains incompatible static and moving directives: ${movement}`, 'Return to Stage 07 and choose one motivated camera behavior.', '07'))
    }
    if (motionRequested && !String(shot.movement_motivation ?? '').trim()) {
      diagnostics.push(defect('major', shot.shot_id, 'camera_movement_without_motivation', `Movement is present without movement_motivation: ${movement}`, 'Add a narrative/continuity motivation or use a locked camera.', '07'))
    }
    for (const action of shot?.simultaneous_actions ?? []) {
      if (action?.mutually_exclusive === true) {
        diagnostics.push(defect('major', shot.shot_id, 'impossible_simultaneous_actions', JSON.stringify(action), 'Sequence or redesign the mutually exclusive actions in Stage 07.', '07'))
      }
    }
  }

  for (const [videoId, shots] of byVideo.entries()) {
    const ordered = shots.toSorted((a, b) => Number(a.time_in) - Number(b.time_in))
    for (let index = 0; index < ordered.length - 1; index += 1) {
      const current = ordered[index]
      const next = ordered[index + 1]
      const allowed = new Set(next?.approved_transition ?? [])
      for (const field of CONTINUITY_FIELDS) {
        const outValue = current?.continuity_out?.[field]
        const inValue = next?.continuity_in?.[field]
        if (outValue === undefined || inValue === undefined || allowed.has(field)) continue
        if (!deepEqual(outValue, inValue)) {
          diagnostics.push(defect(
            'major',
            next.shot_id ?? videoId,
            `continuity_${field}_mismatch`,
            `${current.shot_id}.${field}=${JSON.stringify(outValue)} but ${next.shot_id}.${field}=${JSON.stringify(inValue)}`,
            'Repair the Stage 06/07 handoff or document an approved visible transition.',
            '07',
          ))
        }
      }
    }
  }
  return diagnostics
}

function checkDialogueDuration(pkg) {
  const diagnostics = []
  const items = [
    ...(pkg?.dialogue_items ?? []),
    ...((pkg?.director_shots ?? []).flatMap(shot => (shot?.dialogue_items ?? []).map(item => ({ ...item, shot_id: item.shot_id ?? shot.shot_id })))),
  ]
  for (const item of items) {
    if (!String(item?.text ?? '').trim()) continue
    const start = Number(item.start_seconds)
    const end = Number(item.end_seconds)
    const duration = end - start
    if (!Number.isFinite(duration) || duration <= 0) {
      diagnostics.push(defect('major', item.shot_id ?? 'DIALOGUE', 'dialogue_invalid_time_range', JSON.stringify(item), 'Provide a valid dialogue in/out range.', '06'))
      continue
    }
    const words = countEnglishWords(item.text)
    const rate = words / duration
    if (rate > DIALOGUE_MAX_WORDS_PER_SECOND) {
      diagnostics.push(defect(
        'major',
        item.shot_id ?? 'DIALOGUE',
        'dialogue_too_dense_for_planned_time',
        `${words} words in ${duration.toFixed(2)}s = ${rate.toFixed(2)} words/s; internal QA threshold is ${DIALOGUE_MAX_WORDS_PER_SECOND}.`,
        'Adjust timing, approved dialogue upstream, or external audio plan; QA must not silently rewrite the line.',
        '06',
      ))
    }
  }
  return diagnostics
}

function checkUnapprovedStoryFacts(pkg) {
  const diagnostics = []
  for (const fact of pkg?.unapproved_story_facts ?? []) {
    diagnostics.push(defect('blocker', fact?.stable_ref ?? 'PACKAGE', 'unapproved_story_fact', fact?.evidence ?? JSON.stringify(fact), 'Remove the invented fact or approve it in the owning upstream story stage.', 'upstream'))
  }
  return diagnostics
}

function defect(severity, stableRef, rule, evidence, requestedAction, returnToStage) {
  return { severity, stable_ref: String(stableRef), rule, evidence, requested_action: requestedAction, return_to_stage: returnToStage }
}

function assignStableDefectIds(items) {
  const seen = new Map()
  return items.map(item => {
    const base = `QA-${slug(item.stable_ref)}-${slug(item.rule)}`
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)
    return { defect_id: count === 1 ? base : `${base}-${count}`, ...item }
  })
}

function slug(value) {
  const normalized = String(value).toUpperCase().replace(/[^A-Z0-9]+/gu, '-').replace(/^-|-$/gu, '')
  return normalized || 'PACKAGE'
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function countEnglishWords(text) {
  return String(text).trim().match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/gu)?.length ?? 0
}
