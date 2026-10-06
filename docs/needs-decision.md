# Needs Decision

## ND-001 — Trusted human-approval source for the hard gate

Status: OPEN; blocks V10-01 hard-gate implementation.

DSH `approval.request` returns an outcome without a human actor identity, the public command API can be invoked in-process, and tool guards do not cover native slash skill injection. Therefore current plugin signals cannot prove that an approval came from the user.

Options presented to user:

1. Use an external authenticated approval service that records a signed approval for a specific artifact digest/revision; DSH only consumes the verified record.
2. Extend/patch DSH to provide an unforgeable human identity and an approval hook that covers tool and slash execution.
3. Keep hard approval blocked until the NAS/DSH environment exposes a trusted identity interface.

Do not replace this gate with prompt wording, an `APPROVED` label, a score, or a command whose user origin cannot be authenticated. The previously agreed Story Truth remains the approved Story Package; Continuity Ledger is derived. The V10-00 audit can proceed while this decision is open.

Base test failures are recorded in `docs/status.md`; they are baseline issues, not V10 failures. Do not modify V9 to silence them.
