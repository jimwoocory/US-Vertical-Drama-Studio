# 美国核心写作升级（source-only）

用户已批准2026-10-01美国市场评估中的四项升级：项目合同、跨集兑现与反重复、美国人物声线、证据化审稿。写作-only在04通过且连续性清楚时结束，无工作界面。

权威源码：`core/usvd-v9/skills/01-adaptation`、`02-story-architecture`、`03-screenwriter`、`04-review-continuity`。版本2.1.0。总控为`core/usvd-v9/skills/controller/SKILL.md`。

本次不生成ZIP、AstrBot适配器或其他分发包。`plugins/`、`direct-upload/`、`tabbit/`、`mediago/`仍是原有基线分发，不能用它们验证升级已加载。常规`npm test`先检查全量分发同步，因此在这份source-only分支不能作为“全部通过”的证据。

可直接在支持技能的运行时加载上述核心SKILL.md；后续适配AstrBot时需映射这些合同，不能只复制旧DSH分发目录。新增引用文件也须随对应技能一起加载；核心文件不是已安装AstrBot插件。

## 验收边界

- 定性指令演练与交叉审查用于发现规则冲突；不是独立模型统计实验或观众盲测。
- 原始基线完整测试37通过、3个测试文件因缺少`@deepseek-ai/dsh-tools`加载失败。
- 已有主分支checkout带大量staged deletions，不能在其上安全集成。实现保存在独立分支，任务状态保持REVIEW直到安全合入main并复验；不会把未集成任务标DONE。

详细证据见`baseline-behavior.md`、`validation.md`和`task-board.md`。
