window.__ModuleLoader__.load({id:"@jimwoocory/dsh-us-vertical-drama-studio",factory:(require)=>{var module={exports:{}};var exports=module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: !0 });
}, __copyProps = (to, from, except, desc) => {
  if (from && typeof from == "object" || typeof from == "function")
    for (let key of __getOwnPropNames(from))
      !__hasOwnProp.call(to, key) && key !== except && __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: !0 }), mod);

// dsh-plugin/client.js
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  default: () => client_default,
  inject: () => inject,
  name: () => name,
  p1Compatibility: () => p1Compatibility
});
module.exports = __toCommonJS(client_exports);
var import_react = require("react");

// dsh-plugin/compatibility.js
var P1_DSH_VERSION = "0.1.5-rc.1";
function assertP1Compatibility(context) {
  let declared = context?.dshVersion ?? context?.version ?? context?.runtimeVersion;
  if (declared !== void 0 && declared !== P1_DSH_VERSION)
    throw new Error(`US Vertical Drama P1 Workbench requires DeepSeek Harness ${P1_DSH_VERSION}; detected ${String(declared)}. Keep P0 installed and launch P1 with the pinned command in README.`);
  if (context?.slots === void 0 || typeof context.slots.inject != "function" || typeof context.slots.register != "function")
    throw new Error(`US Vertical Drama P1 Workbench requires the DSH ${P1_DSH_VERSION} slot service. P0 skills remain available without this optional browser panel.`);
}

