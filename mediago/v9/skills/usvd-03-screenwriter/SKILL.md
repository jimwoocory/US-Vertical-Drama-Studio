---
name: usvd-03-screenwriter
description: 当用户已经有 BIBLE APPROVED 与目标集 BEATS APPROVED，需要写欧美竖屏短剧正式剧本时调用。只负责 Screenplay Draft 和 Beat-to-scene trace；不自审 PASS、不做资产、不做分镜或视频提示词。
version: 2.1.0
---

# USVD 03 剧本编写

紧凑检查与示例见 [US Writing Review](references/us-writing-review.md)。

## 前置 Gate 与写作输入

必须同时具备：
- `BIBLE APPROVED`
- 本集 `BEATS APPROVED`
- 目标集数与时长
- 当前连续性/上一集结束状态（若非 EP01）

缺任一关键 Gate：输出 `BLOCKED` 并停止，指向 `USVD 02 故事架构`。

先读取 `US Project Contract` 与 `Character Voice Card`。Contract 应明确目标受众/观看承诺、单集时长、平台或发行约束、免费/订阅/币内容边界，以及已有广告或标题承诺；它只约束可写内容，不把价格、广告故障或退款当作剧本问题。Voice Card 应包含角色词汇、回避话题、压力下的声线和代表句。

缺新 Contract 或 Voice Card 时，兼容旧版已批准材料：从批准 Bible、Beat Sheet 与连续性材料中只读提取可证实字段；无法证实的字段写入 `【Assumptions / Missing Inputs】`，不得编造、改写或补齐 Canon。只有缺失使 Canon 或关键 Beat 无法保留时才输出 `BLOCKED` 并要求上游确认。

## 语言与场景规则

默认用于中国团队审核、欧美视频生成：
- 场景说明、动作、表演方向、制作说明用中文。
- 角色名用英文；对白默认使用自然的美式英语口语。除非 Contract 明确其他目标英语市场，不得以泛“欧美口语”宣称已完成美国本土化。
- 用户明确要求中英双语时才提供双语；不要默认逐句双语堆叠。

每场至少使用：`【场景】`、`【人物】`、`【动作】`、`【情绪/内心】`、`【台词】`。情绪/内心必须是可表演的意图与外显证据，不能写无法拍摄的小说心理旁白。

1. 先列出本集锁定的 Hook / Conflict / Escalation / Reversal / Payoff / Cliffhanger，以及本集需兑现的已到期承诺。若批准 Bible 明确本集为 finale，`Cliffhanger` 可写 `none`，但必须以 closing payoff 与 Series Question/终局情绪目的地的兑现证据替代；非 finale 仍须有具体下一集问题。
2. 只写实现这些 Beat 与承诺所需的场景；不得新增能力、伤势、关键道具功能、身份真相或改变批准结果。
   场景中的措辞、走位与普通动作可以创作；改变证据链的新事实（例如批准材料中没有的通话时间、不在场证明、记录来源、资金权限）必须列入 `【需要上游批准的变化】`，不得作为已批准事实使用后又写“无变化”。先以已有证据完成 Beat；需要关键新事实才能成立时回 USVD 02。
3. 主角在每个关键转折必须有可见行动或选择，并显示即时代价、风险或失去的选项。
4. 对白承担欲望、压力、隐藏、选择或关系变化；用短句、打断、潜台词与角色差异避免翻译腔。相邻角色台词可互换时，按 Voice Card 修订其策略、词汇或回避方式。
5. 动作与台词都必须可拍、可表演；不要把背景设定直接讲给观众。

## 时长与可追溯性

给出 `【Read-through Runtime Estimate】`：目标时长、按对白/动作/停顿作出的估算、风险点。除非提供了实际朗读记录，不得标注“朗读已验证”。

引用对白词数时写明计数口径（排除角色标签、动作与 Trace；说明收缩词是否算一个词），使时长依据可复核。没有计数或实测证据时标为粗估，不把估算写成“已实数/已测读”。

`【Beat-to-scene Trace】` 对六个核心 Beat 各列出：Beat、场景、可见状态变化、兑现的 promise（无则写 `none`）、剧本证据（scene/line 或动作）。批准 finale 的 Cliffhanger 行写 `none`，并在同一行列 closing payoff / Series Question 兑现证据。

## 输出格式

- `【Input Basis】`：Bible/Beats/Contract/Voice Card/continuity 的来源与状态
- `【Assumptions / Missing Inputs】`
- `【Locked Beats and Due Promises】`
- `【Screenplay Draft】`
- `【Read-through Runtime Estimate】`
- `【Beat-to-scene Trace】`
- `【Continuity Delta】`
- `【需要上游批准的变化】`，没有则写“无”
- `【下一步】请调用 USVD 04 审稿连续性`

## 禁止事项与停止条件

- 不得给自己打 Script Doctor 分数或宣布 `SCRIPT DOCTOR PASS`。
- 不得输出角色资产 Prompt、场景资产 Prompt、VIDEO/SHOT、Seedance/MediaGo 视频提示词。
- Screenplay Draft 完成后立即停止。
