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
  if (context?.slots === void 0 || typeof context.slots.inject != "function" || typeof context.slots.register != "function")
    throw new Error(`US Vertical Drama P1 Workbench requires the DSH ${P1_DSH_VERSION} slot service. P0 skills remain available without this optional browser panel.`);
}

// dsh-plugin/production-workbench.js
var PRODUCTION_WORKBENCH_SCHEMA = "us-vertical-drama-workbench/v1", assetKinds = /* @__PURE__ */ new Set(["character", "look", "set", "prop"]), assetStatuses = /* @__PURE__ */ new Set(["draft", "pending_approval", "approved", "blocked"]), shotStatuses = /* @__PURE__ */ new Set(["draft", "blocked", "ready_to_generate", "generating", "review_required", "approved"]), taskStatuses = /* @__PURE__ */ new Set(["todo", "in_progress", "blocked", "review", "done"]), timelineTolerance = 0.05;
function buildProductionSnapshot(manifest) {
  let diagnostics = [], assets = Array.isArray(manifest?.assets) ? manifest.assets : [], shots = Array.isArray(manifest?.shots) ? manifest.shots : [], tasks = Array.isArray(manifest?.tasks) ? manifest.tasks : [], suppliedVideos = Array.isArray(manifest?.videos) ? manifest.videos : [];
  manifest?.schema_version !== PRODUCTION_WORKBENCH_SCHEMA && diagnostics.push(issue("error", "invalid_schema", "\u6E05\u5355\u7248\u672C\u5FC5\u987B\u4E3A us-vertical-drama-workbench/v1")), string(manifest?.episode_id) || diagnostics.push(issue("error", "missing_episode_id", "\u7F3A\u5C11\u96C6\u7F16\u53F7"));
  let assetById = uniqueById(assets, "asset", diagnostics), suppliedVideoById = uniqueById(suppliedVideos, "video", diagnostics), shotById = uniqueById(shots, "shot", diagnostics), taskById = uniqueById(tasks, "task", diagnostics);
  for (let asset of assets)
    assetKinds.has(asset.kind) || diagnostics.push(issue("error", "invalid_asset_kind", `${asset.id ?? "asset"} \u7684\u8D44\u4EA7\u7C7B\u578B\u65E0\u6548`, asset.id)), assetStatuses.has(asset.status) || diagnostics.push(issue("error", "invalid_asset_status", `${asset.id ?? "asset"} \u7684\u8D44\u4EA7\u72B6\u6001\u65E0\u6548`, asset.id));
  let normalizedShots = shots.map((shot) => normalizeShot(shot, assetById, suppliedVideoById, diagnostics)), videos = normalizeVideos(suppliedVideos, normalizedShots, diagnostics), videoById = new Map(videos.map((video) => [video.video_id, video]));
  applyVideoBlocks(normalizedShots, videoById, diagnostics), validateMicroShotTimelines(normalizedShots, videoById, diagnostics, suppliedVideos.length > 0), applyTimelineBlocks(normalizedShots, diagnostics);
  for (let task of tasks) validateTask(task, assetById, shotById, taskById, videoById, diagnostics);
  let totalSeconds = videos.reduce((sum, video) => sum + (video.duration_seconds ?? 0), 0), states = countStates(normalizedShots);
  return {
    schema_version: PRODUCTION_WORKBENCH_SCHEMA,
    episode_id: manifest?.episode_id ?? null,
    episode_display_name_zh: manifest?.episode_display_name_zh ?? null,
    assets,
    videos,
    shots: normalizedShots,
    tasks,
    diagnostics,
    summary: {
      assets: assets.length,
      approved_assets: assets.filter((asset) => asset.status === "approved").length,
      videos: videos.length,
      shots: normalizedShots.length,
      micro_shots: normalizedShots.filter((shot) => hasTimeline(shot)).length,
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
function parseStoryboardText(source, filename = "\u5BFC\u5165\u5206\u955C\u6587\u672C") {
  let lines = String(source ?? "").replace(/\r\n?/g, `
`).split(`
`), videoStarts = lines.map((line, index) => isLabel(line, "\u89C6\u9891\u7F16\u53F7") ? index : -1).filter((index) => index >= 0);
  if (videoStarts.length === 0) throw new Error("\u672A\u627E\u5230\u3010\u89C6\u9891\u7F16\u53F7\u3011\u3002\u8BF7\u5BFC\u5165\u5206\u955C\u5BFC\u6F14\u751F\u6210\u7684 Markdown/TXT\uFF0C\u6216\u5BFC\u5165 production-workbench.json\u3002");
  let videos = [], shots = [];
  return videoStarts.forEach((start, videoIndex) => {
    let end = videoStarts[videoIndex + 1] ?? lines.length, block = lines.slice(start, end), rawVideoId = labelValue(block[0], "\u89C6\u9891\u7F16\u53F7"), videoId = stableId(rawVideoId, "VIDEO", videoIndex + 1), shotStarts = block.map((line, index) => isShotLabel(line) ? index : -1).filter((index) => index >= 0), context = [section(block, "\u573A\u666F\u4E0E\u8FDE\u7EED\u72B6\u6001"), section(block, "\u5149\u7EBF"), section(block, "\u51FA\u573A\u4EBA\u7269"), section(block, "\u58F0\u97F3\u4E0E\u53F0\u8BCD")].filter(Boolean).join("\uFF1B"), explicitVideoMaster = section(block, "\u89C6\u9891\u751F\u6210\u603B\u63D0\u793A\u8BCD") || section(block, "\u89C6\u9891\u603B\u63D0\u793A\u8BCD"), videoMaster = explicitVideoMaster || `\u6839\u636E\u4EE5\u4E0B\u5206\u955C\u8FDE\u7EED\u751F\u6210\u5B8C\u6574\u89C6\u9891\uFF1A${context || "\u4FDD\u6301\u89D2\u8272\u3001\u670D\u88C5\u3001\u573A\u666F\u4E0E\u9053\u5177\u8FDE\u7EED\u3002"}\uFF1B\u955C\u5934\u6309\u65F6\u95F4\u987A\u5E8F\u63A8\u8FDB\uFF0C\u52A8\u4F5C\u3001\u6784\u56FE\u3001\u5149\u7EBF\u548C\u58F0\u97F3\u4EE5\u5404\u955C\u5934\u8BF4\u660E\u4E3A\u51C6\u3002`, videoNegative = section(block, "\u89C6\u9891\u7EA7\u8D1F\u9762\u7EA6\u675F") || section(block, "\u89C6\u9891\u8D1F\u9762\u7EA6\u675F") || "\u4FDD\u6301\u89D2\u8272\u8EAB\u4EFD\u3001\u670D\u88C5\u3001\u573A\u666F\u3001\u9053\u5177\u548C\u7A7A\u95F4\u65B9\u4F4D\u8FDE\u7EED\uFF1B\u4E0D\u65B0\u589E\u672A\u6279\u51C6\u7684\u4EBA\u7269\u3001\u7269\u54C1\u6216\u5730\u70B9\u3002", cursor = 0, videoShots = [];
    shotStarts.forEach((shotStart, shotIndex) => {
      let shotEnd = shotStarts[shotIndex + 1] ?? block.length, shotBlock = block.slice(shotStart, shotEnd), rawShotId = labelValue(shotBlock[0], "\u955C\u5934\u7F16\u53F7") || labelValue(shotBlock[0], "\u955C\u5934"), shotId = stableId(rawShotId, `SHOT-${pad(videoIndex + 1)}`, shotIndex + 1), range = parseRange(section(shotBlock, "\u5305\u5185\u65F6\u95F4")), headerDuration = parseSeconds(shotBlock[0]), declaredDuration = parseSeconds(section(shotBlock, "\u65F6\u957F")) ?? headerDuration, inTime = range?.[0] ?? cursor, duration2 = declaredDuration ?? (range ? range[1] - range[0] : 1), outTime = range?.[1] ?? inTime + duration2;
      cursor = outTime;
      let detail = [section(shotBlock, "\u753B\u9762/\u6784\u56FE"), section(shotBlock, "\u753B\u9762"), section(shotBlock, "\u52A8\u4F5C\u4E0E\u60C5\u7EEA"), section(shotBlock, "\u955C\u5934\u8FD0\u52A8")].filter(Boolean).join("\uFF1B");
      videoShots.push({
        shot_id: shotId,
        video_id: videoId,
        display_name_zh: section(shotBlock, "\u4E2D\u6587\u663E\u793A\u540D") || `\u955C\u5934 ${videoIndex + 1}-${shotIndex + 1}`,
        prompt_id: `PROMPT-${pad(videoIndex + 1)}-${pad(shotIndex + 1)}`,
        source_scene_id: section(shotBlock, "\u5173\u8054\u573A\u666F") || section(block, "\u5173\u8054\u573A\u666F") || `TEXT-SC-${pad(videoIndex + 1)}`,
        timeline_in_seconds: round(inTime),
        timeline_out_seconds: round(outTime),
        duration_seconds: round(outTime - inTime),
        shot_type: section(shotBlock, "\u955C\u5934\u7C7B\u578B") || "\u5FAE\u955C\u5934",
        generation_mode: "independent",
        asset_ids: [],
        asset_lock_prompt: section(shotBlock, "\u8D44\u4EA7\u9501\u5B9A\u63D0\u793A\u8BCD") || "\u6CBF\u7528\u7236\u89C6\u9891\u5DF2\u7ECF\u9501\u5B9A\u7684\u89D2\u8272\u3001\u670D\u88C5\u3001\u573A\u666F\u3001\u9053\u5177\u4E0E\u7A7A\u95F4\u65B9\u4F4D\u3002",
        shot_delta_prompt: section(shotBlock, "\u89C6\u9891\u751F\u6210\u63D0\u793A\u8BCD") || section(shotBlock, "\u955C\u5934\u63D0\u793A\u8BCD") || detail || "\u6309\u8BE5\u955C\u5934\u539F\u59CB\u5206\u955C\u751F\u6210\uFF0C\u4E0D\u6539\u53D8\u5DF2\u9501\u5B9A\u8D44\u4EA7\u3002",
        negative_prompt: section(shotBlock, "\u8D1F\u9762\u7EA6\u675F") || "\u4E0D\u6539\u53D8\u89D2\u8272\u8EAB\u4EFD\u3001\u670D\u88C5\u3001\u573A\u666F\u3001\u9053\u5177\u6216\u7A7A\u95F4\u65B9\u4F4D\u3002",
        status: "ready_to_generate",
        ...outTime - inTime > 3 ? { duration_exception_reason_zh: "\u4ECE\u65E7\u7248\u5206\u955C\u6587\u672C\u81EA\u52A8\u5339\u914D\uFF0C\u4FDD\u7559\u539F\u59CB\u65F6\u957F\u3002" } : {},
        ...outTime - inTime < 0.5 ? { short_duration_reason_zh: "\u4ECE\u65E7\u7248\u5206\u955C\u6587\u672C\u81EA\u52A8\u5339\u914D\uFF0C\u4FDD\u7559\u539F\u59CB\u65F6\u957F\u3002" } : {}
      });
    });
    let duration = parseSeconds(section(block, "\u603B\u65F6\u957F")) ?? Math.max(cursor, ...videoShots.map((item) => item.timeline_out_seconds), 1);
    videos.push({
      video_id: videoId,
      display_name_zh: section(block, "\u4E2D\u6587\u663E\u793A\u540D") || `\u89C6\u9891 ${videoIndex + 1}`,
      source_scene_id: section(block, "\u5173\u8054\u573A\u666F") || `TEXT-SC-${pad(videoIndex + 1)}`,
      duration_seconds: round(duration),
      video_prompt_id: `VIDEO-PROMPT-${pad(videoIndex + 1)}`,
      video_master_prompt: explicitVideoMaster || `${videoMaster}
${videoShots.map((item) => item.shot_delta_prompt).join("\uFF1B")}`,
      video_negative_prompt: videoNegative,
      status: "ready_to_generate",
      imported_from_text: !0
    }), shots.push(...videoShots);
  }), {
    schema_version: PRODUCTION_WORKBENCH_SCHEMA,
    episode_id: filename.replace(/\.[^.]+$/, "") || "TEXT-EPISODE",
    episode_display_name_zh: filename.replace(/\.[^.]+$/, "") || "\u5BFC\u5165\u5206\u955C\u6587\u672C",
    assets: [],
    videos,
    shots,
    tasks: [],
    imported_from_text: !0
  };
}
function normalizeShot(shot, assetById, suppliedVideoById, diagnostics) {
  let id = shot?.shot_id, references = Array.isArray(shot?.asset_ids) ? shot.asset_ids : [], duration = number(shot?.duration_seconds), blocked = !1;
  string(id) || (diagnostics.push(issue("error", "missing_shot_id", "\u5FAE\u955C\u5934\u7F3A\u5C11 shot_id")), blocked = !0), (!string(shot?.video_id) || !string(shot?.prompt_id)) && (diagnostics.push(issue("error", "missing_trace_id", `${id ?? "shot"} \u7F3A\u5C11 video_id \u6216 prompt_id`, id)), blocked = !0), string(shot?.source_scene_id) || (diagnostics.push(issue("error", "missing_source_scene", `${id ?? "shot"} \u7F3A\u5C11 source_scene_id`, id)), blocked = !0), (duration === void 0 || duration <= 0) && (diagnostics.push(issue("error", "invalid_duration", `${id ?? "shot"} \u7684\u65F6\u957F\u5FC5\u987B\u5927\u4E8E 0`, id)), blocked = !0), duration !== void 0 && duration > 15 && (diagnostics.push(issue("error", "duration_over_15s", `${id ?? "shot"} \u8D85\u8FC7 V8 \u517C\u5BB9\u7684 15 \u79D2\u4E0A\u9650`, id)), blocked = !0), (!string(shot?.asset_lock_prompt) || !string(shot?.shot_delta_prompt) || !string(shot?.negative_prompt)) && (diagnostics.push(issue("error", "missing_prompt_layers", `${id ?? "shot"} \u7F3A\u5C11\u8D44\u4EA7\u9501\u5B9A\u3001\u955C\u5934\u53D8\u5316\u6216\u8D1F\u9762\u7EA6\u675F\u63D0\u793A\u8BCD`, id)), blocked = !0), shotStatuses.has(shot?.status) || (diagnostics.push(issue("error", "invalid_shot_status", `${id ?? "shot"} \u7684\u955C\u5934\u72B6\u6001\u65E0\u6548`, id)), blocked = !0), string(shot?.display_name_zh) || diagnostics.push(issue("warning", "missing_chinese_display_name", `${id ?? "shot"} \u672A\u63D0\u4F9B\u4E2D\u6587\u663E\u793A\u540D`, id)), suppliedVideoById.size > 0 && !suppliedVideoById.has(shot?.video_id) && (diagnostics.push(issue("error", "unknown_parent_video", `${id ?? "shot"} \u5173\u8054\u4E86\u4E0D\u5B58\u5728\u7684\u89C6\u9891\u5305 ${shot?.video_id}`, id)), blocked = !0);
  for (let assetId of references) {
    let asset = assetById.get(assetId);
    asset === void 0 ? (diagnostics.push(issue("error", "unknown_asset_reference", `${id ?? "shot"} \u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u8D44\u4EA7 ${assetId}`, id)), blocked = !0) : asset.status !== "approved" && (diagnostics.push(issue("warning", "asset_not_approved", `${id ?? "shot"} \u7B49\u5F85\u8D44\u4EA7 ${assetId} \u5BA1\u6838`, id)), blocked = !0);
  }
  return { ...shot, duration_seconds: duration, status: blocked ? "blocked" : shot.status, blocked };
}
function normalizeVideos(suppliedVideos, shots, diagnostics) {
  let grouped = groupBy(shots, (shot) => shot.video_id), videos = suppliedVideos.length > 0 ? suppliedVideos.map((video) => ({ ...video })) : [...grouped.keys()].filter(Boolean).map((video_id) => ({
    video_id,
    display_name_zh: video_id,
    duration_seconds: grouped.get(video_id).reduce((sum, shot) => sum + (shot.duration_seconds ?? 0), 0),
    status: "draft",
    derived: !0
  }));
  for (let video of videos) {
    let id = video?.video_id, duration = number(video?.duration_seconds);
    video.duration_seconds = duration, string(id) || diagnostics.push(issue("error", "missing_video_id", "\u89C6\u9891\u5305\u7F3A\u5C11 video_id")), string(video?.display_name_zh) || diagnostics.push(issue("warning", "missing_chinese_display_name", `${id ?? "video"} \u672A\u63D0\u4F9B\u4E2D\u6587\u663E\u793A\u540D`, id)), (duration === void 0 || duration <= 0) && diagnostics.push(issue("error", "invalid_video_duration", `${id ?? "video"} \u7684\u89C6\u9891\u5305\u65F6\u957F\u5FC5\u987B\u5927\u4E8E 0`, id)), duration !== void 0 && duration > 15 && diagnostics.push(issue("error", "video_duration_over_15s", `${id ?? "video"} \u8D85\u8FC7 V8 \u517C\u5BB9\u7684 15 \u79D2\u4E0A\u9650`, id)), video.status !== void 0 && !shotStatuses.has(video.status) && diagnostics.push(issue("error", "invalid_video_status", `${id ?? "video"} \u7684\u89C6\u9891\u5305\u72B6\u6001\u65E0\u6548`, id)), !video.derived && (!string(video?.video_prompt_id) || !string(video?.video_master_prompt) || !string(video?.video_negative_prompt)) && (diagnostics.push(issue("error", "missing_video_prompt_layers", String(id ?? "video") + " \u7F3A\u5C11\u89C6\u9891\u603B\u63D0\u793A\u8BCD\u3001\u89C6\u9891\u63D0\u793A\u8BCD\u7F16\u53F7\u6216\u89C6\u9891\u7EA7\u8D1F\u9762\u7EA6\u675F", id)), video.blocked = !0, video.status = "blocked");
  }
  return videos;
}
function applyVideoBlocks(shots, videoById, diagnostics) {
  for (let shot of shots)
    videoById.get(shot.video_id)?.blocked && markBlocked(shot, diagnostics, "parent_video_not_generation_ready", String(shot.shot_id ?? "shot") + " \u7684\u7236\u89C6\u9891\u5305\u5C1A\u672A\u5177\u5907\u53EF\u751F\u6210\u7684\u89C6\u9891\u603B\u63D0\u793A\u8BCD", shot.shot_id);
}
function validateMicroShotTimelines(shots, videoById, diagnostics, requireTimelines) {
  for (let shot of shots) {
    if (!hasTimeline(shot)) {
      requireTimelines && markBlocked(shot, diagnostics, "missing_micro_shot_timeline", `${shot.shot_id ?? "shot"} \u7F3A\u5C11\u5305\u5185\u8D77\u6B62\u65F6\u95F4`, shot.shot_id);
      continue;
    }
    let inTime = number(shot.timeline_in_seconds), outTime = number(shot.timeline_out_seconds);
    if (inTime === void 0 || outTime === void 0 || inTime < 0 || outTime <= inTime) {
      markBlocked(shot, diagnostics, "invalid_micro_shot_timeline", `${shot.shot_id ?? "shot"} \u7684\u5305\u5185\u65F6\u95F4\u65E0\u6548`, shot.shot_id);
      continue;
    }
    Math.abs(outTime - inTime - shot.duration_seconds) > timelineTolerance && markBlocked(shot, diagnostics, "micro_shot_duration_mismatch", `${shot.shot_id ?? "shot"} \u7684\u65F6\u957F\u4E0E\u5305\u5185\u65F6\u95F4\u4E0D\u4E00\u81F4`, shot.shot_id);
    let video = videoById.get(shot.video_id);
    video?.duration_seconds !== void 0 && outTime > video.duration_seconds + timelineTolerance && markBlocked(shot, diagnostics, "micro_shot_outside_video", `${shot.shot_id ?? "shot"} \u8D85\u51FA\u7236\u89C6\u9891\u5305\u65F6\u957F`, shot.shot_id), shot.duration_seconds > 3 && !string(shot.duration_exception_reason_zh) && markBlocked(shot, diagnostics, "long_micro_shot_without_reason", `${shot.shot_id ?? "shot"} \u8D85\u8FC7 3 \u79D2\uFF0C\u5FC5\u987B\u586B\u5199\u4E2D\u6587\u4F8B\u5916\u539F\u56E0`, shot.shot_id), shot.duration_seconds < 0.5 && !string(shot.short_duration_reason_zh) && markBlocked(shot, diagnostics, "short_micro_shot_without_reason", `${shot.shot_id ?? "shot"} \u5C11\u4E8E 0.5 \u79D2\uFF0C\u5FC5\u987B\u586B\u5199\u4E2D\u6587\u4F8B\u5916\u539F\u56E0`, shot.shot_id);
  }
  for (let [videoId, items] of groupBy(shots.filter(hasTimeline), (shot) => shot.video_id)) {
    let cursor = 0;
    for (let shot of [...items].sort((a, b) => a.timeline_in_seconds - b.timeline_in_seconds))
      Math.abs(shot.timeline_in_seconds - cursor) > timelineTolerance && markBlocked(shot, diagnostics, "micro_shot_timeline_gap_or_overlap", `${videoId} \u7684\u5FAE\u955C\u5934\u65F6\u95F4\u7EBF\u5B58\u5728\u7A7A\u6863\u6216\u91CD\u53E0`, shot.shot_id), cursor = shot.timeline_out_seconds;
    let video = videoById.get(videoId);
    video?.duration_seconds !== void 0 && Math.abs(cursor - video.duration_seconds) > timelineTolerance && diagnostics.push(issue("warning", "micro_shot_timeline_not_full_coverage", `${videoId} \u7684\u5FAE\u955C\u5934\u672A\u5B8C\u5168\u8986\u76D6\u89C6\u9891\u5305\u65F6\u957F`, videoId));
  }
}
function applyTimelineBlocks(shots, diagnostics) {
  let blockedIds = new Set(diagnostics.filter((item) => item.severity === "error" && item.target_id !== void 0).map((item) => item.target_id));
  for (let shot of shots) blockedIds.has(shot.shot_id) && (shot.blocked = !0, shot.status = "blocked");
}
function validateTask(task, assetById, shotById, taskById, videoById, diagnostics) {
  if (!string(task?.id)) {
    diagnostics.push(issue("error", "missing_task_id", "\u4EFB\u52A1\u7F3A\u5C11 id"));
    return;
  }
  taskStatuses.has(task.status) || diagnostics.push(issue("error", "invalid_task_status", `${task.id} \u7684\u4EFB\u52A1\u72B6\u6001\u65E0\u6548`, task.id));
  for (let target of Array.isArray(task.targets) ? task.targets : [])
    !assetById.has(target) && !shotById.has(target) && !taskById.has(target) && !videoById.has(target) && diagnostics.push(issue("warning", "unknown_task_target", `${task.id} \u5173\u8054\u4E86\u4E0D\u5B58\u5728\u7684\u5BF9\u8C61 ${target}`, task.id));
}
function uniqueById(values, label, diagnostics) {
  let byId = /* @__PURE__ */ new Map();
  for (let value of values) {
    let id = value?.id ?? value?.shot_id ?? value?.video_id;
    string(id) && (byId.has(id) ? diagnostics.push(issue("error", "duplicate_id", `\u91CD\u590D\u7684 ${label} ID\uFF1A${id}`, id)) : byId.set(id, value));
  }
  return byId;
}
function groupBy(values, key) {
  return values.reduce((groups, value) => {
    let id = key(value);
    return groups.has(id) || groups.set(id, []), groups.get(id).push(value), groups;
  }, /* @__PURE__ */ new Map());
}
function hasTimeline(shot) {
  return number(shot?.timeline_in_seconds) !== void 0 && number(shot?.timeline_out_seconds) !== void 0;
}
function markBlocked(shot, diagnostics, code, message, target_id) {
  diagnostics.push(issue("error", code, message, target_id)), shot.blocked = !0, shot.status = "blocked";
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
function pad(value) {
  return String(value).padStart(3, "0");
}
function round(value) {
  return Math.round(Number(value) * 1e3) / 1e3;
}
function stableId(value, prefix, index) {
  let cleaned = String(value ?? "").trim().replace(/\s+/g, "-");
  return /^[A-Za-z][A-Za-z0-9_-]*$/.test(cleaned) ? cleaned : `${prefix}-${pad(index)}`;
}
function isLabel(line, label) {
  return new RegExp(`^\\s*[\u3010[]${label}`).test(line);
}
function isShotLabel(line) {
  return isLabel(line, "\u955C\u5934\u7F16\u53F7") || /^\s*[【[]镜头\s*\d*[】\]]/.test(line);
}
function labelValue(line, label) {
  let match = String(line ?? "").match(new RegExp(`^\\s*[\u3010[]${label}([^\u3011\\]]*)[\u3011\\]]\\s*(.*)$`));
  return match ? `${match[1]} ${match[2]}`.trim() : "";
}
function section(lines, label) {
  let start = lines.findIndex((line) => isLabel(line, label));
  if (start < 0) return "";
  let values = [labelValue(lines[start], label)];
  for (let index = start + 1; index < lines.length && !/^\s*[【[][^】\]]+[】\]]/.test(lines[index]); index += 1)
    values.push(lines[index].trim());
  return values.join(`
`).trim();
}
function parseSeconds(value) {
  let match = String(value ?? "").match(/(\d+(?:\.\d+)?)\s*(?:秒|s\b)/i);
  return match ? Number(match[1]) : void 0;
}
function parseRange(value) {
  let match = String(value ?? "").match(/(\d+(?:\.\d+)?)\s*(?:秒|s)?\s*(?:–|—|-|~|至|到)\s*(\d+(?:\.\d+)?)\s*(?:秒|s)?/i);
  return match ? [Number(match[1]), Number(match[2])] : void 0;
}

// dsh-plugin/client.js
var name = "us-vertical-drama-studio", inject = ["slots"], p1Compatibility = { dsh: P1_DSH_VERSION, mode: "exact" }, statuses = { draft: "\u8349\u7A3F", blocked: "\u5DF2\u963B\u585E", ready_to_generate: "\u53EF\u751F\u6210", generating: "\u751F\u6210\u4E2D", review_required: "\u5F85\u5BA1\u6838", approved: "\u5DF2\u901A\u8FC7" };
function SessionArtifactIndexer({ sessionId }) {
  return (0, import_react.useEffect)(() => {
    let root, observer, document = globalThis.document;
    if (!document) return;
    let refresh = () => recordConversationDocuments(sessionId, root ? scanConversationDocuments(root) : []), locate = () => {
      let next = document.querySelector("[data-conversation-scroll]");
      next !== root && (observer?.disconnect(), root = next, root && (observer = new MutationObserver(refresh), observer.observe(root, { childList: !0, subtree: !0, characterData: !0 })), refresh());
    };
    locate();
    let locator = new MutationObserver(locate);
    return locator.observe(document.body, { childList: !0, subtree: !0 }), () => {
      observer?.disconnect(), locator.disconnect();
    };
  }, [sessionId]), null;
}
function DramaGoView({ sessionId }) {
  let documents = useConversationDocuments(sessionId);
  return (0, import_react.createElement)(
    "div",
    { className: "uwd-native-view", "data-session-id": String(sessionId) },
    (0, import_react.createElement)("style", null, nativeViewStyles),
    (0, import_react.createElement)(WorkbenchPanel, { documents })
  );
}
function WorkbenchPanel({ documents }) {
  let [snapshot, setSnapshot] = (0, import_react.useState)(), [filename, setFilename] = (0, import_react.useState)("\u672A\u5BFC\u5165\u5206\u955C"), [source, setSource] = (0, import_react.useState)(""), [view, setView] = (0, import_react.useState)("\u6587\u672C"), [activeVideo, setActiveVideo] = (0, import_react.useState)(), [activeShot, setActiveShot] = (0, import_react.useState)(), [error, setError] = (0, import_react.useState)(), video = snapshot?.videos.find((item) => item.video_id === activeVideo) ?? snapshot?.videos[0], shots = (0, import_react.useMemo)(() => snapshot?.shots.filter((item) => item.video_id === video?.video_id).sort((a, b) => (a.timeline_in_seconds ?? 0) - (b.timeline_in_seconds ?? 0)) ?? [], [snapshot, video]), shot = shots.find((item) => item.shot_id === activeShot) ?? shots[0], importStoryboard = (event) => {
    let file = event.target.files?.[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = () => {
      try {
        let text = String(reader.result), manifest = /\.json$/i.test(file.name) ? JSON.parse(text) : parseStoryboardText(text, file.name), next = buildProductionSnapshot(manifest);
        setSnapshot(next), setFilename(file.name), setSource(/\.json$/i.test(file.name) ? JSON.stringify(manifest, null, 2) : text), setActiveVideo(next.videos[0]?.video_id), setActiveShot(next.shots[0]?.shot_id), setView("\u6587\u672C"), setError(void 0);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "\u65E0\u6CD5\u8BFB\u53D6\u5206\u955C\u6587\u4EF6");
      }
    }, reader.readAsText(file, "utf-8");
  }, openConversationDocument = (document) => {
    try {
      let manifest = /(?:分镜|storyboard)/iu.test(document.title) || /【视频编号】|【镜头编号】/u.test(document.source) ? parseStoryboardText(document.source, document.filename) : void 0, next = manifest ? buildProductionSnapshot(manifest) : void 0;
      setSnapshot(next), setFilename(document.filename), setSource(document.source), setActiveVideo(next?.videos[0]?.video_id), setActiveShot(next?.shots[0]?.shot_id), setView("\u6587\u672C"), setError(void 0);
    } catch (reason) {
      setSnapshot(void 0), setFilename(document.filename), setSource(document.source), setView("\u6587\u672C"), setError(reason instanceof Error ? reason.message : "\u65E0\u6CD5\u6253\u5F00\u5BF9\u8BDD\u6587\u6863");
    }
  };
  return (0, import_react.createElement)(
    "div",
    { className: "uwd-workspace-panel", "data-open": "true" },
    (0, import_react.createElement)(
      "aside",
      { className: "uwd-tree", "aria-label": "\u5206\u955C\u6587\u4EF6\u6811" },
      (0, import_react.createElement)("header", null, (0, import_react.createElement)("strong", null, "DramaGo \u5DE5\u4F5C\u53F0")),
      (0, import_react.createElement)("label", { className: "uwd-import" }, "\u5BFC\u5165\u5206\u955C", (0, import_react.createElement)("input", { type: "file", accept: "application/json,.json,text/plain,.txt,text/markdown,.md", onChange: importStoryboard })),
      (0, import_react.createElement)("p", { className: "uwd-project" }, filename),
      (0, import_react.createElement)(ConversationDocumentTree, { documents, activeId: filename, onOpen: openConversationDocument }),
      (0, import_react.createElement)("button", { type: "button", className: view === "\u6587\u672C" ? "selected" : "", onClick: () => setView("\u6587\u672C") }, "\u25A3 \u5206\u955C\u6587\u672C"),
      (0, import_react.createElement)("button", { type: "button", className: view === "\u89C6\u9891\u5305" ? "selected" : "", onClick: () => setView("\u89C6\u9891\u5305") }, "\u25A3 \u89C6\u9891\u5305\u4E0E\u955C\u5934", snapshot ? (0, import_react.createElement)("small", null, String(snapshot.summary.videos) + " \u89C6\u9891 / " + String(snapshot.summary.shots) + " \u955C\u5934") : null),
      snapshot ? (0, import_react.createElement)("div", { className: "uwd-tree-videos" }, snapshot.videos.map((item) => (0, import_react.createElement)(
        "div",
        { key: item.video_id },
        (0, import_react.createElement)("button", { type: "button", className: item.video_id === video?.video_id ? "selected" : "", onClick: () => {
          setActiveVideo(item.video_id), setActiveShot(snapshot.shots.find((next) => next.video_id === item.video_id)?.shot_id), setView("\u89C6\u9891\u5305");
        } }, "\u89C6\u9891\u7F16\u53F7\uFF1A" + item.video_id),
        item.video_id === video?.video_id ? snapshot.shots.filter((next) => next.video_id === item.video_id).map((next) => (0, import_react.createElement)("button", { type: "button", key: next.shot_id, className: "uwd-tree-shot" + (next.shot_id === shot?.shot_id ? " selected" : ""), onClick: () => {
          setActiveShot(next.shot_id), setView("\u89C6\u9891\u5305");
        } }, "\u955C\u5934\u7F16\u53F7\uFF1A" + next.shot_id)) : null
      ))) : null
    ),
    (0, import_react.createElement)(
      "main",
      { className: "uwd-editor", "aria-label": "\u5206\u955C\u7F16\u8F91\u5668" },
      (0, import_react.createElement)("header", { className: "uwd-editor-bar" }, (0, import_react.createElement)("div", null, (0, import_react.createElement)("b", null, filename), (0, import_react.createElement)("small", null, snapshot ? "\u5DF2\u81EA\u52A8\u5339\u914D\u89C6\u9891\u3001\u955C\u5934\u3001\u65F6\u95F4\u4E0E\u63D0\u793A\u8BCD" : "\u5BFC\u5165\u6280\u80FD\u751F\u6210\u7684 Markdown / TXT \u5F00\u59CB\u5236\u4F5C")), (0, import_react.createElement)("div", { className: "uwd-tabs", role: "tablist" }, ["\u6587\u672C", "\u89C6\u9891\u5305"].map((name2) => (0, import_react.createElement)("button", { type: "button", role: "tab", key: name2, "aria-selected": view === name2, onClick: () => setView(name2) }, name2)))),
      error ? (0, import_react.createElement)("p", { className: "uwd-error", role: "alert" }, error) : null,
      view === "\u6587\u672C" ? (0, import_react.createElement)(DocumentView, { source, imported: !!snapshot }) : (0, import_react.createElement)(VideoPackageView, { snapshot, video, shots, shot, setActiveShot })
    )
  );
}
function ConversationDocumentTree({ documents, activeId, onOpen }) {
  let grouped = (0, import_react.useMemo)(() => groupConversationDocuments(documents), [documents]), groups = Object.entries(grouped);
  return documents.length === 0 ? (0, import_react.createElement)("section", { className: "uwd-conversation-files", "aria-label": "\u5BF9\u8BDD\u6587\u6863" }, (0, import_react.createElement)("div", { className: "uwd-tree-caption" }, "\u5BF9\u8BDD\u6587\u6863"), (0, import_react.createElement)("p", { className: "uwd-tree-hint" }, "\u751F\u6210 Markdown \u540E\u4F1A\u81EA\u52A8\u5F52\u6863\u5230\u8FD9\u91CC")) : (0, import_react.createElement)(
    "section",
    { className: "uwd-conversation-files", "aria-label": "\u5BF9\u8BDD\u6587\u6863" },
    (0, import_react.createElement)("div", { className: "uwd-tree-caption" }, "\u5BF9\u8BDD\u6587\u6863", (0, import_react.createElement)("small", null, String(documents.length))),
    groups.map(([group, folders]) => (0, import_react.createElement)(
      "details",
      { key: group, open: !0, className: "uwd-doc-group" },
      (0, import_react.createElement)("summary", null, group, (0, import_react.createElement)("small", null, String(Object.values(folders).flat().length))),
      Object.entries(folders).map(([folder, items]) => (0, import_react.createElement)(
        "details",
        { key: folder, open: !0, className: "uwd-doc-folder" },
        (0, import_react.createElement)("summary", null, folder, (0, import_react.createElement)("small", null, String(items.length))),
        items.map((item) => (0, import_react.createElement)("button", { type: "button", key: item.id, className: "uwd-doc-item" + (activeId === item.filename ? " selected" : ""), title: item.filename, onClick: () => onOpen(item) }, item.filename))
      ))
    ))
  );
}
var sessionDocuments = /* @__PURE__ */ new Map(), sessionDocumentSignatures = /* @__PURE__ */ new Map(), documentSubscribers = /* @__PURE__ */ new Set();
function useConversationDocuments(sessionId) {
  let [documents, setDocuments] = (0, import_react.useState)(() => sessionDocuments.get(sessionId) ?? []);
  return (0, import_react.useEffect)(() => {
    let refresh = () => setDocuments(sessionDocuments.get(sessionId) ?? []);
    return refresh(), documentSubscribers.add(refresh), () => documentSubscribers.delete(refresh);
  }, [sessionId]), documents;
}
function recordConversationDocuments(sessionId, documents) {
  let next = documents.map((item) => ({ ...item, sessionId })), signature = next.map((item) => `${item.id}:${item.filename}`).join("|");
  signature !== sessionDocumentSignatures.get(sessionId) && (sessionDocumentSignatures.set(sessionId, signature), sessionDocuments.set(sessionId, next), documentSubscribers.forEach((notify) => notify()));
}
function scanConversationDocuments(root) {
  let selectors = '[data-message-id], [data-message-role="assistant"], [data-author-role="assistant"], article', seen = /* @__PURE__ */ new Set(), documents = [];
  for (let node of root.querySelectorAll(selectors)) {
    let source = extractMarkdownSource(node.textContent ?? "");
    if (!source || seen.has(source)) continue;
    seen.add(source);
    let title = extractDocumentTitle(source, documents.length + 1), filename = title.toLowerCase().endsWith(".md") ? title : `${title}.md`;
    documents.push({ id: `${documents.length}-${hashText(source)}`, filename, title, source, group: classifyConversationDocument(title, source), folder: classifyConversationFolder(title, source) });
  }
  return documents;
}
function extractMarkdownSource(text) {
  let normalized = String(text).replace(/\r\n?/gu, `
`).trim();
  if (!normalized) return "";
  let fenced = normalized.match(/```(?:markdown|md)?\s*\n([\s\S]*?)```/iu);
  return fenced?.[1]?.trim() ? fenced[1].trim() : /【视频编号】|【镜头编号】|^#{1,3}\s+.+/mu.test(normalized) && normalized.length >= 40 || /\n\s*[-*+]\s+.+\n\s*[-*+]\s+/u.test(normalized) && normalized.length >= 160 ? normalized : "";
}
function extractDocumentTitle(source, index) {
  let heading = source.match(/^#{1,3}\s+(.+)$/mu)?.[1]?.trim(), label = source.match(/【(?:项目名称|文档名称|集数|视频编号)】\s*[:：]?\s*(.+)/u)?.[1]?.trim();
  return (heading || label || `\u5BF9\u8BDD\u6587\u6863 ${index}`).replace(/[\\/:*?"<>|]/gu, "-").slice(0, 72);
}
function classifyConversationDocument(title, source) {
  let text = `${title}
${source}`;
  return /创作者决策|决策记录|decision|approved|批准/iu.test(text) ? "\u521B\u4F5C\u8005\u51B3\u7B56" : /第\s*\d+\s*集|EP\s*\d+|episode|剧本|screenplay|script|分镜|storyboard|视频编号|镜头编号/iu.test(text) ? "\u5267\u96C6" : /资产|asset|角色|场景|道具|服装|look|set|prop/iu.test(text) ? "\u9879\u76EE\u5F00\u53D1" : /输入|input|原始|source|brief/iu.test(text) ? "\u8F93\u5165" : "\u9879\u76EE\u5F00\u53D1";
}
function classifyConversationFolder(title, source) {
  let text = `${title}
${source}`, episode = text.match(/(?:第\s*(\d+)\s*集|\bEP\s*[-_ ]?(\d+)\b|\bepisode\s*(\d+)\b)/iu);
  return episode ? `EP${String(Number(episode[1] ?? episode[2] ?? episode[3])).padStart(3, "0")}` : /创作者决策|决策记录|decision|approved|批准/iu.test(text) ? "\u51B3\u7B56\u8BB0\u5F55" : /资产|asset|角色|场景|道具|服装|look|set|prop/iu.test(text) ? "\u8D44\u4EA7\u4E0E\u8BBE\u5B9A" : /输入|input|原始|source|brief/iu.test(text) ? "\u539F\u59CB\u8F93\u5165" : "\u672A\u5F52\u6863";
}
function groupConversationDocuments(documents) {
  return documents.reduce((groups, item) => {
    let group = groups[item.group] ?? {}, folder = group[item.folder] ?? [];
    return folder.push(item), group[item.folder] = folder, groups[item.group] = group, groups;
  }, {});
}
function hashText(value) {
  let hash = 2166136261;
  for (let character of value) hash = Math.imul(hash ^ character.codePointAt(0), 16777619);
  return (hash >>> 0).toString(36);
}
function DocumentView({ source, imported }) {
  return imported ? (0, import_react.createElement)("article", { className: "uwd-document" }, (0, import_react.createElement)("pre", null, source)) : (0, import_react.createElement)("section", { className: "uwd-empty" }, (0, import_react.createElement)("h1", null, "\u4ECE\u5206\u955C\u6587\u6863\u5F00\u59CB"), (0, import_react.createElement)("p", null, "\u5DE6\u4FA7\u70B9\u51FB\u201C\u5BFC\u5165\u5206\u955C\u201D\uFF0C\u76F4\u63A5\u9009\u62E9\u5206\u955C\u5BFC\u6F14\u751F\u6210\u7684 Markdown\u3001TXT \u6216 production-workbench.json\u3002"), (0, import_react.createElement)("p", null, "\u5BFC\u5165\u540E\uFF1A\u5DE6\u4FA7\u81EA\u52A8\u751F\u6210\u89C6\u9891/\u955C\u5934\u6811\uFF1B\u4E2D\u95F4\u4FDD\u7559\u539F\u59CB\u6587\u6863\uFF1B\u53F3\u4FA7\u7EE7\u7EED\u4F7F\u7528 Harness \u539F\u751F\u5BF9\u8BDD\uFF0C\u8BA9\u6A21\u578B\u4FEE\u6539\u3001\u7EED\u5199\u6216\u5BA1\u6838\u3002"));
}
function VideoPackageView({ snapshot, video, shots, shot, setActiveShot }) {
  return !snapshot || !video ? (0, import_react.createElement)("section", { className: "uwd-empty" }, (0, import_react.createElement)("h1", null, "\u8FD8\u6CA1\u6709\u89C6\u9891\u5305"), (0, import_react.createElement)("p", null, "\u5148\u5BFC\u5165\u5206\u955C\u6587\u672C\uFF0C\u7CFB\u7EDF\u4F1A\u6309\u3010\u89C6\u9891\u7F16\u53F7\u3011\u4E0E\u3010\u955C\u5934\u7F16\u53F7\u3011\u81EA\u52A8\u5EFA\u7ACB\u5173\u7CFB\u3002")) : (0, import_react.createElement)(
    "section",
    { className: "uwd-production" },
    (0, import_react.createElement)("div", { className: "uwd-summary" }, metric("\u89C6\u9891\u5305", snapshot.summary.videos), metric("\u5FAE\u955C\u5934", snapshot.summary.micro_shots), metric("\u53EF\u751F\u6210", snapshot.summary.ready_to_generate), metric("\u963B\u585E", snapshot.summary.blocked)),
    (0, import_react.createElement)("article", { className: "uwd-video-card" }, (0, import_react.createElement)("small", null, "\u89C6\u9891\u7F16\u53F7\uFF1A" + video.video_id + " \xB7 " + seconds(video.duration_seconds) + " \xB7 " + status(video.status)), (0, import_react.createElement)("h1", null, video.display_name_zh ?? video.video_id), (0, import_react.createElement)("h2", null, "\u89C6\u9891\u603B\u63D0\u793A\u8BCD\uFF08\u76F4\u63A5\u63D0\u4EA4\u6A21\u578B\uFF09"), (0, import_react.createElement)("p", null, video.video_master_prompt), (0, import_react.createElement)("h2", null, "\u89C6\u9891\u7EA7\u8D1F\u9762\u7EA6\u675F"), (0, import_react.createElement)("p", null, video.video_negative_prompt)),
    (0, import_react.createElement)("h2", { className: "uwd-section-title" }, "\u955C\u5934\u65F6\u95F4\u7EBF"),
    (0, import_react.createElement)("div", { className: "uwd-timeline" }, shots.map((item) => (0, import_react.createElement)("button", { type: "button", key: item.shot_id, className: item.shot_id === shot?.shot_id ? "selected" : "", onClick: () => setActiveShot(item.shot_id) }, (0, import_react.createElement)("b", null, "\u955C\u5934\u7F16\u53F7\uFF1A" + item.shot_id), (0, import_react.createElement)("small", null, timerange(item) + " \xB7 " + seconds(item.duration_seconds) + " \xB7 " + status(item.status)), (0, import_react.createElement)("span", null, item.shot_delta_prompt)))),
    shot ? (0, import_react.createElement)("article", { className: "uwd-shot-card" }, (0, import_react.createElement)("small", null, "\u5F53\u524D\u9009\u62E9\uFF1A\u955C\u5934\u7F16\u53F7 " + shot.shot_id), (0, import_react.createElement)("h2", null, shot.display_name_zh ?? "\u5FAE\u955C\u5934"), (0, import_react.createElement)("p", null, shot.shot_delta_prompt), (0, import_react.createElement)("h3", null, "\u9501\u5B9A\u8D44\u4EA7\u4E0E\u8D1F\u9762\u7EA6\u675F"), (0, import_react.createElement)("p", null, shot.asset_lock_prompt + `
` + shot.negative_prompt)) : null
  );
}
function metric(label, value) {
  return (0, import_react.createElement)("div", { key: label }, (0, import_react.createElement)("b", null, String(value ?? 0)), (0, import_react.createElement)("small", null, label));
}
function status(value) {
  return statuses[value] ?? value ?? "\u672A\u6807\u6CE8";
}
function seconds(value) {
  let n = Number(value ?? 0);
  return String(Number.isInteger(n) ? n : Number(n.toFixed(1))) + " \u79D2";
}
function timerange(shot) {
  return shot.timeline_in_seconds === void 0 ? "\u672A\u6807\u6CE8" : seconds(shot.timeline_in_seconds) + "\u2013" + seconds(shot.timeline_out_seconds);
}
var nativeViewStyles = '.uwd-native-view{height:100%;min-height:0;font-family:var(--dsw-font-family,system-ui)}.uwd-workspace-panel{display:grid;grid-template-columns:minmax(190px,260px) minmax(0,1fr);height:100%;min-height:0;color:var(--dsw-alias-label-primary,#172033)}.uwd-tree,.uwd-editor{box-sizing:border-box;min-width:0;overflow:auto;background:var(--dsw-alias-bg-base,#fff)}.uwd-tree{border-right:1px solid var(--dsw-alias-border-l2,#e5e7eb);padding:13px 10px}.uwd-tree header{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:10px;font-size:13px}.uwd-import{display:inline-block;margin-bottom:8px;border:1px solid var(--dsw-alias-border-l2,#d1d5db);border-radius:6px;background:transparent;padding:4px 6px;color:var(--dsw-alias-label-secondary,#596579);cursor:pointer;font:11px inherit}.uwd-import input{display:none}.uwd-project{overflow:hidden;margin:0 0 6px;color:var(--dsw-alias-label-secondary,#596579);text-overflow:ellipsis;white-space:nowrap;font-size:11px}.uwd-tree button{display:block;width:100%;border:0;border-radius:5px;color:inherit;background:transparent;padding:7px 8px;text-align:left;cursor:pointer;font:12px/1.4 inherit}.uwd-tree button:hover,.uwd-tree button.selected{background:var(--dsw-alias-interactive-bg-hover,#edf4ff)}.uwd-tree-videos{margin:5px 0 0 8px;border-left:1px solid var(--dsw-alias-border-l2,#e5e7eb);padding-left:4px}.uwd-tree .uwd-tree-shot{margin-left:5px;width:calc(100% - 5px);color:var(--dsw-alias-label-secondary,#596579);font-size:11px}.uwd-editor-bar{position:sticky;top:0;z-index:2;display:flex;min-height:47px;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid var(--dsw-alias-border-l2,#e5e7eb);background:var(--dsw-alias-bg-base,#fff);padding:7px 15px}.uwd-editor-bar b,.uwd-editor-bar small{display:block}.uwd-editor-bar small,.uwd-tree-caption small,.uwd-doc-group summary small,.uwd-doc-folder summary small{color:var(--dsw-alias-label-secondary,#64748b);font-size:10px}.uwd-tabs{display:flex;gap:2px}.uwd-tabs button{border:0;border-radius:5px;color:var(--dsw-alias-label-secondary,#596579);background:transparent;padding:6px 9px;cursor:pointer;font:12px inherit}.uwd-tabs button[aria-selected="true"]{color:var(--dsw-alias-label-primary,#172033);background:var(--dsw-alias-interactive-bg-hover,#edf4ff)}.uwd-error{margin:12px 16px;color:#c24152}.uwd-empty{max-width:580px;margin:100px auto;padding:30px;color:#374151}.uwd-empty h1{margin:0 0 12px;font-size:25px}.uwd-empty p{color:#64748b;line-height:1.8}.uwd-document{box-sizing:border-box;min-height:100%;padding:34px clamp(20px,6%,72px);color:#1f2937}.uwd-document pre{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.9 ui-monospace,SFMono-Regular,Menlo,monospace}.uwd-production{padding:18px clamp(16px,4%,44px) 80px;color:#1f2937}.uwd-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:16px}.uwd-summary div{border:1px solid #e5e7eb;border-radius:8px;padding:9px;background:#f8fafc}.uwd-summary b,.uwd-summary small{display:block}.uwd-summary b{font-size:18px}.uwd-video-card,.uwd-shot-card{border:1px solid #e5e7eb;border-radius:10px;background:#fff;padding:18px;box-shadow:0 1px 3px rgb(15 23 42 / 5%)}.uwd-video-card small,.uwd-shot-card small{color:#64748b}.uwd-video-card h1{margin:7px 0 18px;font-size:20px}.uwd-video-card h2,.uwd-shot-card h2,.uwd-shot-card h3{margin:16px 0 6px;font-size:13px}.uwd-video-card p,.uwd-shot-card p{margin:0;white-space:pre-wrap;color:#374151;line-height:1.7}.uwd-section-title{margin:22px 0 10px;font-size:15px}.uwd-timeline{display:grid;gap:8px}.uwd-timeline button{border:1px solid #e5e7eb;border-radius:8px;background:#fff;padding:10px;text-align:left;cursor:pointer;color:#1f2937}.uwd-timeline button:hover,.uwd-timeline button.selected{border-color:#60a5fa;background:#eff6ff}.uwd-timeline b,.uwd-timeline small,.uwd-timeline span{display:block}.uwd-timeline small{color:#64748b;margin:2px 0 5px}.uwd-timeline span{overflow:hidden;color:#475569;text-overflow:ellipsis;white-space:nowrap;font-size:12px}.uwd-shot-card{margin-top:15px}.uwd-conversation-files{margin:12px 0 14px;border-top:1px solid var(--dsw-alias-border-l2,#e5e7eb);border-bottom:1px solid var(--dsw-alias-border-l2,#e5e7eb);padding:9px 0}.uwd-tree-caption{display:flex;align-items:center;justify-content:space-between;padding:0 8px 6px;color:var(--dsw-alias-label-primary,#172033);font-size:12px;font-weight:600}.uwd-tree-hint{margin:0;padding:0 8px;color:var(--dsw-alias-label-secondary,#64748b);font-size:11px;line-height:1.5}.uwd-doc-group,.uwd-doc-folder{margin:2px 0}.uwd-doc-group summary,.uwd-doc-folder summary{display:flex;justify-content:space-between;cursor:pointer;padding:5px 8px;color:var(--dsw-alias-label-secondary,#596579);font-size:11px}.uwd-doc-folder{margin-left:7px;border-left:1px solid var(--dsw-alias-border-l2,#e5e7eb)}.uwd-doc-item{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:5px 8px!important;margin-left:6px;width:calc(100% - 6px)!important;color:var(--dsw-alias-label-primary,#172033)!important;font-size:11px!important}@media(max-width:900px){.uwd-workspace-panel{grid-template-columns:1fr;grid-template-rows:minmax(210px,38%) minmax(0,1fr)}.uwd-tree{border-right:0;border-bottom:1px solid var(--dsw-alias-border-l2,#e5e7eb)}}';
function apply(context) {
  assertP1Compatibility(context), context.slots.inject("conversation.session.header.utilities", () => context.slots.register(
    { name: "conversation.session.header.utilities", id: "us-vertical-drama-artifact-indexer", order: 100 },
    SessionArtifactIndexer
  )), context.slots.inject("conversation.view", () => context.slots.register(
    { name: "conversation.view", id: "dramago", order: 100, label: "DramaGo" },
    DramaGoView
  ));
}
var client_default = { name, inject, apply };
;return module.exports;}});
