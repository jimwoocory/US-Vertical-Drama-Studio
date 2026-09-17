# USVD V9 Canonical Core

This directory is the V9 source of truth for the vertical-drama workflow.

The controller and stages 01–05 are the current stable Tabbit V2 baseline, copied into Core so downstream distributions can consume a stable, platform-neutral source. Stages 06–07 are implemented as the model-agnostic Storyboard Director and Performance + Cinematography Director. Stage 08 is implemented as the Seedance 2.0 Mini Prompt Adapter with explicit capability, traceability, budget, and degradation rules. Stage 09 is implemented as Prompt QA with deterministic defect localization, a separate human-review checklist, and two reproducible Golden Cases.

Do not hand-edit `plugins/`, `direct-upload/`, `dsh-plugin/`, or packaged artifacts as V9 truth. Distribution generation and synchronization are owned by V9-E and are not implemented here.

See `manifest.json` for ordered stages, canonical paths, baseline provenance, contracts, and distribution targets.
