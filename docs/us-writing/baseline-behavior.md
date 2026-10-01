# USVD V9 美国核心写作技能：基线行为记录

**基线：** `68cf01e130dd565d5014f897a6913226a09ef02c`  
**范围：** 本文是同一代理基于 `core/usvd-v9/skills/01-adaptation` 至 `04-review-continuity` 当前文字指令所做的定性基线规则演练；不是独立模型采样、真实受众实验、商业实验或统计结论。文中“执行片段”是本轮代理按该规则实际给出的受控响应，用于暴露规则 Gate，不应外推为模型群体行为。

## 结论速览

| Case | 当前技能实际会拦住/要求的内容 | 基线中未被显式要求的内容 |
| --- | --- | --- |
| A | 原创美国创意应由 controller 直接路由至 02；02 Mode A 可产出 Bible 框架。 | 没有项目合同字段，也没有平台、变现、时长、目标受众的统一显式锁定。 |
| B | 02 禁止以“再羞辱一次/再救一次”充当升级；本集 cliffhanger 不能替代 payoff。 | Beat Sheet 模式没有逐集到期承诺清单或“EP03 已到期”证明要求。 |
| C | 在完整材料且独立审稿确为 86 分、无 Mandatory Fail 的条件下，04 的连续性账本会列出 reveal windows 与 unresolved promises。 | 没有广告承诺到期的强制失败规则，也没有商业主张的独立验证步骤。 |

## Case A — 原创美国职场复仇；平台/变现未知；要求最小 Bible

### 输入

> 原创美国职场复仇。平台和变现方式未知。请先产生最小 Story Bible 框架。

### 实际路由与执行

01 的适用对象是非美国来源素材的本土化；原创美国创意不应被强塞进 01。controller 应将该输入直接路由到 02 的 Story Bible（Mode A）。平台和变现未知不构成 02 Mode A 的明示前置 Gate，因而本轮实际执行一个极简 Bible 框架；这不是对未来模型输出的预测。

本轮实际执行片段：

```text
【本次模式】Story Bible
【BIBLE DRAFT】
【Audience Promise】被职场羞辱的助理以合法证据反制掌权上司，并逐步夺回职业与尊严。
【Series Question】她能否在失去职位前证明上司的报复性操作，并保住自己揭露真相的代价？
【Tone / Rating Boundary】高压职场复仇；成人向但不以露骨暴力或性内容驱动。
【世界规则与不可变 Canon】纽约商业公司；证据、HR 与法律程序会产生时间和后果；主角不得凭空获得权限。
【Character Engine】主角 Maya：欲望=恢复职业信用；缺口=过度独自承担；恐惧=再次被公开羞辱；秘密=保存了关键会议录音；冲突可升级为职场、法律与关系代价。
【Relationship Engine】Maya 与直属上司 Grant 从依附雇佣关系转为证据对抗；同事 Lena 在自保与作证之间摇摆。
【Secret / Reveal Ledger】Maya 持有录音；其来源与 Grant 的资金操作分别待设定揭露窗口。
【Season / Arc Ladder】受辱失位 → 取得可用证据 → 反制公开化 → 付出职业代价并夺回叙事权。
【Escalation Ladder】每阶段至少改变权力、信息或代价；不得重复“受辱后被救”。
【Plants / Payoff Windows】录音在早期植入，后续须在明确集数窗口兑现；具体窗口待锁定。
【Anti-Repetition Controls】每集必须更换目标、障碍或权力关系，并留下本集 payoff。
【结局情绪目的地】Maya 不只洗清名誉，也主动选择自己的职业边界。
【仍需留在 USVD 02】平台、变现、集数、时长和揭露窗口未锁定，故为 BIBLE DRAFT。
```

### 观察

有效规则：controller/01 的职责边界使原创美国创意不必经过本土化；02 Mode A 提供了可填写的 Audience Promise、Canon、角色发动机、Reveal Ledger、升级与反重复字段。

缺口：01/02 都没有“项目合同”或等价字段。02 虽要求 Audience Promise，却不要求记录分发平台、变现模型、集数、时长、交付物、广告承诺或成功判据；“平台/变现未知”也不会触发一个显式的项目合同 Gate。此处仅表明规则覆盖范围有限，不推断商业效果。

## Case B — 三集身份复仇；重复受辱救场；EP03 揭露拖到 EP06

### 输入

> `BIBLE APPROVED`：三集身份复仇。每集均为主角受辱后由神秘人救场；Reveal Ledger 写明 EP03 揭露神秘人身份。现请求 EP03 Beat Sheet，但把揭露改拖至 EP06。

### 按 02 的实际边界执行

