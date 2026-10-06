# V10 Task Board

Baseline: `67647579153fe73891ee2a6ce3ef1f92842ed9ca`. V10 work uses isolated `codex/<task-id>-<slug>` branches and worktrees. V9 sources and generated V9 distributions are immutable in this project.

| ID | Status | Owner | Dependencies | Allowed Paths | Acceptance |
| --- | --- | --- | --- | --- | --- |
| V10-00 | REVIEW | `/root/story_architecture_audit` | none | `docs/v10-architecture.md` | Map actual V9 skills/controller/contracts/gates/build/distributions/tests; document gaps and ownership; compare Shuohao, VaporShao and ZenStory without copying; propose US-focused V10 writing stages and approval/state contracts; preserve bilingual and inner-voice requirements; no UI. |
| V10-01 | BLOCKED | unassigned | V10-00, ND-001 | `core/usvd-v10/**`, `dsh-plugin/**` (new gate module/tests only), `scripts/**` (V10-only), `docs/v10-architecture.md`, `docs/task-board.md` | Establish separate V10 Core/manifest and prove V9 byte-identical; implement version/digest-bound human approval, SCR invalidation and deterministic controller enforcement with negative tests. |
| V10-02 | BLOCKED | unassigned | V10-01 | `core/usvd-v10/skills/00-*`, `core/usvd-v10/skills/01-*`, `core/usvd-v10/contracts/**`, V10-only tests | Add minimal Intake/Adaptation, Story Architect and Episode Architect skills/contracts; Story Architecture review evidence; story-layer Golden Cases and structural validators. |
| V10-03 | BLOCKED | unassigned | V10-02 | `core/usvd-v10/skills/02-*`, `core/usvd-v10/skills/03-*`, `core/usvd-v10/skills/04-*`, V10-only contracts/tests | Screenwriter can consume only approved Story Package revision; independent Script Doctor; canon ledger is derived; changes return through SCR; preserve bilingual output when explicitly requested. |
| V10-04 | BLOCKED | unassigned | V10-03 | `core/usvd-v10/skills/05-*` through `09-*`, V10-only tests | Add V10-owned downstream skills/contracts or generated sources; preserve director/model-adapter boundaries, `inner_voice`/external voiceover, and V9 Golden Cases as regression fixtures; V9 remains unchanged. |
| V10-05 | BLOCKED | unassigned | V10-04 | V10-only manifest/build/test/docs paths | Validate V10 DSH discovery, V9 synchronization/regressions, and documentation. No package archive, UI/workbench, push, or publishing in this task. |

Integrator will record implementation and test evidence. Tasks remain REVIEW until branch commits are reviewed; they are not DONE until main integration and main revalidation, which is deferred because the existing main checkout has unrelated staged deletions.
