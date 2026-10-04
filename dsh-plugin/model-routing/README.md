# USVDS V10 Stage Model Routing

V10 routes stages 01-04 through DSH's real Session model-selection API.

| Stage | Required model |
|---|---|
| 01 Adaptation | Claude Sonnet 5.5 |
| 02 Story Architecture | Claude Opus 5.5 |
| 03 Screenwriter | Claude Opus 5.5 |
| 04 Review and Continuity | GPT-6.1 Sol |

The route is fixed by stage. There is no capability-score substitution and no
cross-model fallback for these four stages.

The resolver reads DSH `sessionController.modelCatalog()` at runtime and
matches the required user-facing model label to the provider-owned model id.
This supports custom gateways without hard-coding one provider id. Short legacy
ids such as `claude-opus-5` are accepted only when the live catalog display
name proves that the route is the requested 5.5 model.

If the required model is absent, the Skill load is blocked with
`REQUIRED_MODEL_UNAVAILABLE`. V10 must never silently execute 02/03 on Sonnet
or 04 on a non-Sol GPT route.

On successful routing:

1. the stage Skill loads through the native `skill` tool;
2. `SessionController.selectModel()` arms the selected route for the next real
   request;
3. the global default changed as a side effect is restored immediately;
4. after the routed request header commits, the prior Session route is armed
   again for the next request;
5. a machine-readable `USVD_STAGE_MODEL_ROUTE_V1` block is appended to the
   Skill tool result for auditability.

Stages 05-09 are intentionally not changed by this patch.
