# US Vertical Drama Studio Skill Pack v1.2 Design and Acceptance Plan

## Decision

The canonical runtime source is `plugins/us-vertical-drama-studio`. It is an independent eight-skill pack (one orchestrator plus seven specialists) and does not alter any embedded built-in pack. It includes shared references, process fixtures, asset-creation rules, and a structured Seedance/MediaGo storyboard handoff. Version 1.2 integrates a V8-inspired director execution contract as a production layer: independently generatable video packages, visible shot grammar, voice instructions, source coverage, and traceable export rows remain bound to the existing asset ledger.

`packages/instructions/pkg/pack/usvertical.Export` is the deterministic adapter. It validates the canonical pack first, then emits MediaGo, an OpenAI ChatGPT/Codex marketplace plugin, ChatGPT direct-upload folders, and Claude direct-upload folders plus one ZIP per skill. The adapters copy canonical skill text verbatim and create only packaging metadata; business rules never live in a second prompt copy. Every target skill receives the exact `references/...` files it names, so runtime-relative links resolve from the individual skill directory. The command `go run ./cmd/us-vertical-drama-export <source> <output>` is the reproducible build interface.

The marketplace uses `.agents/plugins/marketplace.json` and `plugins/us-vertical-drama-studio/.codex-plugin/plugin.json`. Its six skills live under the plugin, while each ChatGPT direct package is independently uploadable and each Claude ZIP contains exactly one skill folder with `skill.md` at its root. These are deliberately separate distribution surfaces.

## Workflow boundary

```text
US Adaptation → Showrunner → Episode Architect → Screenwriter → Script Doctor → Continuity Editor → Storyboard Director → Seedance/MediaGo handoff
```

The approval boundary is intentionally strict: only an APPROVED Story Bible reaches Episode Architect, only an APPROVED Beat Sheet reaches Screenwriter, only Script Doctor PASS reaches Continuity Editor, and only Continuity CLEAR reaches Storyboard Director. Storyboard Director then emits an asset-creation package, V8-style video packages, shot package, and selected-model handoff without changing dramatic canon. The project specification is the source of truth, so legacy defaults such as 16:9 animation cannot silently override an approved 9:16 live-action US project.

## Acceptance matrix

| Requirement | Evidence |
|---|---|
| Six named skills with uniform contracts | `pkg/pack/usvertical/export_test.go:TestCanonicalPackHasSixGatedSkillsAndSharedReferences` |
| US plausibility rather than literal Chinese-trope transfer | Adapter skill and `us-cultural-plausibility-checklist.md` |
| 40-100 episode showrunning engine | Showrunner skill, story bible and season arc templates |
| EP01 retention anchors and explicit beat fields | Episode Architect skill and beat template |
| Screenwriter preserves approved beats | Screenwriter hard rules and handoff contract |
| Independent 100-point doctor gate | Script Doctor skill and rubric |
| Continuity state tracking | Continuity Editor skill and ledger template |
| Existing storyboard behavior isolated | New independent pack; no builtin asset changes |
| Official OpenAI marketplace manifest, no legacy `.cod` | `TestExportCreatesOfficialMarketplaceAndDirectUploadStructures` |
| Per-skill resource resolution and Claude ZIP root | `TestEveryExportedSkillResolvesItsOwnReferencedResources` |
| One source, deterministic multi-distribution export | `usvertical.Export` and `TestExportIsDeterministicAndDoesNotModifyBuiltInWritingSkills` |
| Norse 80x90s process regression | `fixtures/norse-royal-revenge-ep01.workflow.md` and structural test |
| Parser/discovery compatibility | Canonical source parsed with `pack.ParseDir` in structural test |

## Verification plan

1. Run `go test ./pkg/pack/usvertical` to validate source content, parser compatibility, official marketplace metadata, resource resolution, Claude ZIP roots, fixtures, and deterministic exports.
2. Run `go test ./cmd/us-vertical-drama-export` to validate build-command argument handling.
3. Run `go run ./cmd/us-vertical-drama-export ./packs/us-vertical-drama-studio ../../distribution/export` to regenerate tracked distributions.
4. Because `task` is unavailable, run direct Taskfile equivalents with `GOTMPDIR`, `GOCACHE`, `GOMODCACHE`, and `GOPATH` outside `packages/instructions`; run formatting only over repository source files so an ignored legacy `.tmp` cache cannot be scanned.
