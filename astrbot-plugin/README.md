# USVD AstrBot 美国短剧全流程版 1.1.0

来自 [US-Vertical-Drama-Studio v10](https://github.com/jimwoocory/US-Vertical-Drama-Studio/tree/v10) 的总控与 01–09，共 10 个技能，按 Apache-2.0 许可移植。01–04 保留美国写作升级 2.1.0；其余沿用核心源版本。包括资产锁定、分镜、表演摄影、Seedance 2.0 Mini 提示词适配和 QA，以及对应契约与审查清单。没有 DSH 依赖或工作界面。

## 安装

1. AstrBot 4.5.7 及以上的 4.x 版本，在插件管理中选择从文件安装，上传 `astrbot_plugin_usvd_writer-v1.1.0.zip`。不要上传整个项目仓库的 ZIP。
2. 启用插件，配置并选择当前会话聊天模型。插件复用 AstrBot 的模型设置，无第三方 Python 依赖，无单独 API Key。
3. 在聊天中发送 `/usvd` 查看帮助。若自定义了 AstrBot 唤醒前缀，用对应前缀替换 `/`。

更新时安装新版插件 ZIP；本包未声明一键仓库更新地址，因为上游是多平台工作室仓库，根目录不是独立 AstrBot 插件。

指令模式直接注入技能和参考资料，不需要启用电脑能力、Shell 工具或沙盒。

## 用法

```text
/usvd bible 为美国竖屏短剧建立 Story Bible：原创，单集90秒，8集。
女主是被家族排挤的酒店经理，核心冲突是她证明家族财务舞弊。
```

原作改编用 `/usvd adapt 原作剧情和改编要求`。原创可以直接从 bible 开始。

先用 `/usvd route 项目材料与当前状态` 让总控指定下一步。逐阶段执行并人工确认：`adapt（改编时）→ bible → beats → write → review → assets → storyboard → camera → seedance → qa`。每条指令后可以换行粘贴完整素材：

- `beats`：已批准 Story Bible 正文、目标集号和时长。
- `write`：已批准 Bible、该集 Beat Sheet 正文、时长与必要的前集连续性。
- `review`：完整剧本及对应已批准上游正文；提供一个分数不能替代审稿。

指令模式是**单次请求**：不会读取 AstrBot 历史、自动保存项目、自动批准产物或连跑后续阶段。新一条指令必须包含必要正文，文本上限 100,000 字符，请按单集拆分。审批与阻断由技能指导模型执行，并非代码层面的项目审批数据库。技能的内部 PASS 不等于观众/商业验证。

05–09 的指令和必需材料：

- `assets`：已审核剧本、Script Doctor PASS、Continuity CLEAR 及连续性台账。
- `storyboard`：已锁定资产、审核剧本、批准的节拍及连续性台账。
- `camera`：已批准 Stage 06 分镜及资产/连续性台账。
- `seedance`：已批准 Stage 06/07 包、资产和当前生产 endpoint 能力档案。
- `qa`：Stage 06/07/08 包、台账、能力档案及真实机器 QA 结果（如有）。

本包输出制作文档与提示词，没有调用图像/视频生成服务，也没有接入原仓库的机器 QA 执行器。没有真实机器检查结果时，不能把模型审查当作机器 QA PASS。提供了完整阶段技能，不表示全部下游服务已经连接。

## 可选：原生 Skills 自然对话

支持插件内置 Skills 的较新 AstrBot 版本会发现包内 `skills/` 下的10 个技能。在“插件 → 技能”确认已显示/启用，并为当前人格选择使用这些 Skills。原生模式按 AstrBot 官方要求配置 Local 或已启动的 Sandbox 执行环境，以便模型读取技能及参考文件；普通用户的 Local 读取可能受管理员权限限制。

同一会话中可以说“使用 usvd-02-story-architecture，为我建立美国原创短剧 Story Bible……”，随后提供确认与下一阶段要求。完整制作请明确“交付范围 full-production，包含 05–09，不需要工作界面”；若只要剧本则选择 writing-only，总控在写作审核后停止。不要同时上传同名本地 Skills，以免本地旧版本优先覆盖本插件。若看不到插件技能或不希望配置执行环境，直接使用 `/usvd` 指令模式即可。

原生模式参考：[Skills 使用说明](https://docs.astrbot.app/use/skills.html)、[插件内置 Skills 规范](https://docs.astrbot.app/dev/star/plugin-new.html)。4.5.7 的最低版本声明仅保证指令使用的 SDK API 起点，不意味着旧版具有插件 Skills 自动发现功能。

## 验证范围

交付前测试实际生成 ZIP 的解压、入口模块导入、11 个指令路由（总控、9阶段，其中故事架构分 bible/beats）、模型缺失/异常处理及技能与核心源的字节一致性。AstrBot SDK 边界使用测试替身；没有连接真实 AstrBot 服务或用户模型做端到端运行。技能写作验证沿用 v10 已记录的压力测试，不把安装包测试视为写作质量或商业效果证明。

## 从 1.0.0 升级

安装新版 ZIP 并重载插件；插件标识保持不变。进入人格配置中 USVD 的技能选择，重新勾选全部 10 个并保存，再保存外层人格。新增总控与 05–09 不一定继承原来的四项选择。模型仍复用当前会话模型，未实现按阶段自动切换。
