# USVDS → Xiaoshuren Media MCP Adapter

This is the thin USVDS-side integration boundary approved by the architecture review.

It does **not** move drama-domain logic into Xiaoshuren Media MCP. USVDS remains
the owner of canon, continuity, asset locks, VIDEO/SHOT packages and creative
approval. Media MCP remains the generic execution runtime.

## P0 client port

The adapter expects a transport object with these methods:

- `quoteCreate(input)`
- `generateImage(input)`
- `generateVideo(input)`
- `jobGet(input)`
- `assetGet(input)`

The shapes mirror the P0 Remote MCP tool contracts. The transport can later be
an MCP client without changing Workbench translation code.

`createMediaMcpToolClient(callTool)` is included for that handoff. It maps the
narrow client port to the real MCP tool names `quote_create`,
`generate_image`, `generate_video`, `job_get`, and `asset_get`.

## Additive Workbench fields

`schema_version` remains `us-vertical-drama-workbench/v1`.

Optional generation input fields:

- assets: `image_prompt`, `negative_prompt`, `aspect_ratio`,
  `public_model_id`, `reference_media_asset_ids`
- videos: `media_prompt`, `media_negative_prompt`, `public_model_id`,
  `aspect_ratio`, `video_resolution`, optional `media_mode`

`target_model` remains the USVDS model/display label. It is not assumed to be
the Media MCP route id. Media execution requires an explicit
`public_model_id`.

`bindAssetGenerationSpec()` and `bindVideoGenerationSpec()` project the
approved Stage 05 / Stage 08 execution facts into these additive Workbench
fields without rewriting the upstream creative/directing fields.

The adapter adds top-level `media_executions[]` records using
`usvd.media-execution/v1`.

Execution state and creative approval are separate:

- active Media MCP job → VIDEO may be `generating`;
- successful VIDEO job + ready Asset → VIDEO becomes `review_required`;
- successful asset-image job + ready Asset → asset becomes `review_required`;
- **never** set `approved` automatically.

## Idempotency and stale-result safety

The adapter derives a stable request key from episode + target + generation
inputs + model. The same request reuses the existing `media_executions[]`
record instead of submitting another paid generation.

Each execution stores `workbench_revision`. If prompt/asset linkage/timing or
other generation inputs change before a result is synchronized, writeback fails
with `STALE_WORKBENCH_REVISION` and does not attach the old result to the new
creative state.
