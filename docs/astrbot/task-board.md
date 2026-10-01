# AstrBot writing package

AST-01 — READY → IN_PROGRESS → REVIEW; Owner: Codex /root.

- Depends on: v10 bcf90bd; approved US-only writing skills 2.1.0.
- Allowed Paths: astrbot-plugin/**, scripts/package-astrbot.py, scripts/tests/test_astrbot_package.py, docs/astrbot/**.
- Deliverable: installable plugin ZIP with four canonical writing skills and all their reference resources; no production UI or DSH dependency.
- Acceptance: ZIP can be extracted, plugin metadata/entry point present, canonical files byte-identical, local Markdown links resolve, command entry handles valid/invalid stages and missing providers; documentation includes install/use and validation limits.
- Final state remains REVIEW until main integration and retest (main has pre-existing staged changes and must be preserved).

Implementation and ZIP delivered; validation evidence: validation.md. Business source committed on codex/ast-01-astrbot-writing, not merged into main.

## AST-02 — restore full skill set

READY → IN_PROGRESS → REVIEW. Owner: Codex /root, existing isolated worktree codex/ast-01-astrbot-writing, base 95f050b.
User approved restoring Controller + 01–09 with no work interface.
Allowed Paths: astrbot-plugin/**, scripts/package-astrbot.py, scripts/tests/test_astrbot_package.py, docs/astrbot/**; output delivery/astrbot_plugin_usvd_writer-v1.1.0.zip.
Dependencies: AST-01 package; canonical V9 stage resources.
Acceptance: exactly ten correctly named native Skills; all canonical instructions and stage contracts/checklists included; all stages selectable from chat; no global instruction forbids 05–09 outputs; preserve one-stage gates and no UI/execution claim. Archive/import/routes/resource checks pass. Deliver updated ZIP. REVIEW until main integration/retest.
