# Needs Decision

## ND-001 — Trusted human-approval source for the hard gate

Status: Direction selected for local feasibility work; production hard-gate decision remains OPEN and blocks V10-01B pending target DSH/NAS verification.

DSH `approval.request` returns an outcome without a human actor identity, the public command API can be invoked in-process, and tool guards do not cover native slash skill injection. Therefore current plugin signals cannot prove that an approval came from the user.

The user selected option 1 for a local, synthetic-data proof of concept. This does not authorize production deployment or establish that a human identity source exists in the target NAS environment.

Local POC `a7676ced074f26ae7fdfe65fcff0f6df403e906b` verifies signed-record mechanics only and always reports human identity unverified / production gate blocked. The official `@deepseek-ai/dsh` npm page lists `0.2.0-rc.2`, and the matching official release commit is `639ed015397290b3745d163aafe02ffee4aa3f84` ([release commit](https://github.com/deepseek-ai/deepseek-harness/commit/639ed015397290b3745d163aafe02ffee4aa3f84), [npm package](https://www.npmjs.com/package/@deepseek-ai/dsh)). At that commit, the approval docs describe one-shot `allowed-once` outcomes, human or machine answerers, and no durable grant/revocation store; the request/outcome contract does not itself provide a trusted human-actor claim ([approval subsystem](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/docs/subsystems/approval.md), [package limits](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/interaction/user-approval/README.md#known-limitations-and-deferred-work)).

This is fixed-version source evidence, not a runtime test. `npm view` cannot reach `registry.npmjs.org` in the current environment (`ENOTFOUND`), so the package tarball/integrity and actual installed dependency graph remain unverified. The workspace has no installed DSH runtime or `dsh` executable, no available Docker Linux daemon, and no connected NAS test profile. Therefore no target-runtime or real human-authentication claim has been tested.

Options considered:

1. Use an external authenticated approval service that records a signed approval for a specific artifact digest/revision; DSH only consumes the verified record.
2. Extend/patch DSH to provide an unforgeable human identity and an approval hook that covers tool and slash execution.
3. Keep hard approval blocked until the NAS/DSH environment exposes a trusted identity interface.

Do not replace this gate with prompt wording, an `APPROVED` label, a score, or a command whose user origin cannot be authenticated. The previously agreed Story Truth remains the approved Story Package; Continuity Ledger is derived. The local protocol POC may proceed, but V10-01B and dependent writing skills remain blocked until a real authenticated approval path and controlled artifact entry are verified against target DSH/NAS.

Base test failures are recorded in `docs/status.md`; they are baseline issues, not V10 failures. Do not modify V9 to silence them.
