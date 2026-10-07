# V10 大纲结构体检

`checkup.mjs` 是 Node 原生、无外部依赖的结构检查命令。它读取当前 `contracts/` 中的 Story Package、Project Brief、Review Report 契约，并给出稳定的规则编号、字段位置和可读诊断。提供 Brief 时会核对 `project_id`、`brief_ref.artifact_id`、`brief_ref.revision` 与选定方向。它只检查机器可核验的结构，不产生故事质量结论，也不构成独立审阅或人工批准。

从本目录或使用绝对路径运行：

```text
node checkup.mjs <story-package.json> [--brief <project-brief.json>] [--review <review-report.json>] [--json]
```

结构通过时退出码 `0`；发现结构错误为 `1`；JSON、参数或读取错误为 `2`。`--json` 输出稳定字段 `structural_result`、`findings[]`、`semantic_result`、`unassessed_scopes[]`。规则编号包括 `SCHEMA_*`、`ID_DUPLICATE`、`REF_UNKNOWN`、`EPISODE_COUNT`、`EPISODE_ID_COVERAGE`、`STATE_HANDOFF`、`FINALE_POSITION`、`DIRECTION_SELECTION_MISMATCH`、`REVIEW_BINDING`、`REVIEW_MODE_VERDICT` 等。`NOTE` 表示条件不足或机器未执行的核验；它不影响退出码。

当前契约使用的 JSON Schema 子集已覆盖：`$ref`、`type`、`required`、`properties`、`additionalProperties`、`const`、`enum`、`minLength`、`minItems`、`maxItems`、`minimum`、`pattern`、`format: date`、`allOf` 与 `if/then/else`。若契约以后加入其他关键字，需同步扩展此命令；这里不声称是通用 JSON Schema 验证器。

## 可复现的虚构案例

```text
node checkup.mjs ../examples/original-us-story-package.json --brief ../examples/original-us-project-brief.json
node checkup.mjs ../examples/invalid-story-package.json --brief ../examples/original-us-project-brief.json
```

第一份是虚构美国私人场地租约冲突的三集结构缩略例。其 Brief 中的“创作者选择”只是模拟数据，`brief_ref.digest` 的全零值也只是格式占位；命令会明确报告无法核验 digest。这个案例没有经过美国法律、制作、观众或市场验证，结构通过不表示大纲可以投产，也不表示它达到完整商业季集数。第二份故意有方向 ID 不匹配、角色和事实引用悬空、集数缺口、前后状态不接等错误。

另见 [`../examples/surface-transplant-negative.md`](../examples/surface-transplant-negative.md)：其结构字段可以填满，但只是把中国故事换成英文名字和地名。机器不得靠关键字判定这种问题，必须交给独立故事审阅，审查权力来源、人物可行动作、反抗代价、对手反制和美国背景的事实依据。

## 明确未核验

- 美国社会关系、职业、机构、法律或商业机制是否可信；
- 改编是否真正重建冲突，而非换名、直译或移植设定；
- 主角能动性、因果、升级、爽感、结局和观众需求；
- 来源权利、市场证据、真实出处、审阅独立性及人工批准；
- `brief_ref.digest` 和审阅报告 digest 的真实绑定。它们需要统一的规范化序列化方式和可信工件存储；工件编号与修订号相符不能替代 digest 核验。

工具只验证 `episode_id` 为 `E001`、`EP-01`、`EPISODE_1` 等可识别编号时的 `1..episode_count` 覆盖；其他命名会给出 `EPISODE_ID_COVERAGE_NOT_RUN`。状态检查只比较相邻 `exit_state` 和 `entry_state` 的 JSON 值，不判断状态变化是否合乎剧情。
