# V8-Inspired Director Execution Contract

Apply this reference when the storyboard package is intended for visual generation, voice execution, or MediaGo-style assembly. It complements the asset ledger and import schema; it does not replace them.

## Project specification is the source of truth

Start each episode with one approved specification: visual medium, aspect ratio, target model/endpoint, maximum generated-video duration, locale, dialogue language, and audio path. If a source template contains conflicting defaults, report the conflict and use the approved project specification.

## Video package

Each independently generatable video package contains:

- `【项目规格】` — approved project specification.
- `【视频编号】` — stable `VIDEO-*` ID, total duration, and source coverage.
- `【场景与连续状态】` — location, screen geography, positions, orientation, eye line, inherited pose, active assets, and carry-over effects.
- `【光线】` and `【出场人物】` — the active set state and bound `CHAR-*` / `LOOK-*` IDs.
- numbered `SHOT-*` records — each shot plays one clear visual action from start through consequence.
- `【声音与台词】` — dialogue/voice, ambience, SFX, and music cues, each with time range and execution responsibility.

Use short packages that respect the chosen endpoint. The V8 compatibility target is 15 seconds maximum per independently generated video, not a universal model claim.

## Shot grammar

Every shot makes its visual priority inspectable:

- camera/framing, angle, motivated movement, focus, and depth;
- subject position plus foreground/midground/background when material;
- a visible action, playable expression, and resultant change;
- active asset IDs, including the costume, prop holder/location, and scene state;
- continuity in/out, screen direction, entry/exit, and prop handoff when relevant.

Use a coherent 180-degree axis unless a deliberate, labeled break is needed. Treat shot-style libraries as optional creative choices, never as an instruction to imitate a named filmmaker.

## Voice and dialogue

Use the approved English name and English spoken line exactly once dialogue is locked. Mark `on-camera`, `off-screen`, `voice-over`, or `inner voice`; only on-camera speech receives lip-sync timing. Give each cue a speaker/voice identifier, performance state, start/end time, and language/locale/accent if supplied. Do not infer a voice ID, audio capability, or model feature.

## Asset and continuity audit

The asset ledger remains the source of truth. Every shot binds `CHAR-*`, `LOOK-*`, `SET-*`, and applicable `PROP-*` IDs. Record wardrobe condition, wounds, dirt/damage, prop owner/location/condition, weather/light, and set changes in machine-checkable fields. Use `Asset Lock Prompt + Shot Delta Prompt`: never rely only on prose inheritance from a previous video.

## Traceability and export

Preserve both mappings:

1. source screenplay unit → `VIDEO-*` → `SHOT-*`;
2. `SHOT-*` → `PROMPT-*` → asset IDs → export row → generation result/status.

No prompt may be a detached appendix. If the selected MediaGo build has no documented import schema, export a review table only and label the native import fields as pending.
