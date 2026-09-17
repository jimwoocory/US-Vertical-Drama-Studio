# USVD V9 — Seedance 2.0 Mini Architecture

Status: active refactor branch
Parent tracking issue: #1
Target branch: `refactor/usvd-v9-seedance2-mini`
Target video model: **Seedance 2.0 Mini only**

## 1. Refactor principle

V9 keeps the existing USVD production workflow and rewrites the director-to-prompt pipeline. The core separation is:

`Story intent → Director plan → Model adapter → Prompt QA → Distribution`

The screenplay layer must not write final Seedance prompts. The storyboard layer must not guess model capabilities. The Seedance adapter must not rewrite story facts or invent unlocked assets.

## 2. Stage map

| Stage | Responsibility | May change story? | May write final Seedance prompt? |
|---|---|---:|---:|
| 01 Adaptation | US localization / premise adaptation | yes, before approval | no |
| 02 Story Architecture | Story Bible / season arc / episode beats | yes, before approval | no |
| 03 Screenwriter | approved beats → screenplay | within approved beat | no |
| 04 Script Doctor + Continuity | review, continuity ledger, blocking defects | no silent rewrite | no |
| 05 Asset Director / Lock | CHAR / LOOK / SET / PROP locks | no | no |
| 06 Storyboard Director | VIDEO/SHOT coverage, timing, visual narrative, continuity in/out | no | no |
| 07 Performance & Cinematography Director | blocking, eyeline, micro-performance, composition, camera, lens feel, focus, light, cut motivation | no | no |
| 08 Seedance 2.0 Mini Prompt Adapter | translate approved director package into executable model prompt | no | yes |
| 09 Prompt QA | detect conflicts, overload, unsupported instructions, drift, timing defects | no | may request adapter revision |

## 3. VIDEO / SHOT contract

- `VIDEO-*` remains one independently generatable production unit.
- `SHOT-*` remains a micro-shot inside its parent VIDEO.
- SHOT ranges must be contiguous, non-overlapping and fully cover the parent VIDEO duration.
- SHOT is a directing/timing unit first; it is not automatically a separate model generation call.
- The final model-facing prompt belongs to Stage 08.

## 4. Stage 06 output contract

Each VIDEO must provide:

- source scene / beat coverage
- dramatic objective
- start state / end state
- approved asset IDs
- duration
- ordered SHOT list
- continuity in / out
- dialogue and audio plan

Each SHOT must provide:

- time in / time out
- narrative purpose
- composition / shot size
- character blocking and action
- eyeline / screen direction
- performance beat
- camera intent
- continuity delta

Stage 06 must not output the final Seedance master prompt.

## 5. Stage 07 output contract

Stage 07 enriches the approved SHOT plan with only production-direction details:

- blocking
- eyeline
- gesture
- micro-expression
- performance transition
- camera height / angle
- lens feeling
- movement motivation
- focus behavior
- lighting motivation
- cut motivation

Every addition must have a narrative or continuity reason. Decorative camera motion is rejected.

## 6. Stage 08 Seedance 2.0 Mini adapter

Inputs:

1. approved VIDEO/SHOT plan
2. locked CHAR / LOOK / SET / PROP assets
3. continuity ledger
4. dialogue/audio plan
5. verified current endpoint capability profile

Outputs per VIDEO:

- `video_master_prompt`
- `video_negative_prompt`
- ordered time sequence
- reference bindings
- unsupported/external execution notes

Outputs per SHOT:

- `shot_delta_prompt`
- local exclusions
- continuity state delta

Rules:

- Chinese production prompt by default; approved English names/dialogue remain English.
- Prefer concrete observable actions over adjectives.
- Do not add generic quality tokens such as `8K`, `masterpiece`, or repeated `cinematic` unless a verified production need exists.
- Do not claim audio, lip-sync, seed, first/last-frame, or reference features unless the active Seedance 2.0 Mini endpoint profile confirms them.
- If prompt complexity exceeds the adapter budget, simplify camera/performance instructions before deleting story-critical action or continuity constraints.

## 7. Stage 09 Prompt QA

QA checks:

- story/source coverage
- VIDEO/SHOT timing closure
- asset identity and LOOK consistency
- screen direction / eyeline / blocking continuity
- contradictory camera instructions
- simultaneous impossible actions
- redundant adjective stacks
- unsupported endpoint capabilities
- dialogue duration feasibility
- prompt overload / instruction priority ambiguity
- continuity-in / continuity-out consistency

QA must return defects mapped to stable IDs (`VIDEO-*`, `SHOT-*`, asset IDs), not generic prose only.

## 8. Canonical-source direction

V9 will move toward one canonical Core source. ChatGPT/Codex, DSH, Tabbit and MediaGo distributions must be generated or synchronized from Core rather than hand-edited independently.

Legacy folders remain for traceability until the new build path passes regression tests.

## 9. Golden regression rule

At least two existing poor-result cases must be preserved as Golden Cases.

For each case compare:

- identical screenplay
- identical approved assets
- identical Seedance 2.0 Mini endpoint/settings
- current V8/V2 prompt package
- V9 prompt package

The comparison record must identify which rule change caused each material improvement or regression.

## 10. Merge gate

Do not merge V9 into `main` until:

1. Stage 06/07/08/09 contracts are implemented.
2. Existing plugin/install paths still enumerate skills correctly.
3. Two Golden Cases complete review.
4. V9 materially improves prompt clarity/executability without breaking continuity.
5. Distribution generation/synchronization no longer requires manual prompt edits in multiple platform folders.
