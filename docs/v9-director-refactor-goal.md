# /goal — USVD V9 Director Skill Refactor

## Goal

Refactor the current V9 director pipeline so that **V8 director capability becomes the governing directing baseline**, while preserving the V9 production architecture, Asset Lock, VIDEO/SHOT model, Production Workbench, Seedance 2.0 Mini adapter, Prompt QA, and distribution pipeline.

The target is **not** to copy the V8 prompt into V9. The target is:

> V8 director capability + V9 structured production system.

Use the uploaded/repository V8 baseline as the source of directing rules and the current V9 preview package/repository as the implementation baseline.

## Current baseline

- Repository: `jimwoocory/US-Vertical-Drama-Studio`
- Branch: `refactor/usvd-v9-seedance2-mini`
- Current released preview package baseline: `@jimwoocory/dsh-us-vertical-drama-studio@0.3.0-v9-preview.1`
- Current V9 Core: `0.9.0-preview.1`
- V8 baseline: `core/usvd-v9/references/v8-director-baseline.md`
- V8→V9 mapping: `core/usvd-v9/references/v8-v9-director-mapping.md`

Before modifying code, inspect the actual branch, package source, validators, tests, generated distribution rules, and current git status. Actual source/test behavior wins over assumptions in this document.

## Architecture boundary

Do not collapse the V9 stages.

- Stage 05 owns full asset prompts and Asset Lock.
- Stage 06 owns story-faithful VIDEO/SHOT decomposition, timing, source coverage, audio facts, rough camera intent, and continuity.
- Stage 07 owns acting, blocking, shot size/composition, camera execution, focus/depth, lighting, cut logic, optional VFX execution, and director rhythm.
- Stage 08 remains a Seedance 2.0 Mini adapter only. It translates/compresses approved direction; it must not invent or redesign direction.
- Stage 09 owns deterministic QA + human-review gate and routes defects back to the owning stage.

## Required V8 capabilities to restore

### Stage 06 — Storyboard director hard rules

Implement/strengthen:

1. Plot/dialogue hard lock. No added events, relationships, powers, conflict results, or worldbuilding.
2. VIDEO duration is the sum of SHOT durations. `<=15s` is a ceiling, never a padding target.
3. Long-dialogue policy:
   - 2.5s is a rhythm review line, not a mechanical cut point.
   - >3.0s requires an explicit sustained narrative/performance reason or a split review.
   - >3.6s must split unless an explicit justified long-take exception exists.
   - >4.2s must split or continue into a new VIDEO unless the user explicitly requires a one-take and the shot has sustained internal change.
   - Never split inside a word/semantic fragment; preserve exact approved dialogue and speaker ownership.
4. Dialogue continuation states must remain explicit across SHOT and VIDEO boundaries.
5. Shot merge rule: adjacent shots with the same function/angle/information/emotional role should merge unless there is a new action, new information, reaction, focus shift, relationship change, action phase change, or spatial change.
6. Every SHOT has one dominant visual/narrative job.
7. Spatial continuity: position, direction, eyeline, prop ownership/state, damage, weather, effects, and light state carry forward.
8. Complex action uses micro-beats with start/process/result/after-effect.
9. Full character/set/prop descriptions remain in Asset Lock; SHOT carries IDs plus only visible/continuity-critical state.

### Stage 07 — Performance & cinematography director hard rules

Restore/strengthen:

1. Shot-group grammar is conditional, not a template. No mechanical speaker/listener/insert/reaction cutting.
2. Focus change must equal information change.
3. Depth of field is narrative: mouth/eyes/action/hero prop/spatial anchors must remain readable.
4. Action, chase, multi-character blocking and large spatial scenes must not use excessive shallow depth of field that destroys geography.
5. Camera movement must be motivated by action, gaze, emotion, information, space, or rhythm and must end on a readable handoff point.
6. Stable camera is a valid default; movement is never required for “cinematic” quality.
7. Advanced movement library is opt-in. Mark high-impact movements explicitly so QA can count them.
8. Per VIDEO, default maximum advanced-movement emphasis is 2.
9. Commercial-blockbuster emphasis defaults to max 1 per VIDEO; explicit full-segment high-energy direction may allow 2, one primary + one secondary, never stacked continuously.
10. Cross-VIDEO opening shot-size continuity for the same continuing subject:
    - previous last shot not close/local close → next first shot close/local close;
    - previous last shot close/local close → next first shot medium;
    - disabled when subject/scene/time/space/narrative target changes.
11. Lighting must declare source, direction, subject visibility, dark-side layering, separation, information target, and dramatic intention where relevant.
12. Emotion must be converted into observable performance/composition/light/sound changes, not adjective-only direction.
13. Optional VFX must be caused by story/action/prop/environment state, preserve visibility of key information, and carry residual state forward.
14. VFX intensity L1–L4 is optional and story-triggered only; no generic escalation.

