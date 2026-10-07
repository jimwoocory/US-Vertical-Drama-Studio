---
name: usvd-v10-04-review-continuity
description: Diagnose supplied outlines and independently review V10 story drafts or complete episode packages with evidence-bound findings; do not rewrite or approve them as a human.
---

# USVDS V10 — Review and Continuity

## Modes

Run exactly one mode per invocation:

- `outline-diagnostic`: assess an existing outline or script-derived story summary before a creator selects a V10 direction. This is diagnostic only and cannot unlock story or episode stages.
- `story-draft-review`: review the Story Architect's complete story before episode planning.
- `story-package-review`: review the full Story Package after episode architecture.
- `script-review` and `continuity-project`: reserved for a later V10 implementation; currently return `BLOCKED`.

## Independence and binding

Read the actual artifact being reviewed and its source/brief references. For V10 Story Package modes, identify its `project_id`, `artifact_id`, `revision`, and digest; verify the report is about this exact revision. For `outline-diagnostic`, identify the supplied file, excerpt, or user label as `source_label` and assign an `artifact_id` for this diagnostic target; record the digest and revision if available, or set both to `null` and `binding_status=source_label_only`. State that exact-content binding is unverified in the latter case and cite observable spans. Do not edit the artifact, propose replacement prose as if applied, accept the author's self-score, or inherit findings from a different revision without rechecking them.

This skill can issue a semantic review recommendation only. It cannot authenticate a human, create trusted approval evidence, set `APPROVED`, unlock Screenwriter, or claim audience/commercial validation. V10's trusted approval runtime is blocked by ND-001.

## Story review rubric

For all three story modes, assess relevant items with a stable finding ID, issue type, severity, cited story span/decision ID, evidence, and required action:

1. The chosen direction and its audience promise match the referenced Brief decision. In `outline-diagnostic`, identify the direction the existing material actually takes without claiming the creator selected it.
2. Promise and logline clearly express audience draw, protagonist desire, opposition, and stakes.
3. The protagonist makes consequential choices and has a comprehensible external goal and internal need.
4. The opposing force has credible leverage; conflict can sustain the requested length without repetitive resets.
5. Every major turn follows an earlier cause and changes stakes, cost, power, information, or relationships through protagonist choice, opposing counteraction, and a retained consequence that generates the next pressure. Flag coincidence, withheld information, or a rescue that substitutes for causality.
6. Character motives and relationship leverage are clear, limited to useful complexity, and state changes have causes.
7. The full story has connected beginning, development, escalation, major reversal, crisis, climax, and resolution; climax is set up and the ending pays off the promise.
8. Secrets, promises, reveal windows, source adaptations, and planned character knowledge do not contradict one another.
9. For source adaptation, trace emotional payoff, source power/dependency logic, US replacement mechanism, protagonist option, and cost. Flag `surface_transplant` when renamed people, translated dialogue, substituted places/institutions, or the original plot's unchanged power logic is presented as an American story. The reviewer must cite both source and draft evidence where available; missing source coverage is a separate finding, never a guessed comparison.
10. US-facing social/institutional logic is plausible for the chosen world; uncertainty is marked rather than presented as researched fact. Flag `translation_register` when dialogue, social roles, forms of address, obligations, or institutional behavior visibly preserve a Chinese-language or Chinese-market assumption despite English wording. Cite the specific term/interaction and the US-world mechanism it contradicts; do not reject ordinary bilingual or immigrant-character speech on its own.
11. Exposition does not substitute for visible action and conflict; the story is producible in the requested vertical-drama format.
12. Provenance distinguishes user/source facts, dated market evidence, AI proposals, and approved story decisions.

Treat `surface_transplant`, `translation_register` where it changes story logic, and `causal_break` as mandatory blockers in V10 Story Package modes. A finding must describe the actual failed mechanism and evidence, rather than infer a problem from names, ethnicity, genre, or an automated keyword count. Local style issues that do not affect story logic may be minor.

Semantic quality must cite evidence. JSON field presence, word counts, a score, or a keyword scan cannot establish causality, hook strength, plausibility, or emotional payoff. Record structural/machine-check results separately from semantic findings.

## Mode-specific decision

### `outline-diagnostic`

Read the supplied outline or script and, if needed, extract a brief reverse story summary: promise, protagonist strategy, opposing leverage, key turns, and ending actually present in the material. Diagnose what can be retained, which turns fail causally or culturally, and which source gaps prevent judgment. Do not silently rewrite the material or imply a selected V10 direction. Return `DIAGNOSTIC_COMPLETE` when evidence supports a useful assessment, `BLOCKED` when the provided material cannot support one, or `REJECT` when the supplied direction's premise cannot be repaired within creator limits. Never return a PASS verdict in this mode. A complete diagnostic still requires creator direction selection and a canonical Story Package before episode architecture.

### `story-draft-review`

Require a complete outline through resolution, a Brief-bound selected direction, story engine, main character/relationship architecture, and relevant source coverage. If any mandatory story logic item fails, return `REWRITE` or `BLOCKED`; do not pass an outline because its headings are populated. Only a clean report on a digest-bound revision may return `PASS_FOR_EPISODE_ARCHITECTURE`.

### `story-package-review`

Require the complete intended episode map and its consistency with the reviewed story draft and selected direction. Check every episode for goal, hook/problem, conflict, escalation, emotional beat, reveal/reversal, payoff, unresolved question/cliffhanger or finale close, outcome, entry/exit states, continuity changes, and source/canon/promise references. Check season coverage and adjacent state transitions. On clean review of a digest-bound revision, return `PASS_AWAITING_HUMAN_APPROVAL`; this is a recommendation to present the exact package for human review, not an approval event.

## Output contract

Return a Review Report conforming to [`review-report.schema.json`](../../contracts/review-report.schema.json), containing `review_id`, project/artifact reference, `binding_status`, revision/digest when known, diagnostic `source_label` when applicable, mode/scope, input references, reviewer role (`ai_reviewer`, never `human`), rubric version, structural results, `findings[]` with stable IDs, `issue_type`, evidence and actions, verdict, and `unassessed_scopes`.

Allowed story verdicts: `DIAGNOSTIC_COMPLETE`, `PASS_FOR_EPISODE_ARCHITECTURE`, `PASS_AWAITING_HUMAN_APPROVAL`, `REWRITE`, `REJECT`, `BLOCKED`, subject to mode restrictions above. Never output a human `APPROVED` decision. Stop after the report; do not rewrite the artifact or execute a downstream stage.
