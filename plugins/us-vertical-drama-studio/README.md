# US Vertical Drama Studio 1.2.2

本包更新现有的 ChatGPT 插件身份，保留原有八个技能，并加入五种入口判断、完整故事大纲、独立审查和分集结构。入口是 `skills/us-vertical-drama-studio/SKILL.md`；新增规则来自 `core/usvd-v10/`。

默认用简体中文写项目简报、故事大纲、分集表和审查报告，并为每份面向创作者的开发产物交付内容一致的 DOCX 和 HTML 两个可下载文件，不以 TXT 或聊天文字代替。美国市场定位决定故事的社会机制；只有进入剧本阶段，角色实际说出的对白才默认使用自然的美式英语。英文 JSON 键名、状态码和必要的人名不改变正文的中文要求。详见 `references/output-language.md`、`references/document-delivery.md` 和 `examples/chinese-development-sample.md`。

`tools/checkup.mjs` 只检查机器可验证的结构。它不能判断美国化可信度、因果、对白或观众吸引力。旧制作技能保留给已有批准材料的项目；新的 V10 项目在可信人工批准机制完成前停在 `AWAITING_HUMAN_APPROVAL`（ND-001）。如果当前环境无法制作某种文件，必须如实说明，不能假称已交付。
