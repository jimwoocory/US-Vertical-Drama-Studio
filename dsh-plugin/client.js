/** Embedded three-column workbench for DSH 0.1.5-rc.1. */
import { createElement as h, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { assertP1Compatibility, P1_DSH_VERSION } from './compatibility.js'
import { buildProductionSnapshot, parseStoryboardText } from './production-workbench.js'

export const name = 'us-vertical-drama-studio'
export const inject = ['slots']
export const p1Compatibility = { dsh: P1_DSH_VERSION, mode: 'exact' }

const statuses = { draft: '草稿', blocked: '已阻塞', ready_to_generate: '可生成', generating: '生成中', review_required: '待审核', approved: '已通过' }

/** shell.overlay is a bootstrap seam only; the studio lives inside the DSH session. */
function HarnessBridge() {
  const marker = useRef(null)
  const [target, setTarget] = useState()
  useLayoutEffect(() => {
    const document = marker.current?.ownerDocument
    if (!document) return undefined
    const locate = () => {
      const next = document.querySelector("[data-conversation-scroll] > [data-slot='conversation.session']")
      setTarget(current => current === next ? current : next ?? undefined)
    }
    locate()
    const observer = new MutationObserver(locate)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
  return h('div', null, h('style', null, styles), h('span', { ref: marker, className: 'uwd-bridge-marker', 'aria-hidden': true }), target ? createPortal(h(WorkbenchPanel), target) : null)
}

function WorkbenchPanel() {
  const [snapshot, setSnapshot] = useState()
  const [filename, setFilename] = useState('未导入分镜')
  const [source, setSource] = useState('')
  const [view, setView] = useState('文本')
  const [activeVideo, setActiveVideo] = useState()
  const [activeShot, setActiveShot] = useState()
  const [error, setError] = useState()
  const video = snapshot?.videos.find(item => item.video_id === activeVideo) ?? snapshot?.videos[0]
  const shots = useMemo(() => snapshot?.shots.filter(item => item.video_id === video?.video_id).sort((a, b) => (a.timeline_in_seconds ?? 0) - (b.timeline_in_seconds ?? 0)) ?? [], [snapshot, video])
  const shot = shots.find(item => item.shot_id === activeShot) ?? shots[0]
  const importStoryboard = event => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result)
        const manifest = /\.json$/i.test(file.name) ? JSON.parse(text) : parseStoryboardText(text, file.name)
        const next = buildProductionSnapshot(manifest)
        setSnapshot(next); setFilename(file.name); setSource(/\.json$/i.test(file.name) ? JSON.stringify(manifest, null, 2) : text)
        setActiveVideo(next.videos[0]?.video_id); setActiveShot(next.shots[0]?.shot_id); setView('文本'); setError(undefined)
      } catch (reason) { setError(reason instanceof Error ? reason.message : '无法读取分镜文件') }
    }
    reader.readAsText(file, 'utf-8')
  }
  return h('div', { className: 'uwd-split', 'data-open': 'true' },
    h('aside', { className: 'uwd-tree', 'aria-label': '分镜文件树' },
      h('header', null, h('strong', null, '短剧工作区'), h('label', { className: 'uwd-import' }, '导入分镜', h('input', { type: 'file', accept: 'application/json,.json,text/plain,.txt,text/markdown,.md', onChange: importStoryboard }))),
      h('p', { className: 'uwd-project' }, filename),
      h('button', { type: 'button', className: view === '文本' ? 'selected' : '', onClick: () => setView('文本') }, '▣ 分镜文本'),
      h('button', { type: 'button', className: view === '视频包' ? 'selected' : '', onClick: () => setView('视频包') }, '▣ 视频包与镜头', snapshot ? h('small', null, String(snapshot.summary.videos) + ' 视频 / ' + String(snapshot.summary.shots) + ' 镜头') : null),
      snapshot ? h('div', { className: 'uwd-tree-videos' }, snapshot.videos.map(item => h('div', { key: item.video_id },
        h('button', { type: 'button', className: item.video_id === video?.video_id ? 'selected' : '', onClick: () => { setActiveVideo(item.video_id); setActiveShot(snapshot.shots.find(next => next.video_id === item.video_id)?.shot_id); setView('视频包') } }, '视频编号：' + item.video_id),
        item.video_id === video?.video_id ? snapshot.shots.filter(next => next.video_id === item.video_id).map(next => h('button', { type: 'button', key: next.shot_id, className: 'uwd-tree-shot' + (next.shot_id === shot?.shot_id ? ' selected' : ''), onClick: () => { setActiveShot(next.shot_id); setView('视频包') } }, '镜头编号：' + next.shot_id)) : null))) : null),
    h('main', { className: 'uwd-editor', 'aria-label': '分镜编辑器' },
      h('header', { className: 'uwd-editor-bar' }, h('div', null, h('b', null, filename), h('small', null, snapshot ? '已自动匹配视频、镜头、时间与提示词' : '导入技能生成的 Markdown / TXT 开始制作')), h('div', { className: 'uwd-tabs', role: 'tablist' }, ['文本', '视频包'].map(name => h('button', { type: 'button', role: 'tab', key: name, 'aria-selected': view === name, onClick: () => setView(name) }, name)))),
      error ? h('p', { className: 'uwd-error', role: 'alert' }, error) : null,
      view === '文本' ? h(DocumentView, { source, imported: Boolean(snapshot) }) : h(VideoPackageView, { snapshot, video, shots, shot, setActiveShot })))
}

