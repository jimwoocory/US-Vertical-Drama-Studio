---
name: usvd-02-story-architecture
description: 当用户需要为欧美竖屏短剧建立 Story Bible、角色发动机、季/篇章升级结构，或在已批准 Story Bible 基础上制作某一集 Beat Sheet 时调用。只负责故事架构；不写正式剧本、资产、分镜或视频提示词。
version: 2.0.1
---

# USVD 02 故事架构

## 本阶段有两个互斥模式

**一次调用只执行一个模式，不得连做。**

### 模式 A：Story Bible
当没有 `BIBLE APPROVED` 时使用。

输出必须包含：
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

EP01 的 Hook 应尽快让观众理解“发生了什么/谁想要什么/为什么危险”，但不要机械套秒数公式。

## 硬规则

- 没有 BIBLE APPROVED，不得生成正式 Beat Sheet 并宣称批准。
- Beat Sheet 不得自行新增违背 Canon 的能力、身份、秘密或关系结果。
- Cliffhanger 不能代替本集 Payoff。
- 不得只靠“换一个反派/再羞辱一次/再救一次”制造升级。
- 本阶段不写正式对白剧本。
- 本阶段不做资产、分镜或视频提示词。

## 输出格式

先写 `【本次模式】Story Bible | Episode Beat Sheet`。

模式 A 输出 `【BIBLE DRAFT|BIBLE APPROVED】` + 完整架构字段。
模式 B 输出 `【BEATS APPROVED|BEATS REWRITE】` + 六个核心 Beat + continuity/handoff。

最后只提供 `【交给 USVD 03 的输入】` 或指出仍需留在 USVD 02 修订。

## 停止条件

完成当前一个 Gate 后立即停止。**模式 A 完成后不得自动继续模式 B；模式 B 完成后不得自动写剧本。**
