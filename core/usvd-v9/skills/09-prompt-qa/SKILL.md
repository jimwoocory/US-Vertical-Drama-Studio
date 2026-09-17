---
name: usvd-v9-09-prompt-qa
description: 当 Stage 08 已输出 Seedance 2.0 Mini VIDEO master / SHOT delta Prompt，需要在交付生成前检查剧情覆盖、VIDEO/SHOT 时间闭合、资产漂移、视线/方向/动作连续性、Prompt 冲突与过载、对白时长和 endpoint capability 声明时调用；只诊断、定位和 Gate，不静默改写上游内容。
version: 0.2.0
---

# USVD V9 09 — Prompt QA

## 前置 Gate

必须具备：
- `STAGE 06 APPROVED`
- `STAGE 07 APPROVED`
- `STAGE 08 READY FOR QA`
- Stage 06 VIDEO/SHOT package
- Stage 07 performance/cinematography package
- Stage 08 Seedance 2.0 Mini prompt package
- Asset Ledger / Continuity Ledger
- 当前 endpoint capability profile

缺少能影响判断的结构化证据时，不得凭感觉给 PASS；输出 `BLOCKED` 并列出缺失输入。

## 唯一职责

Stage 09 只回答：**这个 Prompt package 是否忠实、连续、可执行、不过载，并且能追溯到具体 VIDEO/SHOT/Asset 与规则。**

Stage 09 可以：
- 运行机器检查；
- 做人工审片前检查；
- 输出稳定 defect ID、证据、严重度和回退阶段；
- 要求 Stage 06 / 07 / 08 定点修订。

Stage 09 不可以：
- 静默改剧本；
- 静默换资产；
- 静默改 VIDEO/SHOT 时序；
- 直接重写 Stage 08 Prompt 后假装 QA PASS；
- 用“感觉更好”替代可定位证据。

## Gate 结果

只允许：
- `PASS`：无 blocking/major defect，机器检查通过，人工清单无未解决重大项；
- `REVISE`：存在可由 Stage 07/08 定点修正的问题；
- `BLOCKED`：缺关键输入、故事/资产/连续性事实冲突、时间不闭合或模型能力声明无法验证。

## Defect 格式

每个缺陷必须包含：
- `defect_id`
- `severity`: `blocker | major | minor`
- `stable_ref`: `VIDEO-*` / `SHOT-*` / `ASSET-*` / package-level ref
- `rule`
- `evidence`
- `requested_action`
- `return_to_stage`: `06 | 07 | 08 | upstream`

禁止只写“提示词不好”“不够电影感”“节奏有问题”这类不可执行结论。

## 机器检查

### 1. Story/source coverage
- `required_source_refs` 必须被 VIDEO 的 `source_scene_refs` 完整覆盖；
- 不允许 Prompt 引入 source coverage 之外的新剧情事件；
- 缺失覆盖 → `major`，无来源新增事实 → `blocker`。

### 2. VIDEO/SHOT timing closure
复用 Stage 06 硬规则：
- 第一条 SHOT = 0.0s；
- 无 gap / overlap；
- shot duration = time_out - time_in；
- 最后一条 SHOT time_out = VIDEO duration。

任何闭合失败均为 `blocker`。

### 3. Asset identity / LOOK / SET / PROP drift
- VIDEO/SHOT `asset_ids` 必须属于 approved Asset Ledger；
- Prompt/reference binding 不得出现未批准资产 ID；
- active LOOK、PROP holder/state、SET anchor 不得无依据变化。

未知资产或身份漂移 → `blocker`。

### 4. Blocking / eyeline / screen direction continuity
逐相邻 SHOT 对比：
- screen direction；
- eyeline target/direction；
- character position；
- PROP holder/state；
- LOOK / SET / weather-time state。

如果 Stage 06 continuity-out 与下一 SHOT continuity-in 不一致且没有 `approved_transition` → `major`。

