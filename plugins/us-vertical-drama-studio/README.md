# US Vertical Drama Studio 1.2.4

本包更新现有的 ChatGPT 插件身份，保留原有八个技能，并加入前期入口判断、完整故事大纲、独立审查、分集结构和创作者授权草稿通道。入口是 `skills/us-vertical-drama-studio/SKILL.md`；新增规则来自 `core/usvd-v10/`。

默认用简体中文写项目简报、故事大纲、分集表和审查报告，并为每份面向创作者的开发产物交付内容一致的 DOCX 和 HTML 两个可下载文件，不以 TXT 或聊天文字代替。美国市场定位决定故事的社会机制；剧本角色实际说出的对白才默认使用自然的美式英语。

创作者在当前对话中直接要求继续某个已审故事包时，`usvd-v10-03-creator-script-draft` 可使用完整 canonical 包，或使用标明相同修订和摘要的分集 DOCX/HTML 加匹配 review 起草非投产剧本。后一种来源标为 `REVIEW_ATTESTED_VIEW`，不宣称已独立重算 canonical JSON 摘要；如缺少某项必要 Story Truth，只询问该事实。未指定集数时默认先写 EP01–EP03。截图、助手摘要或旧 `APPROVED` 标签不能单独证明用户指令。ND-001 的可信人工审批和正式投产 Gate 仍未实现；此草稿通道不改变 Story Truth。

`tools/checkup.mjs` 只检查机器可验证的结构，不能判断美国化可信度、因果、对白或观众吸引力。旧制作技能保留给已有批准材料的项目。如果当前环境无法制作 DOCX 或 HTML，必须如实说明，不能假称已交付。
