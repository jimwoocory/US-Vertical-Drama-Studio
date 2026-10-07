---
name: us-vertical-drama-studio
description: Route ideas, existing outlines, adaptation sources, and scripts through US-facing story development before the retained screenplay and production workflow.
---

# US Vertical Drama Studio

Use this as the single entry point for developing an original or adapted US-facing vertical microdrama. Coordinate the specialist skills in this plugin; do not duplicate their detailed craft rules.

## First route: story before scripts

For every new project, start with `usvd-v10-controller`, which classifies the material and invokes the V10 Intake, Story Architect, Episode Architect, and independent Review skills. Its five routes cover a simple idea, a completed outline for diagnosis, a novel/comic or other source for adaptation, a creator-selected adaptation direction, and an existing script needing reverse-story diagnosis. Return the specialist's useful diagnosis or direction comparison to the creator. Do not jump from a logline, translated source, existing outline, or screenplay to a production script.

Before episode planning, require a complete Story Package through resolution and an independent `PASS_FOR_EPISODE_ARCHITECTURE` report for its exact revision. The V10 trusted approval runtime is not implemented, so the production Screenwriter and downstream production remain blocked. After full episode architecture and an independent `PASS_AWAITING_HUMAN_APPROVAL` report, a direct creator instruction in the same conversation for the exact package may route to `usvd-v10-03-creator-script-draft`. For this non-production draft, the current review-attested Episode Architecture DOCX/HTML plus its exact matching review is a valid readable source when the canonical JSON is unavailable; disclose that narrower source binding and do not invent omitted canon. An unspecified “continue R4” request defaults to an explicitly stated EP01–EP03 first batch. This creates a clearly labeled, non-production `CREATOR_AUTHORIZED_DRAFT`, never a system `APPROVED` Story Package. Do not ask the creator to repeat an already visible direct approval for that same package; do not use an assistant summary or screenshot alone as approval evidence.

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

## Development document language standard

Unless the creator explicitly requests otherwise, deliver early Project Briefs, direction comparisons, complete story outlines, character plans, and independent reviews in 简体中文. Deliver **every field of the full Episode Map**, every screenplay scene and spoken line, and every creator-facing storyboard, asset, shot, and generation-prompt field in paired Chinese and natural US English. Preserve IDs and factual equivalence. An American target market determines story plausibility; it does not justify English-only early outlines. Follow [`output-language.md`](../../references/output-language.md).

Deliver each requested creator-facing development artifact as two actual downloadable files, DOCX and standalone HTML, with matching content and revision. Do not send TXT or a text dump in place of either file. Keep canonical JSON for internal tracking or a separately requested audit export. Follow [`document-delivery.md`](../../references/document-delivery.md); if the environment cannot make a requested file, state the limitation honestly.

At the project's actual final handoff, or when the creator requests an archive, provide a real downloadable ZIP of the current available DOCX/HTML pairs plus reviews and useful machine-readable assets. Include a manifest with versions, episode scope, SHA-256, bilingual coverage, missing items, and gate status. Follow [`final-package.md`](../../references/final-package.md). A partial ZIP must say `PARTIAL`; packaging never upgrades a draft to system-approved production work.

## Script language standard

Unless the user explicitly requests otherwise, write creator-facing episode scripts in paired Chinese and natural US English:

- Pair scene headings, action, performance direction, on-screen notes, beat traces, and production notes field by field in Chinese and English.
- Format each shootable spoken line as an English character name with its natural English dialogue, followed by a Chinese meaning line labeled `仅供作者理解，不念出/不用于口型`. The Chinese line is not a second performed line.
- For prompts, pair Chinese and English master, local, asset, and negative prompts by prompt ID; mark the one language version submitted to the chosen model and the other as a review translation. Preserve existing machine import fields and do not concatenate both versions into a single prompt input.

## Screenplay annotation standard

Unless the user asks for a treatment or outline only, every screenplay scene must visibly label its production inputs. Use Chinese labels: `【场景】`, `【人物】`, `【动作】`, `【情绪/内心】`, and `【台词】`.

- `【场景】` names the precise dramatic location, time, and scene objective.
- `【人物】` names the characters present; character names in speech are English.
- `【动作】` describes only visible, shootable behavior and changes in the scene.
- `【情绪/内心】` states the playable emotional state or concealed intention and the observable performance evidence that directs performance; do not use it as unfilmable exposition.
- `【台词】` contains the shootable English dialogue in `ENGLISH CHARACTER NAME: “English dialogue.”` format plus the adjacent Chinese reference meaning clearly marked as unspoken.

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
