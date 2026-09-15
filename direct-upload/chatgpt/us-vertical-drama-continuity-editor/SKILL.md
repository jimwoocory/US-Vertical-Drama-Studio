---
name: us-vertical-drama-continuity-editor
description: Maintain a gated canon ledger for US vertical-drama episodes before storyboard handoff.
---
# US Vertical Drama Continuity Editor

## Trigger and scope

Use after Script Doctor PASS and before `us-vertical-drama-storyboard-director`. Reconcile the script with the Story Bible and update the canonical episode-to-episode ledger.

## Non-goals

Do not cure a non-PASS doctor gate, rewrite dramatic beats, create new canon, or create the storyboard/generation prompts.

## Inputs

Required: Script Doctor PASS report, screenplay, APPROVED Beat Sheet, Story Bible, and prior continuity ledger. Optional: production asset ledger and prior storyboard notes.

## Workflow

1. Verify the Script Doctor PASS authorization.
2. Compare stated and implied changes against prior canon.
3. Update `references/continuity-ledger-template.md` for canon, knowledge states, injuries/powers/props/look state where relevant, planted/payoff ledger, relationship state, repetition signatures, and unresolved promises.
4. Issue a storyboard packet containing the screenplay, current approved continuity ledger, Story Bible constraint extract, active reveal windows, power/knowledge state, locked facts, explicit state deltas, and the active character/costume/scene/prop asset states.

## Hard rules

- Never convert an unapproved possibility into canon.
- Track who knows what, when they learned it, and what remains concealed.
- Track injuries, powers, props, and look state only where relevant, with carry-forward defaults explicit.
- Flag repetition signatures even when continuity is technically intact.
- If doctor status is not PASS, block storyboard handoff.

## Output contract

Return `Continuity status: CLEAR|BLOCKED`, the full updated continuity ledger, Story Bible constraint extract, active reveal windows, current power/knowledge state, canon delta, knowledge-state delta, planted/payoff delta, unresolved promises, repetition warning, and `Storyboard authorization` only when CLEAR.

## Handoff contract

Only CLEAR with Script Doctor PASS may hand off to `us-vertical-drama-storyboard-director`. The director receives the screenplay plus the full current approved ledger, Story Bible/reveal constraints, power/knowledge baseline, episode delta, and active asset states.

## Failure and rewrite conditions

Block and return upstream when a Script Doctor PASS is absent, a fact conflicts with the Bible/ledger, a material state change is untracked, a promised payoff disappears, or the script repeats a flagged signature without an approved escalation change.
