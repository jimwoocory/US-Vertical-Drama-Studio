# USVDS V10 Core — in development

This independent canonical root is `core/usvd-v10`, version `0.10.0-preview.1`.
Its manifest is a planning scaffold: every skill is `planned` and non-runnable.
Listed canonical paths describe future files; no skill bodies, generated DSH
catalog, provider integration, or trusted approval runtime exist here yet.

The architecture contract is [docs/v10-architecture.md](../../docs/v10-architecture.md).
V10 defaults to US-facing, `writing-only` delivery, Chinese production notes and
natural American English dialogue. Explicit bilingual requests preserve both
languages without creating duplicate spoken dialogue. Audience and commercial
validation remain untested.

The planned writing flow is Intake/Adaptation → Story Architect → independent
Story draft review → Episode Architect → independent full Story Package review
→ trusted human approval of the exact package revision/digest → Screenwriter
→ independent Script Doctor → derived Continuity Ledger. The Story Package is
the sole project Story Truth; the Ledger is a projection, not another Bible.
ND-001 blocks trusted approval implementation. This scaffold does not enforce
or claim that gate, and does not authorize Screenwriter execution.

Manifest `routing_role` expresses the existing model contract independently of
directory numbering: `01` requires `glm-5.3-flashx`, `02`/`03`/`04` require
`glm-5.3`. Intake directory `00` has role `01`; Story and Episode have role `02`.
Controller has no fixed creative model; roles `05`–`09` retain the current
session model. These are planned routes, not registered DSH mappings.

Full production remains a future explicit scope: Asset Lock → Storyboard /
Director Intent → Performance and Cinematography → Seedance 2.0 Mini Adapter
→ Prompt QA. Preserve intentional inner voice and external narration, source
references, and the external voiceover path in those future stages.

V9 remains frozen. Run these read-only checks from the repository root:

```sh
node --test dsh-plugin/test/v10-core-isolation.test.mjs
node scripts/check-v10-v9-isolation.mjs
node scripts/sync-v9-distributions.mjs --check
```

The isolation checker compares protected paths with Git baseline
`67647579153fe73891ee2a6ce3ef1f92842ed9ca`, covering staged and working-tree
content/path differences plus untracked files, including ignored files. Git
content comparison honors configured checkout/clean filters and is not a
raw-byte comparison of checkout line endings. Tests use only Node built-ins and
Git, with paired `--test-root <temporary-repo> --test-baseline <commit>` overrides.
No V9 build, distribution mutation, package archive, or publication is part of
this scaffold.
