# US writing upgrade validation

## Scope and provenance

Base: `68cf01e130dd565d5014f897a6913226a09ef02c` on V9. Worktree: `usvd-us-writing-worktree`; branch: `codex/usw-01-us-writing`. Approved scope is US core writing skills 01–04, writing-only routing, and source/reference integrity. No UI, AstrBot adapter, installed plugin, regenerated distribution, ZIP, push or publication is claimed.

## Baseline and automated checks

- Original `npm.cmd test`: generated distributions were synchronized; 37 tests passed; three test files could not load because `@deepseek-ai/dsh-tools` is absent. This pre-existing dependency limitation is not repaired or hidden by this Markdown upgrade.
- Scoped existing regression command: `node --test dsh-plugin/test/production-workbench.test.mjs dsh-plugin/test/v9-director-core.test.mjs dsh-plugin/test/v9-prompt-qa.test.mjs dsh-plugin/test/v9-seedance-adapter.test.mjs` — 37/37 passed.
- Core load/parser check: 10 skills load; 01–04 are version2.1.0, expected manifest statuses, and linked local references exist.
- Future reference integrity regression: `node --test scripts/test-us-writing.mjs`. RED: missing 01 reference in plugin planned files. GREEN after resourceMap repair: 1/1 passed, all four linked writing references present across five text distribution surfaces. Test constructs a plan in memory and writes no archives.
- Existing generated paths are intentionally unchanged; full distribution sync is pending the user's paused packaging step. Therefore this source-only branch is not presented as passing full `npm test`.

## Qualitative instruction application

Fresh-context model agents executed the same US workplace-revenge Bible brief five times on the frozen baseline, five times on the initial upgrade, and five times after corrections. Sampling parameters were not controlled as an API experiment; graders were not blinded. These are diagnostic instruction applications, not statistical capability estimates or audience validation.

| Cohort | Observation | Interpretation |
| --- | --- | --- |
| baseline-1..5 | Existing character, escalation and anti-repetition rules already worked. Some outputs correctly required Beats approval, while another encouraged a direct Bible→writer handoff. Platform/monetization limitations could be recorded without the new template. | The original did not universally fail; new rules should strengthen specific evidence/shape obligations rather than claim all prior outputs were poor. |
| green-1..5 | Project contracts and promise/state records appeared, but green-3 allowed premature writer handoff and marked the explicit6×90 brief as ASSUMED; green-1/4 handoff wording was ambiguous. | Real defects retained, not relabelled as passes. Refactored ModeA handoff and BRIEF CONFIRMED definitions. |
| final-1..5 | All include explicit project contract, preserve unknown platform/monetization and audience hypotheses, label supplied6×90 as BRIEF CONFIRMED, and require BEATS APPROVED before03. | Narrow corrected instruction checks passed in these five cases. This is not a commercial-quality or genre-demand conclusion. |

All raw outputs remain under `probes/`. Small verdict variations and fictional Canon choices are not measured as a quality lift. Planned Bible placements are not actual produced-story or viewer payoff evidence.

Independent reviewer exercised pressure B/D/E: overdue EP03 reveal cannot silently move toEP06; missing draft/approved正文 leads toBLOCKED rather than adopting86 points; writing-only stops before asset creation. See `independent-review.md`. The earlier baseline walkthrough was corrected to distinguish actual generated examples from rule-path reasoning.

## Screenwriter and independent review application

Synthetic approved inputs are in `ep01-approved-test-input.md`. First draft is retained in `ep01-draft-probe.md`; it added an unapproved8:14 vendor-call alibi yet declared no upstream changes. A mechanical count found139 dialogue words against its rough154 estimate. This is a substantive evidence-boundary failure, not proof of commercial weakness.

03 was clarified to permit ordinary dialogue/action invention while requiring approval for facts that alter the evidence chain (alibis, source records, financial permissions). The revised draft and separate reviewer responses are recorded alongside the first-draft records. No timed read, real viewer study, finished-video retention or paid conversion experiment occurred.

First-draft independent review: internal craft88/100 but REWRITE because of the unapproved alibi; no ledger update. Revised draft: independent internal craft94/100, PASS and Continuity CLEAR forEP01 only; audience/commercial UNTESTED, broader scope NOT ASSESSED. These heuristic scores are not a measured quality gain. The integrator mechanically confirmed18 dialogue lines /119 English words using contractions as one word; corrected the draft's130 count and the reviewer's inaccurate17/132 quotation. The resulting80–89-second estimate remains untested and requires an actual read before production.

## Integration status

Implementation is reviewed source on an isolated task branch. The existing main checkout has numerous staged deletions; it remains untouched. Tasks are REVIEW, not DONE, until safe integration into main and main revalidation. Generated distributions are still baseline copies, so use the canonical core source to inspect the upgrade.
