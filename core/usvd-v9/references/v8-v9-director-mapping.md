# V8 → V9 Director Capability Mapping

This document maps the archived V8 director baseline into the current V9 staged production architecture. The purpose is to preserve V8 directing behavior without collapsing V9 back into a monolithic prompt.

## Mapping principles

1. Preserve V8 story fidelity, timing, continuity, shot grammar, performance, camera, focus, lighting and self-check behavior.
2. Keep V9 ownership boundaries: Asset Lock → Storyboard → Performance/Cinematography → Seedance Adapter → Prompt QA.
3. A V8 rule becomes a V9 hard rule only when it is structurally deterministic. Semantic/aesthetic checks stay in human review.
4. Do not copy full asset descriptions into SHOT prompts; V9 uses Asset IDs/reference bindings.
5. Do not treat a V8 directing rule as proof of any Seedance endpoint capability.

## Section-by-section mapping

| V8 capability | V9 owner | Treatment |
| --- | --- | --- |
| Highest-priority conflict order; story/dialogue fidelity over style | Stage 06 + Stage 08 | Preserve as hard ordering. Adapter wording can never override story/asset/continuity/director facts. |
| Full-script / continuation / local-edit modes | Controller + Stage 06 | Preserve behavior through gate/routing and continuity inheritance rather than V8 mode labels. |
| Visual asset stream | Stage 05 Asset Lock | Already structurally replaced by V9 Asset Lock. Do not duplicate full asset prompts in Stage 06/07. |
| Dynamic storyboard stream | Stage 06 | Preserve and strengthen. VIDEO/SHOT timing, source coverage, action, dialogue, continuity and camera intent belong here. |
| Reference-image / three-view stability | Stage 05 + Stage 06/07 | Identity belongs to Asset Lock; director stages only consume stable IDs and continuity-critical visible state. |
| Plot fidelity / dialogue hard lock | Stage 06 | Preserve as hard rule. No story invention, no silent dialogue rewrite, no speaker reassignment. |
| Voice-performance instruction | Stage 06 facts + Stage 07 performance + Stage 08 capability routing | Preserve intent; execution depends on verified endpoint/audio chain. |
| Long-dialogue auto-cut policy | Stage 06 + Stage 09 | Restore thresholds and semantic-boundary rules; QA validates deterministic timing/exception evidence. |
| No invented BGM/subtitles/UI | Stage 06 + Stage 08 + Stage 09 | Interpret as no invented production elements. Explicit source music cue may remain, normally external. |
| Scene objective / obstacle / stakes / information gap / relationship change | Stage 06 | Preserve as director analysis inputs and shot narrative purpose. |
| Emotion expressed as visible behavior | Stage 07 | Preserve as hard directing doctrine; adjective-only direction is insufficient. |
| Space, 180° axis, direction, prop/damage/effect carry-over | Stage 06 + Stage 07 + Stage 09 | Already present; strengthen carry-over and QA. |
| Complex action micro-beats and after-effects | Stage 06 | Preserve. One dominant action phase per SHOT. |
| Cross-VIDEO opening shot-size continuity | Stage 07 + Stage 09 | Restore with same-subject/context-switch condition. |
| Shot-group grammar | Stage 06/07 | Preserve as conditional grammar, never a fixed template. |
| Merge similar adjacent shots | Stage 06 + Stage 09 human/machine heuristic | Restore. Deterministic duplicate patterns can warn; semantic merge judgement remains human-reviewed. |
| Focus transfer equals information transfer | Stage 07 + Stage 09 | Restore. |
| Depth of field must preserve critical readability | Stage 07 + human QA | Restore; especially action/chase/multi-character/large-space scenes. |
| Camera movement must have motive and landing point | Stage 07 + Stage 09 | Already present; strengthen landing-point requirement. |
| Advanced camera movement library | Stage 07 | Restore as opt-in library, never default. |
| Advanced movement count ≤2 per VIDEO | Stage 07 + Stage 09 | Restore as measurable V8-compatible production constraint. |
| Commercial-blockbuster emphasis count | Stage 07 + Stage 09 | Restore as optional emphasis profile: default max 1, explicit high-energy max 2 one-primary/one-secondary. |
| Emotional composition serving relationship/value change | Stage 07 | Restore. |
| Lighting source + dramatic intention + readability | Stage 07 + Stage 09 | Strengthen current lighting_motivation into explicit source/information/readability requirements. |
| Eye light / facial readability unless story hides it | Stage 07 + human QA | Restore. |
| Time/rhythm reference: 2.5s review, >3.0/>3.6/>4.2 rules | Stage 06 + Stage 09 | Restore. 15s remains ceiling not target. |
| Every 2–3s effective narrative change | Stage 06/07 + human QA | Preserve as rhythm heuristic, not mechanical cutting. |
| Conditional visual/VFX asset libraries | Stage 05/07 | Story-triggered only. Do not default supernatural/cultivation modules into US drama. |
| VFX cause → direction → target → light/environment feedback → residual state | Stage 07 + Stage 09 | Restore when VFX is present. |
| VFX L1–L4 intensity | Stage 07 optional + QA | Preserve as optional classification, source-triggered only. |
| Director execution table / source coverage list | Stage 06 | Already structurally represented by Gate, coverage, VIDEO, SHOT, continuity and handoff. |
| Direct copyable video prompt per VIDEO | Stage 08 | V9 intentionally moves this out of Stage 06/07. VIDEO master is Stage 08 ownership. |
| CSV nine-grid | Workbench/export | Keep optional, outside Stage 06–09 ownership changes. |
| 40-item final self-check | Stage 09 | Convert deterministic items to machine QA and semantic items to human checklist. |

## Explicit conflicts / non-literal imports

### Aspect ratio and visual defaults

The V8 source contains inconsistent defaults: the opening states 9:16 live action, while a later output example states default 16:9 / 3D animation. V9 must not hard-code either conflicting example. The project specification owns aspect ratio and visual type; for US vertical drama, the normal project default remains 9:16 unless explicitly overridden.

### Prompt language

V8 commonly emits Chinese generation text. V9 keeps Chinese operator-facing production text in Stage 06/07/09, but Stage 08 model-facing Seedance fields remain English by current V9 contract, except approved spoken dialogue/proper nouns/asset IDs.

### Music

V8 says not to generate background music. V9 has a `music_cue` event field. Reconciliation: Stage 06 must never invent music. If source/production explicitly contains a cue, record it; Stage 08 treats it as external by default unless the verified endpoint explicitly supports the requested execution.

### Asset descriptions

V8 can repeat complete visual descriptions inside direct prompts. V9 intentionally moves those descriptions to Asset Lock and reference bindings. This is not a loss of V8 director capability; it prevents prompt duplication and identity drift.

## Target state

After the refactor:

- Stage 06 behaves like the V8 story/timing/continuity/shot-structure director.
- Stage 07 behaves like the V8 performance/camera/focus/lighting director.
- Stage 08 remains the V9 model adapter and compresses without deleting director-critical information.
- Stage 09 turns V8 self-check discipline into traceable machine + human QA.
- Production Workbench and VIDEO/SHOT/Asset architecture remain V9-native.
