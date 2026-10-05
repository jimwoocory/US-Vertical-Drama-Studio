# USVDS → Xiaoshuren Media MCP Adapter

This adapter keeps USVDS as the source of truth for story, continuity, Asset Ledger, VIDEO/SHOT and `production-workbench.json`. It does not move those responsibilities into Media MCP.

## P0 mapping

- approved `CHAR-*` / `SET-*` / `PROP-*` with an image prompt → `quote_create` → `generate_image`
- `VIDEO-*` in `ready_to_generate` → `quote_create` → `generate_video`
- Media MCP `job_id`, status and output Asset ids are written back additively under `media_mcp`
- video state moves to `generating` then `review_required`; generated assets keep approval state separate from `generation_state`

`LOOK-*` is intentionally not submitted independently in this first adapter slice. It stays an approved identity/wardrobe binding used by VIDEO/SHOT references.

## Safety boundary

The adapter never sends Provider credentials. It calls only the public Media MCP tool contract. Provider selection, credentials, retries, reconciliation, storage and Job/Asset persistence remain owned by Xiaoshuren Media MCP.
