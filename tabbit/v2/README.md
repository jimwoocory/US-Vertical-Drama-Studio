# US Vertical Drama Studio — Tabbit 2.0

Tabbit 2.0 不再把完整多阶段工作流塞进一个“任务妙招”。它拆成 **1 个总控 + 6 个阶段 Skill**，每次只完成一个 Gate，减少模型在一次调用中同时服从几十条规则导致的越级、混写和提示词漂移。

## 推荐安装顺序

1. `USVD 总控` → `usvd-controller.zip`
2. `USVD 01 欧美本土化` → `usvd-01-adaptation.zip`
3. `USVD 02 故事架构` → `usvd-02-story-architecture.zip`
4. `USVD 03 剧本编写` → `usvd-03-screenwriter.zip`
5. `USVD 04 审稿连续性` → `usvd-04-review-continuity.zip`
6. `USVD 05 资产锁定` → `usvd-05-asset-lock.zip`
7. `USVD 06 分镜生成包` → `usvd-06-storyboard-video.zip`

每个 ZIP 都是 Tabbit Runtime Bundle：压缩包根目录只有一个 `SKILL.md`，可以独立导入为“任务妙招”。

## 使用原则

- 不知道该用哪个阶段时，先调用 `USVD 总控`。
- 已经知道阶段时，直接调用对应 Skill，不必每次经过总控。
- 一个 Skill 只做自己的 Gate，不自动继续下一步。
- 上游 Gate 缺失时返回 BLOCKED，而不是为了完成任务自行补造上游产物。

## v1 与 v2

`tabbit/us-vertical-drama-studio/` 为 v1 全流程版本，保留兼容和历史记录；新项目建议使用 `tabbit/v2/`。
