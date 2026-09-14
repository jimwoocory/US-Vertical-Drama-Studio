# US Vertical Drama Studio

A single-entry, seven-skill production workflow for US-facing vertical microdrama development. The Studio orchestrator routes work through six specialist skills and enforces approval gates between phases.

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

The workflow gates screenplay and storyboard handoff through approved Story Bible, approved Beat Sheet, Script Doctor PASS, and continuity CLEAR status.

## Other distributions

- `direct-upload/chatgpt/` — per-skill ChatGPT direct-upload packages.
- `direct-upload/claude/` — per-skill Claude folders and ZIP files.
- `mediago/US-Vertical-Drama-Studio-v1.0.0.mgpack` — MediaGo prompt-pack artifact.
- `source/us-vertical-drama-studio/` — canonical business-rules source pack.

## Golden regression case

The source pack includes the 80-episode, ~90-second Norse royal-revenge process fixture used to verify long-form arc cadence and EP01 Hook / Conflict / Escalation / Reversal / Payoff / Cliffhanger gates. It is a workflow fixture, not generated scene content.

## Validation

The marketplace plugin has been checked with OpenAI's current plugin validation script, and the canonical export tests pass before release.
