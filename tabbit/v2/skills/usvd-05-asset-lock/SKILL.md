---
name: usvd-05-asset-lock
description: 当欧美竖屏短剧已经 SCRIPT DOCTOR PASS 且 CONTINUITY CLEAR，需要在分镜前锁定角色、服装、场景与关键道具资产时调用。只制作 Asset Creation Pack 与 Asset Ledger；不拆 VIDEO/SHOT，不输出视频分镜提示词。
version: 2.0.1
---

# USVD 05 资产锁定

## 前置 Gate

必须具备：
- `SCRIPT DOCTOR PASS`
- `CONTINUITY CLEAR`
- 最终审核剧本
- 当前 continuity ledger

缺失则输出 `BLOCKED` 并停止。

## 唯一目标

在分镜之前建立**稳定、可复用、不可随镜头漂移**的资产身份系统。

## 资产 ID

- 角色：`CHAR-*`
- 造型/服装：`LOOK-*`
- 场景：`SET-*`
- 关键道具：`PROP-*`

### CHAR 必须锁定
年龄区间、族裔/地域合理性、脸型、五官锚点、发型/发色、体型、可识别特征。不要把情绪和服装写进永久身份锚点。

### LOOK 必须锁定
所属 CHAR、服装类别、颜色、材质、鞋、饰品、状态（干净/湿/破损等）、适用集/场景。换装必须有剧本依据或明确批准。

### SET 必须锁定
空间类型、地理/建筑逻辑、关键固定物、入口出口、主色/材质、时间、天气、光线锚点、重复出现时必须保留的视觉锚点。

### PROP 必须锁定
形态、材质、尺寸、状态、当前持有人/位置、叙事功能、可发生的状态变化。

## Asset Creation Pack

对每个需要生成的资产输出：
- `Asset ID`
- `中文显示名`
- `锁定锚点`
- `图像生成 Prompt`
- `Negative / Do-not-change`
- `建议画幅`
- `参考图/seed/model`：用户未提供则标记 optional，绝不编造
- `Approval Status: DRAFT|APPROVED`

默认资产 Prompt 可以使用最适配图像模型的语言，但中文解释必须完整。用户指定中文 Prompt 时使用中文。

## 硬规则

- 不允许在不同镜头里重新“描述一个差不多的人”；后续只能引用稳定资产 ID。
- 不允许把场景里临时情绪变成角色永久外貌。
- 不允许资产 Prompt 添加剧本没有的显著饰品、武器、道具或服装变化。
- 未审批资产不得标记 `LOCKED`。
- 不拆 VIDEO/SHOT。
- 不写镜头运动。
- 不生成 Seedance/MediaGo 视频 Prompt。

## 输出格式

1. `【Asset Creation Pack】`
2. `【Asset Ledger】`
3. `【Continuity-to-Asset Mapping】`
4. `【待批准资产】`
5. 所有必须资产均 APPROVED 后才能输出：`【ASSETS LOCKED】`
6. `【下一步】USVD 06 分镜导演`

## 停止条件

完成资产锁定后立即停止，不进入分镜。
