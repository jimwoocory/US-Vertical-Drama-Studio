---
name: usvd-v9-08-seedance-2-mini-adapter
description: 当 Stage 06/07 已 APPROVED、资产与连续性已锁定，需要把导演计划翻译并压缩成仅面向 Seedance 2.0 Mini 的中文 VIDEO master + SHOT delta 视频生成提示词时调用；负责模型执行层，不改剧情、不改导演计划、不发明模型能力。
version: 0.2.0
---

# USVD V9 08 — Seedance 2.0 Mini Prompt Adapter

## 前置 Gate

必须同时具备：
- `STAGE 06 APPROVED`
- `STAGE 07 APPROVED`
- `ASSETS LOCKED`
- Continuity Ledger
- approved dialogue/audio plan
- **当前生产端实际使用的 Seedance 2.0 Mini capability profile**

如果 capability profile 缺失，仍可整理“模型无关内容”，但最终输出必须为 `BLOCKED: ENDPOINT CAPABILITY UNVERIFIED`，不得猜测音频、口型、seed、首尾帧、参考图绑定等能力。

## 固定模型边界

本 Skill 的唯一目标模型是：`Seedance 2.0 Mini`。

禁止：
- 引入 Seedance 2.5、MiniMax、Kling、Veo 或其他模型语法；
- 为“以后兼容”设计多模型抽象；
- 把 Stage 06/07 的导演说明整段原样复制成最终 Prompt。

## 唯一职责

Stage 08 只回答：**如何把已经批准的故事事实、资产锁、时序、表演和摄影计划，翻译成 Seedance 2.0 Mini 更容易执行的模型指令。**

它可以：
- 压缩、排序、去重复；
- 将抽象导演意图改写为可观察、可执行动作；
- 将 VIDEO 时序组织成一条直接提交的 master prompt；
- 将每个 SHOT 写成相对 VIDEO master 的局部 delta；
- 将已验证支持的 endpoint 能力绑定到执行字段；
- 将不支持/未验证能力移到 external execution notes。

它不可以：
- 改 Story Bible / Beat / 台词结果；
- 新增服装、场景、人物、道具；
- 改写 Stage 06 的 VIDEO/SHOT 时间；
- 重新设计 Stage 07 的 Blocking / Eyeline / Camera / Light；
- 把“模型可能支持”写成“模型支持”。

## 输入优先级

冲突时按以下顺序裁决，不得自行折中：
1. approved screenplay / Story Bible / Beat；
2. locked Asset IDs 与 reference bindings；
3. Continuity Ledger；
4. Stage 06 VIDEO/SHOT 时序与 continuity in/out；
5. Stage 07 表演与摄影执行计划；
6. capability profile；
7. Prompt 压缩与措辞偏好。

低优先级内容不得覆盖高优先级事实。

## VIDEO master Prompt

每个 `VIDEO-*` 必须输出一条 `video_master_prompt`，作为该 VIDEO 的完整模型提交入口。默认使用中文；approved English names 与 spoken English dialogue 保持原样。

按以下顺序组织：

1. **身份与场景锚点**：`VIDEO-*`、active `CHAR/LOOK/SET/PROP` reference bindings；
2. **连续性起点**：人物位置、屏幕方向、PROP 状态、LOOK/SET 状态；
3. **有序时间序列**：按 SHOT 的 `time_in → time_out` 依次描述可见动作与信息变化；
4. **表演执行**：Blocking、Eyeline、关键 Gesture、Micro-expression、Performance transition；
5. **摄影执行**：Shot size/composition、camera height/angle、必要的 movement + motivation、focus、lighting；
6. **声音/对白执行**：仅把 capability profile 明确支持的 native 能力写入模型执行；否则标 external；
7. **连续性终点**：VIDEO 结束时人物/道具/空间/伤势/LOOK 状态；
8. **Exclusions**：不能改变的身份、服装、场景、PROP、方向与剧情事实。

### VIDEO master 写法纪律

- 使用具体可观察动词，避免空泛形容词。
- 一条指令只承担一个主要动作或约束。
- 时间顺序优先于文采。
- 不重复完整资产外貌；稳定资产使用 ID/reference binding + 必要不可变锚点。
- 运镜必须继承 Stage 07 的 narrative motivation；没有动机则不新增运镜。
- 禁止 `8K`、`masterpiece`、无功能的 `cinematic` 堆叠。

## SHOT delta Prompt

每个 `SHOT-*` 输出 `shot_delta_prompt`。它不是第二份 VIDEO master，也不是把 master 复制一遍。

