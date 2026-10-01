# US writing upgrade task board

Approved scope: US market; core writing skills 01–04; no UI, AstrBot adapter or packaging. Base: 68cf01e130dd565d5014f897a6913226a09ef02c. Branch: codex/usw-01-us-writing. All owners use this isolated worktree with disjoint paths; integrator owns Git operations.

| ID | Status | Owner | Dependencies | Allowed Paths | Acceptance |
| --- | --- | --- | --- | --- | --- |
| USW-00 | REVIEW | writing_baseline | none | docs/us-writing/baseline-behavior.md | Baseline observed; report retained; no business edit |
| USW-01 | REVIEW | writing_architecture | USW-00 baseline observed | core/usvd-v9/skills/01-adaptation/**, core/usvd-v9/skills/02-story-architecture/** | Implemented; final five qualitative probes corrected contract/handoff; scoped commit by integrator |
| USW-02 | REVIEW | writing_script_review | USW-00 baseline observed | core/usvd-v9/skills/03-screenwriter/**, core/usvd-v9/skills/04-review-continuity/** | Implemented; first draft correctly REWRITE on unapproved alibi, revised draft separately reviewed; scoped commit by integrator |
| USW-03 | REVIEW | root | USW-00 | core/usvd-v9/skills/controller/SKILL.md, core/usvd-v9/manifest.json, docs/us-writing/**, scripts/test-us-writing.mjs, scripts/sync-v9-distributions.mjs | Scoped37 regression tests and future-reference1 test passed; no archive files emitted; main integration remains pending |

Integration policy: workers implement and validate; integrator creates scoped commits. No DONE until main integration and main revalidation. Existing main checkout contains staged deletions and must remain untouched; reviewed branch delivery can be REVIEW without DONE. Generated distributions stay at their baseline because user paused packaging; canonical core is the upgraded source and existing distribution-sync check will report intentionally pending updates. No publishing or push is part of this task.

Behavior validation covers model instruction adherence only; it is not a controlled audience trial or proof of commercial performance.
