---
name: usvd-v10-00-intake-adaptation
description: Identify the material the creator actually has, route idea development, outline diagnosis, source adaptation, or script diagnosis, and prepare a traceable US-facing Project Brief without writing the full story.
---

# USVDS V10 — Intake and Adaptation

## Default output language

Read [the output language contract](../../references/output-language.md). Write the Project Brief reading view, direction cards, adaptation decisions, explanations, and `next_step_for_user` in 简体中文 by default. Set `output_languages` to include `zh-CN-development`; note `en-US-dialogue` only as the later screenplay dialogue policy. Keep JSON keys, status codes, IDs, and necessary original names unchanged. An American setting never implies an English development document. An explicit creator request may override this default.

Read [the document delivery contract](../../references/document-delivery.md). Record `delivery_formats: ["docx", "html"]` in new Briefs by default. Supply the readable Brief and any direction comparison as matching downloadable DOCX and standalone HTML files; do not deliver TXT. Keep the Brief JSON as an internal canonical artifact or optional audit attachment, never as a replacement for the two readable files.

## Ownership

Own the Project Brief, intake route, source coverage, direction preview, adaptation scope, and unresolved intake decisions. Do not own the full story, independent outline verdict, season outline, episode map, screenplay, market conclusions, or human approval. Read [intake routing](../../references/intake-routing.md) when classifying an ambiguous request or proposing directions.

## Inputs

Accept an original idea or market concept, a completed outline, a novel/comic/film or other source work, a source with the creator's chosen adaptation direction, or an existing screenplay. Record which materials the user supplied and which are references only. For adapted works, ask whether the user owns or is authorized to adapt the supplied material when that is unclear. Do not fetch, quote, or reconstruct unsupplied copyrighted source text.

Collect or infer only reversible defaults for US-facing audience/market, format, intended episode count and runtime, rating/tone, adaptation limits, and requested delivery scope. Default the development-document language to Chinese and later screenplay dialogue to natural US English; ask about language only when the creator requests an exception. Ask one focused question when an unresolved choice changes the core premise or rights scope.

## Route before writing

Classify the work by the strongest supplied artifact and the user's immediate question, using exactly one `intake_route`:

| Supplied material and request | `intake_route` | First deliverable / `next_action` |
| --- | --- | --- |
| A simple idea or market concept with no stable conflict engine | `simple_idea` | 2–3 distinct direction cards; `choose_direction` |
| A completed outline whose fit or quality is uncertain | `completed_outline_audit` | Source-bound outline diagnosis; `audit_outline` |
| A novel, comic, film, or story source with no chosen US direction | `source_adaptation` | Source coverage, adaptation tradeoffs, 2–3 US direction cards; `choose_direction` |
| A source and a direction explicitly chosen by the creator | `source_selected_direction` | Check that the chosen direction has a credible US conflict mechanism; `validate_selected_direction` |
| An existing script whose actual story must be assessed | `existing_script_reverse_story` | Reconstruct the story the script actually tells, then diagnose it; `reverse_story_then_audit` |

If the creator has already explicitly chosen a viable direction for a simple idea, record it as `user_selected` and set `next_action: develop_full_story`. If rights, source scope, or a premise-changing choice is unresolved, use `resolve_material_decision` and state the exact decision. A diagnostic route can be `BRIEF_READY` with `direction_selection.status: not_applicable`; the diagnostic is the next action, not a full-story drafting gate. Never treat an existing outline or script as automatically approved.

## Workflow

