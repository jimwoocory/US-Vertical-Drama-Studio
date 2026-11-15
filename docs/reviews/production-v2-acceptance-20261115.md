# 三项生产契约升级：本地验收结果

已在当前工作区实现规则分级、参考图契约和局部失效，保留 v1 读取及既有适配行为。新入口使用显式 v2 契约；历史素材、审查和任务记录不会被自动覆盖。

| 检查 | 结果 |
|---|---|
| Node 24 新增验收 | 25/25 通过 |
| 相关回归（明确使用离线 DSH SDK mock） | 132/132 通过 |
| 原生全量测试 | 150 项：147 通过、3 失败 |
| V9 契约分发同步与 diff 检查 | 通过 |

剩余失败是已有的 DSH SDK 缺失、V10 版本断言、V10 分发同步问题，未为追求全绿改写 V10。修复了 Node 24 下临时 Git 只读文件清理问题。

真实 DSH、独立可信审查服务及 Media MCP v2 生产接口未联调，默认不允许向未验证的新接口提交。没有安装依赖、修改客户端权限、发布、部署或推送。

完整改动文件清单见同目录 JSON；下方包含契约行为、测试证据、兼容性、限制及回滚记录。

---

# USVDS production contract v2 — implementation and acceptance

- Time: 2026-11-15T23:17:28+08:00 (Asia/Shanghai).
- Client/resource: Codex desktop, current USVDS-V11-director-upgrade-20261016 worktree.
- Risk/approval: L3 local code/test changes, explicitly authorized in the current chat. No publish, deploy, installation, secret access or permission changes.
- Pre-upgrade HEAD: `15edfa0`. No commit or push performed. Four pre-existing untracked user notes preserved.

## Implemented behavior

1. Explicit v2 envelope with v1 reads/API behavior preserved; structural/reviewed/craft/taste tiers; separate machine/review/final gates; unknown rules fail closed. Heuristic budgets are warnings only for v2. Actual timing, adopted episode limits and capability/approval boundaries remain hard.
2. Versioned reference contract: visible scope, purpose/control/exclusions, immutable asset version/SHA-256, capability-checked ordered inputs, actual local image header/hash and realpath containment. Missing/pending references never silently become text-to-video.
3. Derived dependency graph: unit-level source mappings, shared assets/references, shots, state propagation, adjoining cut reviews, parent VIDEO, audio/subtitles and episode timing. Current/stale/unknown status preserves historical files and receipts. Conservative state propagation does not assume an unverified continuity reset.
4. Current compiled-input freshness is separate from old generated-result freshness. Job receipts pin submitted VIDEO dependencies; a new snapshot cannot bless old media. Same request retries keep their key; changed inputs get new identity. Old job collection cannot overwrite the active job.
5. Stage 08 and Stage 09 both consume the new contracts. Focused reviewer results carry their actual scope/digest and cannot auto-approve the package. Real trusted review/quote verifiers are injected by the host; absent verifiers remain blocked/pending.
6. Refreshed local generated V9 skill packages/ZIPs and reference resources without changing `.agents` marketplace/permissions or installing them. Legacy V10 and legacy ChatGPT production mirrors were not upgraded.

## Verification

| Check | Tests | Pass | Fail | Evidence/qualification |
|---|---:|---:|---:|---|
| New upgrade acceptance | 25 | 25 | 0 | [TAP](production-v2-node24-new.tap). Local bytes; synthetic review/quote/SDK fixtures. No real model/provider. |
| Related regression | 132 | 132 | 0 | [TAP](production-v2-node24-regression.tap). Explicit offline DSH SDK registration mock; excludes the unrelated V10 isolation file. |
| Native complete suite | 150 | 147 | 3 | [TAP](production-v2-node24-full.tap). No SDK preload; remaining baseline failures listed below. |

- Node: bundled Node **24.22.1**. Initial default-Node baseline was Node 22.23.2: 125 tests, 121 pass, 4 fail.
- V9 distribution sync: PASS, ten skills; source digest `2fb5734bab1677e7fa2a24ec0469726abdc413631449511df3dd24ba8c232ef2`.
- Whitespace/diff check: PASS.
- Existing V9 mirror byte mismatch was corrected by regeneration. Existing Node 24 fixture cleanup failed on read-only temporary Git objects; the test helper now clears only regular-file write protection, never follows symlinks, and preserves the validated temporary-root boundary.

### Native complete-suite failures (not waived)

- `stage09-review-executor.test.mjs`: existing missing `@deepseek-ai/dsh-tools` package. No dependency was installed. Offline registration-contract tests use an explicit test-only loader; they do not validate a real DSH SDK connection.
- V10 manifest test expects `0.10.0-preview.1`, while the existing Core is `0.10.0-preview.7`.
- Existing V10 plugin preview metadata/README are not synchronized with its generator. V10 sources/distribution were preserved rather than rewritten for this upgrade.

## Acceptance coverage

