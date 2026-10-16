# V8-Inspired Director Execution Contract

Apply this reference when the storyboard package is intended for visual generation, voice execution, or MediaGo-style assembly. It complements the asset ledger and import schema; it does not replace them.

## Project specification is the source of truth

Start each episode with one approved specification: visual medium, aspect ratio, target model/endpoint, maximum generated-video duration, locale, dialogue language, and audio path. If a source template contains conflicting defaults, report the conflict and use the approved project specification.

## V11 standing director authority and revision contract

For a V11 production with an adopted, machine-readable complete-episode `duration_policy` of **60–120 seconds**, the AI director is **already authorized at the project level** to cut, merge, or rewrite dialogue and scene expression when the source is too long. No per-episode `creator_authorized` field, routine manual sign-off, or return to the screenwriter is required. This standing creative authority is not the same as permission to publish a final film. Legacy projects without this policy retain their previous approved-script boundaries.

Before VIDEO/SHOT breakdown, the AI director autonomously produces the new playable `director_revision` and selects a natural complete-episode length. The new revision, rather than outdated source lines, becomes the execution source for downstream shot lists, voices, subtitles and prompts. To make this traceable, machine records include:

- `director_revision.revision_id`, `source_revision_id`, `status: locked`, and the original `source_unit_ids`;
- `director_revision.units[]`, each with stable `unit_id`, linked `source_unit_ids`, `operation` (`retain`, `rewrite`, `merge`, `split`), playable `text`, and a concrete `reason` when changed; `cut_units[]` records source units removed and their reasons;
- `episode_direction` with `objective`, `situation_change`, `character_tactic`, `opponent_response`, `knowledge_sequence`, `emotional_payoff` and `continuing_hook`;
- `story_guards` covering `core_promise`, `character_goals`, `causal_chain`, `emotional_setup_payoff`, `continuity` and `continuing_hook`. Their `preserved` declarations are audit claims, not proof of audience effect or canon correctness;
- each downstream VIDEO references `director_revision_id` and `director_unit_ids`; every SHOT and timed dialogue item references the same revision and one active `director_unit_id`.

The director must decide the dramatic payoff before choosing time; shorten redundant exposition and repeated reactions, not comprehension or character choices. A normal overload is handled by an automatic director rewrite and revalidation without new human approval. When changing protected canon would be necessary, flag that specific conflict rather than invent a new story truth.

The assembled `episode_timing.total_duration_seconds` and `episode_timing.timeline[]` must capture programme time using absolute start/end positions. Count titles, meaningful transitions, endings and audio tails; concurrent dialogue, subtitle and ordinary physical action share their actual time interval and are not added twice. Each model VIDEO stays within the existing 15-second generation constraint, which is separate from the 60–120 second episode gate. Missing/out-of-range runtime, unresolved revision lineage or stale dialogue blocks the machine readiness gate.

Machine checks verify structural traceability, range and continuity fields. Natural read-through, animatic, video-level performance and target-audience response each require separate real evidence and must not be marked PASS without running them.

## Video package

Each independently generatable video package contains:

- `【项目规格】` — approved project specification.
- `【视频编号】` — stable `VIDEO-*` ID, Chinese display name, total duration, and source coverage.
- Human-readable headings use `【视频编号】` and `【镜头编号】`; `VIDEO-*` and `SHOT-*` remain the value-level stable IDs used only for tracing, JSON, and exports.
- `【场景与连续状态】` — location, screen geography, positions, orientation, eye line, inherited pose, active assets, and carry-over effects.
- `【光线】` and `【出场人物】` — the active set state and bound `CHAR-*` / `LOOK-*` IDs.
- `【视频生成总提示词】` — one complete Chinese `VIDEO-PROMPT-*` that can be submitted to the selected video model as-is. It sequences the package from first frame to last frame, names every planned cut, binds all active assets, camera/light/audio progression, continuity in/out, and ending state.
- `【视频级负面约束】` — package-level identity, wardrobe, prop, geography, timing, and unwanted-edit exclusions.
- numbered `SHOT-*` micro-shots — each has `【包内时间】` and normally runs 0.5–3 seconds, playing one clear visual action, insert, reveal, or reaction. The video package is the assembly container; the micro-shot is the independently adjustable generation unit.
- `【声音与台词】` — dialogue/voice, ambience, SFX, and music cues, each with time range and execution responsibility.

Use short packages that respect the chosen endpoint. The V8 compatibility target is 15 seconds maximum per independently generated video, not a universal model claim.

Micro-shots must cover the package timeline without gaps or overlap. A micro-shot over 3 seconds requires `【例外原因】` showing why it cannot safely be divided (for example one uninterrupted English line, a continuous physical action, or an endpoint limitation). A meaningful cut, reaction, information reveal, camera change, or prompt change always starts a new micro-shot.

The VIDEO master prompt is mandatory even when every micro-shot has a local prompt. Submit the VIDEO prompt for the normal one-call video generation; use the SHOT prompt only to regenerate or fine-adjust the selected slice. The two levels must describe the same chronology and locked asset state.

## Shot grammar

Every shot makes its visual priority inspectable:

- camera/framing, angle, motivated movement, focus, and depth;
- subject position plus foreground/midground/background when material;
- a visible action, playable expression, and resultant change;
- active asset IDs, including the costume, prop holder/location, and scene state;
- continuity in/out, screen direction, entry/exit, and prop handoff when relevant.

Use a coherent 180-degree axis unless a deliberate, labeled break is needed. Treat shot-style libraries as optional creative choices, never as an instruction to imitate a named filmmaker.

## Language and operator readability

Creator-readable production descriptions, shot/asset fields, and prompt explanations are paired Chinese and natural English. Keep stable IDs such as `VIDEO-005` and `SHOT-005-03` for traceability; retain required `display_name_zh` / `【中文显示名】` import fields and add the matched English display in the DOCX/HTML view. The approved English spoken line remains the only performed line; provide its Chinese meaning as an unspoken reference. Do not change the locked line through translation.

## Voice and dialogue

Use the approved English name and English spoken line exactly once dialogue is locked. Mark `on-camera`, `off-screen`, `voice-over`, or `inner voice`; only on-camera speech receives lip-sync timing. Give each cue a speaker/voice identifier, performance state, start/end time, and language/locale/accent if supplied. Do not infer a voice ID, audio capability, or model feature.

## Asset and continuity audit

The asset ledger remains the source of truth. Every shot binds `CHAR-*`, `LOOK-*`, `SET-*`, and applicable `PROP-*` IDs. Record wardrobe condition, wounds, dirt/damage, prop owner/location/condition, weather/light, and set changes in machine-checkable fields. Use `Asset Lock Prompt + Shot Delta Prompt`: never rely only on prose inheritance from a previous video.

## Traceability and export

Preserve both mappings:

1. source screenplay unit → `VIDEO-*` → time-coded `SHOT-*` micro-shot;
2. `SHOT-*` → `PROMPT-*` → asset IDs → export row → generation result/status.
3. `VIDEO-*` → `VIDEO-PROMPT-*` → target model submission → generation result/status.

No prompt may be a detached appendix. If the selected MediaGo build has no documented import schema, export a review table only and label the native import fields as pending.
