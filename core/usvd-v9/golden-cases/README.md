# USVD V9 Golden Cases

These records compare the legacy prompt-engine shape with the V9 director → adapter → QA pipeline while holding source coverage, approved assets and the normalized `Seedance 2.0 Mini` endpoint profile constant.

## Machine regression result

| Case | Provenance | Legacy baseline | V9 | Machine change | Rendered-video review |
|---|---|---:|---:|---|---|
| `GC-01-ARCHIVE-KEY` | `plugins/us-vertical-drama-studio/fixtures/v1.2-ep01-mediago-video-package.md` | `BLOCKED` — 1 blocker + 1 major | `PASS` — 0 defects | adds required VIDEO master; supplies motivated camera direction; preserves external audio/lip-sync ownership | `pending` |
| `GC-02-AUCTION-ENTRY` | `fixtures/production-workbench-ep01.json` | `REVISE` — 16 major | `PASS` — 0 defects | adds narrative purpose, performance transition, composition priority and cut motivation to all four shots | `pending` |

## Interpretation boundary

A machine `PASS` means the structured V9 package satisfies the deterministic checks implemented in `scripts/v9-prompt-qa-validation.mjs`. It does **not** claim that a rendered V9 video has already been watched or is subjectively superior.

Actual generated-video comparison remains `pending` until baseline and V9 videos are produced with the same endpoint/settings and reviewed using `references/prompt-qa-human-checklist.md`.

## Reproduction

The Golden Cases are loaded by `dsh-plugin/test/v9-prompt-qa.test.mjs`. Running `npm test` verifies the expected legacy gate, expected V9 gate, stable defect localization, and all previous DSH/workbench compatibility tests in the same suite.
