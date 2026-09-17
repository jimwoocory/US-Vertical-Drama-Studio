# USVD V9 Canonical Core

This directory is the V9 source of truth for the vertical-drama workflow.

The controller and stages 01–05 are the current stable Tabbit V2 baseline, copied into Core so downstream distributions can consume a stable, platform-neutral source. Stages 06–09 are explicit contract slots owned by the V9 workstreams; their placeholders intentionally contain boundaries and handoff shapes, not craft guidance.

Do not hand-edit `plugins/`, `direct-upload/`, `dsh-plugin/`, or packaged artifacts as V9 truth. Distribution generation and synchronization are owned by V9-E and are not implemented here.

See `manifest.json` for ordered stages, canonical paths, baseline provenance, contracts, and distribution targets.
