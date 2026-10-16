# V11 导演时长与自主改编校验修复｜AgentDock-company

**日期**：2026-10-16
**工作区**：`C:\Users\Administrator\AgentDock\USVDS-V11-director-upgrade-20261016`
**分支**：`codex/v11-director-upgrade-20261016`
**基线**：`0c68d9cb`
**性质**：本地独立分支代码修复与机器测试；**非部署、非导演创作能力终验**。

## 发现和解决

1. 之前已修改的 `production-workbench.js` 与 `v9-prompt-qa-validation.mjs` 引用 `validateDirectorAdaptation` 和 `isDirectorAdaptationAuthorized`，但模块缺少这些导出，导致三组定向测试中的 3 项失败和模块加载失败。
2. 本次在 `scripts/v9-director-validation.mjs` 补齐两个函数：区分 V11 结构化 60–120 秒整集时长策略和旧版未启用策略；验证导演修订版本、原稿到新导演单元的保留/删减/合并/改写来源映射、保护项声明、Episode Direction Card 和视频/镜头/对白来源一致性。声明式保护不能替代剧情语义与实际表演质检。
3. **导演不需要逐集人工授权**：已确认项目采用 V11 60–120 秒完整节目策略，就具备常驻自主删并改写权；不要求填写 `creator_authorized` 或让编剧逐行审批。若会触及受保护核心故事设定，则只就具体无法自主解决的设定冲突请求上游决策。
4. 延续上轮已有的 Workbench 时间轴、总时长和 Prompt QA 集成；新增 13 项边界与追踪测试。导演契约和 SKILL 文档明确先形成新导演版再拆 VIDEO/SHOT，并要求下游执行该新版本。
5. 仍保持 V8/V9 兼容的每个生成视频包最大 15 秒，与完整节目 60–120 秒不同。完整节目采用绝对时间区间，片头、转场、片尾和音频尾巴按真实占用计入，同时发生的画面/对白/字幕不重复相加。

## 实际测试

- `node --test dsh-plugin/test/v9-director-core.test.mjs dsh-plugin/test/v9-prompt-qa.test.mjs dsh-plugin/test/production-workbench.test.mjs`：原先 9 项中 3 项失败；补齐缺失函数后 **26/26 通过**。
- `node --test dsh-plugin/test/v11-director-upgrade.test.mjs`：新增加的 **13/13 通过**。
- 定向四文件合测：全部通过；覆盖 45 秒、60 秒、105 秒、120 秒、135 秒、未知总时长、镜头重叠/间隙、重叠片头/音频尾巴、legacy 保留、修订来源追踪、无逐集人工审批、陈旧镜头/对白、超载对白改写提示。
- `git diff --check`：通过。
- `npm test`：**105 个测试中 101 PASS、4 FAIL**。这四项分别是缺少 `@deepseek-ai/dsh-tools` 依赖、V10 manifest 固定版本预期不符、V10 GPT plugin 打包不同步、V9 generated ChatGPT/Codex bundle 对照失败。
- 随后在**未修改的主仓库** `US-Vertical-Drama-Studio-V11` 对上述四项失败所在的三个测试文件进行只读复测，**同样四项失败**；因此这四项可标记为基线原有失败，本次不修改 V9/V10 和其他插件来掩盖。
- 测试机 `node v22.23.2`；仓库 package.json 声明 `node >=24`，Node24 环境回归仍未实测。

## 实际验证边界

- 当前证明的是**程序装配/时长与修订来源闭合**；代码与测试没有自动生成一集戏剧化导演改编成片。
- 自然英语朗读、真实演员表演、animatic、AI 媒体成片精确计时、观众情绪及付费效果均 **NOT_RUN**。
- 自动填写 `story_guards: preserved` 不能证明故事核心真实保持，需要后续独立剧情语义 QA 与真实作品对照。
- 无独立 Codex 子代理二次复核，本次没有启动已停止的 Codex App/CLI；本地自动测试不冒充独立 QA。
- 完整生产发布、主分支集成和正式上线 **NOT_RUN**。本地修复可进入更高等级独立 QA，但不能直接宣布 USVDS V11 导演全功能已交付。

## 后续事项

1. 复核一份真实超载剧本：原稿 → 自主导演改编 → 60–120 秒自然朗读 → VIDEO/SHOT 分配 → 情绪/空间连续 → animatic，与旧版对照。
2. 在 Node24+ 环境复测；为本轮独立改动做独立代码 QA。
3. 原有 V9/V10 打包与缺依赖的四项基线失败应按各自项目单独处理，**不能**为修本轮 V11 导演而改动其它版本。
