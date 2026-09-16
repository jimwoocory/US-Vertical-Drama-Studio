# US Vertical Drama Studio

A single-entry, eight-skill production workflow for US-facing vertical microdrama development: one Studio orchestrator plus seven specialist skills. It enforces approval gates from adaptation through asset-locked storyboard and video-generation handoff.

## ChatGPT / Codex Marketplace

This repository is directly importable as a workspace plugin marketplace.

- Marketplace manifest: `.agents/plugins/marketplace.json`
- Plugin manifest: `plugins/us-vertical-drama-studio/.codex-plugin/plugin.json`
- Plugin skills: `plugins/us-vertical-drama-studio/skills/`

In an eligible ChatGPT workspace, open **Workspace settings → Plugins → Add → Import marketplace** and use this repository URL with branch `main` and no subpath.

## Included skills

- US Vertical Drama Studio (single-entry orchestrator)

- US Adaptation
- US Vertical Drama Showrunner
- Episode Architect
- US Vertical Drama Screenwriter
- Script Doctor
- Continuity Editor
- Storyboard Director

The workflow gates screenplay and storyboard handoff through approved Story Bible, approved Beat Sheet, Script Doctor PASS, and continuity CLEAR status.

## Other distributions

- `direct-upload/chatgpt/` — eight per-skill ChatGPT direct-upload packages.
- `direct-upload/claude/` — per-skill Claude folders and ZIP files.
- `mediago/US-Vertical-Drama-Studio-v1.0.0.mgpack` — legacy MediaGo v1.0 artifact; do not release it as v1.1.
- `plugins/us-vertical-drama-studio/` — canonical v1.2 runtime source.
- `source/us-vertical-drama-studio/` — legacy v1.0 source retained for traceability; do not package it for v1.2.

## DeepSeek Harness (DSH)

This repository is also an installable DeepSeek Harness plugin. It registers the same eight canonical skills through DSH's native `ctx.skills` service, including their linked references. It does not duplicate prompt text or add a separate agent loop.

Install it into a DSH profile after DSH itself is configured:

```bash
dsh plugin --profile web add github:jimwoocory/US-Vertical-Drama-Studio
```

Restart the selected DSH profile. The normal DSH skill catalog will then expose the eight `us-vertical-drama-*` skills. The plugin is pinned to the current DSH pre-1.0 skill-service range; because DeepSeek Harness is in developer preview, run `npm test` after upgrading DSH before using it for production work.

## Golden regression case

The source pack includes the 80-episode, ~90-second Norse royal-revenge process fixture used to verify long-form arc cadence and EP01 Hook / Conflict / Escalation / Reversal / Payoff / Cliffhanger gates. It is a workflow fixture, not generated scene content.

## Validation

Run `scripts/validate-v11.sh` before release. A v1.1 MediaGo `.mgpack` still requires a MediaGo-native rebuild and import test; the repository does not claim that the legacy v1.0 binary is compatible.