### Stage 08 — Seedance 2.0 Mini adapter

Keep its current ownership. Add only safeguards:

1. Do not compress away story-critical action, dialogue timing, continuity direction, motivated camera/cut, focus readability, lighting information target, or required VFX causality.
2. VIDEO master remains the complete submission prompt; SHOT delta remains local-only.
3. Capability truth remains endpoint-profile-driven.
4. Model-facing prompt fields stay English except approved spoken dialogue/proper nouns/asset IDs.
5. No V8 rule should be reinterpreted as a Seedance capability claim.

### Stage 09 — Prompt QA

Convert V8 self-checks into machine checks where deterministic and human checks where semantic.

At minimum add QA coverage for:

- V8 long-shot/long-dialogue thresholds and explicit exceptions.
- Consecutive long-shot rhythm warnings.
- Mergeable adjacent-shot warning.
- Cross-VIDEO same-subject opening shot-size rule.
- Missing focus/depth readability direction.
- Missing lighting source/information target when the shot declares a lighting change.
- Advanced-movement count and commercial-emphasis count.
- Unmotivated VFX / VFX intensity without source cause.
- Repeated no-information slow push / stare / hold rhythm.
- No “same as above / previous” omissions in independently executable output.
- No invented BGM/subtitles/UI/extra characters/props/events.
- Existing timing, asset, continuity, prompt-language, capability, overload, and event-resolution checks must remain.

Do not turn semantic judgement into brittle keyword checks if it cannot be made reliable; route those items to the human-review checklist.

## Mapping/conflict rules

Where V8 and V9 differ:

- V8 visual-asset stream maps to Stage 05 Asset Lock; do not reintroduce full asset descriptions into Stage 06/07.
- V8 direct video prompt output maps to Stage 08; Stage 06/07 must remain model-agnostic.
- V8 Chinese production text remains valid for operator-facing Stage 06/07/09. Stage 08 model-facing prompt fields remain English by V9 contract.
- V8 BGM prohibition means “do not invent BGM.” Existing V9 `music_cue` may exist only when source/production explicitly requires it; default empty/external.
- V8 contains conflicting default-format examples (9:16 vs later 16:9/3D defaults). Do not import those defaults as hard rules. Project specification controls aspect ratio/visual type; US vertical drama default remains 9:16 unless project says otherwise.
- CSV nine-grid remains optional export/workbench functionality, not a Stage 06–09 core ownership change.
- Modern-occult / cultivation effect libraries are conditional modules only when source material triggers them; never default them into US drama.

## Implementation scope

Modify canonical Core first:

- `core/usvd-v9/skills/06-storyboard/SKILL.md`
- `core/usvd-v9/skills/07-performance-cinematography/SKILL.md`
- `core/usvd-v9/skills/08-seedance-2-mini-adapter/SKILL.md`
- `core/usvd-v9/skills/09-prompt-qa/SKILL.md`
- corresponding Stage 06/07/08/09 contracts
- `scripts/v9-director-validation.mjs`
- `scripts/v9-prompt-qa-validation.mjs`
- human-review checklist
- relevant tests and fixtures/golden cases only where needed

Then run the repository's V9 distribution generator. Do not hand-edit generated trees as the source of truth.

Also fix the preview package so an installed/published TGZ contains every script referenced by its npm scripts. Prefer including the required `scripts/` directory rather than shipping a package whose `npm test` references missing files.

## Versioning

If implementation changes the director contract/behavior, create the next preview rather than rewriting preview.1:

- Core target: `0.9.0-preview.2`
- npm package target: `0.3.0-v9-preview.2`

Do not publish or merge to `main` automatically.

## Tests / acceptance gates

All of the following must pass before completion:

1. Existing tests remain green.
2. Add regression tests for the restored V8 rules.
3. `npm run build:v9`
4. `npm run check:v9`
5. `npm test`
6. Generated distributions are byte-synchronized with canonical Core.
7. New preview TGZ contains every file required by its npm scripts.
8. Install/package smoke test for the new TGZ succeeds.
9. Stage 06/07 do not emit final model prompt fields.
10. Stage 08 does not redesign approved direction.
11. Stage 09 localizes every new defect to a stable VIDEO/SHOT/package ref and return stage.
12. Golden-case blocker/major defect count does not regress without an explicit documented reason.

## Deliverables

Return:

- changed-file list;
- concise V8→V9 rule coverage report: restored / already-present / intentionally-not-imported;
- test results;
- new package filename + SHA-256 if packaging succeeds;
- commit SHA(s);
- Draft PR #7 status;
- any unresolved blockers.

Do not merge PR #7 or publish npm without explicit user approval.