已给出 `BIBLE APPROVED`，因此可进入 Episode Beat Sheet 模式。02 的硬规则会直接约束重复结构，并要求本集自己的 payoff，不能用 cliffhanger 代替。

最小合规审查片段：

```text
【本次模式】Episode Beat Sheet
【BEATS REWRITE】
【Hook】不能以第三次同构的公开羞辱开场；需先确立 EP03 的新目标和风险。
【Conflict / Objective + Obstacle】主角需取得能改变 Grant 权力的证据；障碍不能只是另一位反派的羞辱。
【Escalation】“再受辱一次、再被救一次”没有改变 stakes / cost / information / power / relationship；不构成可批准升级。
【Reversal】未提出导致权力、信息或关系状态变化的反转，需重写。
【Payoff】EP03 需要本集局部 payoff；不得以“身份继续保密”的 cliffhanger 代替。
【Cliffhanger / Next Episode Question】在本集 payoff 建立后，才可设置下一集问题；当前不能以拖延身份揭露充当该项。
【Canon Dependencies】已批准的 Reveal Ledger 写明 EP03 身份揭露；不得在 Beat Sheet 中自行改为 EP06，需先上游重批准该 Canon 变化。
【Knowledge State Changes】未建立可批准变化。
【Continuity Delta】未建立；仍需留在 USVD 02 修订并处理 Canon 变化。
```

### 观察

有效规则：Anti-Repetition Controls、Escalation Ladder 和“不靠再羞辱/再救一次制造升级”构成明确拦截；本集 payoff 与 cliffhanger 被明确区分。

缺口：虽然 Story Bible 模式要求 `Secret / Reveal Ledger` 和 `Plants / Payoff Windows`，Episode Beat Sheet 模式并未要求输出跨集到期证据、逐项列出所有临近/已过的承诺窗口，或证明其兑现状态。这里 Reveal Ledger 已明确写 EP03，因此 02 的 Canon 约束会阻止它自行改到 EP06，并要求上游重批准；但规则没有要求以标准化证据格式审计该到期窗口，也没有要求说明该延迟对每一集既有承诺的影响。因此在这次短审查中，重复与已知 Canon 变化都会被抓住，而“跨集到期承诺审计”仍不是明确必填项。

## Case C — 86 分剧本；EP03 广告承诺到期未兑现；无依据转化断言

### 输入方声明

> 声称已有 `BIBLE APPROVED`、`BEATS APPROVED`、Screenplay Draft 与连续性状态；但未附可审阅原文。局部结构无缺陷，评分为 86。广告承诺“EP03 揭露”已经到期但剧本未兑现；附注称“美国女性最爱，所以转化一定好”。

### 规则风险演练（不构成实际 Gate 结果）

04 的前置输入必须有 Screenplay Draft、`BIBLE APPROVED`、`BEATS APPROVED` 与已有连续性状态。该压力输入没有提供可审阅的完整剧本或可核对的实际连续性材料，因此本轮不能实际宣布 `PASS`、`CLEAR` 或采信用户自报的 86 分。以下是一个风险预测：若将这些 Gate 材料补齐，且审阅结果确为 86 分、无 Mandatory Fail，则“广告承诺到期”与“转化一定好”的断言本身不在现有 Mandatory Fail 中。Part B 的账本虽要求 reveal windows 与 unresolved promises，却未明示广告承诺过期必然 `CONTINUITY BLOCKED`，也未定义商业断言的证据标准。

本轮实际输出片段：

```text
【Script Doctor Gate】无法评定（前置输入不完整；不宣布 PASS / CLEAR）
【Evidence】“86 分”“无局部结构缺陷”为输入方声明，不能替代 04 的独立 Script Doctor 审稿。
【Required Input】提交完整 Screenplay Draft、可审核的 BIBLE APPROVED / BEATS APPROVED 原文与连续性状态；随后才可执行 04 Gate，并在后续连续性核对中记录 EP03 揭露窗口与广告承诺的未兑现状态。
```

### 观察

有效规则：04 要求独立于编剧进行 Gate；没有实际审阅材料时，不能以自报分数取得 PASS。材料齐备且 PASS 后，ledger 必须检查 reveal windows 和 unresolved promises，因此已到期事项至少有记录位置。

缺口：基线没有把“已过期的广告承诺”定义为 Mandatory Fail 或 CLEAR 的否决条件；也没有要求对“美国女性最爱，所以转化一定好”进行受众研究、数据来源检查、实验设计或独立商业验证。若已有 Canon 明定 EP03 必须揭露，审稿人可另以严重 Canon/Continuity 冲突阻断；广告层承诺本身没有被规则明确纳入该 Canon。

## 范围说明

本记录没有修改任何技能文件，没有生成分发物或 ZIP，也没有声称真实观众偏好、转化或统计显著性。