// dsh-plugin/production-workbench.js
var PRODUCTION_WORKBENCH_SCHEMA = "us-vertical-drama-workbench/v1", assetKinds = /* @__PURE__ */ new Set(["character", "look", "set", "prop"]), assetStatuses = /* @__PURE__ */ new Set(["draft", "pending_approval", "approved", "blocked"]), shotStatuses = /* @__PURE__ */ new Set(["draft", "blocked", "ready_to_generate", "generating", "review_required", "approved"]);
function buildProductionSnapshot(manifest) {
  let diagnostics = [], assets = Array.isArray(manifest?.assets) ? manifest.assets : [], shots = Array.isArray(manifest?.shots) ? manifest.shots : [], tasks = Array.isArray(manifest?.tasks) ? manifest.tasks : [];
  manifest?.schema_version !== PRODUCTION_WORKBENCH_SCHEMA && diagnostics.push(issue("error", "invalid_schema", "schema_version must be us-vertical-drama-workbench/v1")), string(manifest?.episode_id) || diagnostics.push(issue("error", "missing_episode_id", "episode_id is required"));
  let assetById = uniqueById(assets, "asset", diagnostics), shotById = uniqueById(shots, "shot", diagnostics), taskById = uniqueById(tasks, "task", diagnostics);
  for (let asset of assets)
    assetKinds.has(asset.kind) || diagnostics.push(issue("error", "invalid_asset_kind", `${asset.id ?? "asset"} has an invalid kind`, asset.id)), assetStatuses.has(asset.status) || diagnostics.push(issue("error", "invalid_asset_status", `${asset.id ?? "asset"} has an invalid status`, asset.id));
  let normalizedShots = shots.map((shot) => normalizeShot(shot, assetById, diagnostics));
  for (let task of tasks) validateTask(task, assetById, shotById, taskById, diagnostics);
  let totalSeconds = normalizedShots.reduce((sum, shot) => sum + (shot.duration_seconds ?? 0), 0), states = countStates(normalizedShots);
  return {
    schema_version: PRODUCTION_WORKBENCH_SCHEMA,
    episode_id: manifest?.episode_id ?? null,
    assets,
    shots: normalizedShots,
    tasks,
    diagnostics,
    summary: {
      assets: assets.length,
      approved_assets: assets.filter((asset) => asset.status === "approved").length,
      shots: normalizedShots.length,
      total_seconds: totalSeconds,
      ready_to_generate: states.ready_to_generate ?? 0,
      generating: states.generating ?? 0,
      review_required: states.review_required ?? 0,
      blocked: states.blocked ?? 0,
      errors: diagnostics.filter((item) => item.severity === "error").length,
      warnings: diagnostics.filter((item) => item.severity === "warning").length
    }
  };
}
function normalizeShot(shot, assetById, diagnostics) {
  let id = shot?.shot_id, references = Array.isArray(shot?.asset_ids) ? shot.asset_ids : [], duration = number(shot?.duration_seconds), blocked = !1;
  string(id) || (diagnostics.push(issue("error", "missing_shot_id", "shot_id is required")), blocked = !0), (!string(shot?.video_id) || !string(shot?.prompt_id)) && (diagnostics.push(issue("error", "missing_trace_id", `${id ?? "shot"} requires video_id and prompt_id`, id)), blocked = !0), string(shot?.source_scene_id) || (diagnostics.push(issue("error", "missing_source_scene", `${id ?? "shot"} requires source_scene_id`, id)), blocked = !0), (duration === void 0 || duration <= 0) && (diagnostics.push(issue("error", "invalid_duration", `${id ?? "shot"} requires a positive duration_seconds`, id)), blocked = !0), duration !== void 0 && duration > 15 && (diagnostics.push(issue("error", "duration_over_15s", `${id ?? "shot"} exceeds the V8-compatible 15-second limit`, id)), blocked = !0), (!string(shot?.asset_lock_prompt) || !string(shot?.shot_delta_prompt) || !string(shot?.negative_prompt)) && (diagnostics.push(issue("error", "missing_prompt_layers", `${id ?? "shot"} requires asset_lock_prompt, shot_delta_prompt, and negative_prompt`, id)), blocked = !0);
  for (let assetId of references) {
    let asset = assetById.get(assetId);
    asset === void 0 ? (diagnostics.push(issue("error", "unknown_asset_reference", `${id ?? "shot"} references unknown asset ${assetId}`, id)), blocked = !0) : asset.status !== "approved" && (diagnostics.push(issue("warning", "asset_not_approved", `${id ?? "shot"} waits for ${assetId} approval`, id)), blocked = !0);
  }
  return shotStatuses.has(shot?.status) || (diagnostics.push(issue("error", "invalid_shot_status", `${id ?? "shot"} has an invalid status`, id)), blocked = !0), { ...shot, duration_seconds: duration, status: blocked ? "blocked" : shot.status, blocked };
}
function validateTask(task, assetById, shotById, taskById, diagnostics) {
  if (!string(task?.id)) {
    diagnostics.push(issue("error", "missing_task_id", "task id is required"));
    return;
  }
  ["todo", "in_progress", "blocked", "review", "done"].includes(task.status) || diagnostics.push(issue("error", "invalid_task_status", `${task.id} has an invalid status`, task.id));
  for (let target of Array.isArray(task.targets) ? task.targets : [])
    !assetById.has(target) && !shotById.has(target) && !taskById.has(target) && diagnostics.push(issue("warning", "unknown_task_target", `${task.id} targets unknown ${target}`, task.id));
}
function uniqueById(values, label, diagnostics) {
  let byId = /* @__PURE__ */ new Map();
  for (let value of values) {
    if (!string(value?.id ?? value?.shot_id)) continue;
    let id = value.id ?? value.shot_id;
    byId.has(id) ? diagnostics.push(issue("error", "duplicate_id", `duplicate ${label} ID: ${id}`, id)) : byId.set(id, value);
  }
  return byId;
}
function countStates(shots) {
  return shots.reduce((counts, shot) => ({ ...counts, [shot.status]: (counts[shot.status] ?? 0) + 1 }), {});
}
function issue(severity, code, message, target_id) {
  return { severity, code, message, ...target_id === void 0 ? {} : { target_id } };
}
function string(value) {
  return typeof value == "string" && value.trim() !== "";
}
function number(value) {
  return typeof value == "number" && Number.isFinite(value) ? value : void 0;
}

