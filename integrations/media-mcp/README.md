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

## Explicit local v2 contract (unpublished)

V1 package reads, original plan shape, idempotency keys and receipt updates are preserved. V2 uses `us-vertical-drama-workbench/v2` and the Core contracts under `core/usvd-v9/contracts/`. V1 artifacts are never silently migrated, and a v2 package must not be relabelled v1 to bypass checks.

`buildProductionSnapshot(package, { mediaRoot, verifyReview })` and `runPromptQA` recompute structural checks, actual local reference-image hashes, the derived dependency graph and the exact current review digest. `verifyReview(receipt, inputDigest)` is an injected synchronous host verifier, not a package flag; absent or failed verification leaves review PENDING. The four reviewed policy rules require scoped evidence. Test fixtures use an explicitly synthetic in-memory verifier and do not establish real reviewer identity.

Before building a v2 submission plan, call `captureArtifactSnapshot` only after actual compilation/validation and preserve the old snapshot for comparison. `analyzeArtifactFreshness` returns current/stale/unknown per artifact, removed nodes and reasons; it does not overwrite media, receipts, source, or jobs. State propagation is conservative through all later cuts; no unverified reset marker shortens it. Editing one member of a one-call VIDEO may stale the complete VIDEO result. Missing graph information never establishes reuse eligibility.

`input_freshness` describes the compiled inputs separately from result freshness. A receipt pins the submitted VIDEO dependency fingerprint: capturing a new compilation snapshot cannot relabel an old generated result as current. Current approved inputs may authorize a replacement generation while the historical result remains stale. `availability: not_generated` never asserts an existing usable media result.

`buildMediaMcpPlan(package, options)` requires `mediaRoot`, `verifyReview` and an explicitly host-verified `mediaMcpContract: 'usvds-media-mcp-request/v2'`. Only the current Seedance 2.0 Mini public model is accepted. V2 visual assets must already be resolved upstream; this slice plans VIDEO requests only. The real external Media MCP v2 transport is **NOT VERIFIED** and the default remains blocked. No network calls occur in these functions.

`bindGenerateCall` rechecks the current package, bytes, plan and `verifyQuote(quote, currentTarget)` before producing a call description. The host must verify the exact provider quote and user confirmation, and pin verified inputs for dispatch; a model must not install an always-true verifier. The transport must support ordered versioned reference bindings, capability checks and immutable media inputs before real execution. These checks neither create an OAuth grant nor authorize charging or publishing.

For v2 job receipts supply `request_fingerprint` and `public_model_id` from the original plan. Changed execution inputs produce a different idempotency key; identical retries retain the same key. Prior job IDs remain under `media_mcp_history`. Query/collect existing remote jobs using their original IDs; stale or historical results cannot replace the active job or become current-ready. Generation success still requires subsequent quality review.
