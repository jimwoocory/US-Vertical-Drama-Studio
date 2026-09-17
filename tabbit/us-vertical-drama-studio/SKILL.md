---
name: us-vertical-drama-studio
description: Complete US-facing vertical microdrama workflow for premise/adaptation, series bible, episode beats, screenplay, script review, continuity, storyboard, and Seedance/MediaGo generation packets.
---

# US Vertical Drama Studio for Tabbit

Use this Skill as the single entry point for creating or adapting US-facing vertical microdramas. The specialist playbooks are bundled under `references/`; load the relevant reference when that phase is active instead of requiring separate external Skills.

## Default operating model

Treat every project as a gated production pipeline and preserve canon between phases:

`BRIEF → BIBLE APPROVED → BEATS APPROVED → SCRIPT DRAFT → SCRIPT DOCTOR PASS → CONTINUITY CLEAR → STORYBOARD PACKAGE APPROVED`

Do not mark a downstream deliverable approved if the required upstream gate has not passed.

## Intake

Collect or infer only the minimum missing information:

- premise or source material and whether this is original or an adaptation
- target market/audience, rating, tone, language
- episode count and approximate runtime
- requested deliverable: full package, season plan, one episode, screenplay, audit, continuity pass, storyboard, or video-generation packet

If a missing choice materially changes the story, ask one focused question. Otherwise state a reversible assumption and continue.

## Script language standard

Unless the user explicitly requests otherwise:

- scene headings, action, performance direction, production notes, diagnostics, prompts, and UI-style labels are Chinese;
- character names and spoken dialogue are English;
- speech format is `ENGLISH CHARACTER NAME: “English dialogue.”`;
- do not duplicate every line in Chinese and English unless explicitly requested.

For screenplay scenes use visible labels: `【场景】`, `【人物】`, `【动作】`, `【情绪/内心】`, `【台词】`.

## Phase routing

Use the bundled specialist playbooks in `references/`:

1. Adaptation: `references/us-vertical-drama-adapter.md`
2. Series canon/showrunner: `references/us-vertical-drama-showrunner.md`
3. Episode architecture: `references/us-vertical-drama-episode-architect.md`
4. Screenplay: `references/us-vertical-drama-screenwriter.md`
5. Independent script review: `references/us-vertical-drama-script-doctor.md`
6. Continuity: `references/us-vertical-drama-continuity-editor.md`
7. Storyboard + generation packet: `references/us-vertical-drama-storyboard-director.md`

When a specialist playbook refers to its own reference file, use the matching file in this Skill's `references/` directory.

## Storyboard / video package rules

After `SCRIPT DOCTOR PASS` and `CONTINUITY CLEAR`, follow the storyboard-director playbook and enforce these production rules:

- First group source coverage into independently generatable video packages, normally ≤15 seconds each.
- Every video package has its own directly usable video-level master prompt and video-level negative prompt.
- Then split each package into contiguous micro-shots, normally 0.5–3 seconds each, for fine adjustment and replacement.
- Human-readable headings must use `【视频编号】` and `【镜头编号】`; machine IDs may remain `VIDEO-*` and `SHOT-*` only as values or export fields.
- Every shot must include exact package time range, duration, scene link, active asset IDs, action/emotion, camera, continuity in/out, local generation prompt, and negative constraints.
- Maintain stable asset IDs for character, look/costume, set/location, and hero props.
- Do not invent model capabilities; leave unsupported Seedance/MediaGo fields optional and explicitly unset.
- Emit a `production-workbench.json` that traces assets, videos, shots, prompts, generation states, and tasks.

Use these supporting specifications when the storyboard phase is active:

- `references/asset-ledger-template.md`
- `references/director-execution-contract.md`
- `references/production-workbench-manifest.md`
- `references/seedance-mediago-output-schema.md`

## State and handoff

At every phase transition include:

- current canon/version
- deliverable and episode range
- unresolved decisions
- risks or deliberate deviations
- next gate and its acceptance condition

A downstream phase may flag a canon problem but must not silently rewrite an approved upstream decision.

## Quality controls

Keep US cultural plausibility, commercial readability, vertical framing, short-episode rhythm, hook/payoff/cliffhanger logic, emotional clarity, production feasibility, and continuity visible in every relevant deliverable.

Escalation must change stakes, costs, information, power, or relationships. Reject repetition that merely swaps locations or insults.

## Final response format

Lead with the requested creative result. Then provide a compact production status containing:

- gate status
- canon assumptions
- unresolved decisions
- recommended next handoff

When the user asks only for critique, audit, or one specialist task, do not force the full pipeline.
