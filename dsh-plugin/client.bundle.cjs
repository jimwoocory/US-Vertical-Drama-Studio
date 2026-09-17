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
      let detail2 = [section(shotBlock, "\u753B\u9762/\u6784\u56FE"), section(shotBlock, "\u753B\u9762"), section(shotBlock, "\u52A8\u4F5C\u4E0E\u60C5\u7EEA"), section(shotBlock, "\u955C\u5934\u8FD0\u52A8")].filter(Boolean).join("\uFF1B");
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
        shot_delta_prompt: section(shotBlock, "\u89C6\u9891\u751F\u6210\u63D0\u793A\u8BCD") || section(shotBlock, "\u955C\u5934\u63D0\u793A\u8BCD") || detail2 || "\u6309\u8BE5\u955C\u5934\u539F\u59CB\u5206\u955C\u751F\u6210\uFF0C\u4E0D\u6539\u53D8\u5DF2\u9501\u5B9A\u8D44\u4EA7\u3002",
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
var name = "us-vertical-drama-studio", inject = ["slots"], p1Compatibility = { dsh: P1_DSH_VERSION, mode: "exact" }, tabs = ["\u5236\u4F5C\u53F0", "\u8D44\u4EA7", "\u4EFB\u52A1\u4E0E\u95EE\u9898"], statuses = { draft: "\u8349\u7A3F", blocked: "\u5DF2\u963B\u585E", ready_to_generate: "\u53EF\u751F\u6210", generating: "\u751F\u6210\u4E2D", review_required: "\u5F85\u5BA1\u6838", approved: "\u5DF2\u901A\u8FC7", pending_approval: "\u5F85\u5BA1\u6838", todo: "\u5F85\u5904\u7406", in_progress: "\u8FDB\u884C\u4E2D", review: "\u5F85\u590D\u6838", done: "\u5DF2\u5B8C\u6210" }, kinds = { character: "\u89D2\u8272", look: "\u670D\u88C5\u9020\u578B", set: "\u573A\u666F", prop: "\u9053\u5177" };
function WorkbenchPanel() {
  let [tab, setTab] = (0, import_react.useState)("\u5236\u4F5C\u53F0"), [snapshot, setSnapshot] = (0, import_react.useState)(), [filename, setFilename] = (0, import_react.useState)(), [importKind, setImportKind] = (0, import_react.useState)(), [activeVideo, setActiveVideo] = (0, import_react.useState)(), [activeShot, setActiveShot] = (0, import_react.useState)(), [error, setError] = (0, import_react.useState)(), importManifest = (event) => {
    let file = event.target.files?.[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = () => {
      try {
        let text = String(reader.result), isJson = /\.json$/i.test(file.name), manifest = isJson ? JSON.parse(text) : parseStoryboardText(text, file.name), next = buildProductionSnapshot(manifest);
        setSnapshot(next), setFilename(file.name), setImportKind(isJson ? "JSON \u751F\u4EA7\u6E05\u5355" : "\u5206\u955C\u6587\u672C\u81EA\u52A8\u5339\u914D"), setActiveVideo(next.videos[0]?.video_id), setActiveShot(next.shots[0]?.shot_id), setError(void 0), setTab("\u5236\u4F5C\u53F0");
      } catch (reason) {
        setSnapshot(void 0), setError(reason instanceof Error ? reason.message : "\u65E0\u6CD5\u8BFB\u53D6\u751F\u4EA7\u6E05\u5355");
      }
    }, reader.readAsText(file, "utf-8");
  }, content = snapshot === void 0 ? (0, import_react.createElement)(Welcome, null) : tab === "\u5236\u4F5C\u53F0" ? (0, import_react.createElement)(Desk, { snapshot, activeVideo, activeShot, setActiveVideo, setActiveShot }) : tab === "\u8D44\u4EA7" ? (0, import_react.createElement)(Assets, { snapshot }) : (0, import_react.createElement)(Tasks, { snapshot, openTarget: (target) => {
    let shot = snapshot.shots.find((item) => item.shot_id === target);
    shot && (setActiveVideo(shot.video_id), setActiveShot(shot.shot_id), setTab("\u5236\u4F5C\u53F0"));
  } });
  return (0, import_react.createElement)(
    "section",
    { className: "uwd-workspace", "aria-label": "\u77ED\u5267\u5236\u4F5C\u5DE5\u4F5C\u53F0" },
    (0, import_react.createElement)(
      "header",
      { className: "uwd-topbar" },
      (0, import_react.createElement)("div", null, (0, import_react.createElement)("strong", null, "US Vertical Drama \xB7 \u77ED\u5267\u5236\u4F5C\u53F0"), (0, import_react.createElement)("small", null, snapshot?.episode_display_name_zh ?? filename ?? "\u751F\u6210\u3001\u5BA1\u6838\u548C\u5FAE\u8C03\u90FD\u5728\u540C\u4E00\u5DE5\u4F5C\u533A\u5B8C\u6210")),
      (0, import_react.createElement)("div", { className: "uwd-top-actions" }, importKind ? (0, import_react.createElement)("span", { className: "uwd-import-state" }, importKind) : null, (0, import_react.createElement)("label", { className: "uwd-import" }, "\u5BFC\u5165\u5206\u955C\u6587\u4EF6", (0, import_react.createElement)("input", { type: "file", accept: "application/json,.json,text/plain,.txt,text/markdown,.md", onChange: importManifest })))
    ),
    error === void 0 ? null : (0, import_react.createElement)("p", { className: "uwd-error", role: "alert" }, error),
    (0, import_react.createElement)("nav", { className: "uwd-tabs", role: "tablist", "aria-label": "\u5DE5\u4F5C\u533A\u9875\u7B7E" }, tabs.map((item) => (0, import_react.createElement)("button", { key: item, type: "button", role: "tab", "aria-selected": tab === item, onClick: () => setTab(item) }, item))),
    content
  );
}
function Welcome() {
  return (0, import_react.createElement)(
    "main",
    { className: "uwd-welcome" },
    (0, import_react.createElement)("h1", null, "\u89C6\u9891\u5206\u955C\u5236\u4F5C\u5DE5\u4F5C\u533A"),
    (0, import_react.createElement)("p", null, "\u76F4\u63A5\u5BFC\u5165\u5206\u955C\u5BFC\u6F14\u751F\u6210\u7684 Markdown / TXT\uFF0C\u7CFB\u7EDF\u4F1A\u81EA\u52A8\u5339\u914D\u3010\u89C6\u9891\u7F16\u53F7\u3011\u3001\u3010\u955C\u5934\u7F16\u53F7\u3011\u3001\u65F6\u957F\u53CA\u4E24\u5C42\u89C6\u9891\u63D0\u793A\u8BCD\uFF1B\u4E5F\u652F\u6301 production-workbench.json \u9AD8\u7EA7\u6E05\u5355\u3002"),
    (0, import_react.createElement)("p", { className: "uwd-welcome-note" }, "\u5DE5\u4F5C\u53F0\u548C\u5236\u4F5C\u8BF4\u660E\u4F7F\u7528\u4E2D\u6587\uFF1B\u82F1\u6587\u53EA\u4FDD\u7559\u89D2\u8272\u540D\u4E0E\u5B9E\u9645\u53F0\u8BCD\u3002")
  );
}
function Desk({ snapshot, activeVideo, activeShot, setActiveVideo, setActiveShot }) {
  let video = snapshot.videos.find((item) => item.video_id === activeVideo) ?? snapshot.videos[0], shots = (0, import_react.useMemo)(() => snapshot.shots.filter((item) => item.video_id === video?.video_id).sort((a, b) => (a.timeline_in_seconds ?? 0) - (b.timeline_in_seconds ?? 0)), [snapshot, video]), shot = shots.find((item) => item.shot_id === activeShot) ?? shots[0];
  return (0, import_react.createElement)(
    "main",
    { className: "uwd-desk" },
    (0, import_react.createElement)(
      "aside",
      { className: "uwd-sidebar" },
      (0, import_react.createElement)("div", { className: "uwd-sidebar-title" }, "\u5267\u96C6 / \u89C6\u9891 / \u955C\u5934", (0, import_react.createElement)("span", null, String(snapshot.summary.shots))),
      (0, import_react.createElement)("p", { className: "uwd-episode-tree" }, snapshot.episode_display_name_zh ?? snapshot.episode_id ?? "\u672A\u547D\u540D\u5267\u96C6"),
      snapshot.videos.map((item) => (0, import_react.createElement)(
        "div",
        { className: "uwd-video-tree", key: item.video_id },
        (0, import_react.createElement)(
          "button",
          { type: "button", className: item.video_id === video?.video_id ? "selected" : "", onClick: () => {
            setActiveVideo(item.video_id), setActiveShot(snapshot.shots.find((next) => next.video_id === item.video_id)?.shot_id);
          } },
          (0, import_react.createElement)("b", null, item.display_name_zh ?? item.video_id),
          (0, import_react.createElement)("small", null, "\u89C6\u9891\u7F16\u53F7\uFF1A" + item.video_id + " \xB7 " + seconds(item.duration_seconds) + " \xB7 " + status(item.status))
        ),
        item.video_id !== video?.video_id ? null : snapshot.shots.filter((next) => next.video_id === item.video_id).sort((a, b) => (a.timeline_in_seconds ?? 0) - (b.timeline_in_seconds ?? 0)).map((next) => (0, import_react.createElement)("button", { type: "button", key: next.shot_id, className: "uwd-tree-shot" + (next.shot_id === activeShot ? " selected" : ""), onClick: () => setActiveShot(next.shot_id) }, (0, import_react.createElement)("b", null, next.display_name_zh ?? next.shot_id), (0, import_react.createElement)("small", null, "\u955C\u5934\u7F16\u53F7\uFF1A" + next.shot_id + " \xB7 " + timerange(next))))
      ))
    ),
    (0, import_react.createElement)(
      "section",
      { className: "uwd-stage" },
      (0, import_react.createElement)("div", { className: "uwd-metrics" }, metric("\u89C6\u9891\u5305", snapshot.summary.videos), metric("\u5FAE\u955C\u5934", snapshot.summary.micro_shots || snapshot.summary.shots), metric("\u53EF\u751F\u6210", snapshot.summary.ready_to_generate), metric("\u963B\u585E", snapshot.summary.blocked)),
      video === void 0 ? (0, import_react.createElement)("p", null, "\u6CA1\u6709\u53EF\u663E\u793A\u7684\u89C6\u9891\u5305\u3002") : (0, import_react.createElement)(Timeline, { video, shots, activeShot, setActiveShot }),
      video === void 0 ? null : (0, import_react.createElement)(VideoPrompt, { video }),
      (0, import_react.createElement)("p", { className: "uwd-help" }, "\u6BCF\u4E00\u5757\u4EE3\u8868\u4E00\u4E2A\u53EF\u72EC\u7ACB\u751F\u6210\u3001\u66FF\u6362\u6216\u5FAE\u8C03\u7684\u5FAE\u955C\u5934\u3002\u5B83\u4EEC\u6309\u65F6\u95F4\u6392\u5217\uFF0C\u4FDD\u8BC1\u8D44\u4EA7\u548C\u52A8\u4F5C\u8FDE\u7EED\u3002")
    ),
    (0, import_react.createElement)(Inspector, { shot, assets: snapshot.assets })
  );
}
function Timeline({ video, shots, activeShot, setActiveShot }) {
  let duration = video.duration_seconds || Math.max(...shots.map((item) => item.timeline_out_seconds ?? item.duration_seconds), 1);
  return (0, import_react.createElement)(
    "section",
    { className: "uwd-timeline-card" },
    (0, import_react.createElement)("div", { className: "uwd-timeline-title" }, (0, import_react.createElement)("div", null, (0, import_react.createElement)("h1", null, video.display_name_zh ?? video.video_id), (0, import_react.createElement)("small", null, "\u89C6\u9891\u7F16\u53F7\uFF1A" + video.video_id + " \xB7 " + seconds(duration) + " \xB7 " + status(video.status))), (0, import_react.createElement)("span", null, String(shots.length) + " \u4E2A\u5FAE\u955C\u5934")),
    (0, import_react.createElement)("div", { className: "uwd-ruler" }, [0, 0.25, 0.5, 0.75, 1].map((point) => (0, import_react.createElement)("i", { key: point, style: { left: String(point * 100) + "%" } }, seconds(duration * point)))),
    (0, import_react.createElement)("div", { className: "uwd-track", role: "list", "aria-label": "\u5FAE\u955C\u5934\u65F6\u95F4\u7EBF" }, shots.map((item) => {
      let width = Math.max(4, (item.duration_seconds || 0) / duration * 100), left = (item.timeline_in_seconds || 0) / duration * 100;
      return (0, import_react.createElement)(
        "button",
        { type: "button", role: "listitem", key: item.shot_id, className: "uwd-segment " + item.status + (item.shot_id === activeShot ? " selected" : ""), style: { left: String(left) + "%", width: String(width) + "%" }, onClick: () => setActiveShot(item.shot_id) },
        (0, import_react.createElement)("b", null, item.display_name_zh ?? item.shot_id),
        (0, import_react.createElement)("small", null, timerange(item) + " \xB7 " + seconds(item.duration_seconds))
      );
    }))
  );
}
function Inspector({ shot, assets }) {
  if (shot === void 0) return (0, import_react.createElement)("aside", { className: "uwd-inspector" }, "\u9009\u62E9\u4E00\u4E2A\u5FAE\u955C\u5934\u67E5\u770B\u8BE6\u7EC6\u5236\u4F5C\u4FE1\u606F\u3002");
  let bound = (shot.asset_ids ?? []).map((id) => assets.find((asset) => asset.id === id)).filter(Boolean);
  return (0, import_react.createElement)(
    "aside",
    { className: "uwd-inspector" },
    (0, import_react.createElement)("small", { className: "uwd-id" }, "\u955C\u5934\u7F16\u53F7\uFF1A" + shot.shot_id),
    (0, import_react.createElement)("h1", null, shot.display_name_zh ?? "\u672A\u547D\u540D\u5FAE\u955C\u5934"),
    (0, import_react.createElement)("span", { className: "uwd-state " + shot.status }, status(shot.status)),
    (0, import_react.createElement)("dl", { className: "uwd-details" }, detail("\u5305\u5185\u65F6\u95F4", timerange(shot)), detail("\u65F6\u957F", seconds(shot.duration_seconds)), detail("\u955C\u5934\u7C7B\u578B", shot.shot_type ?? "\u672A\u6807\u6CE8"), detail("\u751F\u6210\u65B9\u5F0F", generation(shot.generation_mode))),
    (0, import_react.createElement)("h2", null, "\u753B\u9762\u4E0E\u52A8\u4F5C"),
    (0, import_react.createElement)("p", null, shot.shot_delta_prompt),
    (0, import_react.createElement)("h2", null, "\u9501\u5B9A\u8D44\u4EA7"),
    (0, import_react.createElement)("div", { className: "uwd-chips" }, bound.length === 0 ? "\u672A\u7ED1\u5B9A\u8D44\u4EA7" : bound.map((asset) => (0, import_react.createElement)("span", { key: asset.id }, asset.display_name_zh ?? asset.id))),
    (0, import_react.createElement)(Prompt, { title: "\u8D44\u4EA7\u9501\u5B9A\u63D0\u793A\u8BCD", text: shot.asset_lock_prompt }),
    (0, import_react.createElement)(Prompt, { title: "\u8D1F\u9762\u7EA6\u675F", text: shot.negative_prompt }),
    shot.duration_exception_reason_zh ? (0, import_react.createElement)("p", { className: "uwd-exception" }, "\u957F\u955C\u5934\u4F8B\u5916\uFF1A" + shot.duration_exception_reason_zh) : null,
    shot.short_duration_reason_zh ? (0, import_react.createElement)("p", { className: "uwd-exception" }, "\u77ED\u955C\u5934\u4F8B\u5916\uFF1A" + shot.short_duration_reason_zh) : null
  );
}
function VideoPrompt({ video }) {
  return (0, import_react.createElement)(
    "section",
    { className: "uwd-video-prompt" },
    (0, import_react.createElement)("div", null, (0, import_react.createElement)("small", null, "\u89C6\u9891\u63D0\u793A\u8BCD\u7F16\u53F7\uFF1A" + (video.video_prompt_id ?? "\u672A\u63D0\u4F9B")), (0, import_react.createElement)("h2", null, "\u89C6\u9891\u603B\u63D0\u793A\u8BCD\uFF08\u76F4\u63A5\u63D0\u4EA4\u6A21\u578B\uFF09")),
    (0, import_react.createElement)(Prompt, { title: "\u5B8C\u6574\u65F6\u5E8F\u4E0E\u955C\u5934\u53D8\u5316", text: video.video_master_prompt }),
    (0, import_react.createElement)(Prompt, { title: "\u89C6\u9891\u7EA7\u8D1F\u9762\u7EA6\u675F", text: video.video_negative_prompt })
  );
}
function Prompt({ title, text }) {
  let copy = () => {
    text && navigator.clipboard?.writeText && navigator.clipboard.writeText(text).catch(() => {
    });
  };
  return (0, import_react.createElement)("section", { className: "uwd-prompt" }, (0, import_react.createElement)("div", null, (0, import_react.createElement)("h2", null, title), (0, import_react.createElement)("button", { type: "button", onClick: copy }, "\u590D\u5236")), (0, import_react.createElement)("p", null, text ?? "\u672A\u63D0\u4F9B"));
}
function Assets({ snapshot }) {
  return (0, import_react.createElement)(
    "main",
    { className: "uwd-table-page" },
    (0, import_react.createElement)("h1", null, "\u8D44\u4EA7\u9501\u5B9A\u72B6\u6001"),
    (0, import_react.createElement)("p", null, "\u8D44\u4EA7\u5BA1\u6838\u901A\u8FC7\u540E\uFF0C\u5173\u8054\u955C\u5934\u624D\u4F1A\u663E\u793A\u4E3A\u53EF\u751F\u6210\u3002"),
    (0, import_react.createElement)(
      "table",
      null,
      (0, import_react.createElement)("thead", null, (0, import_react.createElement)("tr", null, ["\u8D44\u4EA7", "\u7C7B\u578B", "\u72B6\u6001", "\u673A\u5668 ID"].map((name2) => (0, import_react.createElement)("th", { key: name2 }, name2)))),
      (0, import_react.createElement)("tbody", null, snapshot.assets.map((asset) => (0, import_react.createElement)("tr", { key: asset.id }, (0, import_react.createElement)("td", null, asset.display_name_zh ?? "\u672A\u547D\u540D\u8D44\u4EA7"), (0, import_react.createElement)("td", null, kinds[asset.kind] ?? asset.kind), (0, import_react.createElement)("td", null, status(asset.status)), (0, import_react.createElement)("td", null, asset.id))))
    )
  );
}
function Tasks({ snapshot, openTarget }) {
  return (0, import_react.createElement)(
    "main",
    { className: "uwd-problem-page" },
    (0, import_react.createElement)("section", null, (0, import_react.createElement)("h1", null, "\u4EFB\u52A1\u961F\u5217"), snapshot.tasks.length === 0 ? (0, import_react.createElement)("p", null, "\u6682\u65E0\u4EFB\u52A1\u3002") : (0, import_react.createElement)("ul", null, snapshot.tasks.map((task) => (0, import_react.createElement)("li", { key: task.id }, (0, import_react.createElement)("b", null, task.display_name_zh ?? task.id), (0, import_react.createElement)("span", null, status(task.status)), (0, import_react.createElement)("small", null, (task.targets ?? []).join("\u3001") || "\u672A\u5173\u8054\u5BF9\u8C61"))))),
    (0, import_react.createElement)("section", null, (0, import_react.createElement)("h1", null, "\u9700\u8981\u5904\u7406"), snapshot.diagnostics.length === 0 ? (0, import_react.createElement)("p", { className: "uwd-ok" }, "\u5F53\u524D\u6CA1\u6709\u963B\u585E\u9879\u3002") : (0, import_react.createElement)("ul", null, snapshot.diagnostics.map((item, index) => (0, import_react.createElement)("li", { className: item.severity, key: item.code + index, onClick: () => item.target_id && openTarget(item.target_id) }, (item.target_id ? item.target_id + " \xB7 " : "") + item.message))))
  );
}
function metric(label, value) {
  return (0, import_react.createElement)("div", { className: "uwd-metric", key: label }, (0, import_react.createElement)("b", null, String(value)), (0, import_react.createElement)("small", null, label));
}
function detail(label, value) {
  return (0, import_react.createElement)("div", { key: label }, (0, import_react.createElement)("dt", null, label), (0, import_react.createElement)("dd", null, value));
}
function status(value) {
  return statuses[value] ?? value ?? "\u672A\u6807\u6CE8";
}
function generation(value) {
  return { independent: "\u72EC\u7ACB\u751F\u6210", extend: "\u5EF6\u5C55\u751F\u6210", image_to_video: "\u56FE\u751F\u89C6\u9891" }[value] ?? value ?? "\u672A\u6807\u6CE8";
}
function seconds(value) {
  let number2 = Number(value ?? 0);
  return String(Number.isInteger(number2) ? number2 : Number(number2.toFixed(1))) + " \u79D2";
}
function timerange(shot) {
  return shot.timeline_in_seconds === void 0 ? "\u672A\u6807\u6CE8" : seconds(shot.timeline_in_seconds) + "\u2013" + seconds(shot.timeline_out_seconds);
}
var styles = ".uwd-workspace{position:fixed;inset:0;z-index:31;background:#0d1118;color:#edf0f6;font:13px/1.45 system-ui;display:flex;flex-direction:column}.uwd-topbar{height:64px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 22px;border-bottom:1px solid #273246;background:#121925}.uwd-topbar strong,.uwd-topbar small{display:block}.uwd-topbar strong{font-size:15px}.uwd-topbar small{color:#9aa8bc;margin-top:2px}.uwd-import{border:1px solid #41516d;border-radius:7px;background:#182235;color:#e8eef9;padding:7px 10px;cursor:pointer}.uwd-import input{display:none}.uwd-error{margin:8px 18px;color:#fda4af}.uwd-tabs{height:42px;flex:none;display:flex;gap:4px;padding:0 18px;border-bottom:1px solid #273246;background:#101722}.uwd-tabs button{border:0;background:transparent;color:#9aa8bc;padding:11px 10px;cursor:pointer}.uwd-tabs button[aria-selected=true]{color:#fff;border-bottom:2px solid #fb7185}.uwd-welcome{display:grid;place-content:center;flex:1;text-align:center;padding:30px}.uwd-welcome h1{font-size:24px;margin:0 0 12px}.uwd-welcome p{max-width:610px;color:#b5c0d2;margin:6px auto}.uwd-welcome-note{color:#86efac!important}.uwd-desk{display:grid;grid-template-columns:210px minmax(390px,1fr) 340px;min-height:0;flex:1}.uwd-sidebar{overflow:auto;border-right:1px solid #273246;background:#101722;padding:12px}.uwd-sidebar-title{display:flex;justify-content:space-between;color:#c8d3e6;font-weight:700;padding:4px 5px 9px}.uwd-sidebar-title span{color:#8291a8}.uwd-sidebar button{display:block;width:100%;text-align:left;border:1px solid transparent;background:transparent;color:#dce4f1;border-radius:8px;padding:10px 8px;margin:4px 0;cursor:pointer}.uwd-sidebar button:hover,.uwd-sidebar button.selected{background:#1b2940;border-color:#40557a}.uwd-sidebar b,.uwd-sidebar small{display:block}.uwd-sidebar small{color:#9aa8bc;margin-top:3px}.uwd-stage{overflow:auto;padding:18px;background:#0d1118}.uwd-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:14px}.uwd-metric{border:1px solid #273246;background:#131c2b;padding:10px;border-radius:9px}.uwd-metric b{font-size:19px;display:block}.uwd-metric small{color:#9aa8bc}.uwd-timeline-card{border:1px solid #273246;border-radius:12px;background:#121925;padding:17px}.uwd-timeline-title{display:flex;justify-content:space-between;gap:12px}.uwd-timeline-title h1{font-size:16px;margin:0}.uwd-timeline-title small{color:#9aa8bc}.uwd-timeline-title>span{border-radius:999px;background:#273b5c;padding:4px 8px;height:min-content;color:#cfe0ff;white-space:nowrap}.uwd-ruler{position:relative;height:25px;margin:15px 4px 0;border-top:1px solid #45516a}.uwd-ruler i{position:absolute;top:5px;transform:translateX(-50%);font-style:normal;font-size:11px;color:#8e9ab0}.uwd-track{position:relative;height:94px;border-radius:8px;background:linear-gradient(90deg,#182031 1px,transparent 1px);background-size:10% 100%;overflow:hidden}.uwd-segment{position:absolute;top:13px;bottom:13px;min-width:20px;border:1px solid #536a98;border-radius:6px;background:#274b75;color:#eef5ff;padding:7px;text-align:left;overflow:hidden;cursor:pointer}.uwd-segment b,.uwd-segment small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.uwd-segment small{color:#d0e0fa;font-size:10px;margin-top:4px}.uwd-segment.selected{outline:2px solid #fbbf24;z-index:2}.uwd-segment.ready_to_generate{background:#176b52;border-color:#39a980}.uwd-segment.blocked{background:#7b2637;border-color:#e06980}.uwd-segment.generating{background:#55418a;border-color:#9179d5}.uwd-segment.review_required{background:#70551a;border-color:#cba345}.uwd-help{color:#9aa8bc;margin:11px 2px}.uwd-inspector{overflow:auto;border-left:1px solid #273246;background:#101722;padding:17px}.uwd-inspector h1{font-size:17px;margin:2px 0 8px}.uwd-id{color:#8493ab}.uwd-state{display:inline-block;border-radius:999px;padding:3px 7px;font-size:11px;background:#273246}.uwd-details{display:grid;grid-template-columns:1fr 1fr;gap:10px;border-top:1px solid #273246;border-bottom:1px solid #273246;padding:11px 0;margin:13px 0}.uwd-details dt{font-size:11px;color:#91a0b7}.uwd-details dd{margin:2px 0 0}.uwd-inspector h2{font-size:12px;color:#c9d5e8;margin:15px 0 6px}.uwd-inspector p,.uwd-prompt p{color:#d4deec;margin:0;white-space:pre-wrap}.uwd-chips{display:flex;gap:5px;flex-wrap:wrap}.uwd-chips span{background:#223149;color:#cfe0ff;border-radius:999px;padding:3px 7px;font-size:11px}.uwd-prompt{border:1px solid #2a374c;background:#121b2a;border-radius:8px;padding:9px;margin-top:10px}.uwd-prompt div{display:flex;justify-content:space-between;align-items:center}.uwd-prompt h2{margin:0 0 7px}.uwd-prompt button{border:1px solid #41516d;background:#1c2a40;color:#dce8f9;border-radius:5px;padding:3px 6px;cursor:pointer}.uwd-exception{border-left:3px solid #fbbf24;padding-left:8px;color:#fde68a!important}.uwd-table-page,.uwd-problem-page{overflow:auto;flex:1;padding:22px}.uwd-table-page h1,.uwd-problem-page h1{font-size:18px;margin:0 0 7px}.uwd-table-page>p{color:#9aa8bc}.uwd-table-page table{width:100%;border-collapse:collapse;text-align:left}.uwd-table-page th,.uwd-table-page td{padding:10px 8px;border-bottom:1px solid #273246}.uwd-table-page th{color:#9aa8bc;font-weight:600}.uwd-problem-page{display:grid;grid-template-columns:1fr 1fr;gap:30px}.uwd-problem-page ul{list-style:none;padding:0;margin:0}.uwd-problem-page li{border-bottom:1px solid #273246;padding:9px 3px}.uwd-problem-page b,.uwd-problem-page span,.uwd-problem-page small{display:block}.uwd-problem-page span{color:#a8c9ff;margin:2px 0}.uwd-problem-page small{color:#8f9eb4}.uwd-problem-page li.error{color:#fda4af;cursor:pointer}.uwd-problem-page li.warning{color:#fde68a;cursor:pointer}.uwd-ok{color:#86efac}@media(max-width:980px){.uwd-desk{grid-template-columns:170px minmax(310px,1fr)}.uwd-inspector{grid-column:1/-1;border-left:0;border-top:1px solid #273246;max-height:340px}.uwd-stage{min-height:360px}}@media(max-width:650px){.uwd-topbar{padding:0 12px}.uwd-topbar strong{font-size:13px}.uwd-desk{grid-template-columns:1fr}.uwd-sidebar{display:flex;gap:5px;overflow:auto;border-right:0;border-bottom:1px solid #273246}.uwd-sidebar-title{display:none}.uwd-sidebar button{min-width:150px}.uwd-metrics{grid-template-columns:repeat(2,1fr)}.uwd-problem-page{grid-template-columns:1fr}.uwd-timeline-card{padding:12px}.uwd-segment{font-size:10px;padding:5px}}", treeStyles = ".uwd-top-actions{display:flex;gap:10px;align-items:center}.uwd-import-state{color:#a7f3d0;font-size:12px}.uwd-episode-tree{margin:0 5px 8px;padding:7px 8px;border-left:2px solid #f472b6;color:#dbeafe;background:#151f30}.uwd-video-tree{border-left:1px solid #34425a;margin-left:7px;padding-left:7px}.uwd-sidebar .uwd-tree-shot{margin-left:7px;width:calc(100% - 7px);padding:7px 8px;background:#111a29}.uwd-sidebar .uwd-tree-shot b{font-weight:500;font-size:12px}";
function apply(context) {
  assertP1Compatibility(context), context.slots.inject("shell.overlay", () => context.slots.register({
    name: "shell.overlay",
    id: "us-vertical-drama-workbench"
  }, () => (0, import_react.createElement)("div", null, (0, import_react.createElement)("style", null, styles + treeStyles), (0, import_react.createElement)(WorkbenchPanel))));
}
var client_default = { name, inject, apply };
;return module.exports;}});
