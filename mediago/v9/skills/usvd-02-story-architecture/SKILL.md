---
name: usvd-02-story-architecture
description: 当用户需要为欧美竖屏短剧建立 Story Bible、角色发动机、季/篇章升级结构，或在已批准 Story Bible 基础上制作某一集 Beat Sheet 时调用。只负责故事架构；不写正式剧本、资产、分镜或视频提示词。
version: 2.1.0
---

# USVD 02 故事架构

## 本阶段有两个互斥模式

**一次调用只执行一个模式，不得连做。**

## US Project Contract 与既有 Bible

使用 [US Writing Contract](references/us-writing-contract.md)。无论项目原创还是改编，进入本技能都必须有同一份合同；原创项目不得因绕过 USVD 01 而跳过它。

- 若用户提供旧版 `BIBLE APPROVED` 但没有合同，从已有 Bible/brief 提取已知字段；其余标 `ASSUMED` 或 `UNVERIFIED`，继续在不依赖缺口的范围内工作。仅缺新合同不得撤销既有批准；只有核心 Canon 缺口才改为 `BIBLE DRAFT`。不要伪造研究，也不要仅因未知平台、长度或模式撤销旧批准。
- 未经证据不得把美国观众描述为某一年龄、性别或人口群；记录观看动机、项目假设和验证状态。
- 发行可为免费、广告、订阅、币或组合；把它作为预期管理约束，不规定万能反转秒数或固定付费集数。

### 模式 A：Story Bible
当没有 `BIBLE APPROVED` 时使用。

输出必须包含：
- 完整 `US Project Contract`
- Audience Promise
- Series Question
- Tone / Rating Boundary
- 世界规则与不可变 Canon
- 主角与主要角色的 `Character Engine`：欲望、缺口、恐惧、秘密、可升级冲突
- Relationship Engine
- Secret / Reveal Ledger
- Season / Arc Ladder
- Escalation Ladder：每一阶段必须改变 stakes / cost / information / power / relationship 中至少一项
- Plants / Payoff Windows
- Promise Ledger：每项承诺有 ID、来源（广告/标题/故事）及其批准状态、计划正片落点（`PLANNED`）、到期 window、状态，以及延期理由/替代兑现（如适用）；模式 A 尚未写正片，不得把计划落点写成兑现证据
- Episode / Arc State Changes：每集或篇章记录主角目标、主动行动、具体代价及信息/权力/关系变化；篇章和季终复核未兑现承诺
- Character / Relationship Differentiation：说明主要角色及关系怎样以不同策略、价值冲突或后果推进，不能只互换反派或受辱者
- Anti-Repetition Controls
- 结局情绪目的地

如果核心 Canon 仍有未决项，标记 `BIBLE DRAFT`；只有完整且自洽才标记 `BIBLE APPROVED`。

### 模式 B：Episode Beat Sheet
只有用户已经提供 `BIBLE APPROVED` 时才能使用。

先定位本集在季/篇章中的状态变化，再明确：
- Hook
- Conflict / Objective + Obstacle
- Escalation
- Reversal
- Payoff
- Cliffhanger / Next Episode Question
- Canon Dependencies
- Knowledge State Changes
- Continuity Delta
- 本集主角的主动行动与具体代价，以及信息/权力/关系状态变化
- 本集涉及承诺的 ID、来源、正片证据位置与到期状态；场景证据可用既有 `SCxx` / `EPxx` 格式，无须新编号系统

在批准单集前，跨集复核上一集留下的状态/承诺、本集的兑现或推进，以及下一集承接；不得把重复悬念或新的 cliffhanger 当作跨集 payoff。

EP01 的 Hook 应尽快让观众理解“发生了什么/谁想要什么/为什么危险”，但不要机械套秒数公式。

季终集的 `Cliffhanger / Next Episode Question` 可写 `NONE / FINALE`；此时必须以终局情绪目的地和 `Series Question` 的兑现替代。非季终集仍必须给出具体、可承接的下一集问题。

## 硬规则

- 没有 BIBLE APPROVED，不得生成正式 Beat Sheet 并宣称批准。
- Beat Sheet 不得自行新增违背 Canon 的能力、身份、秘密或关系结果。
- Cliffhanger 不能代替本集 Payoff。
- 不得只靠“换一个反派/再羞辱一次/再救一次”制造升级。
- 延期承诺必须记录理由和替代兑现；不得自行篡改已批准的 payoff window。需要改窗时保留原 window，标记 `REQUIRES APPROVAL`，留在 USVD 02 等待批准。
- 广告或标题承诺必须能指向正片中的场景/集证据；不得用不存在的高潮承诺吸引观看。
- 只有具有明确批准记录的广告、标题或故事承诺可沿用为既有承诺；本次新拟广告/标题标 `PROPOSED`，经明确批准后才能成为正片必须兑现的约束，不把计划落点当作已兑现证据。
- 单集 Gate 必须复核关联 Promise ID 的到期状态和相邻集状态变化；缺少本集 payoff、主动行动或具体代价时不得以 cliffhanger 补足。
- 本阶段不写正式对白剧本。
- 本阶段不做资产、分镜或视频提示词。

## 输出格式

先写 `【本次模式】Story Bible | Episode Beat Sheet`。

模式 A 输出 `【BIBLE DRAFT|BIBLE APPROVED】` + 完整架构字段。
模式 B 输出 `【BEATS APPROVED|BEATS REWRITE】` + 六个核心 Beat + `【US Project Contract 状态】`（沿用、提取或更新的假设/核验状态）+ continuity/handoff。

模式 A 的下一步仍是 USVD 02：只有 `BIBLE APPROVED` 后才能在下一次调用单独生成并批准目标集 Beat Sheet。`【交给 USVD 03 的输入】` 必须标“待本集 BEATS APPROVED 后交付”，不得建议只凭 Bible 起草剧本，也不得在本次顺手生成 Beat Sheet。

模式 B 只有 `BEATS APPROVED` 才提供 `【交给 USVD 03 的输入】`（Bible、目标集 Beats、Contract、状态与承诺）；`BEATS REWRITE` 留在 USVD 02。

## 停止条件

完成当前一个 Gate 后立即停止。**模式 A 完成后不得自动继续模式 B；模式 B 完成后不得自动写剧本。**
