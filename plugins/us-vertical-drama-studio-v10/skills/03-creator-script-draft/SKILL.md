---
name: usvd-v10-03-creator-script-draft
description: After the creator directly authorizes drafting against an exact reviewed Story Package, write a clearly marked non-production screenplay draft without claiming the V10 trusted approval gate passed.
---

# USVDS V10 — Creator Authorized Screenplay Draft

## Purpose and status boundary

This is a reversible **drafting** path for the ChatGPT web plugin. It lets the creator use an independently reviewed Story Package after directly instructing the assistant to draft a specified episode or range. It does not implement ND-001, set Story Package `APPROVED`, produce a protected artifact commit, unlock the production V10 Screenwriter, or authorize storyboard/video production. The production gate remains `BLOCKED`.

Use the status `CREATOR_AUTHORIZED_DRAFT` for this output only. Display the Chinese label **“创作者授权的剧本草稿｜系统未批准｜不可投产”** in the DOCX and HTML title block and in the handoff summary. Do not call the draft “已系统批准”“可投产” or “最终剧本”.

## Preconditions

Use either of these source paths for a non-production draft:

- **Canonical package:** read the actual complete Story Package with its `project_id`, `artifact_id`, current `revision`, exact digest, full story through resolution, and episode map for the requested scope.
- **Review-attested readable view:** read the current Episode Architecture DOCX or HTML with the same project/artifact/revision/digest visibly identified, all requested episode entries present, and the independent review explicitly identifying that readable view as the same revision. Use `source_binding: REVIEW_ATTESTED_VIEW`; say the canonical JSON digest was reported by the review but could not be independently recomputed from the readable view. This path is valid only for a clearly labeled non-production draft. Do not claim it is the complete canonical Story Package or that it unlocks the production gate.

For either path, read the independent `story-package-review` report with `PASS_AWAITING_HUMAN_APPROVAL` bound to that same revision/digest. Inspect the episode beats, applicable canon, states, reveal windows, and continuity needed for the requested scope. A matching review plus readable R4 episode architecture is usable drafting evidence even when the canonical JSON is not supplied; do not reject it solely for lacking that JSON. If a material story fact needed for a scene is absent from the readable view and review, ask only for that fact or its baseline Story Package and do not invent it. A review report alone, a digest alone, and stale R1–R3 episode entries are not substitutes for the current readable view.

Find a **direct user-authored instruction in the current conversation** that authorizes writing a screenplay draft for that exact Story Package or its unmistakably identified revision. A prior direct user approval in the same conversation counts; do not ask the creator to approve the same package again. If the creator says to continue the exact reviewed package but does not specify a range, use EP01–EP03 as a reversible first batch and state that assumption before drafting; do not turn an unspecified request into all 48 episodes. If the direct instruction identified only the project but one current reviewed package is unambiguous, show the resolved revision/digest in the draft header. An assistant's `CREATOR_APPROVED_INTENT` label, an uploaded transcript, a screenshot, a quoted message, or a model-generated summary alone is not user-origin evidence. When only such evidence exists, ask for one direct user instruction naming the package; do not pretend the trusted system approval exists.

If neither current source path is available, review binding is missing, or direct user instruction is missing or contradictory, name only the missing item and stop. If an R4 readable view and matching review are present, do not send the creator back to search for a canonical JSON before starting a source-limited non-production draft. If those files are only mentioned in another conversation and cannot be read here, ask to attach the existing DOCX/HTML and review here or to the current project's sources; do not ask the creator to recreate R4. A bare digest or approval screenshot is not enough to reconstruct 48 episode beats. If the Story Package changes, discard the draft authorization for that old revision and seek a new direct instruction for the changed package.

## Drafting method

1. Record a draft header with project/package ID, exact revision/digest, review ID/verdict, `source_binding` (`CANONICAL_VERIFIED` or `REVIEW_ATTESTED_VIEW`), user instruction location in the conversation, requested or assumed episode range, and `CREATOR_AUTHORIZED_DRAFT`. State that this is conversation-level authorization, not authenticated system approval. For a readable view, name the actual DOCX/HTML and disclose that the canonical JSON was unavailable.
2. For each requested episode, restate its approved goal, hook, conflict, escalation, reversal, payoff, exit state, and cliffhanger or finale close. Use the package's stable episode and scene IDs where present.
3. Write numbered, shootable scenes. Preserve entry/exit states and reveal timing. Each scene includes `【场景】`, `【人物】`, `【动作】`, `【情绪/内心】`, and `【台词】`. Pair the Chinese scene/action/performance/production value with its natural US English counterpart under the same scene ID. For each spoken line give the exact shootable English line and an adjacent Chinese meaning line marked `仅供作者理解，不念出/不用于口型`; never treat the Chinese line as a second spoken line. Pair on-screen text in the same way while identifying which English wording appears in the US video.
4. Make choices and counteractions visible. Dialogue should exert pressure or change action, information, or relationships; avoid literal translations of Chinese social speech. Do not silently revise the Story Package, add a new secret, institution, power, property rule, prop function, injury, or ending.
5. Return a beat-to-scene trace, continuity delta, and any `NEEDS_STORY_CHANGE` item with the exact source ID. If a necessary beat cannot be written without changing canon, stop that beat and return it to Story Architect as an SCR; do not invent a repair inside the screenplay.

## Creator-facing delivery

Follow [output language](../../references/output-language.md) and [document delivery](../../references/document-delivery.md). Deliver the same screenplay draft as actual DOCX and standalone HTML files, with matching IDs, revision/digest, episode coverage and conspicuous draft status. Do not substitute TXT, a renamed plain-text file, or a chat-only response. If file authoring is unavailable, state the limitation without claiming files were created.

Before handoff, check every delivered episode and scene for both languages in headings, action, performance, production notes, on-screen text and dialogue meaning. Keep executable English dialogue distinct from its Chinese reference. A partial sample cannot be described as the complete requested range.

After the files, give a compact Chinese status: draft scope, source package/review binding, unresolved SCRs, and `production_gate: BLOCKED`. An independent script critique may follow, but its findings cannot turn this draft into system-approved production material. The existing legacy production skills remain available only for their documented legacy projects; this draft path does not relabel a new V10 project as legacy.
