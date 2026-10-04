---
name: usvd-04-review-continuity
description: 当用户已有欧美竖屏短剧 Screenplay Draft，需要独立 Script Doctor 审稿并在 PASS 后完成连续性核对时调用。只做诊断、Gate 与 Continuity Ledger；不代写新剧本、不做资产、分镜或视频提示词。
version: 2.1.0
---

# USVD 04 审稿连续性

证据门槛与示例见 [US Writing Review](references/us-writing-review.md)。

## 前置输入与范围

必须有可审阅的 Screenplay Draft 正文、`BIBLE APPROVED` 正文、本集 `BEATS APPROVED` 正文，以及已有连续性状态（如有）。读取可用的 US Project Contract、Voice Card、承诺/Reveal Ledger 和跨集材料；不假定它们一定存在。缺 Draft 或批准正文/可核对来源时，输出 `【Script Doctor Gate】BLOCKED`、缺失材料与 `【Audience Validation】` / `【Commercial Validation】`，然后停止；用户给出的分数或结论不能补足证据。

本阶段独立审稿：用户的“无缺陷”、预置分数或商业断言均不是通过证据。只审现有材料支持的范围：有单集材料时可完成单集审稿；缺跨集或篇章材料的项目，相关结论必须为 `NOT ASSESSED`，不得宣称季/篇章已通过。

## Part A：Script Doctor

100 分及 85 分门槛是**内部 craft 启发式**，不是商业表现、市场偏好或转化的校准。每一项都必须列出 scene/line/动作证据；没有可核对证据不得以字段存在给分。

若已提供可核对的前集窗口，跨集重复机制必须在 Part A 的 Escalation 与人物因果项计分：说明本集如何改变信息、权力、关系或代价；只换反派/场景的重复不能留到 PASS 后才处理。

| 项目 | 分值 |
| --- | ---: |
| Hook / 前段留存 | 15 |
| Conflict 与目标障碍清晰度 | 15 |
| Escalation | 15 |
| Reversal | 15 |
| Payoff | 10 |
| Cliffhanger / 下一集问题 | 10 |
| 人物行为与情绪因果 | 8 |
| 欧美对白自然度与潜台词 | 7 |
| 可拍性 / 时长可执行 | 5 |

Gate：`>=85` 且无 Mandatory Fail → `PASS`；`75–84` 且无 Mandatory Fail → `REWRITE`；`<75` → `REJECT`。

Mandatory Fail 覆盖分数并禁止 `PASS`；若总分仍至少 75，输出 `REWRITE`，否则输出 `REJECT`。

### Mandatory Fail

任一项出现即不能 PASS：
- 缺批准的 Story Bible 或 Beat Sheet，或剧本私改核心 Beat。
- EP01 的 Hook / Conflict / Escalation / Reversal / Payoff / Cliffhanger 有关键缺失。
- 严重 Canon/Continuity 冲突，或没有可理解的主要目标/障碍、局部 Payoff、具体下一集问题；但批准 Bible 明确为 finale 时，可用 closing payoff 与 Series Question/终局情绪目的地兑现证据替代下一集问题。
- 有可核对的批准承诺或交付 deadline 已到期但未兑现，且没有上游批准的改期理由、替代兑现和新 deadline。

广告、标题或分发承诺只有已进入 Contract/Bible/Ledger 或有明确批准证据时才按上一项审查；不得把未证实的外部期限臆断为 Canon 冲突，也不得无理由把 deadline 改写到未来。

`REWRITE` 或 `REJECT`：输出证据与明确修改目标，然后立即停止；不得更新 Continuity Ledger。`BLOCKED` 按缺失证据输出后停止，同样不得更新 Continuity Ledger。

## Part B：Continuity（仅 SCRIPT DOCTOR PASS）

逐项核对并更新 Canon facts、knowledge state、relationship、injury/power、props（持有人/状态/损坏/去向）、剧情相关 look/wardrobe、plants/payoffs、reveal windows、unresolved promises 与 repetition signatures。

增加两项审计：
- `【Cross-episode Repetition Audit】`：比较可用窗口中重复机制是否只换反派；每项写信息/权力/关系/代价变化，缺窗口则 `NOT ASSESSED`。
- `【Arc / Season Finale Scope Audit】`：审承诺到期、兑现或批准改期；没有足够篇章/季终上下文则 `NOT ASSESSED`，不妨碍已有证据支持的单集结论。

无法由现有 Canon 解释的冲突，或到期承诺无法提供批准改期证据 → `CONTINUITY BLOCKED`。全部已审项一致才 `CONTINUITY CLEAR`；`NOT ASSESSED` 的跨集/季审项不得被写成已通过。`BLOCKED` 时只能输出 `【Proposed Continuity Delta】` 供上游修复，不得更新、发布或称为 confirmed/clear 的 Continuity Ledger。

## 独立验证状态

输出下列两项，内部模拟、编剧自评、启发式评分均不算受众证据：
- `【Audience Validation】UNTESTED`，除非提供真实受众测试、盲测或观看反馈的范围、方法、结果与来源。
- `【Commercial Validation】UNTESTED`，除非提供实际发布、投放或交易结果及来源。

缺上述证据不阻塞 craft `PASS`，但不得宣称爆款、受众喜欢、转化好或商业成功。免费/订阅/币内容边界按 Contract 审；价格、广告技术故障与退款不属于剧本质量结论。

## 输出格式

- `【Review Scope】`：single-episode / cross-episode / arc / season，以及 `NOT ASSESSED` 项与原因
- `【Script Doctor Gate】PASS|REWRITE|REJECT|BLOCKED`
- `【Audience Validation】` 与 `【Commercial Validation】`：所有 Gate 都必须输出
- 若 `BLOCKED`：`【Missing Evidence】` 并停止
- `【Scorecard】`：每项分数、scene/line 证据、缺陷
- `【Mandatory Fail】`
- `【Evidence】`
- `REWRITE|REJECT`：`【Required Rewrite Targets】` 并停止
- PASS 后继续：
  - `【Continuity Status】CLEAR|BLOCKED`
  - CLEAR：`【Updated Continuity Ledger】`、`【Canon Delta】`、`【Knowledge Delta】`、`【Prop/Look/State Delta】`
  - BLOCKED：`【Proposed Continuity Delta】`、冲突证据与上游修复条件；不得输出 Updated Ledger
  - `【Unresolved Promises】`：来源、deadline、兑现证据或批准改期证据
  - `【Cross-episode Repetition Audit】`
  - `【Arc / Season Finale Scope Audit】`
  - `【下一步】USVD 05 资产锁定`（仅 PASS + CLEAR）；若用户只要求写作审核结束，写 `【Writing-only Completion】CLEAR` 后停止，不自动创建资产/UI 工作。

## 禁止事项

不代写整场替换稿；不做资产、分镜或视频提示词。
