# Production Workbench Manifest

For every storyboard delivery, emit `production-workbench.json` beside the readable review package. It is the status source for the DSH production workbench and MediaGo handoff; it never replaces the human-readable screenplay, asset ledger, or shot package.

```json
{
  "schema_version": "us-vertical-drama-workbench/v1",
  "episode_id": "EP-001",
  "assets": [
    { "id": "CHAR-EVE", "kind": "character", "status": "approved" },
    { "id": "LOOK-EVE-NIGHT", "kind": "look", "status": "approved" },
    { "id": "SET-AUCTION", "kind": "set", "status": "approved" },
    { "id": "PROP-BOTTLE", "kind": "prop", "status": "approved" }
  ],
  "shots": [
    {
      "shot_id": "SHOT-001",
      "video_id": "VIDEO-001",
      "prompt_id": "PROMPT-001",
      "source_scene_id": "EP01-SC01",
      "duration_seconds": 8,
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

A shot may move to `ready_to_generate` only after every bound asset is `approved`, all three prompt layers are present, source/trace IDs are present, and the independent video duration is no more than 15 seconds in V8-compatible mode. Do not turn unresolved items green: retain them as `blocked` with an explicit task or continuity warning.
