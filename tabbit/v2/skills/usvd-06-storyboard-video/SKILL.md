---
name: usvd-06-storyboard-video
description: 当欧美竖屏短剧已经 SCRIPT DOCTOR PASS、CONTINUITY CLEAR、ASSETS LOCKED，需要制作分镜、15秒以内视频包、0.5–3秒微镜头以及 Seedance/MediaGo 生成提示词时调用。只执行视觉生产拆分，不改剧情、不新增资产。
version: 2.0.0
---

# USVD 06 分镜生成包

## 前置 Gate

必须同时具备：
- `SCRIPT DOCTOR PASS`
- `CONTINUITY CLEAR`
- `ASSETS LOCKED`
- 最终剧本
- Asset Ledger

任何一项缺失 → 输出 `BLOCKED` 并停止。不得自行补造上游内容。

## 项目规格

开始前锁定：目标视频模型、画幅（欧美竖屏默认 9:16）、视觉媒介、地区/时代、单视频最大时长、音频/口型能力、导出目标。用户未提供模型能力时不得假定支持某功能。

## 两层结构

### 第一层：VIDEO 视频包
先按连续动作/对白/场景状态，把剧本覆盖拆成**可独立生成的视频包**。默认每包 `<=15s`。

每个 VIDEO 必须有：
- `【视频编号】VIDEO-xxx`
- `【中文显示名】`
- `【项目规格】`
- `【来源场景/原文单元】`
- `【时长】`
- `【场景与连续状态】`
- `【出场人物与 LOOK】`
- `【关键 PROP】`
- `【光线】`
- `【声音与台词】`
- `【视频生成总提示词】`：直接提交给视频模型的完整中文 master prompt
- `【视频级负面约束】`

**VIDEO 总提示词是正常生成入口，不能用一串子镜头 Prompt 代替。**

### 第二层：SHOT 微镜头
再把每个 VIDEO 拆成连续、可单独调整的 micro-shots。常规 `0.5–3s`；只有不可中断对白/动作才可更长，并写 `【例外原因】`。

每个 SHOT 必须有：
- `【镜头编号】SHOT-xxx`
- `【包内时间】0.0s–2.4s`
- `【时长】`
- `【镜头类型】`
- `【生成方式】`
- `【关联场景】`
- `【画面/构图】`
- `【角色与服装】`：只引用已锁 CHAR/LOOK
- `【场景】`：只引用已锁 SET
- `【道具】`：只引用已锁 PROP
- `【动作与情绪】`
- `【镜头运动】`
- `【连续性进/出】`
- `【视频生成提示词】`：仅描述本镜头相对 VIDEO master 的局部变化
- `【负面约束】`

## 提示词纪律

- 默认视频提示词使用中文；角色英文名和实际英文对白保持英文。
- VIDEO master prompt 写完整时序、人物、资产、动作、镜头进程、光线、声音和 continuity。
- SHOT prompt 是局部 delta，不得重新发明角色、服装、场景或道具。
- 不得混用 16:9 默认值覆盖 9:16 项目。
- 不得宣称模型支持音频、lip-sync、首尾帧、seed 等，除非用户已指定/模型能力已确认。

## 连续性检查

逐相邻 SHOT 检查：屏幕方向、人物进出、道具交接、服装状态、伤势、时间天气、空间地理、台词时长。发现冲突只标记，不改剧情。

## 输出顺序

1. `【项目规格】`
2. `【Video Packages】`：每个 VIDEO 先完整 master prompt，再列其 SHOT
3. `【Prompt Placement Map】`：Scene → VIDEO → SHOT → 包内时间 → Asset IDs
4. `【Seedance / MediaGo Import Rows】`：用户目标系统支持时输出；不支持字段保持 optional/空
5. `【Continuity Warnings】`
6. `【production-workbench.json】`：结构至少包含 episode、assets、videos、shots、prompts、generation_state、tasks

## 硬规则

- 不改 Story Bible，不改 Beat，不改对白结果。
- 不新增未经 05 批准的服装、饰品、场景、道具。
- 每个 VIDEO 必须能独立生成。
- 每个 SHOT 必须落在父 VIDEO 的时间范围内，所有 SHOT 时长总和与 VIDEO 对齐。
- 不得把整个成片拆成大量互不关联的英文 Prompt 清单。

## 完成标准

只有 VIDEO/SHOT 时间闭合、资产引用完整、提示词分层清晰、连续性检查通过后，才标记 `STORYBOARD PACKAGE APPROVED`。
