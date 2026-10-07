# USVDS V10 Core — in development

This independent canonical root is `core/usvd-v10`, version `0.10.0-preview.7`.
The controller, Intake/Adaptation, Story Architect, Episode Architect, and
Review/Continuity story-review instructions and initial JSON contracts are
authored but unvalidated. All V10 skills remain non-runnable: no generated
DSH provider or trusted approval runtime exists here yet. A generated ChatGPT
package now exposes the authored story skills as instructions, without claiming
runtime enforcement or production readiness.

The architecture contract is [docs/v10-architecture.md](../../docs/v10-architecture.md).
V10 defaults to US-facing, `writing-only` delivery. Early briefs, complete
outlines, diagnostics, and reviews default to Simplified Chinese. Episode maps,
screenplays, shot/asset packages, and generation prompts are paired Chinese and
natural US English in creator reading views. The English spoken line is the only
performed line; its Chinese meaning is marked unspoken. Machine import fields
keep their required schema and one designated prompt submission language. See
`references/output-language.md` and `references/final-package.md`. Audience and
commercial validation remain untested.

The planned writing flow is Intake/Adaptation → Story Architect → independent
Story draft review → Episode Architect → independent full Story Package review
→ trusted human approval of the exact package revision/digest → Screenwriter
→ independent Script Doctor → derived Continuity Ledger. The Story Package is
the sole project Story Truth; the Ledger is a projection, not another Bible.
ND-001 blocks trusted approval implementation. The authored skill text specifies
the intended sequence but does not enforce that gate or authorize Screenwriter
execution. The separately named `03-creator-script-draft` skill may create a
conspicuously labeled, non-production draft after direct creator instruction
for an exact reviewed package in the current ChatGPT conversation. For drafting,
it accepts the complete canonical package or a current Episode Architecture
DOCX/HTML with matching review and clearly discloses the latter as a
review-attested readable view rather than an independently verified canonical
JSON. It cannot
set `APPROVED`, commit protected artifacts, or authorize production. The
production Screenwriter and downstream stages remain planned.

Manifest `routing_role` expresses the existing model contract independently of
directory numbering: `01` requires `glm-5.3-flashx`, `02`/`03`/`04` require
`glm-5.3`. Intake directory `00` has role `01`; Story and Episode have role `02`.
Controller has no fixed creative model; roles `05`–`09` retain the current
session model. These are planned routes, not registered DSH mappings. Authored
skills have not yet been validated against runtime behavior.

The ChatGPT integration keeps the existing `us-vertical-drama-studio` plugin
identity and its eight legacy skills, adds the five V10 story skills plus the
creator-authorized draft skill, contracts,
examples, and structural checkup, and routes new projects through story intake.
The separate `us-vertical-drama-studio-v10` preview remains a Core-generated
inspection package. Use `node scripts/sync-chatgpt-plugin.mjs` to refresh the
existing-plugin package after changing Core.

Full production remains a future explicit scope: Asset Lock → Storyboard /
Director Intent → Performance and Cinematography → Seedance 2.0 Mini Adapter
→ Prompt QA. Preserve intentional inner voice and external narration, source
references, and the external voiceover path in those future stages.

V9 remains frozen. Run these read-only checks from the repository root:

```sh
node --test dsh-plugin/test/v10-core-isolation.test.mjs
node scripts/check-v10-v9-isolation.mjs
node scripts/sync-v9-distributions.mjs --check
node scripts/sync-v10-plugin.mjs --check
```

To refresh the separate ChatGPT Agent Plugin preview from Core, run
`npm run build:plugin-v10`. It intentionally exposes only the authored
story-workflow skills and does not register a V10 DSH provider or unblock
Screenwriter execution.

The isolation checker compares protected paths with Git baseline
`67647579153fe73891ee2a6ce3ef1f92842ed9ca`, covering staged and working-tree
content/path differences plus untracked files, including ignored files. Git
content comparison honors configured checkout/clean filters and is not a
raw-byte comparison of checkout line endings. Tests use only Node built-ins and
Git, with paired `--test-root <temporary-repo> --test-baseline <commit>` overrides.
This Core remains isolated from V9 generation. The existing ChatGPT package is
a separate distribution and does not grant a V10 human approval event.
