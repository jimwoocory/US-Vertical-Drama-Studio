# Project Status

Current baseline: `67647579153fe73891ee2a6ce3ef1f92842ed9ca` (`codex/dsh-03-zhipu-routing`).

Current V10 branch: `codex/v10-00-architecture-audit` (isolated worktree).

Current phase: V10 Core isolation. `V10-00` was spec-approved by independent review; its task board remains REVIEW pending eventual main integration. `V10-01A` is READY; `V10-01B` hard approval enforcement remains BLOCKED by ND-001.

V9 is frozen as the compatibility baseline. This work targets DSH-native writing skills and artifacts; no workbench UI, archive packaging, push, or publish is in scope for this phase.

Baseline `npm test` result on `6764757`: 55 passed, 2 failed. The failures are a missing local `@deepseek-ai/dsh-tools` dependency in `stage09-review-executor.test.mjs` and an existing generated ChatGPT/Codex controller mirror mismatch in `v9-distribution.test.mjs`. The V9 synchronization check and all other tests passed.

Current action: start `V10-01A` Core isolation and manifest from the reviewed architecture. DSH runtime audit found no authenticated human actor on existing approval signals; ND-001 is open and blocks hard-gate implementation in V10-01B. V9 compatibility audit is complete.
