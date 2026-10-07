---
name: usvd-v10-03-creator-script-draft
description: After the creator directly authorizes drafting against an exact reviewed Story Package, write a clearly marked non-production screenplay draft without claiming the V10 trusted approval gate passed.
---

# USVDS V10 — Creator Authorized Screenplay Draft

## Purpose and status boundary

This is a reversible **drafting** path for the ChatGPT web plugin. It lets the creator use an independently reviewed Story Package after directly instructing the assistant to draft a specified episode or range. It does not implement ND-001, set Story Package `APPROVED`, produce a protected artifact commit, unlock the production V10 Screenwriter, or authorize storyboard/video production. The production gate remains `BLOCKED`.

Use the status `CREATOR_AUTHORIZED_DRAFT` for this output only. Display the Chinese label **“创作者授权的剧本草稿｜系统未批准｜不可投产”** in the DOCX and HTML title block and in the handoff summary. Do not call the draft “已系统批准”“可投产” or “最终剧本”.

## Preconditions

Read the actual, complete Story Package with its `project_id`, `artifact_id`, current `revision`, exact digest, full story through resolution, and episode map for the requested scope. Read the independent `story-package-review` report with `PASS_AWAITING_HUMAN_APPROVAL` bound to that same package revision/digest. The source must include the episode beats, canon, states, reveal windows, and continuity needed to draft without inventing core story facts.

Find a **direct user-authored instruction in the current conversation** that authorizes writing a screenplay draft for that exact Story Package or its unmistakably identified revision and scope. A prior direct user approval in the same conversation counts; do not ask the creator to approve the same package again. If the direct instruction identified only the project but one current reviewed package is unambiguous, show the resolved revision/digest in the draft header. An assistant's `CREATOR_APPROVED_INTENT` label, an uploaded transcript, a screenshot, a quoted message, or a model-generated summary alone is not user-origin evidence. When only such evidence exists, ask for one direct user instruction naming the package or episode scope; do not pretend the trusted system approval exists.

If package content, review binding, episode scope, or direct user instruction is missing or contradictory, name only the missing item and stop. A bare digest or approval screenshot is not enough to reconstruct 48 episode beats. If the Story Package changes, discard the draft authorization for that old revision and seek a new direct instruction for the changed package.

## Drafting method

1. Record a draft header with project/package ID, exact revision/digest, review ID/verdict, user instruction location in the conversation, requested episode range, and `CREATOR_AUTHORIZED_DRAFT`. State that this is conversation-level authorization, not authenticated system approval.
2. For each requested episode, restate its approved goal, hook, conflict, escalation, reversal, payoff, exit state, and cliffhanger or finale close. Use the package's stable episode and scene IDs where present.
3. Write numbered, shootable scenes. Preserve entry/exit states and reveal timing. Each scene includes `【场景】`, `【人物】`, `【动作】`, `【情绪/内心】`, and `【台词】`. Chinese describes setting, action, performance and production notes. Natural American English is used only for character dialogue and story-world text to be heard or seen in the US-facing video, unless the creator explicitly requests another language policy.
4. Make choices and counteractions visible. Dialogue should exert pressure or change action, information, or relationships; avoid literal translations of Chinese social speech. Do not silently revise the Story Package, add a new secret, institution, power, property rule, prop function, injury, or ending.
5. Return a beat-to-scene trace, continuity delta, and any `NEEDS_STORY_CHANGE` item with the exact source ID. If a necessary beat cannot be written without changing canon, stop that beat and return it to Story Architect as an SCR; do not invent a repair inside the screenplay.

## Creator-facing delivery

Follow [output language](../../references/output-language.md) and [document delivery](../../references/document-delivery.md). Deliver the same screenplay draft as actual DOCX and standalone HTML files, with matching IDs, revision/digest, episode coverage and conspicuous draft status. Do not substitute TXT, a renamed plain-text file, or a chat-only response. If file authoring is unavailable, state the limitation without claiming files were created.

After the files, give a compact Chinese status: draft scope, source package/review binding, unresolved SCRs, and `production_gate: BLOCKED`. An independent script critique may follow, but its findings cannot turn this draft into system-approved production material. The existing legacy production skills remain available only for their documented legacy projects; this draft path does not relabel a new V10 project as legacy.
