# AstrBot 1.1.0 — full skill restoration

User approved Controller + 01–09, without a work interface. Package identity retained from 1.0.0; the archive now includes exactly ten native Skills and 11 chat routes (Story Architecture has separate bible/beats commands).

Added: Controller, 05 Asset Lock, 06 Storyboard, 07 Performance/Cinematography, 08 Seedance 2.0 Mini Adapter, 09 Prompt QA. Canonical Skill names are preserved, including the `usvd-v9-` names for 06–09. Stage 06–09 JSON contracts and Stage 09 human checklist are bundled in their references directories, byte-identical to core. No global writing-only instruction forbids the restored outputs.

Test-first: archive integration failed against 1.0.0 with expected 10 Skills but actual 4. After implementation, archive build/extraction/import, all 11 stage invocations, canonical-resource parity and existing error handling passed. Ruff checks passed. 38 existing relevant Node checks passed.

Delivery: `delivery/astrbot_plugin_usvd_writer-v1.1.0.zip`, 23 files. New skill selections must be saved in the user's AstrBot persona.

Limits: SDK boundaries use test doubles; no remote AstrBot instance or real model was connected. This package supplies Skills and text generation, not image/video generation endpoints or the original machine QA execution engine. Stage 09 cannot claim machine QA PASS without actual machine results. It still uses the current AstrBot chat model; per-stage model routing has not been implemented. AST-02 is REVIEW, not DONE, because main integration/retest remains pending.
