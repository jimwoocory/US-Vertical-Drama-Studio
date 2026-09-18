---
name: usvd-v9-06-storyboard
description: 当欧美竖屏短剧已经 SCRIPT DOCTOR PASS、CONTINUITY CLEAR、ASSETS LOCKED，需要把审核剧本拆成模型无关的 VIDEO/SHOT 分镜导演计划时调用；只负责来源覆盖、时序、叙事拍法和连续性，不编写最终视频模型 Prompt。
version: 0.2.0
---

# USVD V9 06 — 分镜导演

## 前置 Gate

必须同时具备：
- `SCRIPT DOCTOR PASS`
- `CONTINUITY CLEAR`
- `ASSETS LOCKED`
- 最终审核剧本
- approved Beat Sheet / Story Bible 约束
- Continuity Ledger
- Asset Ledger（`CHAR-*` / `LOOK-*` / `SET-*` / `PROP-*`）

缺失任一关键 Gate 时输出 `BLOCKED`，不得自行补造上游内容。

## 唯一职责

Stage 06 只回答：**这段剧情怎样被拆成可执行、连续、可检查的 VIDEO/SHOT 视觉叙事计划。**

它负责：
- 来源场景/Beat 覆盖；
- `VIDEO-*` 独立生成单元划分；
- `SHOT-*` 微镜头划分与包内时间；
- 镜头叙事目的、景别/构图意图、可见动作；
- 屏幕方向、人物进出、道具交接和 continuity in/out；
- 每个 SHOT 的对白、内心独白、环境声、SFX、音乐 cue 与事件时间；
- `camera_movement` 与叙事动机；
- 将批准资产 ID 精确绑定到 VIDEO/SHOT。

它不负责模型翻译、模型能力判断或最终生成 Prompt。

## VIDEO / SHOT 两层结构

### VIDEO

`VIDEO-*` 是一次独立视频生产/生成单元的稳定 ID。默认不得超过项目设定的单视频上限；如果项目没有提供上限，沿用当前生产约束 `<=15s`，但这只是生产时长约束，不代表任何模型能力声明。

每个 VIDEO 必须包含：
- `【视频编号】VIDEO-*`
- `【中文显示名】`
- `【来源场景/原文单元】`
- `【戏剧目标】`
- `【起始状态】`
- `【结束状态】`
- `【时长】`
- `【资产引用】`：只引用已批准 `CHAR/LOOK/SET/PROP`
- `【镜头列表】`：有序 `SHOT-*`
- `【连续性进】`
- `【连续性出】`
- `【audio_schema_version】`：新数据使用 `shot-level-2`；旧版 `dialogue_audio_plan` 只作兼容聚合字段；
- `【时长】`：必须等于全部 SHOT 时长之和，15 秒是上限而不是补齐目标；
- `【声音与台词计划】`：由 SHOT 事件聚合，不再作为新数据的唯一来源。

### SHOT

`SHOT-*` 是父 VIDEO 内的微镜头/节奏单元，不自动等于一次独立模型调用。

每个 SHOT 必须包含：
- `【镜头编号】SHOT-*`
- `【父视频】VIDEO-*`
- `【包内时间】time_in–time_out`
- `【时长】`
- `【叙事目的】`
- `【景别/构图】`
- `【可见动作/Blocking】`
- `【视线/屏幕方向】`
- `【表演节拍】`
- `【镜头意图】`
- `【运镜】`：静态镜头显式写 `LOCKED/STATIC`；动态运镜必须写动机；
- `【对白】`、`【内心独白】`、`【环境声】`、`【SFX】`、`【音乐 cue】`；
- `【shot_events】`：每个事件包含稳定 `event_id`、时间范围、`source_ref` 和 `execution_intent`；
- `【连续性进】`
- `【连续性出】`
- `【连续性变化】`
- `【资产引用】`

Stage 06 的“Blocking / 表演节拍 / 镜头意图”只写叙事需要的粗粒度意图；Stage 07 再负责表演和摄影层的精确化。

## 时间闭合硬规则

对每个 VIDEO：
1. 第一条 SHOT 必须从 `0.0s` 开始。
2. 相邻 SHOT 必须首尾相接；不得有 gap，也不得 overlap。
3. 每条 SHOT 的 `duration = time_out - time_in`。
4. 最后一条 SHOT 的 `time_out` 必须等于父 VIDEO `duration`。
5. SHOT 顺序必须和来源动作/对白因果顺序一致。
6. 调整时长必须重新验证整包闭合，不能只改单镜头数字。
7. `VIDEO.duration_seconds = Σ SHOT.duration_seconds`，允许误差不超过 `0.01s`。
8. `VIDEO.duration_seconds` 超过 `15s` 时必须 `BLOCKED`；不得用 15 秒填充实际不足的镜头。

## 连续性硬规则

逐相邻 SHOT 检查：
- 屏幕方向与 eyeline；
- 人物进出位置；
- 服装/LOOK 状态；
- PROP 持有人、位置、损坏状态；
- SET 空间关系与固定锚点；
- 时间、天气、光线状态；
- 台词开始/结束与动作承接。

发现剧本冲突只输出 `Continuity Warning`，不得静默改剧情。

## 声音、对白与运镜

- Approved English character names 与 approved English dialogue 原样保留。
- 中文只用于导演说明、执行说明、诊断与标签。
- 每个 SHOT 必须直接记录 `dialogue`、`inner_voice`、`environment_sound`、`sfx`、`music_cue`；无内容使用空数组，不得缺字段。
- 每个事件必须带 `event_id`、`shot_id`、`time_in`、`time_out`、`source_ref`、`execution_intent`。
- `camera_movement` 属于分镜字段；Stage 06 写叙事意图，Stage 07 再精化执行参数。
- 角色、道具、场景的完整外观描述不写入 SHOT；只保留 `asset_ids` 和影响连续性的局部状态。
- Stage 06 不判断某视频模型是否原生支持音频、口型或配音。

## 禁止输出

Stage 06 禁止输出或维护以下模型层字段：
- `video_master_prompt`
- `video_negative_prompt`
- `shot_delta_prompt`
- `final_model_prompt`
- 任何以“直接提交给某视频模型”为目的的完整提示词
- 模型专属参数、营销词或能力假设

禁止用 `8K`、`masterpiece`、无叙事目的的 `cinematic` 等词替代导演信息。

## 输出顺序

1. `【Stage 06 Gate】`
2. `【来源覆盖表】`
3. `【VIDEO 计划】`
4. `【SHOT 计划】`
5. `【时间闭合检查】`
6. `【连续性检查】`
7. `【声音与台词计划】`
8. `【Stage 07 Handoff】`

## 完成条件

只有来源覆盖完整、VIDEO/SHOT 时间完全闭合、资产引用合法、continuity in/out 可追踪，并且没有最终模型 Prompt 泄漏时，才输出 `STAGE 06 APPROVED`，随后交给 Stage 07。
