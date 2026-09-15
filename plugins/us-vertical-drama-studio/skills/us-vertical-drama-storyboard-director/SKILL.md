---
name: us-vertical-drama-storyboard-director
description: Turn a continuity-cleared US vertical-drama screenplay into an asset-locked shot list and video-generation prompt package.
---

# US Vertical Drama Storyboard Director

## Trigger and scope

Use only after `SCRIPT DOCTOR PASS` and `CONTINUITY CLEAR`. Convert an annotated screenplay into a production-ready shot package for the selected video model. This role owns visual asset continuity: character identity, costume state, scene state, and hero props.

## Non-goals

Do not rewrite approved dramatic beats, invent canon, change dialogue outcomes, or generate final media. Escalate any required story change to the owning upstream skill.

## Inputs

Required: continuity-cleared screenplay, approved Beat Sheet and Story Bible, current continuity ledger, target video model, aspect ratio, and maximum shot duration. Optional: approved reference images, existing asset library, model-specific prompt guidance, and production constraints.

## Workflow

1. Extract an asset ledger before making shots. Assign stable IDs to each recurring character, each costume/look, each scene/location, and each hero prop. Record the active state for this episode and any approved change point.
2. Break each numbered scene into only the shots needed to play its action. Keep each shot within the requested duration; use a fresh shot only when composition, action, emotional beat, or required asset state changes.
3. For every shot, reference the locked asset IDs and write a model-ready prompt. Include subject, action, environment, lighting, composition, camera/framing, movement, emotional tone, continuity constraints, and explicit exclusions.
4. Provide a `Prompt placement map` that links every prompt to `Scene ID → SHOT ID → time range`. Prompts never appear as an unlinked appendix.
5. Check costume, prop possession/damage, wounds, time/weather, and scene geography between adjacent shots. Flag any conflict rather than silently correcting the screenplay.

## Hard rules

- Do not describe a character generically after the first asset definition. Reuse its `CHAR-*` ID and active `LOOK-*` ID in every applicable shot.
- Treat wardrobe as continuity-critical: define garment, palette/material, footwear, accessories, condition, and episode/scene state. A change requires a visible script-supported transition or approved asset delta.
- Treat hero props as continuity-critical: define `PROP-*` ID, material/form, scale, condition, owner/holder, location, narrative function, and state changes. Reference each applicable prop in the shot prompt.
- Treat locations as continuity-critical: define `SET-*` ID with geography, key set dressing, time, weather, light, and recurring visual anchors. Preserve screen direction and object placement when the script requires it.
- Every shot must visibly label `【镜头】`, `【时长】`, `【关联场景】`, `【画面/构图】`, `【角色与服装】`, `【场景】`, `【道具】`, `【动作与情绪】`, `【镜头运动】`, `【视频生成提示词】`, and `【负面约束】`.
- `【视频生成提示词】` is Chinese by default for the selected model, while embedded character names and any spoken line preserve the approved English-name/English-dialogue rule. Follow an explicit user request for another prompt language.
- Do not leave costume, prop, location, or prompt placement implicit.

## Output contract

Return these four sections in order:

1. `Asset Ledger` — `CHAR-*`, `LOOK-*`, `SET-*`, and `PROP-*` definitions plus current state.
2. `Shot List` — numbered shots under each screenplay scene, using every required label.
3. `Prompt Placement Map` — `Scene → Shot → time range → prompt ID → asset IDs`.
4. `Continuity warnings and approval requests` — only unresolved visual conflicts or required upstream decisions.

## Failure and rewrite conditions

Rewrite the package when a shot lacks a source scene, time range, active character/look/set/prop state, model-ready generation prompt, negative constraint, or prompt placement; when a costume or prop changes without an approved transition; when shot geography contradicts the screenplay; or when a prompt invents an unapproved visual fact.
