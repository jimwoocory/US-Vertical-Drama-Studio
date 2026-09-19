# US Vertical Drama Studio

A single-entry, eight-skill production workflow for US-facing vertical microdrama development: one Studio orchestrator plus seven specialist skills. It enforces approval gates from adaptation through asset-locked storyboard and video-generation handoff.

## V9 Preview branch

The `refactor/usvd-v9-seedance2-mini` branch adds a **separate V9 preview** without replacing the stable V1/V2 distribution trees. V9 authoring truth lives only under `core/usvd-v9/` and uses the gated chain:

`01–05 story/assets → 06 Storyboard → 07 Performance+Cinematography → 08 Seedance 2.0 Mini Adapter → 09 Prompt QA`.

Run `npm run build:v9` to regenerate all V9 distribution surfaces and `npm run check:v9` to verify they are byte-synchronized with Core. `npm test` runs that synchronization gate before the full regression suite.

Generated V9 preview surfaces:

- ChatGPT/Codex marketplace plugin: `plugins/us-vertical-drama-studio-v9/`
- ChatGPT/Claude direct upload: `direct-upload/v9/`
- Tabbit: `tabbit/v9/`
- MediaGo integration source: `mediago/v9/`
- DSH: `dsh-plugin/` reads the generated V9 plugin manifest dynamically

The existing stable `plugins/us-vertical-drama-studio/`, `direct-upload/chatgpt/`, `direct-upload/claude/`, `tabbit/v2/`, and legacy MediaGo `.mgpack` remain present and are not rewritten by the V9 generator.

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

- `direct-upload/chatgpt/` — stable per-skill ChatGPT direct-upload packages.
- `direct-upload/claude/` — stable per-skill Claude folders and ZIP files.
- `direct-upload/v9/` — generated V9 preview ChatGPT/Claude folders and deterministic ZIP files.
- `mediago/US-Vertical-Drama-Studio-v1.0.0.mgpack` — legacy MediaGo v1.0 artifact; do not release it as v1.1.
- `mediago/v9/` — generated V9 Skill source + manifest; no V9 `.mgpack` is claimed without a verified MediaGo-native packager.
- `plugins/us-vertical-drama-studio/` — stable v1.2 runtime surface.
- `plugins/us-vertical-drama-studio-v9/` — generated V9 preview marketplace surface.
- `source/us-vertical-drama-studio/` — legacy v1.0 source retained for traceability; do not package it for v1.2.

## DeepSeek Harness (DSH)

This repository is also an installable DeepSeek Harness plugin. On the V9 preview branch, DSH reads `plugins/us-vertical-drama-studio-v9/manifest.json` and exposes the generated ten-skill V9 catalog through the native skill-provider lifecycle. The catalog is not hard-coded in `dsh-plugin/index.js`, so Core remains the single authoring source.

### Optional Stage 09 native reviewer

The controlled reviewer is disabled by default. To enable the single, one-shot, tool-free Stage 09 reviewer in a DSH profile that already mounts `@deepseek-ai/dsh-subagent` and `@deepseek-ai/dsh-subagent-spawn-in-process`, pass this plugin configuration:

```yaml
stage09ControlledReview:
  enabled: true
  provider: spawn
```

This exposes `dramago_stage09_review` only. It requires a machine-QA `PASS`, one focused question, and a bounded evidence packet; it starts one depth-one reviewer with no global tools and disposes it after the final structured result. It does not enable general-purpose delegation.

### Compatibility boundary

The P0 skill provider and the production-workbench JSON contract are independent of the browser panel. The optional **P1 Production Workbench UI** is deliberately pinned to **DeepSeek Harness `0.1.5-rc.1` only**. It uses the native Harness conversation geometry rather than covering it: a production file tree on the left, the readable storyboard or video package in the center, and the original DSH chat/composer on the right. Markdown/TXT delivery files are parsed automatically into their `【视频编号】` / `【镜头编号】` production relationships. Do not install this package with DSH `0.1.6-alpha.1` or another version: the P1 UI has exact peer dependencies and a runtime slot-service guard, while P0 remains usable without the panel.

Create the profile from DSH's `web` template before installing the plugin. A bare profile has no browser shell, so it can run P0 skills but cannot show P1:

```bash
npx -y @deepseek-ai/dsh@0.1.5-rc.1 --profile us-drama --from-default-profile web --no-open
npx -y --package pnpm@11.7.0 --package @deepseek-ai/dsh@0.1.5-rc.1 dsh plugin --profile us-drama add github:jimwoocory/US-Vertical-Drama-Studio
```

Launch the same profile with `npx -y @deepseek-ai/dsh@0.1.5-rc.1 --profile us-drama`. The V9 branch exposes ten generated skills: controller + 01–05 + model-agnostic 06 Storyboard + 07 Performance/Cinematography + 08 Seedance 2.0 Mini Adapter + 09 Prompt QA. Operator-facing production text is Chinese; approved English character names and dialogue remain English. The adapter and P1 UI are verified only against DSH `0.1.5-rc.1`; because DeepSeek Harness is in developer preview, do not upgrade this profile in place. Create another profile to test a newer DSH version, and run `npm test` before using that version for production work.

DSH installs profile plugins separately from its own runtime, so `dsh plugin add` can print a peer-dependency warning even when this exact DSH command is used. Treat the pinned DSH command and the P1 startup check as the compatibility authority; do not silence the warning by upgrading the plugin's `0.1.5-rc.1` peer pins.

## Golden regression cases

V9 includes two reproducible prompt-engine Golden Cases under `core/usvd-v9/golden-cases/`: the archive-key fixture and auction-entry reaction fixture. Their machine regression is part of `npm test`; rendered-video review remains explicitly pending until baseline and V9 outputs are generated with identical endpoint settings and viewed using the human checklist. The repository also retains the older Norse royal-revenge workflow fixture for long-form process regression.

## Validation

For V9 preview validation run `npm run check:v9` and `npm test`. `scripts/validate-v11.sh` remains a legacy stable-distribution check. A V9 MediaGo `.mgpack` still requires a verified MediaGo-native packager and import test; the repository does not claim that the legacy v1.0 binary is V9-compatible.
