# Intake routing and US adaptation decisions

This guide supports `00-intake-adaptation`. It describes decisions at the entrance to V10; it does not replace independent story or outline review.

## Classify by evidence, then by request

Read the supplied artifact before choosing a route. A filename or the creator's label is not proof that an outline is complete. A complete outline follows the major causal turns through a climax and resolution; a treatment that stops at the premise is still an idea. When a full screenplay is supplied for quality assessment, choose `existing_script_reverse_story` even if the user calls it an outline. When source material and a separate US adaptation direction are both supplied, choose `source_selected_direction`.

For `completed_outline_audit`, identify what the existing outline claims and send it to diagnosis. Do not repair it inside Intake. For `existing_script_reverse_story`, first reconstruct the protagonist's actual decisions, opposition, changed states, climax, and ending from the script, with scene locators. The reconstructed story is the object of diagnosis. A polished English script can still have an unworkable story engine.

For `simple_idea` and `source_adaptation`, give the creator 2–3 short directions when the core engine is unsettled. Each card must answer: what emotional result is promised, what the protagonist actively does, who can stop them, what the action costs, and which US social or institutional arrangement creates that pressure. Directions must differ in choices and consequences, not only in occupation, city, or character names. If no credible alternatives can be formed from the available material, state the missing premise decision in `open_decisions`; do not fabricate details.

For `source_selected_direction`, record the user's exact intended direction, then check its engine. Preserve the user's selection as a decision, but mark any proposed mechanism repair as `ai_proposal`. If the selected direction is implausible, explain the specific break and offer a repair for that direction before suggesting a replacement.

## Preserve payoff; rebuild the mechanism

Summarize the source's emotional promise in ordinary language: what the audience expects to feel when the protagonist wins, loses, or uncovers the truth. Identify how four mechanisms deliver it:

| Dimension | Question for the source | Question for the US version |
| --- | --- | --- |
| Power | Who can impose a meaningful constraint, and through what authority or dependence? | Who has credible leverage in this US setting, and what limits it? |
| Relationship | Why do people stay, trust, betray, protect, or obey? | Which specific bond or dependency would make that behavior plausible? |
| Cost | What can the protagonist lose by acting? | What immediate, visible price makes each strategy a consequential choice? |
| Causality | Why does one action produce the next reversal? | Which US facts, rules, incentives, or character choices make that result follow? |

Fill `adaptation_mechanism_map` for all four dimensions when the source supplies enough evidence. If coverage is partial, record the gap and mark the dimension `unresolved`; do not invent the missing source. `us_plausibility` must explain the character or setting logic, and must label any unverified legal, medical, workplace, or institutional premise. A proposed US equivalent must change how the conflict operates where needed while preserving the chosen emotional payoff.

Reject a proposed adaptation direction at this gate when the only changes are English names, US place labels, literal dialogue translation, or generic American decoration while decisive pressure still relies on the original culture's unstated hierarchy or obligations. Name the failed mechanism and the required redesign. Do not smooth it over with fluent prose.

## Direction record and handoff

Assign stable IDs to direction cards. An explicit creator choice sets `direction_selection.status: user_selected` and uses the matching `direction_id`; a model recommendation leaves `awaiting_user_selection` with a null selected ID. A creator-supplied selected direction can be represented by a single card. For an outline or script diagnostic, `not_applicable` and an empty card list are valid.

Use `next_step_for_user` to say exactly what happens next: choose among cards, receive an outline diagnosis, receive a script-derived story diagnosis, check a selected adaptation direction, or proceed to a complete story. Diagnostic handoffs do not imply approval. Full-story drafting follows an explicit direction choice and a plausible conflict mechanism; unresolved adaptation failures return to direction work.

These entry patterns borrow three distinct methods: source selection and a quick creator-facing skeleton; staged handoff of a chosen brief; and comparison of genuinely different conflict engines. V10 retains its own story architecture and independent review stages.