SHOT delta 只包含相对父 VIDEO 的局部变化：
- 本 SHOT 的精确时间范围；
- 本 SHOT 新发生的动作/反应；
- 本 SHOT 特有的 Blocking / Eyeline / micro-expression；
- 本 SHOT 特有的构图、运镜、焦点或光线变化；
- 本 SHOT 的 continuity state delta；
- 本 SHOT local exclusions。

不变化的角色身份、LOOK、SET、PROP 只引用绑定，不重复长描述。

如果 `shot_delta_prompt` 与父 `video_master_prompt` 基本相同，应判定为 Adapter 失败并重写。

## capability profile 与 external 执行

每项能力必须是 `supported | unsupported | unknown`，至少覆盖：
- `audio`
- `lip_sync`
- `seed`
- `start_frame`
- `end_frame`
- `reference_images`

规则：
- `supported`：只有项目确实要使用时才可标 `native`；
- `unsupported`：不得写成模型原生执行，必须 `external` 或 `unused`；
- `unknown`：按 unsupported 处理，不得乐观推断；
- external 能力必须进入 `external_execution_notes`，写明由 MediaGo/后期/配音/口型链路等外部环节执行；
- capability profile 只描述当前 endpoint，不推导其他 Seedance 版本能力。

## Prompt 预算（项目内部预算，不是模型上下文上限）

为控制过载，采用以下 V9 内部生产预算：

### VIDEO master
- 目标：`<=1200` 个 Unicode 字符；
- `1201–1600`：`REVIEW`，必须检查冗余；
- `>1600`：`OVER_BUDGET`，不得直接交给 Stage 09 PASS。

### SHOT delta
- 目标：`<=360` 个 Unicode 字符；
- `361–520`：`REVIEW`；
- `>520`：`OVER_BUDGET`。

这些数值是 USVDS 的**内部复杂度预算**，不代表 Seedance 2.0 Mini endpoint 的官方最大输入长度。

## 超预算降级顺序

超预算时按顺序删减，直到回到预算；每次删减记录 `degradation_log`：
1. 删除重复形容词、同义词和 generic quality tokens；
2. 删除无叙事作用的氛围/镜头修饰；
3. 合并重复的资产外貌描述，改为 Asset ID/reference binding；
4. 合并重复的 lighting/focus 描述，只保留发生变化的部分；
5. 从 SHOT delta 删除父 VIDEO 已明确且本 SHOT 未变化的内容；
6. 压缩非关键环境细节。

**绝不能删除**：
- story-critical action；
- VIDEO/SHOT 时间顺序；
- active asset identity / LOOK / PROP 状态；
- continuity-critical screen direction / eyeline / prop handoff；
- approved spoken line 与必要 timing；
- Stage 07 明确为叙事必要的 movement/cut motivation。

若仍超预算，输出 `BLOCKED: PROMPT OVERLOAD`，返回 Stage 07/08 人工简化，不得牺牲剧情事实。

## Negative / Exclusions

`video_negative_prompt` 与 `local_exclusions` 只写可验证的“不要改变”：
- 不改变 CHAR identity；
- 不改变 active LOOK；
- 不新增/删除未授权 PROP；
- 不改变 SET 固定锚点；
- 不翻转既定屏幕方向；
- 不新增剧本外动作/人物；
- 不做 Stage 07 未批准的装饰性运镜。

不要把 positive prompt 全部反写成 negative prompt。

## Traceability

每条输出都必须可追溯：
- VIDEO 输出：`video_id + source_scene_refs + asset_ids + prompt_id`；
- SHOT 输出：`shot_id + parent video_id + time range + asset_ids + prompt_id`；
- reference binding：`asset_id → reference_id/path`；
- external note：`feature → capability status → execution owner`。

禁止输出无法定位到稳定 ID 的匿名 Prompt。

## 输出顺序

1. `【Stage 08 Gate】`
2. `【Capability Profile】`
3. `【Reference Bindings】`
4. `【VIDEO Master Prompts】`
5. `【SHOT Delta Prompts】`
6. `【External Execution Notes】`
7. `【Prompt Budget Report】`
8. `【Degradation Log】`
9. `【Stage 09 Handoff】`

## 完成条件

只有以下全部满足，才输出 `STAGE 08 READY FOR QA`：
- target model 精确为 `Seedance 2.0 Mini`；
- VIDEO master / SHOT delta 职责不重复；
- 所有 Prompt 可追溯到 VIDEO/SHOT/Asset IDs；
- capability claims 与 profile 一致；
- unsupported/unknown 能力已 external/unused；
- Prompt 未出现无效 quality-token 堆叠；
- Prompt 在预算内，或 REVIEW 项有明确 degradation log；
- story / asset / continuity / timing 未被 Adapter 改写。

随后交给 Stage 09 Prompt QA；Stage 09 可要求 Stage 08 定点重写，但不得静默修改上游导演计划。
