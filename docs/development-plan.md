# V10 Development Plan

## Global constraints

- Base work on commit `67647579153fe73891ee2a6ce3ef1f92842ed9ca`.
- Work only in isolated `codex/<task-id>-<slug>` branches/worktrees.
- Never edit `core/usvd-v9/`, V9 manifests, V9 generators, or generated V9 surfaces.
- User scope is US-facing DSH writing skills; do not build a workbench UI.
- Keep 01=`glm-5.3-flashx`, 02–04=`glm-5.3` unless a new user decision changes routing.
- Preserve bilingual output when requested and the Stage 06–09 `inner_voice`/external-voiceover path.
- No archive packaging, push, publish, or merge to the existing main checkout during these tasks.

## Execution order

1. V10-00 architecture audit; compare the plan against current source and record proposed boundaries.
2. V10-01 Core isolation, artifact/state contracts, approval/SCR enforcement and negative tests.
3. V10-02 Story/episode skills and Story Layer Golden Cases.
4. V10-03 Screenplay, independent review and derived canon/continuity.
5. V10-04 V10-owned downstream compatibility and voice-field regression.
6. V10-05 DSH discovery, distribution checks, tests and docs.

## Design constraints

The approved Story Package is the authoritative Story Truth; the Continuity Ledger is a derived, append-only state projection. Approval binds to a specific artifact revision/digest and human actor. An SCR creates a new revision and invalidates affected downstream approvals/artifacts. Machine hard-fail rules are limited to deterministic structural invariants; semantic judgments require rubric/evidence and must not be represented as deterministic facts.

Each task follows test-first development for behavior changes, runs scoped tests, and records a commit and review result. Existing baseline failures are recorded in `docs/status.md` and must not be attributed to V10.

## Task briefs

### Task 1 — V10-00 Architecture Audit

Allowed path: `docs/v10-architecture.md` only. Produce the V9 source/ownership map, gap analysis, third-party design comparison, and a proposed US-focused V10 writing workflow with explicit artifact, approval, SCR, and regression contracts. Resolve the user's no-workbench scope and preserve bilingual/inner-voice behavior. No production code changes.

Acceptance: document cites actual repository paths and tests; distinguishes deterministic structural invariants from semantic review; identifies one Story Truth and derived Continuity Ledger; calls out runtime enforcement risks; gives a V10-01 starting contract. Owner creates a commit; Integrator reviews it. Baseline remains `6764757`.

### Task 2A — V10-01A Core isolation and manifest

Allowed paths: `core/usvd-v10/README.md`, `core/usvd-v10/manifest.json`, `scripts/check-v10-v9-isolation.mjs`, and `dsh-plugin/test/v10-core-isolation.test.mjs`. Create a clearly in-development V10 Core manifest using the approved stage IDs and routing roles. Prove the checker detects V9-owned tree drift without modifying V9. No DSH approval runtime code.

Acceptance: manifest checks pass; V9 Core and generated roots match the exact Git base inventory and working tree; V9 `check:v9` remains unchanged. Tests demonstrate the checker detects changed and extra files in protected V9 paths.

### Task 2B — V10-01B Trusted approval and state gate

Allowed paths: V10-only DSH gate/domain modules, `core/usvd-v10/contracts/**`, and V10 tests/docs. This task is BLOCKED on ND-001. Implement revision/digest-bound human approval, SCR invalidation, and controller enforcement only after a trusted actor boundary is selected and verified against exact DSH `0.2.0-rc.2`. Add tests for forged AI approval, machine answerer, digest mismatch, stale approval after SCR, slash bypass, and allowed transition after verified human approval.

Acceptance: V9 trees remain unchanged; tests demonstrate each forbidden transition is blocked and an explicitly approved matching revision is allowed. If exact DSH runtime cannot provide the selected trust contract, fail closed and revise ND before writing skills that depend on the hard gate.

### Task 2C — V10-01C Local signed-protocol proof of concept

Allowed paths: `core/usvd-v10/approval-protocol/**` and `dsh-plugin/test/v10-approval-protocol.test.mjs`. Use synthetic artifacts and test-only keys to validate a signed record bound to project, artifact, revision, digest, scope, actor, decision, and event ID. Cover tampering/mismatch rejection, revocation, SCR invalidation, state-version compare-and-swap, and snapshot restore. The protocol must clearly distinguish a cryptographically valid test record from a trusted human approval.

Do not integrate DSH, ship a signing service, access NAS, introduce production keys, or claim a hard gate. The live identity channel and target runtime remain unverified; this POC is preparation for V10-01B only.

### Task 3 — V10-02 Story and episode architecture

Allowed paths: V10 Core Intake/Adaptation, Story Architect, Episode Architect skills/contracts, and V10 story tests. Implement only the smallest set of independently owned skills after V10-01A/B. Include Story Architecture review evidence and Golden Cases for original idea, adaptation, existing screenplay reverse outline, SCR, continuity contradiction, and mandatory failure.

Acceptance: deterministic validators enforce structure only; semantic findings include reviewer evidence. Screenplay transition remains blocked until the exact Story Package revision is human-approved.

### Task 4 — V10-03 Screenplay, review, and canon

Allowed paths: V10 Screenwriter/Script Doctor/Canon skills, contracts, tests, and V10 docs. Enforce approved Story Package inputs, independent script review, derived append-only Continuity Ledger, SCR routing, and bilingual output when explicitly requested.

Acceptance: tests prevent silent changes to approved outcome/reveal/motivation and preserve source-approved inner monologue/voiceover fields through the required downstream handoff.

### Task 5 — V10-04 Downstream compatibility

Allowed paths: V10-owned downstream skills/contracts/tests and generated V10 source only. Preserve V9 Director/Storyboard/Performance/Adapter/QA separation, voice-field schema, and V9 Golden Cases as downstream regression fixtures.

Acceptance: V9 remains unchanged and existing downstream regression behavior is represented in V10 tests without cloning generated distribution trees as authoring truth.

### Task 6 — V10-05 DSH validation and documentation

Allowed paths: V10 DSH catalog/build/test/documentation paths only. Verify discovery, V10 contracts, V9 compatibility checks, and final docs. No workbench UI, archive package, push, publish, or merge to the existing main checkout.

Acceptance: all V10 tests pass; known baseline failures are clearly separated; no V9 tracked file changed. Report the branch and commit evidence.
