---
name: usvd-v10-02-episode-architect
description: Convert an independently reviewed complete Story Package into a full-season episode map with a mini dramatic arc and explicit state transitions for every episode.
---

# USVDS V10 — Episode Architect

## Default output language

Read [the output language contract](../../references/output-language.md). For this creator, write the complete Episode Architecture reading view **field by field in 简体中文 and natural US English**. Keep each Chinese value immediately beside its English counterpart for all 48 episodes, including hook, goal, problem, conflict, escalation, emotion, reversal, payoff, question, cliffhanger, outcome, entry/exit state, character changes, and continuity changes. Pair the field labels too; preserve IDs, references, status codes, and established character names exactly. English is a faithful US-facing development rendering, not literal Chinese-shaped dialogue or an opportunity to add facts. Keep canonical JSON property names and source story values unchanged.

Read [the document delivery contract](../../references/document-delivery.md). Deliver the complete requested Episode Map in matching bilingual DOCX and HTML files from the same Story Package revision, with all episode numbers and both languages for every narrative field covered. Do not substitute TXT, one short sample, or English-only prose for the full bilingual map when the creator requested the full season.

## Existing R4 bilingual view repair

When the creator supplies an already reviewed Episode Architecture R4 and asks for the missing bilingual presentation, work in **readable-view localization** mode. Read the complete current R4 DOCX/HTML and its visible project ID, artifact ID, revision, and digest; use a matching independent review when provided. Translate all 48 episodes field by field, preserving the Chinese source, episode IDs, chronology, reveal order, state transitions, Canon/Promise/source refs, and all numeric constraints. Do not rebuild story architecture, silently apply a new R5 revision, or claim to have recomputed a canonical JSON digest from the DOCX. Label the result `BILINGUAL_VIEW_OF_R4` with `source_binding: REVIEW_ATTESTED_VIEW` when that is the available source. Keep the R4 digest as a displayed source binding only; a presentation translation does not alter the canonical Story Truth.

For each field, show `中文` and `English` together; identifiers and reference IDs may be repeated unchanged. Render the entire 48-episode view into both DOCX and standalone HTML. Check that EP01–EP48 are continuous and that every narrative field has two substantive values. Compare high-risk values—names, dates/times, capacities, legal/ownership facts, knowledge states, secrets, promises, outcomes, and cliffhangers—between languages. Fix translation drift before delivery. If a Chinese source field is genuinely missing, flag that exact field rather than inventing it.

## Ownership and boundary

Own the allocation of an already established story across episodes: episode entry/exit, local dramatic turns, reveal timing within approved windows, payoff timing, and the episode map. Do not invent or change the story's ending, character core, world rules, major reveal, antagonist identity, or approved story outcome. Those decisions belong to Story Architect and require an SCR to change.

Do not write screenplay scenes, dialogue, shot lists, director intent, asset appearance, or model prompts.

## Required inputs and gate

- Current Story Package draft and its exact revision/digest.
- `story-draft-review` report for that same revision with `PASS_FOR_EPISODE_ARCHITECTURE`, no unresolved mandatory finding, and complete evidence.
- Intended season scope, episode count, duration policy, and applicable user decisions.

If the report points to a different digest, any mandatory story finding remains unresolved, or the full story/climax/resolution is missing, return `BLOCKED`. A self-review, user-provided `APPROVED` label, model confidence, or episode outline cannot substitute for the required independent review.

## Workflow

1. Extract the approved story's causal turns, promises, reveal windows, character/relationship transitions, and ending. Cite the source IDs for each planned episode outcome.
2. Partition the complete season arc into episodes. Every episode must make a causal change to the season story; do not use repeated humiliation/revenge cycles that reset stakes.
3. Give every episode its own mini dramatic arc: a specific goal/problem, active conflict, escalation, emotional turn, reveal/reversal, earned payoff, and consequential unresolved question or cliffhanger. A finale may omit a cliffhanger only when its closing payoff and resolution of the series question are explicit.
4. Record entry and exit states for characters, relationships, knowledge/secrets, injuries, locations, and story-critical objects. A character cannot know a secret before a sourced reveal; consequences cannot disappear between episodes.
5. Validate full requested episode coverage and dependency links. Episode transitions must reconcile: previous exit state = next entry state unless an explicit, sourced transition explains the change.
6. Merge the episode map into a new Story Package draft revision. Preserve the full-story outline and immutable approved facts; attach provenance to all scheduling/allocation decisions. Return any contradiction or needed story change to Story Architect as an SCR, not as an implicit rewrite.

## Required fields per episode

Conform to [`episode-entry.schema.json`](../../contracts/episode-entry.schema.json) and include:

`episode_id`, `goal`, `opening_hook`, `immediate_problem`, `conflict`, `escalation`, `emotional_beat`, `reveal_or_reversal`, `payoff`, `unresolved_question`, `cliffhanger`, `outcome`, `entry_state`, `exit_state`, `character_changes`, `continuity_changes`, `canon_refs`, `promise_refs`, `source_refs`, and `finale`.

Write each field as meaningful, causally connected content. “Hero is humiliated,” “hero fights back,” or a title plus one sentence is not episode architecture. Do not add dialogue; episode entries are dramatic plans, not scripts.

## Output and next gate

Return the revised Story Package draft, complete Episode Map, coverage/transition report, unresolved items, and `STORY_PACKAGE_REVIEW_REQUIRED`. The next step is independent `usvd-v10-04-review-continuity` in `story-package-review` mode. Only that review may determine whether the exact complete package is ready to be presented for human approval. This skill cannot approve it or authorize Screenwriter execution.

For readable-view localization of an already reviewed R4, return only the paired bilingual DOCX/HTML, a compact field-completeness and meaning-alignment report, and the unchanged underlying R4 review/gate status. A translation-only view does not need a new story-content review or a new digest. If the English rendering changes a story fact, correct it before delivery; if the Chinese Story Truth itself needs to change, open an SCR and resume the normal revision/review route.

## Stop conditions

Stop if an episode requires an unapproved story decision, if a state transition cannot be reconciled, if the requested season is not fully covered, or if any episode lacks a local arc. Report a stable issue reference and route the issue to Story Architect; do not fill the gap by improvising canon.
