# Production Workbench Manifest

For every storyboard delivery, emit `production-workbench.json` beside the readable review package. It is the status source for the DSH production workbench and MediaGo handoff; it never replaces the human-readable screenplay, asset ledger, or shot package. Keep the `/v1` schema identifier for backward compatibility, but use the additive `videos` and time-coded micro-shot fields below for the visual workbench.

```json
{
  "schema_version": "us-vertical-drama-workbench/v1",
  "episode_id": "EP-001",
  "episode_display_name_zh": "第 1 集：拍卖厅的火花",
  "assets": [
    { "id": "CHAR-EVE", "display_name_zh": "女主角：伊芙", "kind": "character", "status": "approved" },
    { "id": "LOOK-EVE-NIGHT", "kind": "look", "status": "approved" },
    { "id": "SET-AUCTION", "kind": "set", "status": "approved" },
    { "id": "PROP-BOTTLE", "kind": "prop", "status": "approved" }
  ],
  "videos": [
    {
      "video_id": "VIDEO-001",
      "display_name_zh": "伊芙发现入口异动",
      "source_scene_id": "EP01-SC01",
      "duration_seconds": 8,
      "status": "ready_to_generate"
    }
  ],
  "shots": [
    {
      "shot_id": "SHOT-001",
      "video_id": "VIDEO-001",
      "display_name_zh": "伊芙回头看向入口",
      "prompt_id": "PROMPT-001",
      "source_scene_id": "EP01-SC01",
      "timeline_in_seconds": 0,
      "timeline_out_seconds": 1.6,
      "duration_seconds": 1.6,
      "shot_type": "反应",
      "generation_mode": "independent",
      "asset_ids": ["CHAR-EVE", "LOOK-EVE-NIGHT", "SET-AUCTION", "PROP-BOTTLE"],
      "asset_lock_prompt": "Approved immutable asset anchors.",
      "shot_delta_prompt": "Only the shot-specific action, composition and motion.",
      "negative_prompt": "Explicit identity, wardrobe, prop and geography exclusions.",
      "status": "ready_to_generate"
    }
  ],
  "tasks": [
    { "id": "TASK-001", "status": "todo", "targets": ["SHOT-001"] }
  ]
}
```

Use `character`, `look`, `set`, or `prop` for asset kinds. Asset status is `draft`, `pending_approval`, `approved`, or `blocked`. Shot status is `draft`, `blocked`, `ready_to_generate`, `generating`, `review_required`, or `approved`. Task status is `todo`, `in_progress`, `blocked`, `review`, or `done`.

A video package may not exceed 15 seconds in V8-compatible mode. Its child shots are time-coded micro-shots: each must fit inside its parent video, their ranges must be contiguous with no overlap, and each should be 0.5–3 seconds. A longer micro-shot requires `duration_exception_reason_zh`; a shorter one requires `short_duration_reason_zh` when it is under 0.5 seconds. `shot_type` and `generation_mode` must use Chinese production terms (for example `反应`, `特写插入`, `动作`, `对白`; `independent`, `extend`, `image_to_video` respectively). `display_name_zh` is required for every human-visible video and shot.

A shot may move to `ready_to_generate` only after every bound asset is `approved`, all three prompt layers are present, source/trace IDs are present, its parent video is valid, and the micro-shot has a valid timeline. Do not turn unresolved items green: retain them as `blocked` with an explicit task or continuity warning.
