# USVDS production contract v2 — local implementation

Scope: rule tiers, versioned reference bindings and dependency-based invalidation in the current V11 worktree. This is an unpublished local contract implementation. It does not install a plugin, alter client permissions, submit media jobs or deploy anything.

## Entry points and compatibility

- The original workbench schema and exported `PRODUCTION_WORKBENCH_SCHEMA` remain v1. Legacy reads, validation, Media MCP plan shape and old idempotency keys retain their behavior. Reading v1 adds an explicit unknown freshness annotation, never an inferred production approval.
- New packages explicitly use `PRODUCTION_WORKBENCH_SCHEMA_V2` / `us-vertical-drama-workbench/v2`, current `policy_version`, a nonempty episode/endpoint revision, source and asset evidence, adopted complete-episode duration policy, reference profile and versioned bindings. Unknown versions are rejected at the production boundary.
- The existing V9-named paths remain the actual canonical production contracts. V10 story contracts and the retained legacy ChatGPT plugin are unchanged. Only local V9 generated skill distributions were refreshed; no installation or registry change occurred.
- Do not strip v2 fields or rename a v2 envelope to v1 to submit it to an older runtime. Migrate explicitly with actual evidence; no automatic migration or regeneration is performed.

## Rule ownership

`core/usvd-v9/contracts/production-policy-v2.json` owns stable rule classification. Structural rules block deterministic errors; reviewed rules require exact current host-verified evidence; craft defaults are warnings; taste options are recorded choices. Existing diagnostic rule codes/severity remain available. Unknown rule codes fail closed.

`runPromptQA(package, options)` and `buildProductionSnapshot(package, options)` expose separate machine/review/final gates and `generation_ready`. Micro-shot 0.5–3 seconds, internal prompt budgets and word-rate estimates are advisory in v2; v1 retains its prior behavior. Adopted complete-episode 60–120 seconds, timing closure, approved assets, English execution prompts and verified endpoint limits remain mandatory. An upstream director/voice BLOCKED result cannot be promoted by changing contract versions.

The four required review dimensions are story causality, character agency, reveal/emotional payoff, and visual-reference/continuity suitability. `review_receipt` must bind the current input digest, policy, distinct author/reviewer, run, required rule coverage and evidence. The caller supplies a synchronous trusted `verifyReview` implementation. A package's own `trusted`/PASS flag is never sufficient. An ordinary focused Stage 09 model review returns only its actual scope and digest; it cannot become a whole-package approval automatically. Missing trusted-host integration remains PENDING.

## Reference binding

`reference-binding-v2.schema.json` describes immutable approved asset/version/content hash, VIDEO/visible SHOT scope, purpose, allowed/forbidden controls, input slot, order, relative media path and resolution status. Machine purpose enums are stable English; human labels are Chinese. Supported roles include appearance, subject, look state, spatial layout, composition, scale, effect, first/last frame and style.

The validator resolves real paths under an explicitly supplied `mediaRoot`, rejects escape/symlink traversal outside it, reads local image headers and SHA-256, checks immutable ledger versions and approval, ordered slot uniqueness, reference limits, supported capability combinations and explicit first/last looping. Planned references stay draft-only. Missing references or incompatible modes never silently become text-to-video. Byte checks do not prove image content or artistic suitability; those remain reviewed evidence.

Stage 05 owns identities/versions; Stage 06 declares visible reference intent; Stage 07 refines performance/composition/continuity; Stage 08 validates and compiles ordered provider inputs; Stage 09 aggregates actual checks and scoped review. Final model prompt ownership remains Stage 08.

## Dependency and result validity

`captureArtifactSnapshot` captures a compilation baseline; `analyzeArtifactFreshness(current, previousSnapshot)` compares a derived graph of source units, shared canon, asset versions, references, shots, state carry-over, cut reviews, VIDEO prompts/results, audio, subtitles, episode timing and whole-package review. Missing nodes, duplicates and cycles cannot establish freshness. No externally supplied dependency graph can hide real dependencies from this derivation.

Object key order does not change hashes; dialogue/prompt bytes, ordered references, crop/control intent, versioned assets, target/capability/policy changes do. Display labels, ordinary notes, media filenames and modification times are not generation identity. Media resolution and bytes are rechecked independently. Source-unit edits are scoped to consumers, while whole-package review is invalidated. State changes conservatively propagate to all later cuts; there is no unverified reset shortcut.

The report distinguishes compiled `input_freshness` from generated-result freshness and availability. Capturing a new input snapshot cannot make an older submitted result current: each job receipt pins its VIDEO dependency fingerprint. A current reviewed plan can authorize regeneration while its prior result remains stale. An unchanged prospective result with `not_generated` availability is not an existing reusable film. No deletion, overwriting, job submission or automatic regeneration occurs.

## Media MCP boundary

The v2 plan slice consumes already-resolved visual assets and constructs VIDEO call descriptions only. Default external execution is blocked until the trusted host verifies support for `usvds-media-mcp-request/v2`, immutable inputs and the existing Seedance 2.0 Mini target. The real external v2 transport was not called or validated in this task.

New idempotency keys include actual request identity; identical retries retain the key, changed requests get a different key. Quote binding rechecks current inputs, references, review and a host `verifyQuote` before describing a generate call. Real dispatch must pin the verified bytes and enforce user confirmation. Historical jobs keep their original IDs; querying/collecting an old job does not resubmit it. Receipt replay cannot reset terminal history, and old/stale results cannot replace the active job.

## Tests and rollback

See `docs/reviews/production-v2-acceptance-20261115.md` and its TAP logs for exact results and remaining baseline failures. SDK mocks are explicitly test-only and do not prove real DSH/provider integration.

For rollback, first preserve the working diff and new files. Restore only the files listed in the acceptance report from the pre-upgrade `15edfa0` baseline, remove only the newly created v2 resources/distributions in that manifest, and regenerate matching legacy distributions. Preserve the four pre-existing untracked user notes, all real project media and all remote job receipts. Do not reset the whole workspace, delete projects, or alter global/online plugin state. No rollback command was executed.
