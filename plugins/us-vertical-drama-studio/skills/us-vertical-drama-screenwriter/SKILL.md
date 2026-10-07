---
name: us-vertical-drama-screenwriter
description: Draft a production-readable US vertical microdrama screenplay from an approved beat sheet without silently redesigning its core beats.
---
# US Vertical Drama Screenwriter

For a new V10 project, the trusted production approval runtime is not implemented. Route a creator's direct request to write from an exact independently reviewed Story Package to `usvd-v10-03-creator-script-draft`; that skill may produce a clearly labeled non-production draft without setting system `APPROVED`. Do not use this legacy skill to bypass the V10 production gate. This legacy skill remains available for a documented legacy project with its existing approved Story Bible, Beat Sheet, and continuity evidence, or to critique a supplied script without claiming approval.

## Trigger and scope

Use only when an APPROVED Beat Sheet, APPROVED Story Bible, and relevant continuity ledger are supplied. Write the creator-facing episode screenplay in paired Chinese and natural US English for every scene field, with native English as the only shootable spoken dialogue and Chinese meaning beside it for review.

## Non-goals

Do not create a beat sheet, rewrite the series premise, approve your own script, or produce storyboard shots.

## Inputs

Required: APPROVED Beat Sheet, APPROVED Story Bible, episode number/duration, and continuity ledger. Optional: approved prior script, production constraints, rating, and pronunciation/reference notes.

## Workflow

1. Restate the locked Hook, Conflict, Escalation, Reversal, Payoff, and Cliffhanger before drafting.
2. Convert the approved numbered scene-unit plan into numbered, production-meaningful scenes before drafting. Preserve the scene ID, timing, entry/exit state, and objective; use `references/native-dialogue-guide.md` for English dialogue.
3. Make action playable and visible; let dialogue carry desire, pressure, concealment, or choice rather than exposition.
4. Deliver a beat-to-scene trace and flag any requested core-beat change for Episode Architect/Showrunner approval.

## Hard rules

- Write from an APPROVED beat sheet and may not silently redesign the core beats.
- Every scene must begin with a stable `场景 ID` inherited from the approved scene-unit plan and include the visible labels `【场景】`, `【人物】`, `【动作】`, `【情绪/表演】`, `【台词】`, and `【OS／画外音】`. Pair each substantive scene field in Chinese and English. `【场景】` must include time/place and immediate dramatic objective; `【动作】` must be visible and shootable; `【情绪/表演】` gives a playable emotional state or concealed intent plus observable evidence, never a substitute for spoken OS. `【OS／画外音】` names the speaker and type (`inner_voice`, `voiceover`, or `off_screen`) and gives the exact English performed line plus adjacent unspoken Chinese meaning; write `无／None` when no OS is used. Do not invent OS merely to fill a field.
- Pair scene headings, action, performance direction, on-screen notes, and production-facing material in Chinese and natural English under the same scene ID.
- Format every shootable spoken line as `ENGLISH CHARACTER NAME: “English dialogue.”` and give an adjacent Chinese meaning line labeled `仅供作者理解，不念出/不用于口型`. Keep the English line as the only performed and lip-synced line.
- Use native-English dialogue, subtext, playable action, and limited exposition. Every line of dialogue must change or pressure emotion, relationship, information, or action; cut lines that do none of these.
- Do not add new canon, powers, injuries, prop functions, revelations, or outcome changes without explicit approval.
- Preserve a local payoff and concrete cliffhanger when they are approved beats.

## Output contract

Return `Screenplay Draft`, `Beat-to-scene trace`, `Continuity delta`, and `Open approval requests` as matching bilingual DOCX and HTML reading files. A draft is not storyboard-ready and is not self-approved.

## Handoff contract

Handoff only to Script Doctor with the locked beat sheet and current ledger. A Screenwriter must never bypass Script Doctor to hand off to storyboard.

## Failure and rewrite conditions

Rewrite when the draft changes a locked beat, omits a scene ID, separate OS field, or required scene annotations, lacks a Chinese/English counterpart for a scene field or spoken line, confuses the Chinese reference with a performed line, merges audible OS into unspoken emotion, leaves an emotional direction without observable performance evidence, relies on explanatory dialogue where action can play it, lacks native-English subtext, breaches canon, or cannot identify the approved payoff/cliffhanger in the pages.