// dsh-plugin/client.js
var name = "us-vertical-drama-studio", inject = ["slots"], p1Compatibility = { dsh: P1_DSH_VERSION, mode: "exact" }, tabs = ["\u603B\u89C8", "\u8D44\u4EA7", "\u955C\u5934", "\u4EFB\u52A1"];
function WorkbenchPanel() {
  let [open, setOpen] = (0, import_react.useState)(!1), [tab, setTab] = (0, import_react.useState)("\u603B\u89C8"), [snapshot, setSnapshot] = (0, import_react.useState)(), [filename, setFilename] = (0, import_react.useState)(), [error, setError] = (0, import_react.useState)(), content = (0, import_react.useMemo)(() => snapshot === void 0 ? (0, import_react.createElement)("p", { className: "uwd-empty" }, "\u9009\u62E9\u7531\u5206\u955C\u5BFC\u6F14\u8F93\u51FA\u7684 production-workbench.json\uFF0C\u5373\u53EF\u663E\u793A\u8D44\u4EA7\u3001\u955C\u5934\u3001\u4EFB\u52A1\u4E0E\u963B\u585E\u539F\u56E0\u3002") : renderTab(snapshot, tab), [snapshot, tab]), readManifest = (event) => {
    let file = event.target.files?.[0];
    if (file === void 0) return;
    let reader = new FileReader();
    reader.onload = () => {
      try {
        let value = JSON.parse(String(reader.result));
        setSnapshot(buildProductionSnapshot(value)), setFilename(file.name), setError(void 0);
      } catch (reason) {
        setSnapshot(void 0), setError(reason instanceof Error ? reason.message : "\u65E0\u6CD5\u8BFB\u53D6 production-workbench.json");
      }
    }, reader.readAsText(file, "utf-8");
  };
  return open ? (0, import_react.createElement)(
    "aside",
    { className: "uwd-panel", "aria-label": "US Vertical Drama Production Workbench" },
    (0, import_react.createElement)(
      "header",
      null,
      (0, import_react.createElement)("div", null, (0, import_react.createElement)("strong", null, "US Vertical Drama"), (0, import_react.createElement)("span", null, filename ?? "Production Workbench \xB7 P1")),
      (0, import_react.createElement)("button", { type: "button", onClick: () => setOpen(!1), "aria-label": "\u5173\u95ED\u5DE5\u4F5C\u53F0" }, "\xD7")
    ),
    (0, import_react.createElement)(
      "div",
      { className: "uwd-import" },
      (0, import_react.createElement)("label", null, "\u8F7D\u5165\u751F\u4EA7\u6E05\u5355", (0, import_react.createElement)("input", { type: "file", accept: "application/json,.json", onChange: readManifest })),
      error === void 0 ? null : (0, import_react.createElement)("p", { role: "alert" }, error)
    ),
    (0, import_react.createElement)("nav", { role: "tablist", "aria-label": "\u5DE5\u4F5C\u53F0\u9875\u7B7E" }, tabs.map((label) => (0, import_react.createElement)("button", {
      type: "button",
      role: "tab",
      key: label,
      "aria-selected": tab === label,
      onClick: () => setTab(label)
    }, label))),
    (0, import_react.createElement)("section", { className: "uwd-content" }, content)
  ) : (0, import_react.createElement)("button", { type: "button", className: "uwd-launcher", onClick: () => setOpen(!0) }, "\u77ED\u5267\u5DE5\u4F5C\u53F0");
}
function renderTab(snapshot, tab) {
  return tab === "\u603B\u89C8" ? (0, import_react.createElement)(
    "div",
    null,
    (0, import_react.createElement)("h2", null, snapshot.episode_id ?? "\u672A\u547D\u540D\u96C6"),
    (0, import_react.createElement)(
      "div",
      { className: "uwd-stats" },
      stat("\u8D44\u4EA7", `${snapshot.summary.approved_assets}/${snapshot.summary.assets}`),
      stat("\u955C\u5934", snapshot.summary.shots),
      stat("\u53EF\u751F\u6210", snapshot.summary.ready_to_generate),
      stat("\u5F85\u5BA1\u6838", snapshot.summary.review_required),
      stat("\u5DF2\u963B\u585E", snapshot.summary.blocked)
    ),
    (0, import_react.createElement)("h3", null, "\u9700\u8981\u5904\u7406"),
    renderDiagnostics(snapshot.diagnostics)
  ) : tab === "\u8D44\u4EA7" ? renderTable(["ID", "\u7C7B\u578B", "\u72B6\u6001"], snapshot.assets.map((asset) => [asset.id, asset.kind, asset.status])) : tab === "\u955C\u5934" ? renderTable(["\u955C\u5934", "\u6765\u6E90", "\u65F6\u957F", "\u72B6\u6001"], snapshot.shots.map((shot) => [shot.shot_id, shot.source_scene_id, `${shot.duration_seconds ?? "?"}s`, shot.status])) : renderTable(["\u4EFB\u52A1", "\u72B6\u6001", "\u5173\u8054\u5BF9\u8C61"], snapshot.tasks.map((task) => [task.id, task.status, (task.targets ?? []).join(", ") || "\u2014"]));
}
function stat(label, value) {
  return (0, import_react.createElement)("div", { className: "uwd-stat", key: label }, (0, import_react.createElement)("span", null, value), (0, import_react.createElement)("small", null, label));
}
function renderDiagnostics(items) {
  return items.length === 0 ? (0, import_react.createElement)("p", { className: "uwd-ok" }, "\u6CA1\u6709\u963B\u585E\u9879\uFF0C\u751F\u6210\u524D\u4ECD\u8BF7\u786E\u8BA4\u76EE\u6807\u6A21\u578B\u4E0E\u5A92\u4F53\u80FD\u529B\u3002") : (0, import_react.createElement)("ul", { className: "uwd-diagnostics" }, items.map((item, index) => (0, import_react.createElement)("li", { key: `${item.code}-${index}`, "data-severity": item.severity }, `${item.target_id === void 0 ? "" : `${item.target_id} \xB7 `}${item.message}`)));
}
function renderTable(headers, rows) {
  let body = rows.length === 0 ? (0, import_react.createElement)("tr", null, (0, import_react.createElement)("td", { colSpan: headers.length }, "\u6682\u65E0\u8BB0\u5F55")) : rows.map((row, index) => (0, import_react.createElement)("tr", { key: index }, row.map((cell, cellIndex) => (0, import_react.createElement)("td", { key: cellIndex }, String(cell)))));
  return (0, import_react.createElement)("div", { className: "uwd-table-wrap" }, (0, import_react.createElement)(
    "table",
    null,
    (0, import_react.createElement)("thead", null, (0, import_react.createElement)("tr", null, headers.map((header) => (0, import_react.createElement)("th", { key: header }, header)))),
    (0, import_react.createElement)("tbody", null, body)
  ));
}
var styles = `
.uwd-launcher{position:fixed;right:20px;bottom:22px;z-index:30;border:0;border-radius:999px;background:#e11d48;color:#fff;padding:10px 15px;font:600 13px system-ui;box-shadow:0 8px 28px #0005;cursor:pointer}.uwd-panel{position:fixed;right:18px;bottom:18px;width:min(560px,calc(100vw - 36px));max-height:min(720px,calc(100vh - 36px));overflow:auto;z-index:31;background:#101216;color:#edf0f6;border:1px solid #2b3039;border-radius:16px;box-shadow:0 20px 60px #0009;font:13px/1.45 system-ui}.uwd-panel header{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 12px}.uwd-panel header strong{display:block;font-size:15px}.uwd-panel header span{display:block;color:#9aa3b2;font-size:12px}.uwd-panel button{cursor:pointer}.uwd-panel header button{border:0;background:transparent;color:#c8cfda;font-size:25px}.uwd-import{display:flex;align-items:center;gap:12px;padding:0 18px 12px;color:#c8cfda}.uwd-import label{display:flex;gap:8px;align-items:center}.uwd-import input{max-width:205px;color:#c8cfda}.uwd-import p{margin:0;color:#fda4af}.uwd-panel nav{display:flex;gap:4px;padding:0 14px;border-bottom:1px solid #2b3039}.uwd-panel nav button{border:0;background:transparent;color:#aab2bf;padding:10px 9px}.uwd-panel nav button[aria-selected=true]{color:#fff;border-bottom:2px solid #fb7185}.uwd-content{padding:16px 18px 20px}.uwd-empty{color:#aab2bf}.uwd-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.uwd-stat{background:#191d24;border-radius:9px;padding:9px;text-align:center}.uwd-stat span{display:block;font-size:17px;font-weight:700}.uwd-stat small{color:#9aa3b2}.uwd-diagnostics{margin:0;padding-left:18px}.uwd-diagnostics li{margin:7px 0}.uwd-diagnostics li[data-severity=error]{color:#fda4af}.uwd-diagnostics li[data-severity=warning]{color:#fde68a}.uwd-ok{color:#86efac}.uwd-table-wrap{overflow:auto}.uwd-table-wrap table{width:100%;border-collapse:collapse;text-align:left}.uwd-table-wrap th,.uwd-table-wrap td{padding:9px 7px;border-bottom:1px solid #2b3039;vertical-align:top}.uwd-table-wrap th{color:#9aa3b2;font-weight:600}@media(max-width:520px){.uwd-stats{grid-template-columns:repeat(3,1fr)}}`;
function apply(context) {
  assertP1Compatibility(context), context.slots.inject("shell.overlay", () => context.slots.register({
    name: "shell.overlay",
    id: "us-vertical-drama-workbench"
  }, () => (0, import_react.createElement)("div", null, (0, import_react.createElement)("style", null, styles), (0, import_react.createElement)(WorkbenchPanel))));
}
var client_default = { name, inject, apply };
;return module.exports;}});