1. Identify source kind, source boundary, and what was actually read. Preserve stable locators such as chapter, page, scene, timestamp, or user-provided passage. Mark unavailable or truncated ranges explicitly.
2. Separate source facts, user decisions, market evidence, AI proposals, and assumptions. Market information is evidence with source/date, never story truth by itself.
3. For adaptation, create a decision matrix with `retain`, `cut`, `merge`, and `redesign` candidates. For every material cut or merge, state the dramatic consequence (“this means…”), the affected character/plot functions, and an exact source locator or mark the proposal as unsupported.
4. Identify the source's emotional promise, then map the power, relationship, cost, and causal mechanisms that make it work. For each, state the US mechanism that could produce the same emotional payoff and why it is credible for these characters and this setting. Mark unverified institutional details as uncertainty. A change of names, location labels, or translated dialogue does not pass this gate; if the story still depends on a source-culture mechanism that has no credible US equivalent, return it for redesign.
5. For an unclear premise or unchosen adaptation, offer 2–3 short direction cards. Keep the emotional promise where appropriate, but change the protagonist's strategy, opposing leverage, cost, and US power logic enough that each direction would generate a different chain of choices and reversals. State the tradeoff and ask the creator to choose. Do not infer selection from an AI recommendation.
6. Record a creator-selected direction with a stable `direction_id`, `direction_selection.status: user_selected`, and a source-backed summary. The selected ID must match one entry in `direction_candidates`. If the creator supplied that direction, include one matching entry; this is a record of their direction, not a claim that alternatives were approved. If cards await a choice, use `NEEDS_USER_DECISION` and a null selected ID.
7. Identify high-level character candidates and the story function each serves, but do not finalize the cast or full character arcs. Flag likely recurring characters, one-scene roles, narrative objects, and production risks as estimates for Story Architect review; do not produce visual asset prompts.
8. Produce one Project Brief and adaptation decision table. Give it a stable `artifact_id`, a monotonically increasing `revision`, and `parent_revision: null` for the first revision or the immediate prior revision thereafter. Do not turn the brief or direction cards into a full story, season outline, episode list, or screenplay.

## Output contract

Return a Project Brief conforming to [`project-brief.schema.json`](../../contracts/project-brief.schema.json) and a concise human-readable summary with:

- `project_id`, `artifact_id`, `revision`, `parent_revision`, working title, `source_kind`, `market: US`, output language policy, `delivery_formats`, delivery scope, season/episode scope, and duration policy.
- `intake_route`, `next_action`, and `next_step_for_user`: tell the creator what was recognized, what they will see next, and what decision is needed. This must be understandable without skill names.
- `source_refs[]`: source ID, supplied/observed range, locator, coverage status, and limitations.
- `direction_candidates[]` with stable `direction_id`, audience promise, protagonist strategy, opposing force, cost, and US power logic; `direction_selection` records whether the creator has explicitly selected one. Use an empty candidate array for a pure outline/script diagnosis.
- `adaptation_limits`: elements to preserve, elements open to change, prohibited changes, and any rights/authorization status the user supplied.
- `adaptation_decisions[]`: decision (`retain | cut | merge | redesign | unresolved`), source references whose locators appear in `source_refs[]`, dramatic reason, downstream implications for characters/plot functions, and whether the proposal is user-decided or still an AI proposal.
- `adaptation_mechanism_map[]`: one entry for each relevant `power | relationship | cost | causality` dimension, naming the emotional payoff, source mechanism, proposed US mechanism, US plausibility basis, and decision status. For original ideas with no source, use an empty array.
- `evidence_and_assumptions[]`: statement, provenance (`user | source | market_evidence | ai_proposal`), source/date/locator when applicable; state uncertainty in the statement rather than implying a verified fact.
- `open_decisions[]` and `brief_status: BRIEF_READY | NEEDS_USER_DECISION`.

Do not label an AI proposal or inferred detail as approved canon. `BRIEF_READY` means the next diagnostic or story task has enough traceable input; it does not mean the direction or story passed review. For full-story drafting, require an explicitly creator-selected `direction_selection.selected_direction_id` and a credible US conflict mechanism. A completed outline or script can proceed to diagnosis without a selected direction ID.

## Stop conditions

Stop after delivering the brief and direction preview if needed. Never claim full source coverage when only excerpts were read. Never claim audience or commercial validation based on market research or genre conventions. Never quietly turn a Chinese social dependency into an American one by changing labels.