function DocumentView({ source, imported }) {
  if (!imported) return h('section', { className: 'uwd-empty' }, h('h1', null, '从分镜文档开始'), h('p', null, '左侧点击“导入分镜”，直接选择分镜导演生成的 Markdown、TXT 或 production-workbench.json。'), h('p', null, '导入后：左侧自动生成视频/镜头树；中间保留原始文档；右侧继续使用 Harness 原生对话，让模型修改、续写或审核。'))
  return h('article', { className: 'uwd-document' }, h('pre', null, source))
}

function VideoPackageView({ snapshot, video, shots, shot, setActiveShot }) {
  if (!snapshot || !video) return h('section', { className: 'uwd-empty' }, h('h1', null, '还没有视频包'), h('p', null, '先导入分镜文本，系统会按【视频编号】与【镜头编号】自动建立关系。'))
  return h('section', { className: 'uwd-production' },
    h('div', { className: 'uwd-summary' }, metric('视频包', snapshot.summary.videos), metric('微镜头', snapshot.summary.micro_shots), metric('可生成', snapshot.summary.ready_to_generate), metric('阻塞', snapshot.summary.blocked)),
    h('article', { className: 'uwd-video-card' }, h('small', null, '视频编号：' + video.video_id + ' · ' + seconds(video.duration_seconds) + ' · ' + status(video.status)), h('h1', null, video.display_name_zh ?? video.video_id), h('h2', null, '视频总提示词（直接提交模型）'), h('p', null, video.video_master_prompt), h('h2', null, '视频级负面约束'), h('p', null, video.video_negative_prompt)),
    h('h2', { className: 'uwd-section-title' }, '镜头时间线'),
    h('div', { className: 'uwd-timeline' }, shots.map(item => h('button', { type: 'button', key: item.shot_id, className: item.shot_id === shot?.shot_id ? 'selected' : '', onClick: () => setActiveShot(item.shot_id) }, h('b', null, '镜头编号：' + item.shot_id), h('small', null, timerange(item) + ' · ' + seconds(item.duration_seconds) + ' · ' + status(item.status)), h('span', null, item.shot_delta_prompt)))),
    shot ? h('article', { className: 'uwd-shot-card' }, h('small', null, '当前选择：镜头编号 ' + shot.shot_id), h('h2', null, shot.display_name_zh ?? '微镜头'), h('p', null, shot.shot_delta_prompt), h('h3', null, '锁定资产与负面约束'), h('p', null, shot.asset_lock_prompt + '\n' + shot.negative_prompt)) : null)
}

function metric(label, value) { return h('div', { key: label }, h('b', null, String(value ?? 0)), h('small', null, label)) }
function status(value) { return statuses[value] ?? value ?? '未标注' }
function seconds(value) { const n = Number(value ?? 0); return String(Number.isInteger(n) ? n : Number(n.toFixed(1))) + ' 秒' }
function timerange(shot) { return shot.timeline_in_seconds === undefined ? '未标注' : seconds(shot.timeline_in_seconds) + '–' + seconds(shot.timeline_out_seconds) }

