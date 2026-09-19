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

### V9.1 升级门禁

- `VIDEO.duration_seconds` 必须等于全部 SHOT 时长之和，允许误差 `±0.01s`；超过 `15s` 为 `blocker`，15 秒不是补齐目标。
- 每个 SHOT 必须存在 `dialogue`、`inner_voice`、`environment_sound`、`sfx`、`music_cue`；无内容可为空数组，但字段不能缺失。
- 音频只存在于 VIDEO 级 `dialogue_audio_plan`、而 SHOT 没有对应字段时，判定为 `major`。
- 每个 SHOT 必须显式声明 `camera_movement`；动态运镜缺 `movement_motivation` 判定为 `major`。
- `asset_ids` 必须引用 Asset Ledger；完整角色/场景/道具描述不得在多个 SHOT 中重复复制，资产提示词过载判定为 `major`。
- 每个 `shot_events.event_id` 必须在 Stage 08 落到 `native_execution`、`external_execution_notes` 或 `unused_with_reason`，否则判定为 `major`。
- `video_master_prompt`、`video_negative_prompt`、`shot_delta_prompt` 与 `local_exclusions` 必须为英文；只有 approved spoken dialogue 可保留原语言，否则判定为 `blocker`。

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

### 11. Event execution coverage

- `event_id`、`shot_id`、`source_ref`、`execution_owner` 和 `capability_status` 必须可回溯。
- `inner_voice` 默认检查为 external voiceover，不得被静默当成 lip-sync。
- unknown/unsupported 能力不得进入 native execution。

### 12. Continuity in/out closure
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

## 受控子代理审核 POC（默认关闭）

本阶段的审核子代理是**可选的只读二次意见**，不是生产流水线的默认步骤，也不替代主代理的 Gate 决策。

只有同时满足以下条件，才允许准备一次审核请求：
- Stage 09 的机器 QA 已为 `PASS`；
- 用户明确要求子代理审核，或主审记录了机器规则无法判断的具体主观问题；
- 请求包含一个明确的 `review_question`，不能笼统要求“检查整个项目”。

以下情况不得启动审核：
- 机器 QA 尚有 blocker/major defect；
- 仅因为上下文很长、希望“多找一个 agent”，或试图替代人工审片；
- 其他 Stage（01–08）或一次 Gate 内的第二次审核请求。

审核上下文包必须只包含：当前 Gate 摘要、机器 QA 摘要、未决主观问题、相关 stable refs，以及必要的 VIDEO/SHOT/asset 证据。禁止传入完整聊天记录、无关项目文档或原始工具转录。上下文包上限 `6000 tokens`。

运行边界必须由宿主执行层强制：
- 同时最多 `1` 名 reviewer，委派深度固定为 `1`，不得递归委派；
- reviewer 只读，不得修改项目文档、调用下游 Skill、提交媒体任务或创建子代理；
- reviewer 完成即释放；本 Skill 本身只准备审核请求，**绝不自行 spawn agent**；
- 宿主未配置原生委派时，保留正常的 Stage 09 结果，并标记 `REVIEW NOT RUN`，不得伪造审核结论。

当 DSH 插件配置明确启用 `stage09ControlledReview.enabled: true` 后，主代理可以调用唯一入口 `dramago_stage09_review`。该入口固定使用一次性 `spawn` reviewer；reviewer 没有全局工具访问权，因此不会读写项目、发起生成或继续委派。配置缺少 native `spawn` provider 时必须失败并保持 `REVIEW NOT RUN`。

reviewer 只返回：`review_status`（`PASS` / `NEEDS_REVISION` / `BLOCKED`）、`defects[]`、`return_to_stage`（`06` / `07` / `08` / `upstream` / `none`）和 `evidence[]`。主代理将该意见映射为最终 Stage 09 Gate，且不得静默改写任何生产文档。

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
7. `【Controlled Review】`（仅在实际请求或明确未运行时输出）

## 完成条件

只有机器规则通过、重大人工项已解决、所有 defect 都有 stable ref，并且没有未验证 capability claim 时，才输出 `PROMPT QA PASS`。若运行受控审核，最终 Gate 仍由主代理依据审核证据决定。
