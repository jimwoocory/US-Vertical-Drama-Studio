# US Vertical Drama Studio — DSH full workflow

A no-UI DeepSeek Harness plugin for US-facing vertical drama. It provides the controller and all nine production stages as ten native DSH Skills.

## Included stages

- Controller: checks the current gate and routes to one next skill.
- 01 Adaptation; 02 Story Architecture (Bible and episode beats); 03 Screenwriter; 04 Review and Continuity.
- 05 Asset Lock; 06 Storyboard; 07 Performance and Cinematography; 08 Seedance 2.0 Mini Adapter; 09 Prompt QA.

Skills 01–04 contain the approved US writing upgrades 2.1.0. The remaining stages and contracts come from V9 Core. DSH loads the catalog from the generated manifest and registers a native skill provider. This package does not inject a browser workbench or call image/video generation services.

## DSH install

The V9 Skills are generated into `plugins/us-vertical-drama-studio-v9/`. Build that DSH surface from canonical Core with:

```sh
npm run build:dsh-v9
```

Use DSH `0.2.0-rc.2` for this preview. Create a web profile and install the repository branch that contains this package:

```sh
npx -y @deepseek-ai/dsh@0.2.0-rc.2 --profile us-drama --from-default-profile web --no-open
npx -y --package pnpm@11.7.0 --package @deepseek-ai/dsh@0.2.0-rc.2 dsh plugin --profile us-drama add github:jimwoocory/US-Vertical-Drama-Studio#v11
npx -y @deepseek-ai/dsh@0.2.0-rc.2 --profile us-drama
```

In the profile, enable the **US Vertical Drama Studio** plugin and use its Skills in chat. The controller routes one stage at a time. Provide the upstream approved materials required by each stage; never ask the agent to skip approval gates.

## Source and package

Canonical truth lives in `core/usvd-v9/`. The DSH plugin reads the generated catalog from `plugins/us-vertical-drama-studio-v9/manifest.json`. Run `npm run build:dsh-v9` after changing Core to refresh that DSH catalog without rewriting the other platform distributions.

Package version: `0.4.0-v9-preview.1`. DSH's browser UI injection and client bundle are excluded. The standard npm package archive can be produced with `npm pack`.

## V10 GPT story-workflow preview

The separate Agent Plugins inspection package is generated from `core/usvd-v10/` with `npm run build:plugin-v10`. The existing ChatGPT web plugin package at `plugins/us-vertical-drama-studio/` is updated from the same Core with `node scripts/sync-chatgpt-plugin.mjs`. It keeps its original eight skills and adds five V10 story skills, intake routing, source mechanism mapping, independent outline review, JSON contracts, examples, and a deterministic structural checkup. New V10 projects stop before screenplay work: trusted human approval and protected Screenwriter execution remain blocked by ND-001. V9 DSH distributions are untouched.

ChatGPT plugin 1.2.1 makes all creator-facing briefs, outlines, episode maps, reviews, and exported development documents Chinese by default. US-facing describes the story market; natural American English is reserved for later screenplay dialogue unless the creator requests another development language. See `core/usvd-v10/references/output-language.md`.

ChatGPT plugin 1.2.2 delivers each requested development artifact as matching DOCX and HTML files by default. TXT and chat text are not substitutes. See `core/usvd-v10/references/document-delivery.md`.

ChatGPT plugin 1.2.3 adds a separate creator-authorized screenplay **draft** path for an exact independently reviewed Story Package. It records direct creator intent in the active conversation, keeps the Story Package unchanged, and labels the draft non-production. It does not satisfy ND-001 or unlock the production Screenwriter.

ChatGPT plugin 1.2.4 also accepts a current Episode Architecture DOCX/HTML and exact matching independent review for a scoped non-production draft when the canonical JSON is unavailable in the conversation. The draft discloses `REVIEW_ATTESTED_VIEW`; it never claims to have recomputed the canonical digest. An unspecified continuation begins with EP01–EP03 as a stated assumption.

ChatGPT plugin 1.2.5 delivers the complete Episode Map, episode scripts, asset/shot packages, and image/video prompts in paired Chinese and natural US English reading views. Existing machine import fields retain one selected prompt submission language. At final handoff or on request, the plugin packages available current DOCX/HTML, reviews, and useful structured assets into a ZIP with a file manifest and honest partial/gate status. This is a delivery rule for the ChatGPT web plugin; it does not unlock the V10 production gate.

## V9 DSH stage model routing

V10 uses DSH's real Session model-selection API for the writing/review stages:

- 01 Adaptation → **GLM 5.3 FlashX** (`glm-5.3-flashx`)
- 02 Story Architecture → **GLM 5.3** (`glm-5.3`)
- 03 Screenwriter → **GLM 5.3** (`glm-5.3`)
- 04 Review and Continuity → **GLM 5.3** (`glm-5.3`)

The router resolves the required target against the live DSH model catalog and fails closed when that exact target is unavailable. It does not silently substitute another model. Stages 05–09 keep the current session model unless another explicit production route owns them.

## Limits

Stage 08 writes Seedance 2.0 Mini prompts; it does not submit video-generation requests. Stage 09 can report machine QA as PASS only when it receives actual machine-check results. It does not claim audience or commercial validation.

## License

Apache-2.0 license in `LICENSE`.
