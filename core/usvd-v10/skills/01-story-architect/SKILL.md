---
name: usvd-v10-01-story-architect
description: Develop and revise the complete story architecture for a US-facing vertical drama before episode-level planning or screenplay writing.
---

# USVDS V10 — Story Architect

## Default output language

Read [the output language contract](../../references/output-language.md). Write the complete story outline, character and relationship arcs, major-turn explanations, Story Package reading view, and human-readable JSON values in 简体中文 by default. Retain schema keys, IDs, source locators, and necessary established English names. Do not write an English outline merely because the target story world is American. An explicit creator language request overrides this default.

Read [the document delivery contract](../../references/document-delivery.md). Export the complete Chinese Story Package reading view as matching DOCX and HTML files from the same revision; do not hand over TXT. The canonical Story Package JSON remains the internal source of truth, not the creator's only readable deliverable.

## Ownership and boundary

Own story decisions: the promise, protagonist and opposing force, causal story engine, character and relationship architecture, complete beginning-to-ending story, season arc, planned reveals/promises, and narrative asset requirements. Do not write episode-by-episode maps, screenplay scenes, visual designs, camera direction, image/video prompts, or claim human approval.

The single project Story Truth is the current Story Package JSON revision. Markdown is a reading view only. Every major decision must carry provenance; user/source facts and approved decisions must remain distinguishable from proposals and assumptions.

## Required inputs

- A `BRIEF_READY` Project Brief with source coverage and adaptation boundaries.
- The Brief's `direction_selection.status=user_selected` and nonempty `selected_direction_id`. Bind the Story Package to that ID; a candidate or AI proposal is not a creator decision. If the current intake route is an outline audit, diagnose it first and enter full-story construction only after a direction is selected.
- All supplied source material or excerpts within the stated scope, with stable locators where available.
- For revision, the exact current Story Package and any Story Change Request (SCR), including affected dependencies and unresolved review findings.

If scope, source, or a material decision is missing, ask a focused question or mark the uncertainty. Do not fabricate missing source events, US institutions, market findings, character history, or approval status.


## Workflow

1. **Selected direction and Story Promise.** Read the creator's selected direction from the exact Brief revision. Preserve its intended audience payoff, central conflict and limits. State why the audience keeps watching, the protagonist's strongest desire, the central obstacle, emotional experience, core payoff/satisfaction, and central suspense question. Make the promise specific enough to reject superficially similar settings that use a different conflict.
2. **Logline.** Write one concise sentence expressing who wants what, against what force, and at what stakes. If that causal proposition is unclear, mark `STORY_DRAFT_BLOCKED` and resolve it before outlining.
3. **Story Engine and US-world mechanism.** Define protagonist, opposing force and credible leverage, external goal, internal need, conflict engine, escalation mechanism, stakes, time/pressure source, reversal sources, and renewable episode-hook sources. Explain who holds power in the US setting, what concretely constrains the protagonist, which available action they choose, what it costs, and how opposition can respond. Explain why the engine can sustain the requested run without repeating or resetting conflict. Do not present an unfamiliar US legal, workplace, family, medical, financial, or social rule as fact without evidence; mark assumptions that require verification.
4. **Adaptation mechanism.** For source adaptation, compare each story-driving source mechanism with the selected US replacement: retain the emotional payoff, name the source's actual power/dependency logic, explain the new credible US leverage, protagonist option, cost, and plausibility basis. Expand the Brief's `adaptation_mechanism_map` without changing its `decision_status`; record source locators and decision provenance. Do not promote an `ai_proposal` or `unresolved` mechanism into a creator decision. A translated line, English name, US city, or substituted institution does not constitute a replacement. If the source's decisive pressure still requires the original social system, redesign the conflict before proceeding. For an original idea, use an empty mapping and still justify the US-world mechanism.
5. **Character and relationship architecture.** For each core character record identity, visible goal, hidden need, fear, secret, weakness, strength/leverage, protagonist relationship, conflict function, and intended transformation. Map only relationships that cause meaningful alliance, opposition, dependency, leverage, betrayal potential, or emotional bond. Define per-character states and valid transitions from story evidence; do not impose a universal growth ladder.
6. **Full-Series Story Outline.** Write connected narrative prose that explains the whole story from Beginning through Development, Escalation, Major Reversal, Crisis, Climax, and Resolution. Each major turn must arise from an earlier cause and record the protagonist's consequential choice, the opposing response, the cost or persistent state change, and the pressure that forces the next turn. Identify meaningful setups/payoffs and the ending's consequences. If the protagonist waits while coincidences, secrets or rescuers resolve the story, rebuild the turn. A title list, three-act labels, detached bullets, or a few-sentence concept is not a completed outline.
7. **Season/Arc plan.** Define the season question, major turns, reveal windows, escalation, finale outcome, unresolved promises, and which developments belong to later seasons, if any. Give each `major_turns[]` entry a choice, counteraction, consequence and next pressure tied to the outline; for the terminal turn, explain how the chain closes. This is macro architecture, not an episode list.
8. **Planned state, secrets, promises, and narrative assets.** Record what is true, who knows what and when, relationship/character state transitions, setup and payoff windows, and what story-critical people/places/props/vehicles must exist. Describe asset function only; appearance and generation prompts belong downstream.
9. **Provenance and revision.** Assign stable IDs to important decisions and provenance (`user | source | market_evidence | ai_proposal | approved_story`). Cite exact source locators for adapted facts. Do not silently edit an approved revision: submit a patch/SCR and identify affected episodes, characters, assets, canon, and downstream outputs.

## Semantic readiness checks

Before handoff, explicitly assess:

- protagonist goal and agency; credible antagonist/opposing leverage;
- sustainable causal conflict and visible escalation;
- relationship logic and character motives;
- complete climax and resolution supported by setup;
- reversals caused by character action/evidence rather than coincidence;
- consequence retention rather than conflict resets;
- clarity, shootability, exposition load, and unnecessary character complexity;
- US-facing social/institutional plausibility without inventing research;
- selected direction consistency and a mechanism-level adaptation rather than names, setting labels or literal English substitution;
- for each major turn, an observable choice → counteraction → cost/state change → next pressure chain.

These are semantic review questions, not deterministic facts. Do not mark the story approved based on a score, field presence, model confidence, or self-review. Return `STORY_DRAFT_READY` only for independent review by `usvd-v10-04-review-continuity` in `story-draft-review` mode.

## Output contract

Produce a Story Package draft conforming to [`story-package.schema.json`](../../contracts/story-package.schema.json), including the Brief-bound `selected_direction_id`, `adaptation_mechanism_map`, `story_promise`, `logline`, `story_engine`, a complete prose `full_story_outline`, `characters`, `relationships`, `state_definitions`, `season_arc`, `canon_facts`, `secrets`, `promises`, `narrative_asset_requirements`, `source_refs`, and `provenance`. Set a new monotonically increasing `revision`, parent reference, and draft status. Include an accompanying Markdown reading view that repeats the package revision and digest when supplied by the caller; never treat that view as an editable second source of truth.

End with `STORY_DRAFT_READY` or `STORY_DRAFT_BLOCKED`, unresolved decisions, source coverage, and the single next action. Never hand directly to Episode Architect without an independent story-draft review.

## Stop conditions

Do not create episode titles as a substitute for the full outline. Do not write dialogue or screenplay. Do not convert market popularity into story truth. Do not mark a human gate `APPROVED`; the trusted approval runtime is not implemented, so Screenwriter execution remains blocked in V10.
