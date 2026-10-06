# Project Status

Current baseline: `67647579153fe73891ee2a6ce3ef1f92842ed9ca` (`codex/dsh-03-zhipu-routing`).

Current V10 branch: `codex/v10-00-architecture-audit` (isolated worktree).

Current phase: V10 Core isolation. `V10-00` and `V10-01A` passed independent spec review and remain REVIEW pending eventual main integration/reverification. `V10-01B` hard approval enforcement remains BLOCKED by ND-001.

V9 is frozen as the compatibility baseline. This work targets DSH-native writing skills and artifacts; no workbench UI, archive packaging, push, or publish is in scope for this phase.

Baseline `npm test` result on `6764757`: 55 passed, 2 failed. The failures are a missing local `@deepseek-ai/dsh-tools` dependency in `stage09-review-executor.test.mjs` and an existing generated ChatGPT/Codex controller mirror mismatch in `v9-distribution.test.mjs`. The V9 synchronization check and all other tests passed.

Current action: V10-01A implementation commit `3ddf395145bf53a40a0ccb6ff02fb8a7280e610e` is independently approved; focused tests passed 15/15, the V9 isolation checker passed against all seven protected paths, and V9 distribution sync passed. No task is currently READY: V10-01B and downstream work remain blocked by ND-001 until the trusted approval identity boundary is decided. DSH runtime audit found no authenticated human actor on existing approval signals; V9 compatibility audit is complete.
