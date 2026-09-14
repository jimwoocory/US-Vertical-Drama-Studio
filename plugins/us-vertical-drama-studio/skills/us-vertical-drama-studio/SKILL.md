---
name: us-vertical-drama-studio
description: Orchestrate the complete US-facing vertical microdrama workflow from premise to approved series bible, episode beats, screenplay, review, and continuity handoff.
---

# US Vertical Drama Studio

Use this as the single entry point for developing an original or adapted US-facing vertical microdrama. Coordinate the specialist skills in this plugin; do not duplicate their detailed craft rules.

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

## Route the work

Run the smallest complete sequence that satisfies the request:

1. **Adaptation** — use `us-vertical-drama-adapter` for non-US source material or when cultural plausibility is uncertain. Produce an approved Adaptation Brief.
2. **Series canon** — use `us-vertical-drama-showrunner` to create the Story Bible, arc ladder, character engines, reveal ledger, escalation plan, and anti-repetition controls. Require `APPROVED Story Bible`.
3. **Episode architecture** — use `us-vertical-drama-episode-architect` to create episode beats with hook, conflict, escalation, reversal, payoff, and cliffhanger gates. Require `APPROVED Beat Sheet`.
4. **Screenplay** — use `us-vertical-drama-screenwriter` only from an approved Beat Sheet. Draft native, shootable vertical-drama scenes within the requested runtime.
5. **Independent review** — use `us-vertical-drama-script-doctor` to score the draft against the rubric. Do not call it ready unless the result is `PASS`; route failed items back to the responsible phase.
6. **Continuity** — use `us-vertical-drama-continuity-editor` to update the continuity ledger and verify names, rules, props, injuries, time, reveals, and handoffs. Require `CLEAR` before final delivery.

For a full-series request, plan the series first, then expand episodes in batches sized to the user's requested review cadence. Do not fabricate all episodes when the user asked for a plan or sample.

## State and handoffs

Maintain these statuses explicitly:

`BRIEF` → `BIBLE APPROVED` → `BEATS APPROVED` → `SCRIPT DRAFT` → `SCRIPT DOCTOR PASS` → `CONTINUITY CLEAR`.

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
