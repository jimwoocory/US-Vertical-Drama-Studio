---
name: us-vertical-drama-studio
description: Route ideas, existing outlines, adaptation sources, and scripts through US-facing story development before the retained screenplay and production workflow.
---

# US Vertical Drama Studio

Use this as the single entry point for developing an original or adapted US-facing vertical microdrama. Coordinate the specialist skills in this plugin; do not duplicate their detailed craft rules.

## First route: story before scripts

For every new project, start with `usvd-v10-controller`, which classifies the material and invokes the V10 Intake, Story Architect, Episode Architect, and independent Review skills. Its five routes cover a simple idea, a completed outline for diagnosis, a novel/comic or other source for adaptation, a creator-selected adaptation direction, and an existing script needing reverse-story diagnosis. Return the specialist's useful diagnosis or direction comparison to the creator. Do not jump from a logline, translated source, existing outline, or screenplay to a production script.

Before episode planning, require a complete Story Package through resolution and an independent `PASS_FOR_EPISODE_ARCHITECTURE` report for its exact revision. Before screenplay production on a new V10 project, require full episode architecture, an independent `PASS_AWAITING_HUMAN_APPROVAL` report, and a real human approval event bound to the same artifact revision. The V10 trusted approval runtime is not implemented, so this plugin must stop new V10 work at `AWAITING_HUMAN_APPROVAL`; its older writing and production skills cannot bypass that gate.

The seven original specialist skills remain available for a legacy project with its previously approved Story Bible, Beat Sheet, and downstream handoff evidence. They may also critique supplied material without implying approval. If such evidence is absent, route the project to V10 story intake rather than fabricate an `APPROVED` status.

## Operating principle

Treat the project as a gated production pipeline. Preserve canon between phases, keep a versioned decision ledger, and never present a downstream deliverable as approved when an upstream gate is missing.

## Intake

Collect or infer only the minimum missing information:

- premise or source material and whether it is original or an adaptation
- target market/audience, rating, tone, and language
- episode count and approximate runtime
- requested deliverable (full package, season plan, one episode, screenplay, audit, or continuity pass)

If a missing choice materially changes the story, ask one focused question before proceeding. Otherwise state a reversible assumption.

## Script language standard

Unless the user explicitly requests otherwise, write production scripts for Chinese review with English dialogue for video generation:

- Write scene headings, action, performance direction, on-screen notes, beat traces, and production notes in Chinese.
- Put English only in character names, character dialogue, or diegetic spoken/written dialogue that must be generated or shown in the final video.
- Format speech as an English character name followed by an English line in quotation marks (for example, `ETHAN: “I made a promise.”`). Do not duplicate every line in Chinese and English.

## Screenplay annotation standard

Unless the user asks for a treatment or outline only, every screenplay scene must visibly label its production inputs. Use Chinese labels: `【场景】`, `【人物】`, `【动作】`, `【情绪/内心】`, and `【台词】`.

- `【场景】` names the precise dramatic location, time, and scene objective.
- `【人物】` names the characters present; character names in speech are English.
- `【动作】` describes only visible, shootable behavior and changes in the scene.
- `【情绪/内心】` states the playable emotional state or concealed intention and the observable performance evidence that directs performance; do not use it as unfilmable exposition.
- `【台词】` contains only the relevant English dialogue in `ENGLISH CHARACTER NAME: “English dialogue.”` format.

For storyboard-ready work, split the screenplay into numbered scene units before shot design. Preserve the approved scene ID, timing, entry/exit state, objective, visible action, observable performance evidence, and dialogue purpose. Do not substitute unlabelled prose for these fields.

## Route the work

For a documented legacy project only, run the smallest complete sequence that satisfies the request:

1. **Adaptation** — use `us-vertical-drama-adapter` for non-US source material or when cultural plausibility is uncertain. Produce an approved Adaptation Brief.
2. **Series canon** — use `us-vertical-drama-showrunner` to create the Story Bible, arc ladder, character engines, reveal ledger, escalation plan, and anti-repetition controls. Require `APPROVED Story Bible`.
3. **Episode architecture** — use `us-vertical-drama-episode-architect` to create episode beats with hook, conflict, escalation, reversal, payoff, and cliffhanger gates. Require `APPROVED Beat Sheet`.
4. **Screenplay** — use `us-vertical-drama-screenwriter` only from an approved Beat Sheet. Draft native, shootable vertical-drama scenes within the requested runtime.
5. **Independent review** — use `us-vertical-drama-script-doctor` to score the draft against the rubric. Do not call it ready unless the result is `PASS`; route failed items back to the responsible phase.
6. **Continuity** — use `us-vertical-drama-continuity-editor` to update the continuity ledger and verify names, rules, props, injuries, time, reveals, and handoffs. Require `CLEAR` before final delivery.
7. **Storyboard and generation packet** — use `us-vertical-drama-storyboard-director` only after `SCRIPT DOCTOR PASS` and `CONTINUITY CLEAR`. It locks character, costume, scene, and prop assets, then creates per-shot video-generation prompts.

For a full-series request, plan the series first, then expand episodes in batches sized to the user's requested review cadence. Do not fabricate all episodes when the user asked for a plan or sample.

## State and handoffs

Maintain these statuses explicitly:

`BRIEF` → `BIBLE APPROVED` → `BEATS APPROVED` → `SCRIPT DRAFT` → `SCRIPT DOCTOR PASS` → `CONTINUITY CLEAR` → `STORYBOARD PACKAGE APPROVED`.

Every handoff includes:

- current canon/version
- deliverable and episode range
- unresolved decisions
- risks or deliberate deviations
- next gate and acceptance condition

A specialist may flag a canon problem but may not silently rewrite another phase's approved decisions. Send changes back to the owning phase and record the revision.

## Quality controls

Keep US plausibility, commercial readability, vertical framing, short-episode rhythm, and emotional clarity visible in every relevant deliverable. Enforce escalation through changed stakes, costs, information, or relationships; reject repetition that only swaps locations or insults. Keep cliffhangers specific and causally earned.

When the user requests only critique, audit, or one specialist task, do not force the full pipeline. Return the requested artifact plus the relevant gate status and the shortest next step.

## Final response format

Lead with the requested creative result. Then provide a compact production status:

- gate status
- canon assumptions
- unresolved decisions
- recommended next handoff

Use the specialist reference files only when their phase is active.