- Valid 4s/0.3s shots produce warnings; structural errors, unapproved assets, incompatible/unknown endpoint features and upstream voice BLOCKED remain blocking.
- Forged/self-reviewed/stale/missing semantic receipts do not grant readiness; reviewer entry recomputes machine checks and current digest.
- Local camera/source-unit edits affect their consumers and whole-package review while unrelated VIDEO inputs stay current; shared asset/state changes propagate; dialogue edits stale audio/subtitle/timing dependencies.
- Changed bytes at the same path, altered controls/order/asset versions, path escapes, pending references and incompatible mixed modes are detected. Same-content relocation/display-name changes do not needlessly change dependency identity.
- Dependency holes/cycles cannot establish freshness. Snapshot capture never rewrites source, historical review or media; a fresh compilation snapshot cannot make an old job result current.
- Quote binding rechecks bytes, current request and host-verified confirmation. Duplicate receipt replay preserves terminal state; stale/historical job results remain separate.
- Legacy fixtures and original adapter behaviors pass related regression; unknown new versions are rejected.

## Material limits

- Real DSH SDK/model integration, real independently authenticated review receipts, actual Media MCP v2 acceptance, provider charging, full media generation/animatic/audience validation: NOT_RUN.
- V2 Media MCP planning consumes pre-resolved visual assets and describes VIDEO calls only. It is blocked by default until the host verifies the v2 transport, immutable dispatch inputs and exact quote confirmation. New v2 transport fields have not been claimed accepted by a third party.
- State invalidation conservatively includes later cuts. It may invalidate more than a future evidence-backed boundary analysis would require, but never silently trusts reset flags.
- A one-call VIDEO can require whole-package regeneration. Input freshness is not proof that generated media exists or passed visual review.

## Changed files

Full secret-free manifest: [production-v2-changed-files-20261115.json](production-v2-changed-files-20261115.json).

39 source/test/document/log entries and 148 generated-distribution entries are listed. Counts include this report and manifest.

- `core/usvd-v9/contracts/artifact-dependencies-v2.schema.json`
- `core/usvd-v9/contracts/production-policy-v2.json`
- `core/usvd-v9/contracts/reference-binding-v2.schema.json`
- `core/usvd-v9/contracts/stage-06-storyboard.json`
- `core/usvd-v9/contracts/stage-07-performance-cinematography.json`
- `core/usvd-v9/contracts/stage-08-seedance-2-mini-adapter.json`
- `core/usvd-v9/contracts/stage-09-prompt-qa.json`
- `core/usvd-v9/manifest.json`
- `core/usvd-v9/references/prompt-qa-human-checklist.md`
- `core/usvd-v9/skills/05-asset-lock/SKILL.md`
- `core/usvd-v9/skills/06-storyboard/SKILL.md`
- `core/usvd-v9/skills/07-performance-cinematography/SKILL.md`
- `core/usvd-v9/skills/08-seedance-2-mini-adapter/SKILL.md`
- `core/usvd-v9/skills/09-prompt-qa/SKILL.md`
- `docs/production-contract-v2.md`
- `docs/reviews/production-v2-acceptance-20261115.md`
- `docs/reviews/production-v2-changed-files-20261115.json`
- `docs/reviews/production-v2-node24-full.tap`
- `docs/reviews/production-v2-node24-new.tap`
- `docs/reviews/production-v2-node24-regression.tap`
- `dsh-plugin/controlled-review.js`
- `dsh-plugin/production-workbench.js`
- `dsh-plugin/stage09-review-executor.js`
- `dsh-plugin/stage09-review-tool.js`
- `dsh-plugin/test/fixtures/dsh-tools-contract-mock.mjs`
- `dsh-plugin/test/fixtures/production-v2.mjs`
- `dsh-plugin/test/v10-core-isolation.test.mjs`
- `dsh-plugin/test/v11-production-contract.test.mjs`
- `dsh-plugin/test/v11-stage09-tool.test.mjs`
- `integrations/media-mcp/README.md`
- `integrations/media-mcp/index.mjs`
- `scripts/sync-v9-distributions.mjs`
- `scripts/v11-artifact-freshness.mjs`
- `scripts/v11-autonomous-director.mjs`
- `scripts/v11-production-policy.mjs`
- `scripts/v11-reference-bindings.mjs`
- `scripts/v11-voice-timing-local.mjs`
- `scripts/v9-prompt-qa-validation.mjs`
- `scripts/v9-seedance-adapter-validation.mjs`

Generated copies are confined to the existing V9 plugin, direct-upload/v9, Tabbit/v9 and MediaGo/v9 roots. They were rebuilt from Core; `.agents`/`.codex` and V10 have no tracked diff.

## Rollback and audit

Rollback is local only: first preserve this diff and all new files; restore only manifest-listed tracked changes from `15edfa0`, remove only manifest-listed newly created resources if reverting, and regenerate matching legacy distributions. Preserve all four pre-existing notes and real project media/jobs. Do not use a whole-workspace reset or broad delete. No rollback, deployment or external-state mutation was executed.

Action record: inspected before writes; changed only the authorized workspace; verified local contracts, real local fixture-byte handling, related regression and native full-suite status; recorded approval, risk, result, evidence and rollback here.
