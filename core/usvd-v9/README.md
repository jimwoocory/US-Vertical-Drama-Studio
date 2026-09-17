# USVD V9 Canonical Core

This directory is the V9 source of truth for the vertical-drama workflow.

The controller and stages 01–05 are the current stable Tabbit V2 baseline, copied into Core so downstream distributions can consume a stable, platform-neutral source. Stages 06–07 are implemented as the model-agnostic Storyboard Director and Performance + Cinematography Director. Stage 08 is implemented as the Seedance 2.0 Mini Prompt Adapter with explicit capability, traceability, budget, and degradation rules. Stage 09 is implemented as Prompt QA with deterministic defect localization, a separate human-review checklist, and two reproducible Golden Cases.

Do not hand-edit generated V9 distribution trees. `scripts/sync-v9-distributions.mjs` is the only synchronization entry point from this Core into ChatGPT/Codex, direct-upload, Tabbit and MediaGo V9 source surfaces; DSH reads the generated V9 manifest dynamically. Stable V1/V2 directories remain untouched for compatibility.

See `manifest.json` for ordered stages, canonical paths, baseline provenance, contracts, and distribution targets.
