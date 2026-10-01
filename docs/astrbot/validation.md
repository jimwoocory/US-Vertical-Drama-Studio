# AstrBot package validation — 2026-10-02

Base: v10 bcf90bd37ca65411d046b46130b3237336347855. Canonical writing skills unchanged, all four at 2.1.0.

Delivered archive: `astrbot_plugin_usvd_writer-v1.0.0.zip`, 12 entries. Root-level main.py, metadata.yaml, README.md, LICENSE; four namespaced Skill folders, each with canonical SKILL.md and its reference Markdown.

Checks:

- Test-first: package test initially failed because the packager was absent.
- `python -m unittest discover -s scripts/tests -p test_astrbot_package.py -v`: one archive integration test, all assertions passed. It builds/extracts/imports the actual archive, checks source-byte parity and links, invokes five stages with multi-line material, rejects empty/unknown/oversized requests, handles no provider and provider failure without leaking exception text.
- `node --test scripts/test-us-writing.mjs dsh-plugin/test/production-workbench.test.mjs dsh-plugin/test/v9-director-core.test.mjs dsh-plugin/test/v9-prompt-qa.test.mjs dsh-plugin/test/v9-seedance-adapter.test.mjs`: 38 passed, 0 failed.
- Ruff formatting and checks for the three Python files.
- Metadata parsed with PyYAML; no additional plugin runtime dependencies.

Framework boundaries were replaced by test doubles. No live AstrBot instance or user model was connected. The SDK minimum reflects the documented introduction of get_current_chat_provider_id/llm_generate at 4.5.7; native plugin Skills require a newer AstrBot version that implements discovery. Command mode loads all instructions itself and does not require computer execution tools.

No whole-workspace test success is claimed. Previous DSH full-test dependency limitations remain unrelated to this Python package. No audience, revenue or measured writing-quality improvement is inferred from archive checks.

Official sources checked:

- https://docs.astrbot.app/dev/star/plugin-new.html
- https://docs.astrbot.app/dev/star/guides/simple.html
- https://docs.astrbot.app/dev/star/guides/ai.html
- https://docs.astrbot.app/use/skills.html
- https://github.com/AstrBotDevs/AstrBot/blob/master/astrbot/core/star/context.py
- https://github.com/AstrBotDevs/AstrBot/blob/master/astrbot/core/star/updater.py
