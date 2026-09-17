# US Vertical Drama Studio — Tabbit 版

这是 `US Vertical Drama Studio` 面向 Tabbit「妙招 → 任务」的发行目录。

## 目录

- `SKILL.md`：Tabbit 任务妙招的主规则与路由入口。
- `references/`：各阶段专业规则、模板和 MediaGo / Seedance 交付规范。

## 在 Tabbit 中创建

1. 打开「妙招」→「自定义妙招」→「创建妙招」。
2. 类型选择「任务」。
3. 名称填写：`US Vertical Drama Studio`。
4. 「描述」填写：

   `当用户需要创作、改编、诊断或继续开发面向美国/欧美市场的竖屏短剧、漫剧、微短剧时调用。覆盖故事设定、美国本土化改编、Story Bible、分集节拍、剧本、Script Doctor、连续性检查、分镜设计、15秒以内视频包、0.5–3秒微镜头、Seedance/MediaGo视频生成提示词与production-workbench交付。若只是普通写作、非短剧任务或与影视创作无关，不调用。`

5. 把本目录 `SKILL.md` 的完整内容粘贴到 Tabbit 的 `SKILL.md` 编辑框。
6. 通过「上传文件」上传 `references/` 中的规则文件。
7. 保存后，用一个短剧任务做调用测试，确认能够进入对应阶段，而不是只输出通用回答。

## GitHub 维护方式

GitHub 作为该 Skill 的版本源。更新规则时修改本目录后提交仓库，再把最新版同步到 Tabbit。不要在 Tabbit 和 GitHub 分别长期维护两套不同规则。

## 关键生产约束

- 先剧本/连续性审核，再进入分镜与生成包。
- 单个视频包通常不超过 15 秒。
- 视频包下拆分 0.5–3 秒的可独立调整微镜头。
- 人类可读标题统一使用 `【视频编号】` 与 `【镜头编号】`。
- 每个视频包必须有完整 VIDEO 总提示词；每个微镜头必须有 SHOT 局部提示词。
- 资产、服装、场景、道具和连续状态使用稳定 ID 锁定。
- 最终可输出 `production-workbench.json`，用于 DSH / MediaGo 工作台衔接。
