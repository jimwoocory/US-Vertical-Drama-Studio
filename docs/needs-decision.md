# Needs Decision

## ND-001 — Trusted human-approval source for the hard gate

Status: Direction selected for local feasibility work; production hard-gate decision remains OPEN and blocks V10-01B pending target DSH/NAS verification.

DSH `approval.request` returns an outcome without a human actor identity, the public command API can be invoked in-process, and tool guards do not cover native slash skill injection. Therefore current plugin signals cannot prove that an approval came from the user.

The user selected option 1 for a local, synthetic-data proof of concept. This does not authorize production deployment or establish that a human identity source exists in the target NAS environment.

Local POC `a7676ced074f26ae7fdfe65fcff0f6df403e906b` verifies signed-record mechanics only and always reports human identity unverified / production gate blocked. The current Codex workspace has no installed DSH runtime packages or `dsh` executable, no available Docker Linux daemon, and no connected NAS test profile. An exact public source mapping for DSH `0.2.0-rc.2` was not established in this environment. Therefore no target-runtime or real human-authentication claim has been tested.

Options considered:

1. Use an external authenticated approval service that records a signed approval for a specific artifact digest/revision; DSH only consumes the verified record.
2. Extend/patch DSH to provide an unforgeable human identity and an approval hook that covers tool and slash execution.
3. Keep hard approval blocked until the NAS/DSH environment exposes a trusted identity interface.

Do not replace this gate with prompt wording, an `APPROVED` label, a score, or a command whose user origin cannot be authenticated. The previously agreed Story Truth remains the approved Story Package; Continuity Ledger is derived. The local protocol POC may proceed, but V10-01B and dependent writing skills remain blocked until a real authenticated approval path and controlled artifact entry are verified against target DSH/NAS.

Base test failures are recorded in `docs/status.md`; they are baseline issues, not V10 failures. Do not modify V9 to silence them.
