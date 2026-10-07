---
name: usvd-v10-02-episode-architect
description: Convert an independently reviewed complete Story Package into a full-season episode map with a mini dramatic arc and explicit state transitions for every episode.
---

# USVDS V10 — Episode Architect

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

## Stop conditions

Stop if an episode requires an unapproved story decision, if a state transition cannot be reconciled, if the requested season is not fully covered, or if any episode lacks a local arc. Report a stable issue reference and route the issue to Story Architect; do not fill the gap by improvising canon.
