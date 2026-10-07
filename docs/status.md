# Project Status

Current baseline: `67647579153fe73891ee2a6ce3ef1f92842ed9ca` (`codex/dsh-03-zhipu-routing`).

Current V10 branch: `codex/v10-00-architecture-audit` (isolated worktree).

Current phase: V10 Core isolation and approval protocol preparation. `V10-00`, `V10-01A`, local signed-protocol POC `V10-01C`, citation evidence update `V10-00C`, and fixture portability fix `V10-01D` passed independent review and remain REVIEW pending integration/reverification. Production hard approval enforcement `V10-01B` remains BLOCKED pending exact DSH/NAS trusted-identity verification.

V9 is frozen as the compatibility baseline. This work targets DSH-native writing skills and artifacts; no workbench UI, archive packaging, push, or publish is in scope for this phase.

Baseline `npm test` result on `6764757`: 55 passed, 2 failed. The failures are a missing local `@deepseek-ai/dsh-tools` dependency in `stage09-review-executor.test.mjs` and an existing generated ChatGPT/Codex controller mirror mismatch in `v9-distribution.test.mjs`. The V9 synchronization check and all other tests passed.

Current action: review the follow-up evidence and prepare the NAS runtime experiment. V10-01C commit `a7676ced074f26ae7fdfe65fcff0f6df403e906b` implements only a local signed-protocol POC; its records still report `human_identity: UNVERIFIED` and `production_gate: BLOCKED`. This workspace has no target DSH runtime, NAS profile, or verified human-auth channel. V10-01A commit `3ddf395145bf53a40a0ccb6ff02fb8a7280e610e` remains independently approved; V9 isolation and synchronization checks passed.
