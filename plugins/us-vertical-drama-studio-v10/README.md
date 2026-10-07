# US Vertical Drama Studio V10 — GPT plugin preview

This package exposes Intake, Story Architect, Episode Architect, independent review, a controller, and a separate creator-authorized screenplay draft skill. The source of truth is `core/usvd-v10/`.

Development documents default to Simplified Chinese and matching DOCX plus HTML files. Later screenplay dialogue defaults to natural American English. A directly authorized draft must identify the exact reviewed Story Package revision and display `CREATOR_AUTHORIZED_DRAFT`, “系统未批准｜不可投产”.

The trusted human approval runtime and protected production Screenwriter are not implemented (ND-001). The creator-authorized draft path does not set system `APPROVED`, change Story Truth, or authorize downstream production. This package does not invoke image/video services or external production APIs. Authored skills remain unvalidated in the Core manifest.
