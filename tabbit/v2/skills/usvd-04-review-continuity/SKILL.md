---
name: usvd-04-review-continuity
description: 当用户已有欧美竖屏短剧 Screenplay Draft，需要独立 Script Doctor 审稿并在 PASS 后完成连续性核对时调用。只做诊断、Gate 与 Continuity Ledger；不代写新剧本、不做资产、分镜或视频提示词。
version: 2.0.0
---

# USVD 04 审稿连续性

## 前置输入

必须有：Screenplay Draft、`BIBLE APPROVED`、本集 `BEATS APPROVED`，以及已有连续性状态（如有）。

## Part A：Script Doctor

独立检查，不要替编剧偷偷重写。

### 100 分结构
- Hook / 前段留存：15
- Conflict 与目标障碍清晰度：15
- Escalation：15
- Reversal：15
- Payoff：10
- Cliffhanger / 下一集问题：10
- 人物行为与情绪因果：8
- 欧美对白自然度与潜台词：7
- 可拍性 / 时长可执行：5

Gate：
- `>=85` 且无 Mandatory Fail → PASS
- `75–84` 且无 Mandatory Fail → REWRITE
- `<75` → REJECT

### Mandatory Fail
任一项出现即不能 PASS：
- 缺批准的 Story Bible 或 Beat Sheet
- 剧本私改核心 Beat
- EP01 的 Hook / Conflict / Escalation / Reversal / Payoff / Cliffhanger 有关键缺失
- 严重 Canon/Continuity 冲突
- 没有可理解的主要目标/障碍
- 没有本集局部 Payoff
- 没有具体下一集问题

如果 Gate 不是 PASS：输出证据与明确修改目标，然后**立即停止**；不得进入连续性部分。

## Part B：Continuity

只有 `SCRIPT DOCTOR PASS` 才执行。

逐项核对并更新：
- Canon facts
- Who-knows-what / knowledge state
- Relationship state
- Injury / power state
- Props：持有人、状态、损坏、去向
- Look / wardrobe carry-forward（仅记录剧情相关）
- Plants / payoff ledger
- Reveal windows
- Unresolved promises
- Repetition signatures

出现无法由现有 Canon 解释的冲突 → `CONTINUITY BLOCKED`，不要自行修剧情。
全部一致 → `CONTINUITY CLEAR`。

## 输出格式

- `【Script Doctor Gate】PASS|REWRITE|REJECT`
- `【Scorecard】`
- `【Mandatory Fail】`
- `【Evidence】`
- 非 PASS：`【Required Rewrite Targets】` 并停止
- PASS 后继续：
  - `【Continuity Status】CLEAR|BLOCKED`
  - `【Updated Continuity Ledger】`
  - `【Canon Delta】`
  - `【Knowledge Delta】`
  - `【Prop/Look/State Delta】`
  - `【Unresolved Promises】`
  - `【下一步】USVD 05 资产锁定`（仅 PASS + CLEAR）

## 禁止事项

不代写整场替换稿；不做资产；不做分镜；不输出视频提示词。
