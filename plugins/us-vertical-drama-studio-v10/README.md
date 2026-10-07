# US Vertical Drama Studio V10 — GPT plugin preview

This Agent Plugins package exposes the V10-authored workflow: Intake/Adaptation, Story Architect, Episode Architect, independent story review, and a controller that routes only one allowed stage at a time. The source of truth for skill instructions and contracts is `core/usvd-v10/`.

## Make the workflow visible

- Adaptation produces a source-backed retain/cut/merge/redesign decision table and identifies downstream consequences.
- Story Architect creates the complete causal story, character/relationship states, season arc, reveals, promises, and narrative asset requirements.
- Episode Architect is separate and maps every episode as a mini dramatic arc with entry/exit state and canon references.
- Review is a separate skill and binds its evidence to the exact artifact revision and digest.
- The controller reports the current gate and one next action; it never writes story content itself.

## Import and limitation

The ZIP contains one plugin directory with a root `plugin.json` and skills under `skills/`. Import it only in a client that supports Agent Plugins. V10 trusted human approval and protected Screenwriter execution are not implemented (ND-001); this preview stops at `AWAITING_HUMAN_APPROVAL` and must not be treated as an approval runtime. This package does not invoke image/video services or external production APIs.

All included skills are marked authored but unvalidated in the Core manifest. This is a workflow preview, not a claim that the V10 pipeline is fully operational.
