# V10 outline workflow: reference integration

This note records how the existing ChatGPT web plugin's version 1.2.0 uses ideas from three public writing skills. The V10 Core and the original plugin skills remain our own instructions. No third-party skill text or code is bundled.

| Reference | Useful method | V10 implementation |
| --- | --- | --- |
| [shuohao `novel-outline`](https://github.com/eternityspring/shuohao-skills/blob/main/skills/novel-outline/SKILL.md) | Source-grounded retain/cut/merge decisions, a short creator-facing skeleton, and checkable derived artifacts | Intake records source coverage and adaptation decisions; direction cards expose the conflict before a long outline; JSON contracts and `tools/checkup.mjs` check structure and references. |
| [VaporShao `short-drama-writing`](https://github.com/VaporShao/short-drama-writing-skill/blob/main/SKILL.md) | Clear concept → story → episode → script handoffs and concrete stage templates | Project Brief v2 binds a creator-selected direction to Story Package v2; Story Architect completes the causal story before Episode Architect maps episodes; screenplay remains behind the V10 approval gate. |
| [ZenStory `short-drama-develop`](https://github.com/zenstory-ai/drama-skills/blob/main/skills/short-drama-develop/SKILL.md) and [story-craft](https://github.com/zenstory-ai/drama-skills/blob/main/skills/short-drama-develop/references/story-craft.md) | Creator choice among genuinely different conflict engines, then action → counteraction → cost/state change → next pressure | Intake offers 2–3 directions with different US power logic; major turns record the causal chain; independent Review flags agency gaps, causal breaks, superficial transplantation, and translation-shaped social logic. |

## Route by supplied material

| Creator has | First V10 action | Next decision or result |
| --- | --- | --- |
| A simple idea | `simple_idea` | Compare distinct directions, then ask the creator to choose. |
| A complete outline to assess | `completed_outline_audit` | Diagnose the supplied story through its ending; no automatic approval. |
| A novel, comic, or motion comic to adapt | `source_adaptation` | Map emotional payoff and four mechanisms, propose distinct US directions. |
| A source with a chosen adaptation direction | `source_selected_direction` | Validate that direction's US conflict mechanism without forcing alternatives. |
| A completed script to assess | `existing_script_reverse_story` | Reconstruct only the story on the page, then diagnose it. |

The four adaptation dimensions are **power, relationship, cost, and causality**. The reviewer needs cited story evidence before calling a case a superficial transplant or China-shaped English. The machine checkup explicitly reports story quality as `NOT_MACHINE_ASSESSED`.

The old eight skills remain in the updated plugin for documented legacy projects. New V10 projects stop at `AWAITING_HUMAN_APPROVAL` after story and episode review because ND-001 has no trusted approval runtime. Version 1.2.0 is a visible story-development improvement, not a claim that the full V10 production workflow is executable or audience-validated.

Version 1.2.1 corrects a delivery-language defect seen in a real outline: a Brief claimed Chinese development documents, but the outline body was English. The default is now Chinese for every planning and review artifact, including human-readable JSON values. English is retained for schema keys, status codes, established names, and later screenplay dialogue. `output_language_mismatch` blocks a review pass until the exact corrected revision is reviewed.

Version 1.2.2 adds the creator's file-format preference: every requested human-readable development artifact defaults to matching DOCX and standalone HTML files from the same revision. TXT or a chat text dump is not a deliverable. Canonical JSON remains internal and may be exported separately for audit.

Version 1.2.3 adds a separate creator-authorized, non-production screenplay draft path after exact package review and a direct user instruction in the active conversation. The official V10 production approval Gate remains blocked by ND-001; a draft neither changes Story Truth nor unlocks storyboard or video production.
