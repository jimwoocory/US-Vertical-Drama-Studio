# 美国核心写作升级：独立审查

**审查基线：** `68cf01e130dd565d5014f897a6913226a09ef02c`  
**审查对象：** controller、USVD 01–04、各自新引用资料、未来分发生成计划与 `docs/us-writing/probes/`。  
**结论状态：** `REVIEW`。核心规则文本和分发引用修复可用；早期五份 green 探针仍保留真实偏差，不能作为“五项均绿”或商业质量提升的证据。待五份 fresh probes 完成后，应以其实际文本复核，而不是回填本结论。

## 已核验的规则

| 审查点 | 证据 | 结论 |
| --- | --- | --- |
| Legacy 兼容 | 02 允许从旧 `BIBLE APPROVED` 只读提取合同字段；03 在缺 Contract/Voice Card 时标注缺口，只有 Canon 或关键 Beat 无法保留才 `BLOCKED`。 | 可用；不因新增模板撤销旧批准。 |
| 原创路线 | controller 将原创/已有欧美 premise、无 Bible 的项目路由到 02；02 明定原创不得因绕过 01 而跳过合同。 | 可用；不强制原创美国项目先做改编。 |
| 承诺到期与延期 | 02 要求 Promise ID、来源、批准状态、window、正片证据和到期状态；改窗须保留原 window、理由、替代兑现与 `REQUIRES APPROVAL`。04 将有证据的已到期未兑现承诺列为 Mandatory Fail。 | 可用；新拟广告仍是 `PROPOSED`，不会被臆定为既有 Canon。 |
| 人物声线与诚实时长 | 03 要 Voice Card 的词汇、回避项、压力声线和代表句，要求相邻角色不可互换；另要求目标时长、对白/动作/停顿依据和风险点，未给实际朗读记录不得称“朗读已验证”。 | 可用；这是可执行写作/审稿约束，不是实际表演或时长实验。 |
| 证据化评分 | 04 的每个 scorecard 项必须有 scene/line/动作证据；85 分为内部 craft 启发式，非市场或转化校准。 | 可用。 |
| 缺材料与预置 86 分 | 04 缺正文或批准原文时必须 `BLOCKED` 并停止；用户分数、无缺陷结论和商业断言不补足证据。 | 可用；不能审正文时不产生评分。 |
| 非 PASS 不更新 ledger | 04 对 `BLOCKED`、`REWRITE`、`REJECT` 都规定停止且不更新 ledger；PASS 后若连续性阻塞，只能给 Proposed Delta。 | 可用。 |
| Finale 与下一集 | 02、03、04 均允许批准 finale 的 next question 为 `NONE / FINALE`，前提是同处给出 closing payoff 与 Series Question/终局情绪兑现证据。 | 可用。 |
| writing-only 边界 | controller 在 `SCRIPT DOCTOR PASS + CONTINUITY CLEAR` 后输出 `none — 写作完成`；04 在同样条件且只要求写作时输出 `Writing-only Completion`，不进 05。 | 可用；未测商业/受众不应伪装为 craft Gate 失败。 |

## 压力场景的最小实际响应

以下是本审查按当前技能文字执行的最小响应，不是对任意模型、受众或商业表现的预测。

### B — EP03 到期承诺被拖至 EP06

```text
【本次模式】Episode Beat Sheet
【BEATS REWRITE】
【承诺审计】P-01 已批准，兑现 window 为 EP03；所提 EP06 延期没有上游批准。
【拒绝原因】第三次“June 被嘲笑、Eli 救场”没有改变信息、权力、关系或代价；局部拿到钥匙不能代替 P-01 的到期兑现。
【所需修订】在 EP03 给出 P-01 的正片证据，或保留原 window 并记录延期理由、替代兑现和 `REQUIRES APPROVAL`；获批前不得写成 EP06。
【交接】留在 USVD 02；不代写完整替代剧本。
```

这符合 02 的重复拦截、当集 payoff、相邻集状态与关联 Promise 审计要求。

### D — 缺正文却要求采信 86 分、PASS 和 ledger

```text
【Review Scope】single-episode；cross-episode / arc / season：NOT ASSESSED（没有材料）
【Script Doctor Gate】BLOCKED
【Audience Validation】UNTESTED
【Commercial Validation】UNTESTED
【Missing Evidence】可审阅 Screenplay Draft 正文、BIBLE APPROVED 正文、BEATS APPROVED 正文与可核对连续性来源。
```

