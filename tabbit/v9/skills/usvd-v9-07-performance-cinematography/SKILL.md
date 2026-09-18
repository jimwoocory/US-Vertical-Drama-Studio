---
name: usvd-v9-07-performance-cinematography
description: 当 Stage 06 已经输出 APPROVED VIDEO/SHOT 分镜计划，需要把每个 SHOT 精确导演成可执行的表演、Blocking、视线、构图、摄影机、焦点、光线与 Cut 动机时调用；只做导演层精化，不改剧情、不改锁定资产、不写最终视频模型 Prompt。
version: 0.2.0
---

# USVD V9 07 — 表演与摄影导演

## 前置 Gate

必须具备：
- `STAGE 06 APPROVED`
- Stage 06 VIDEO/SHOT package
- Continuity Ledger
- Asset Ledger
- approved dialogue/audio plan；优先使用 SHOT 级 `shot_events`，旧版才读取 VIDEO 级聚合字段

如果 Stage 06 时间没有闭合、资产未锁定或来源覆盖不完整，输出 `BLOCKED` 并返回 Stage 06。

## 唯一职责

Stage 07 只回答：**已经确定的每个 SHOT 应该怎样被演员和摄影机执行，才能把该镜头的叙事目的拍出来。**

Stage 07 不新增剧情、不改变对白结果、不重新划分 VIDEO/SHOT、不改变锁定资产，也不负责模型 Prompt Engineering。它不得改写或静默丢弃 Stage 06 的音频事件事实。

### SHOT 事件与兼容读取

- 新数据优先读取 `shot_events`，按 `event_id`、时间范围和 `source_ref` 绑定到表演、动作、切点与摄影指令。
- 旧数据只有 VIDEO 级 `dialogue_audio_plan` 时，才按 SHOT 时间范围切片；无法确定归属时输出 `REVIEW_REQUIRED` 或 `BLOCKED`，不得静默复制。
- 每个事件必须保留来源和执行意图；Stage 07 只补充导演关系，不改写台词文本。

## 每个 SHOT 必须补齐

### 1. Blocking
- 人物起始位置、移动方向、停止点；
- 与 SET 固定物、PROP、其他角色的空间关系；
- 进出画方向；
- 动作必须可见、可执行，不写抽象心理活动。

### 2. Eyeline
- 角色具体看向谁/什么；
- eyeline 高低、左右方向；
- 反打关系和屏幕方向保持一致；
- 只有叙事明确需要时才允许打破 180° 关系，并写明原因。

### 3. Gesture
- 只保留能传达意图、权力关系或情绪变化的动作；
- 避免每句台词都配手势；
- PROP 交互必须与 continuity 状态一致。

### 4. Micro-expression
- 使用可观察变化：停顿、眨眼、下颌收紧、嘴角变化、呼吸、吞咽、目光转移等；
- 每个微表情必须对应一个可说明的情绪/信息变化；
- 不使用“更有戏”“更电影感”之类不可执行描述。

### 5. Performance transition
明确 SHOT 内的表演状态变化，例如：
`戒备 → 识别到威胁 → 强行镇定`。

必须能对应 SHOT 的 narrative purpose。

### 6. Shot size / composition
- 景别：ECU / CU / MCU / MS / MLS / WS 等，输出时附中文说明；
- 主体在画面中的位置与视觉优先级；
- 前景/中景/背景关系；
- 留白、遮挡、负空间只有在叙事需要时使用；
- 不为“好看”改变 Stage 06 已确认的空间连续性。

### 7. Camera height / angle
- 眼平、高机位、低机位、肩后、贴近物体等；
- 角度必须服务信息、权力关系、主观感受或空间清晰度；
- 不允许无原因极端仰俯角。

### 8. Lens feeling
用视觉效果描述镜头感，而不是硬塞器材参数：
- 空间压缩/拉开；
- 面部透视强弱；
- 环境信息量；
- 主体与背景关系。

除非制作规格明确要求，不强制写具体毫米数。

### 9. Camera movement
每个运镜必须写 `movement_motivation`：
- 跟随关键动作；
- 揭示新信息；
- 改变权力关系；
- 重构空间关系；
- 强化主观感受。

如果没有明确动机，默认 `LOCKED / STATIC`。禁止为了“电影感”持续推拉摇移。

Stage 06 的 `camera_intent` 是叙事来源；Stage 07 输出可执行的 `camera_movement` 和 `movement_motivation`。二者冲突时返回 Stage 06，不由 Stage 07 猜测。

### 10. Focus behavior
- focus target；
- 何时保持、何时 rack focus；
- 焦点变化必须对应叙事信息转移；
- 没有信息转移时不要设计无意义焦点漂移。

### 11. Lighting motivation
只描述有来源和叙事作用的光：
- 环境实际光源；
- 时间/天气连续性；
- 人物脸部可读性；
- 光线变化对应的事件或空间变化。

不得用 generic quality tokens 代替灯光设计。

### 12. Cut motivation
每个 SHOT 的结束必须能说明为什么此处 Cut：
- 动作完成；
- 视线触发；
- 信息揭示；
- 情绪反应；
- 台词重音；
- 空间关系需要切换。

没有明确 Cut 动机时，应检查是否真的需要拆成两个 SHOT。

## 连续性约束

Stage 07 必须继承 Stage 06：
- `video_id / shot_id`
- `time_in / time_out / duration`
- source coverage
- asset IDs
- continuity in/out
- screen direction
- dialogue timing

Stage 07 可以精化执行方式，但不得让相邻镜头在人物位置、eyeline、PROP 持有、LOOK、SET、天气/时间和屏幕方向上产生无解释跳变。

## 禁止输出

禁止输出或维护：
- `video_master_prompt`
- `video_negative_prompt`
- `shot_delta_prompt`
- `final_model_prompt`
- 任何模型专属语法、参数或能力声明

禁止 `8K`、`masterpiece`、无叙事动机的 `cinematic`、无动机镜头运动和形容词堆叠。

## 输出顺序

1. `【Stage 07 Gate】`
2. `【逐镜头表演导演】`
3. `【逐镜头摄影导演】`
4. `【连续性复核】`
5. `【无动机导演指令清理】`
6. `【Stage 08 Handoff】`

每个 SHOT 至少输出：
- `【镜头编号】`
- `【Blocking】`
- `【Eyeline】`
- `【Gesture】`
- `【Micro-expression】`
- `【Performance transition】`
- `【景别/构图】`
- `【Camera height/angle】`
- `【Lens feeling】`
- `【Camera movement】`
- `【Movement motivation】`
- `【Focus behavior】`
- `【Lighting motivation】`
- `【Cut motivation】`
- `【Continuity check】`

## 完成条件

只有所有导演指令都能追溯到具体 `VIDEO-* / SHOT-*`，所有运镜/焦点/光线/Cut 都有叙事或连续性动机，并且没有模型 Prompt 泄漏时，才输出 `STAGE 07 APPROVED`，交给 Stage 08 进行模型翻译。
