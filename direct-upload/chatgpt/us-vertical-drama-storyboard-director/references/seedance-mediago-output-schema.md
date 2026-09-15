# Seedance / MediaGo Shot Output Schema

Use one record per `SHOT-*`. Keep the same `scene_id`, `shot_id`, and approved asset IDs in the screenplay, prompt map, and import output. Emit a Markdown table for review; additionally emit JSON or CSV only when the selected MediaGo build specifies an accepted import format.

| Field | Required | Meaning |
|---|---:|---|
| `scene_id`, `video_id`, `shot_id`, `prompt_id` | yes | Stable source, independent-video, shot, and prompt-placement IDs. |
| `target_model` | yes | Selected target, e.g. `Seedance 2.0`; never assume a capability. |
| `aspect_ratio`, `duration_seconds` | yes | User-selected format and planned duration; duration cannot exceed the selected model limit. |
| `character_reference_ids`, `look_reference_ids`, `scene_reference_id`, `prop_reference_ids` | yes when applicable | Approved `CHAR/LOOK/SET/PROP` IDs and approved image/reference paths. |
| `asset_lock_prompt`, `shot_delta_prompt`, `negative_prompt` | yes | Immutable approved asset anchors, the shot-specific change, and exclusions. |
| `camera`, `continuity_in`, `continuity_out` | yes | Composition/movement plus inter-shot state and screen-direction continuity. |
| `source_coverage`, `asset_state_in`, `asset_state_out` | yes | Source unit mapping plus machine-checkable wardrobe, prop, set, weather/light, and damage state. |
| `dialogue_audio`, `lip_sync_timing` | required when dialogue is spoken | Exact approved English line(s), speaker, and start/end seconds; otherwise `none`. |
| `voice_cues` | yes | Dialogue/voice, ambience, SFX, and music cues with time range and execution responsibility; mark unsupported model features as external. |
| `start_frame_reference`, `end_frame_reference`, `seed` | optional | Supply only when supported and selected. |
| `export_row`, `generation_status`, `generation_result_id` | yes / pending / optional | Stable row ID, `pending` until generated, and a returned result ID only after the target system provides one. |

## Seedance use

Treat `target_model: Seedance 2.0` as a target label, not proof of a specific duration, reference-image, seed, frame-control, or audio feature. Obtain those limits from the user’s enabled endpoint or current MediaGo adapter; validate against them before export.

## MediaGo handoff

MediaGo receives the Asset Creation Pack first, then approved reference IDs/paths, followed by one shot record per `SHOT-*`. If MediaGo has no structured-import adapter, return the same fields as a review table and preserve the prompt-placement map; do not pretend a generic JSON blob can be imported. The native adapter must map `VIDEO-*`, `SHOT-*`, `PROMPT-*`, asset IDs, and `export_row` without flattening them away.