这里不采信用户预置的 86 分或“美国女性一定会付费”断言，不输出 scorecard、PASS、CLEAR 或 Updated Continuity Ledger。

### E — writing-only 的单集完成

```text
【当前Gate】SCRIPT DOCTOR PASS + CONTINUITY CLEAR
【已具备材料】EP01 独立审稿 PASS、连续性 CLEAR、交付范围 writing-only
【缺失材料】篇章/季终审计；市场、受众与商业验证
【下一步唯一Skill】none — 写作完成
【阻塞/回退原因】none；未覆盖范围为 NOT ASSESSED，不等同于单集 craft 失败
【建议直接输入】none
```

不路由到 05，也不因未做受众/商业实验而将该单集写作结论改为失败。

### A/C 的指令可用性

场景 A 的原创美国项目可由 controller 直达 02 Mode A；合同允许平台、变现和受众证据保持 `UNVERIFIED` 或 `ASSUMED`，不虚构人口统计。场景 C 的旧 Bible/Beats 和 EP01 ending 可让 03 只读提取合同/Voice Card 可证实字段，其他列为 missing assumptions；没有实际朗读记录时只给 runtime estimate。两者是指令路径检查，未假冒完整商业实验或正文审稿。

## 探针证据矩阵（初稿保留）

| 样本 | 观察到的与本次规则有关字段 | 审查判定 |
| --- | --- | --- |
| baseline-1 | Mode A 后明确先回 02 Mode B，Beat 批准后再到 03。 | 可作基线中的正确路线样本。 |
| baseline-2 | `BIBLE APPROVED` 后直接交 03。 | 记录旧缺口。 |
| baseline-3 / baseline-4 | 保持 `BIBLE DRAFT`，不直接写剧本。 | 记录旧的 Gate 行为。 |
| baseline-5 | 要先为 EP01 单独批准 Beat。 | 可作基线中的正确路线样本。 |
| green-1 | 有合同、Promise Ledger 与 `PLANNED` 非已兑现说明；但标题为“交给 03”，交接文字没有明确当前下一步仍为 02。 | 不作为无歧义 green。 |
| green-2 | 保持 `BIBLE DRAFT`，并阻止 Beat/剧本。 | 定性符合 Gate。 |
| green-3 | 把用户给定的 6×90 秒标为 `ASSUMED`，且 `BIBLE APPROVED` 后明确让 03 据此起草 EP01。 | 真实失败样本；不得作为通过证据。 |
| green-4 | 有 Contract/Promise Ledger，但 “交给 03” 交接表达仍需以 Mode B 明确收束。 | 不作为无歧义 green。 |
| green-5 | 保持 `BIBLE DRAFT`，6×90 秒标 `CONFIRMED`，并阻止下游。 | 定性符合 Gate；状态标签待按最新 `BRIEF CONFIRMED` 统一。 |

这些十份是定性、单次文本演练，不能支持“美国观众更喜欢”“转化提高”或任何统计/商业结论。

## 分发与打包

最初发现：生成器的 `resourceMap` 只覆盖 06–09，未来生成会让 01–04 的 `references/...` 相对链接丢失，合同与审稿阈值将无法随技能分发。这是恢复打包时的 P1 风险。

修复后，`resourceMap` 显式映射 01–04 的四个引用文件，`scripts/test-us-writing.mjs` 在内存计划中检查 plugin、ChatGPT direct upload、Claude direct upload、Tabbit 与 MediaGo 五个文本 surface 的每条引用链接。实际运行结果：`1/1` 通过；额外直接检查也显示四个技能均携带相应 resource。

当前 `node scripts/sync-v9-distributions.mjs --check` 仍报告旧分发 out-of-sync。这是用户暂停打包导致的预期状态，且 manifest 已记录 `pending-user-paused-packaging`；它不是本次 source-only 工作的失败，也不能被写成“分发已同步”。未生成 ZIP 或新分发物。

## 建议与复验条件

1. 保留 green-3 的真实失败记录；不要回填为通过。以五份 fresh probes 验证 `BRIEF CONFIRMED` 与 Mode A → Mode B → 03 的完整文案。
2. fresh probes 还应复核 B、D、E 的最小输出：EP03 不得静默延期；缺正文不得给 86/PASS/ledger；writing-only 不得进 05。
3. 恢复打包前保留并运行 `node scripts/test-us-writing.mjs`；恢复后再运行同步生成与全量检查。当前不以暂停中的 `check` 失败否定 source-only 规则，也不以它声称分发已完成。