const styles = '.uwd-bridge-marker{display:none}.uwd-split{display:contents;font-family:var(--dsw-font-family,system-ui)}[data-conversation-scroll]:has(>[data-slot="conversation.session"]>.uwd-split){display:grid;grid-template-columns:clamp(170px,16%,210px) minmax(320px,1fr) clamp(360px,34%,500px);grid-template-rows:minmax(0,1fr);min-height:0;overflow:auto;position:relative;background:var(--dsw-alias-bg-base,#fff)}[data-conversation-scroll]:has(>[data-slot="conversation.session"]>.uwd-split)>[data-slot="conversation.session"]>:not(.uwd-split){grid-column:3;grid-row:1;min-width:0;min-height:100%;border-left:1px solid var(--dsw-alias-border-l2,#e5e7eb)}[data-conversation-scroll]:has(>[data-slot="conversation.session"]>.uwd-split)>[data-composer-seat]{grid-column:3;grid-row:1;align-self:end;min-width:0;width:100%;position:sticky;z-index:4}.uwd-tree,.uwd-editor{box-sizing:border-box;grid-row:1;position:sticky;top:0;align-self:start;min-width:0;height:100%;overflow:auto;color:var(--dsw-alias-label-primary,#172033);background:var(--dsw-alias-bg-base,#fff)}.uwd-tree{grid-column:1;border-right:1px solid var(--dsw-alias-border-l2,#e5e7eb);padding:13px 10px}.uwd-tree header{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:14px;font-size:13px}.uwd-import{border:1px solid var(--dsw-alias-border-l2,#d1d5db);border-radius:6px;padding:4px 6px;color:var(--dsw-alias-label-secondary,#596579);cursor:pointer;font-size:11px}.uwd-import input{display:none}.uwd-project{overflow:hidden;margin:0 0 6px;color:var(--dsw-alias-label-secondary,#596579);text-overflow:ellipsis;white-space:nowrap;font-size:11px}.uwd-tree button{display:block;width:100%;border:0;border-radius:5px;color:inherit;background:transparent;padding:7px 8px;text-align:left;cursor:pointer;font:12px/1.4 inherit}.uwd-tree button:hover,.uwd-tree button.selected{background:var(--dsw-alias-interactive-bg-hover,#edf4ff)}.uwd-tree button small{display:block;color:var(--dsw-alias-label-secondary,#596579);font-size:10px}.uwd-tree-videos{margin:5px 0 0 8px;border-left:1px solid var(--dsw-alias-border-l2,#e5e7eb);padding-left:4px}.uwd-tree .uwd-tree-shot{margin-left:5px;width:calc(100% - 5px);color:var(--dsw-alias-label-secondary,#596579);font-size:11px}.uwd-editor{grid-column:2;background:#fff}.uwd-editor-bar{position:sticky;top:0;z-index:2;display:flex;min-height:47px;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid var(--dsw-alias-border-l2,#e5e7eb);background:var(--dsw-alias-bg-base,#fff);padding:7px 15px}.uwd-editor-bar b,.uwd-editor-bar small{display:block}.uwd-editor-bar small{color:var(--dsw-alias-label-secondary,#596579);font-size:11px}.uwd-tabs{display:flex;gap:2px}.uwd-tabs button{border:0;border-radius:5px;color:var(--dsw-alias-label-secondary,#596579);background:transparent;padding:6px 9px;cursor:pointer;font:12px inherit}.uwd-tabs button[aria-selected="true"]{color:var(--dsw-alias-label-primary,#172033);background:var(--dsw-alias-interactive-bg-hover,#edf4ff)}.uwd-error{margin:12px 16px;color:#c24152}.uwd-empty{max-width:580px;margin:100px auto;padding:30px;color:#374151}.uwd-empty h1{margin:0 0 12px;font-size:25px}.uwd-empty p{color:#64748b;line-height:1.8}.uwd-document{box-sizing:border-box;min-height:100%;padding:34px clamp(20px,6%,72px);color:#1f2937}.uwd-document pre{margin:0;white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.9 ui-monospace,SFMono-Regular,Menlo,monospace}.uwd-production{padding:18px clamp(16px,4%,44px) 80px;color:#1f2937}.uwd-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:16px}.uwd-summary div{border:1px solid #e5e7eb;border-radius:8px;padding:9px;background:#f8fafc}.uwd-summary b,.uwd-summary small{display:block}.uwd-summary b{font-size:18px}.uwd-summary small{color:#64748b;font-size:11px}.uwd-video-card,.uwd-shot-card{border:1px solid #e5e7eb;border-radius:10px;background:#fff;padding:18px;box-shadow:0 1px 3px rgb(15 23 42 / 5%)}.uwd-video-card small,.uwd-shot-card small{color:#64748b}.uwd-video-card h1{margin:7px 0 18px;font-size:20px}.uwd-video-card h2,.uwd-shot-card h2,.uwd-shot-card h3{margin:16px 0 6px;font-size:13px}.uwd-video-card p,.uwd-shot-card p{margin:0;white-space:pre-wrap;color:#374151;line-height:1.7}.uwd-section-title{margin:22px 0 10px;font-size:15px}.uwd-timeline{display:grid;gap:8px}.uwd-timeline button{border:1px solid #e5e7eb;border-radius:8px;background:#fff;padding:10px;text-align:left;cursor:pointer;color:#1f2937}.uwd-timeline button:hover,.uwd-timeline button.selected{border-color:#60a5fa;background:#eff6ff}.uwd-timeline b,.uwd-timeline small,.uwd-timeline span{display:block}.uwd-timeline small{color:#64748b;margin:2px 0 5px}.uwd-timeline span{overflow:hidden;color:#475569;text-overflow:ellipsis;white-space:nowrap;font-size:12px}.uwd-shot-card{margin-top:15px}@media(max-width:900px){[data-conversation-scroll]:has(>[data-slot="conversation.session"]>.uwd-split){grid-template-columns:170px minmax(280px,1fr)}[data-conversation-scroll]:has(>[data-slot="conversation.session"]>.uwd-split)>[data-slot="conversation.session"]>:not(.uwd-split),[data-conversation-scroll]:has(>[data-slot="conversation.session"]>.uwd-split)>[data-composer-seat]{grid-column:1/-1;grid-row:2}.uwd-tree,.uwd-editor{height:auto;min-height:520px}}'

export function apply(context) {
  assertP1Compatibility(context)
  context.slots.inject('shell.overlay', () => context.slots.register({ name: 'shell.overlay', id: 'us-vertical-drama-workbench', order: -100 }, HarnessBridge))
}

export default { name, inject, apply }
