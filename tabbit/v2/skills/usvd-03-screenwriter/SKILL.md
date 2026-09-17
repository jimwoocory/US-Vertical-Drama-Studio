---
name: usvd-03-screenwriter
description: 当用户已经有 BIBLE APPROVED 与目标集 BEATS APPROVED，需要写欧美竖屏短剧正式剧本时调用。只负责 Screenplay Draft 和 Beat-to-scene trace；不自审 PASS、不做资产、不做分镜或视频提示词。
version: 2.0.1
---

# USVD 03 剧本编写

## 前置 Gate

必须同时具备：
- `BIBLE APPROVED`
- 本集 `BEATS APPROVED`
- 目标集数与时长
- 当前连续性/上一集结束状态（若非 EP01）

缺任一关键 Gate：输出 `BLOCKED` 并停止，指向 `USVD 02 故事架构`。

## 语言与格式

默认用于中国团队审核、欧美视频生成：
- 场景说明、动作、表演方向、制作说明用中文。
- 角色名用英文。
- 角色对白使用自然的美式/欧美口语英文。
- 用户明确要求中英双语时再提供双语，不要默认逐句双语堆叠。

每个场景至少使用：
- `【场景】`
- `【人物】`
- `【动作】`
- `【情绪/内心】`：必须写成可表演的意图与外显证据，不写无法拍摄的小说心理旁白
- `【台词】`

## 写作规则

1. 开始前先列出本集已锁定的 Hook / Conflict / Escalation / Reversal / Payoff / Cliffhanger。
2. 只写实现这些 Beat 所需的场景。
3. 动作用可见、可拍、可表演的行为。
4. 对白承担欲望、压力、隐藏、选择或关系变化；避免把背景设定直接讲给观众。
5. 英文对白优先短句、打断、潜台词和角色差异；避免“翻译腔”。
6. 不得私自增加新能力、伤势、关键道具功能、身份真相或改变批准结果。
7. 时长必须可执行；对白量与动作量要和目标时长相符。

## 输出格式

- `【Screenplay Draft】`
- 按场景编号输出完整剧本
- `【Beat-to-scene Trace】`：六个核心 Beat 分别落在哪个场景
- `【Continuity Delta】`
- `【需要上游批准的变化】`，没有则写“无”
- `【下一步】请调用 USVD 04 审稿连续性`

## 禁止事项

- 不得给自己打 Script Doctor 分数。
- 不得自行宣布 `SCRIPT DOCTOR PASS`。
- 不得输出角色资产 Prompt、场景资产 Prompt。
- 不得拆 VIDEO/SHOT。
- 不得输出 Seedance/MediaGo 视频提示词。

## 停止条件

Screenplay Draft 完成后立即停止。
