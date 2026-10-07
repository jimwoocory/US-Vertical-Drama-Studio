# USVDS V10 Stage Model Routing

V10 routes stages 01-04 through DSH's real Session model-selection API.

| Stage | Required model |
|---|---|
| 01 Adaptation | GLM 5.3 FlashX (`glm-5.3-flashx`) |
| 02 Story Architecture | GLM 5.3 (`glm-5.3`) |
| 03 Screenwriter | GLM 5.3 (`glm-5.3`) |
| 04 Review and Continuity | GLM 5.3 (`glm-5.3`) |

The route is fixed by stage. There is no capability-score substitution and no
cross-model fallback for these four stages.

The resolver reads DSH `sessionController.modelCatalog()` at runtime and
matches the required user-facing model label or exact model id. Provider hints
prefer Z.AI/Zhipu-compatible catalog groups while still allowing custom
gateways to expose these exact models under another provider id.

If the required model is absent, the Skill load is blocked with
`REQUIRED_MODEL_UNAVAILABLE`. V10 must never silently execute stages 02–04 on
GLM 5.3 FlashX when the GLM 5.3 target is unavailable.

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
