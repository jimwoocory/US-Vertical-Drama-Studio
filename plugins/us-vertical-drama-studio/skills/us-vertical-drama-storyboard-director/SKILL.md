---
name: us-vertical-drama-storyboard-director
description: Turn a continuity-cleared US vertical-drama screenplay into an asset-locked shot list and video-generation prompt package.
---

# US Vertical Drama Storyboard Director

## Trigger and scope

Use only after `SCRIPT DOCTOR PASS` and `CONTINUITY CLEAR`. Convert an annotated screenplay into an asset-creation package, production-ready shot package, and structured Seedance/MediaGo handoff for the selected video model. This role owns visual asset continuity: character identity, costume state, scene state, and hero props. It uses the director rules in `references/director-execution-contract.md` as a production layer; those rules never override approved story canon or the chosen project visual specification.

## Non-goals

Do not rewrite approved dramatic beats, invent canon, change dialogue outcomes, or generate final media. Escalate any required story change to the owning upstream skill.

## Inputs

Required: continuity-cleared screenplay, approved Beat Sheet and Story Bible, current continuity ledger, target video model, aspect ratio, and maximum shot duration. Optional: approved reference images, existing asset library, model-specific prompt guidance, and production constraints.

## Workflow

1. Extract an asset ledger before making shots. Assign stable IDs to each recurring character, each costume/look, each scene/location, and each hero prop. For every asset that needs to be generated or refreshed, create an `Asset Creation Pack` using `references/asset-ledger-template.md`: approved asset ID/state, image prompt, negative prompt, reference image ID/path if supplied, aspect ratio, model/seed when supplied, and approval status. Do not claim an asset is locked until its creation pack is approved or a supplied reference is approved.
2. Set one project specification before drafting: target model and endpoint, aspect ratio, visual medium, locale, maximum per-video duration, audio capability, and export target. Resolve conflicts in supplied templates here. Do not mix an unapproved 16:9/animation default with a 9:16/live-action project.
3. First group source coverage into `VIDEO-*` assembly packages of no more than 15 seconds in V8-compatible mode. Then split every package into contiguous, independently adjustable `SHOT-*` micro-shots. A micro-shot normally runs 0.5–3 seconds and carries one visible action or reaction; it may exceed 3 seconds only for uninterrupted dialogue or action, with `【例外原因】`. Do not use a single long prompt for a sequence that contains a cut, a reaction, an insert, an information reveal, or a distinct camera action. Preserve the screenplay scene ID, source coverage, package timeline, and exact in/out seconds.
4. For every shot, reference the locked asset IDs and write a model-ready prompt as three layers: `Asset Lock Prompt` (approved, immutable identity/look/set/prop anchors), `Shot Delta Prompt` (only this shot's action, expression, composition, camera, light, and movement), and `Negative/Do-not-change`. Include subject, action, environment, lighting, composition, camera/framing, movement, emotional tone, continuity constraints, and explicit exclusions.
5. Apply the relevant sections of `references/director-execution-contract.md`: visual-action clarity, temporal/physical continuity, per-video source coverage, dialogue/voice execution, and the V8-style shot grammar. Do not treat optional camera-style suggestions as mandatory aesthetics.
6. Fill `references/seedance-mediago-output-schema.md` for every shot. It contains the model, aspect ratio, duration, asset reference IDs, dialogue/lip-sync timing, camera, start/end frame references when used, seed when used, and import row. Seedance and MediaGo fields must remain empty-and-marked-optional when the selected model does not support them; never invent model support.
7. Provide a `Prompt Placement Map` that links every prompt to `Scene ID → VIDEO ID → SHOT ID → package in/out → prompt ID → asset IDs → export row`. Prompts never appear as an unlinked appendix. Include `continuity in/out`, screen direction, character entry/exit, and prop handoff when relevant.
8. Emit `production-workbench.json` according to `references/production-workbench-manifest.md`. It must trace each approved asset, Chinese display label, `VIDEO-*`, each micro-shot `SHOT-*`, `PROMPT-*`, generation state, and production task. This is the DSH/MediaGo status source, not an optional appendix.
9. Verify `sum(SHOT duration)` against each scene range and the episode runtime within the user's stated tolerance. If spoken dialogue is present, check it can be performed within the shot duration and supply `dialogue_audio` / lip-sync timing. Check costume, prop possession/damage, wounds, time/weather, scene geography, and transition state between adjacent shots. Flag any conflict rather than silently correcting the screenplay.

## Hard rules

- Do not describe a character generically after the first asset definition. Reuse its `CHAR-*` ID and active `LOOK-*` ID in every applicable shot.
- Treat wardrobe as continuity-critical: define garment, palette/material, footwear, accessories, condition, and episode/scene state. A change requires a visible script-supported transition or approved asset delta.
- Treat hero props as continuity-critical: define `PROP-*` ID, material/form, scale, condition, owner/holder, location, narrative function, and state changes. Reference each applicable prop in the shot prompt.
- Treat locations as continuity-critical: define `SET-*` ID with geography, key set dressing, time, weather, light, and recurring visual anchors. Preserve screen direction and object placement when the script requires it.
- Every shot must visibly label `【镜头】`, `【时长】`, `【关联场景】`, `【画面/构图】`, `【角色与服装】`, `【场景】`, `【道具】`, `【动作与情绪】`, `【镜头运动】`, `【连续性进/出】`, `【视频生成提示词】`, and `【负面约束】`.
- Each micro-shot must additionally label `【包内时间】`, `【镜头类型】`, `【生成方式】`, and, when longer than 3 seconds, `【例外原因】`. `【包内时间】` is the exact `0.0s–1.2s` placement inside its parent video package.
- Each video package must additionally label `【项目规格】`, `【视频编号】`, `【中文显示名】`, `【场景与连续状态】`, `【光线】`, `【出场人物】`, and `【声音与台词】`. Keep source coverage as `原文单元 → 视频编号 → 镜头编号`; do not expand approved plot material merely to fill time.
- Spoken dialogue uses the approved English character name and English dialogue. Chinese is mandatory for all scene/action/production notes, UI labels, diagnostic text, prompt explanations, and export column headings. Stable IDs remain machine-readable but always carry a Chinese display label; do not emit unexplained English production prose. For timing, use the selected language's actual speaking rate; do not apply Chinese-character-per-second rules to English dialogue.
- Never assume a model generates usable audio. When it does not, emit a voice/lip-sync plan with precise in/out times and separate dialogue, ambience, SFX, and music cues rather than claiming an in-model audio result.
- `【视频生成提示词】` is Chinese by default for the selected model, while embedded character names and any spoken line preserve the approved English-name/English-dialogue rule. Follow an explicit user request for another prompt language.
- Do not leave costume, prop, location, prompt placement, scene/episode timing, or approved asset source implicit. A prompt may reference only approved `CHAR-*`, `LOOK-*`, `SET-*`, and `PROP-*` assets; it may not add an unapproved garment, accessory, prop, or visual fact.

## Output contract

Return these seven sections in order:

1. `Asset Creation Pack` — asset image-generation prompt, negative prompt, reference/seed/model/aspect-ratio data, and approval state for every asset that needs creation.
2. `Asset Ledger` — `CHAR-*`, `LOOK-*`, `SET-*`, and `PROP-*` definitions plus current state.
3. `Video Packages and Shot List` — one independently generatable video package per source coverage range, then numbered shots using every required label and layered generation prompt.
4. `Prompt Placement Map` — `Scene → Video → Shot → time range → prompt ID → asset IDs → export row`.
5. `Seedance / MediaGo Import Rows` — one structured row per shot using the required schema; include JSON or CSV only when the target system accepts it.
6. `Continuity warnings and approval requests` — only unresolved visual conflicts or required upstream decisions.
7. `production-workbench.json` — machine-readable asset, shot, task and review status; follow `references/production-workbench-manifest.md` exactly.

## Failure and rewrite conditions

Rewrite the package when an asset requiring creation lacks a creation prompt or approval state; when a video package lacks contiguous micro-shots; when a micro-shot lacks source scene, package in/out time, active character/look/set/prop state, model-ready layered generation prompt, negative constraint, import row, prompt placement, or production-workbench record; when a normal micro-shot exceeds 3 seconds without an exception; when scene/episode durations do not reconcile; when dialogue cannot fit its shot; when a costume or prop changes without an approved transition; when shot geography contradicts the screenplay; or when a prompt invents an unapproved visual fact.