### 5. Camera contradictions / unmotivated direction
检查：
- 同一 SHOT 同时要求 `LOCKED/STATIC` 与 push/pan/tilt/dolly/orbit/zoom 等运动；
- Stage 07 声明 movement 但缺 `movement_motivation`；
- focus/light/cut 变化缺叙事或连续性理由。

矛盾 → `major`；无动机装饰性指令 → `major/minor`。

### 6. Impossible simultaneous actions
结构化 `simultaneous_actions` 中标记 mutually exclusive 的动作不得同时发生。若动作物理上互斥或依赖顺序却被写成同一瞬间 → `major`。

### 7. Prompt redundancy / AI-style padding
检查：
- `8K`、`masterpiece`、无功能 generic `cinematic`；
- VIDEO master 与 SHOT delta 完全复制；
- 同一限制/资产描述在 delta 中无变化地大段重复；
- 无叙事目的的形容词堆叠。

机器只处理确定性模式；语义冗余进入人工检查。

### 8. Endpoint capability truthfulness
复用 Stage 08 capability profile：
- target model 必须是 `Seedance 2.0 Mini`；
- unsupported/unknown 不得标 native；
- external 必须有 execution owner；
- 不得借用其他模型或其他 Seedance 版本语法。

错误能力声明 → `blocker`。

### 9. Dialogue duration feasibility
对白时长使用项目内部 QA 启发式，不声称是模型官方限制：
- 英文默认审查阈值：`<= 3.0 words/second`；
- 超过阈值 → `major`，要求调整镜头时长、对白或外部音频计划；
- approved dialogue 文本本身不得由 QA 静默删改。

### 10. Prompt overload
复用 Stage 08 内部预算：
- VIDEO master > 1600 Unicode chars → `major`；
- SHOT delta > 520 Unicode chars → `major`；
- REVIEW 区间必须有 degradation log。

### 11. Continuity in/out closure
VIDEO 与 SHOT 的结束状态必须成为下一单元的合法起点；伤势、PROP、LOOK、位置、方向、时间/天气不可凭空复位。

## 人工审片前清单

机器检查通过后，仍必须人工确认：
- 0–3 秒是否有清楚可见的信息/动作/反应，不依赖说明文字才能理解；
- 每个 SHOT 是否只有一个主要视觉任务；
- 表演是否从可观察动作表达，而非抽象情绪词；
- 反应镜头是否给到足够的“看见 → 反应 → 决定”变化；
- 镜头变化是否由动作、信息、情绪或空间驱动；
- 画面中最重要信息是否在竖屏构图里有明确优先级；
- VIDEO master 是否能独立描述完整过程，SHOT delta 是否只做局部变化；
- 音频/口型外部链路是否和画面 timing 对齐；
- 观看时是否出现“连续几个镜头都只有站着、看、慢推”的重复节奏；
- 是否存在 AI 常见的无因果微动作、道具复制、人物漂移或空间跳变。

人工清单发现重大问题时，不能因为机器 PASS 就放行。

## Golden Case 回归

每个 Golden Case 必须固定：
- 同一 source coverage；
- 同一 approved assets；
- 同一 `Seedance 2.0 Mini` 目标与 endpoint profile；
- baseline Prompt Engine 输出；
- V9 Prompt Engine 输出；
- baseline defects；
- V9 defects；
- material change → rule mapping；
- 人工审片结果字段（未生成时必须明确 `pending`，不得编造）。

V9 不要求“所有主观指标必然更好”，但要求：
- blocker/major defect 不增加；
- 新规则导致的变化可追溯；
- 若出现回归，能定位到 06/07/08/09 的具体规则。

## 输出顺序

1. `【Stage 09 Gate】`
2. `【Machine QA Summary】`
3. `【Defects】`
4. `【Human Review Checklist】`
5. `【Return-to-stage Actions】`
6. `【Golden Case Regression】`（回归任务时）

## 完成条件

只有机器规则通过、重大人工项已解决、所有 defect 都有 stable ref，并且没有未验证 capability claim 时，才输出 `PROMPT QA PASS`。
