/** Full-workspace, Chinese-first production surface for DSH P1. */
import { createElement as h, useMemo, useState } from 'react'
import { assertP1Compatibility, P1_DSH_VERSION } from './compatibility.js'
import { buildProductionSnapshot, parseStoryboardText } from './production-workbench.js'

export const name = 'us-vertical-drama-studio'
export const inject = ['slots']
export const p1Compatibility = { dsh: P1_DSH_VERSION, mode: 'exact' }

const tabs = ['制作台', '资产', '任务与问题']
const statuses = { draft: '草稿', blocked: '已阻塞', ready_to_generate: '可生成', generating: '生成中', review_required: '待审核', approved: '已通过', pending_approval: '待审核', todo: '待处理', in_progress: '进行中', review: '待复核', done: '已完成' }
const kinds = { character: '角色', look: '服装造型', set: '场景', prop: '道具' }

function WorkbenchPanel() {
  const [tab, setTab] = useState('制作台')
  const [snapshot, setSnapshot] = useState()
  const [filename, setFilename] = useState()
  const [importKind, setImportKind] = useState()
  const [activeVideo, setActiveVideo] = useState()
  const [activeShot, setActiveShot] = useState()
  const [error, setError] = useState()
  const importManifest = event => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result)
        const isJson = /\.json$/i.test(file.name)
        const manifest = isJson ? JSON.parse(text) : parseStoryboardText(text, file.name)
        const next = buildProductionSnapshot(manifest)
        setSnapshot(next); setFilename(file.name); setImportKind(isJson ? 'JSON 生产清单' : '分镜文本自动匹配'); setActiveVideo(next.videos[0]?.video_id); setActiveShot(next.shots[0]?.shot_id); setError(undefined); setTab('制作台')
      } catch (reason) {
        setSnapshot(undefined); setError(reason instanceof Error ? reason.message : '无法读取生产清单')
      }
    }
    reader.readAsText(file, 'utf-8')
  }
  const content = snapshot === undefined
    ? h(Welcome, null)
    : tab === '制作台'
      ? h(Desk, { snapshot, activeVideo, activeShot, setActiveVideo, setActiveShot })
      : tab === '资产'
        ? h(Assets, { snapshot })
        : h(Tasks, { snapshot, openTarget: target => {
          const shot = snapshot.shots.find(item => item.shot_id === target)
          if (shot) { setActiveVideo(shot.video_id); setActiveShot(shot.shot_id); setTab('制作台') }
        } })
  return h('section', { className: 'uwd-workspace', 'aria-label': '短剧制作工作台' },
    h('header', { className: 'uwd-topbar' },
      h('div', null, h('strong', null, 'US Vertical Drama · 短剧制作台'), h('small', null, snapshot?.episode_display_name_zh ?? filename ?? '生成、审核和微调都在同一工作区完成')),
      h('div', { className: 'uwd-top-actions' }, importKind ? h('span', { className: 'uwd-import-state' }, importKind) : null, h('label', { className: 'uwd-import' }, '导入分镜文件', h('input', { type: 'file', accept: 'application/json,.json,text/plain,.txt,text/markdown,.md', onChange: importManifest })))),
    error === undefined ? null : h('p', { className: 'uwd-error', role: 'alert' }, error),
    h('nav', { className: 'uwd-tabs', role: 'tablist', 'aria-label': '工作区页签' }, tabs.map(item => h('button', { key: item, type: 'button', role: 'tab', 'aria-selected': tab === item, onClick: () => setTab(item) }, item))),
    content)
}

function Welcome() {
  return h('main', { className: 'uwd-welcome' },
    h('h1', null, '视频分镜制作工作区'),
    h('p', null, '直接导入分镜导演生成的 Markdown / TXT，系统会自动匹配【视频编号】、【镜头编号】、时长及两层视频提示词；也支持 production-workbench.json 高级清单。'),
    h('p', { className: 'uwd-welcome-note' }, '工作台和制作说明使用中文；英文只保留角色名与实际台词。'))
}

function Desk({ snapshot, activeVideo, activeShot, setActiveVideo, setActiveShot }) {
  const video = snapshot.videos.find(item => item.video_id === activeVideo) ?? snapshot.videos[0]
  const shots = useMemo(() => snapshot.shots.filter(item => item.video_id === video?.video_id).sort((a, b) => (a.timeline_in_seconds ?? 0) - (b.timeline_in_seconds ?? 0)), [snapshot, video])
  const shot = shots.find(item => item.shot_id === activeShot) ?? shots[0]
  return h('main', { className: 'uwd-desk' },
    h('aside', { className: 'uwd-sidebar' },
      h('div', { className: 'uwd-sidebar-title' }, '剧集 / 视频 / 镜头', h('span', null, String(snapshot.summary.shots))),
      h('p', { className: 'uwd-episode-tree' }, snapshot.episode_display_name_zh ?? snapshot.episode_id ?? '未命名剧集'),
      snapshot.videos.map(item => h('div', { className: 'uwd-video-tree', key: item.video_id },
        h('button', { type: 'button', className: item.video_id === video?.video_id ? 'selected' : '', onClick: () => { setActiveVideo(item.video_id); setActiveShot(snapshot.shots.find(next => next.video_id === item.video_id)?.shot_id) } },
          h('b', null, item.display_name_zh ?? item.video_id), h('small', null, '视频编号：' + item.video_id + ' · ' + seconds(item.duration_seconds) + ' · ' + status(item.status))),
        item.video_id !== video?.video_id ? null : snapshot.shots.filter(next => next.video_id === item.video_id).sort((a, b) => (a.timeline_in_seconds ?? 0) - (b.timeline_in_seconds ?? 0)).map(next => h('button', { type: 'button', key: next.shot_id, className: 'uwd-tree-shot' + (next.shot_id === activeShot ? ' selected' : ''), onClick: () => setActiveShot(next.shot_id) }, h('b', null, next.display_name_zh ?? next.shot_id), h('small', null, '镜头编号：' + next.shot_id + ' · ' + timerange(next))))))
    ),
    h('section', { className: 'uwd-stage' },
     h('div', { className: 'uwd-metrics' }, metric('视频包', snapshot.summary.videos), metric('微镜头', snapshot.summary.micro_shots || snapshot.summary.shots), metric('可生成', snapshot.summary.ready_to_generate), metric('阻塞', snapshot.summary.blocked)),
     video === undefined ? h('p', null, '没有可显示的视频包。') : h(Timeline, { video, shots, activeShot, setActiveShot }),
      video === undefined ? null : h(VideoPrompt, { video }),
     h('p', { className: 'uwd-help' }, '每一块代表一个可独立生成、替换或微调的微镜头。它们按时间排列，保证资产和动作连续。')),
    h(Inspector, { shot, assets: snapshot.assets }))
}

function Timeline({ video, shots, activeShot, setActiveShot }) {
  const duration = video.duration_seconds || Math.max(...shots.map(item => item.timeline_out_seconds ?? item.duration_seconds), 1)
  return h('section', { className: 'uwd-timeline-card' },
    h('div', { className: 'uwd-timeline-title' }, h('div', null, h('h1', null, video.display_name_zh ?? video.video_id), h('small', null, '视频编号：' + video.video_id + ' · ' + seconds(duration) + ' · ' + status(video.status))), h('span', null, String(shots.length) + ' 个微镜头')),
    h('div', { className: 'uwd-ruler' }, [0, 0.25, 0.5, 0.75, 1].map(point => h('i', { key: point, style: { left: String(point * 100) + '%' } }, seconds(duration * point)))),
    h('div', { className: 'uwd-track', role: 'list', 'aria-label': '微镜头时间线' }, shots.map(item => {
      const width = Math.max(4, (item.duration_seconds || 0) / duration * 100)
      const left = (item.timeline_in_seconds || 0) / duration * 100
      return h('button', { type: 'button', role: 'listitem', key: item.shot_id, className: 'uwd-segment ' + item.status + (item.shot_id === activeShot ? ' selected' : ''), style: { left: String(left) + '%', width: String(width) + '%' }, onClick: () => setActiveShot(item.shot_id) },
        h('b', null, item.display_name_zh ?? item.shot_id), h('small', null, timerange(item) + ' · ' + seconds(item.duration_seconds)))
    })))
}

function Inspector({ shot, assets }) {
  if (shot === undefined) return h('aside', { className: 'uwd-inspector' }, '选择一个微镜头查看详细制作信息。')
  const bound = (shot.asset_ids ?? []).map(id => assets.find(asset => asset.id === id)).filter(Boolean)
  return h('aside', { className: 'uwd-inspector' },
    h('small', { className: 'uwd-id' }, '镜头编号：' + shot.shot_id),
    h('h1', null, shot.display_name_zh ?? '未命名微镜头'),
    h('span', { className: 'uwd-state ' + shot.status }, status(shot.status)),
    h('dl', { className: 'uwd-details' }, detail('包内时间', timerange(shot)), detail('时长', seconds(shot.duration_seconds)), detail('镜头类型', shot.shot_type ?? '未标注'), detail('生成方式', generation(shot.generation_mode))),
    h('h2', null, '画面与动作'), h('p', null, shot.shot_delta_prompt),
    h('h2', null, '锁定资产'), h('div', { className: 'uwd-chips' }, bound.length === 0 ? '未绑定资产' : bound.map(asset => h('span', { key: asset.id }, asset.display_name_zh ?? asset.id))),
    h(Prompt, { title: '资产锁定提示词', text: shot.asset_lock_prompt }),
    h(Prompt, { title: '负面约束', text: shot.negative_prompt }),
    shot.duration_exception_reason_zh ? h('p', { className: 'uwd-exception' }, '长镜头例外：' + shot.duration_exception_reason_zh) : null,
    shot.short_duration_reason_zh ? h('p', { className: 'uwd-exception' }, '短镜头例外：' + shot.short_duration_reason_zh) : null)
}

function VideoPrompt({ video }) {
  return h('section', { className: 'uwd-video-prompt' },
    h('div', null, h('small', null, '视频提示词编号：' + (video.video_prompt_id ?? '未提供')), h('h2', null, '视频总提示词（直接提交模型）')),
    h(Prompt, { title: '完整时序与镜头变化', text: video.video_master_prompt }),
    h(Prompt, { title: '视频级负面约束', text: video.video_negative_prompt }))
}

function Prompt({ title, text }) {
  const copy = () => { if (text && navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(() => {}) }
  return h('section', { className: 'uwd-prompt' }, h('div', null, h('h2', null, title), h('button', { type: 'button', onClick: copy }, '复制')), h('p', null, text ?? '未提供'))
}

function Assets({ snapshot }) {
  return h('main', { className: 'uwd-table-page' }, h('h1', null, '资产锁定状态'), h('p', null, '资产审核通过后，关联镜头才会显示为可生成。'),
    h('table', null, h('thead', null, h('tr', null, ['资产', '类型', '状态', '机器 ID'].map(name => h('th', { key: name }, name)))),
      h('tbody', null, snapshot.assets.map(asset => h('tr', { key: asset.id }, h('td', null, asset.display_name_zh ?? '未命名资产'), h('td', null, kinds[asset.kind] ?? asset.kind), h('td', null, status(asset.status)), h('td', null, asset.id))))))
}

function Tasks({ snapshot, openTarget }) {
  return h('main', { className: 'uwd-problem-page' },
    h('section', null, h('h1', null, '任务队列'), snapshot.tasks.length === 0 ? h('p', null, '暂无任务。') : h('ul', null, snapshot.tasks.map(task => h('li', { key: task.id }, h('b', null, task.display_name_zh ?? task.id), h('span', null, status(task.status)), h('small', null, (task.targets ?? []).join('、') || '未关联对象'))))),
    h('section', null, h('h1', null, '需要处理'), snapshot.diagnostics.length === 0 ? h('p', { className: 'uwd-ok' }, '当前没有阻塞项。') : h('ul', null, snapshot.diagnostics.map((item, index) => h('li', { className: item.severity, key: item.code + index, onClick: () => item.target_id && openTarget(item.target_id) }, (item.target_id ? item.target_id + ' · ' : '') + item.message)))))
}

function metric(label, value) { return h('div', { className: 'uwd-metric', key: label }, h('b', null, String(value)), h('small', null, label)) }
function detail(label, value) { return h('div', { key: label }, h('dt', null, label), h('dd', null, value)) }
function status(value) { return statuses[value] ?? value ?? '未标注' }
function generation(value) { return { independent: '独立生成', extend: '延展生成', image_to_video: '图生视频' }[value] ?? value ?? '未标注' }
function seconds(value) { const number = Number(value ?? 0); return String(Number.isInteger(number) ? number : Number(number.toFixed(1))) + ' 秒' }
function timerange(shot) { return shot.timeline_in_seconds === undefined ? '未标注' : seconds(shot.timeline_in_seconds) + '–' + seconds(shot.timeline_out_seconds) }

const styles = '.uwd-workspace{position:fixed;inset:0;z-index:31;background:#0d1118;color:#edf0f6;font:13px/1.45 system-ui;display:flex;flex-direction:column}.uwd-topbar{height:64px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 22px;border-bottom:1px solid #273246;background:#121925}.uwd-topbar strong,.uwd-topbar small{display:block}.uwd-topbar strong{font-size:15px}.uwd-topbar small{color:#9aa8bc;margin-top:2px}.uwd-import{border:1px solid #41516d;border-radius:7px;background:#182235;color:#e8eef9;padding:7px 10px;cursor:pointer}.uwd-import input{display:none}.uwd-error{margin:8px 18px;color:#fda4af}.uwd-tabs{height:42px;flex:none;display:flex;gap:4px;padding:0 18px;border-bottom:1px solid #273246;background:#101722}.uwd-tabs button{border:0;background:transparent;color:#9aa8bc;padding:11px 10px;cursor:pointer}.uwd-tabs button[aria-selected=true]{color:#fff;border-bottom:2px solid #fb7185}.uwd-welcome{display:grid;place-content:center;flex:1;text-align:center;padding:30px}.uwd-welcome h1{font-size:24px;margin:0 0 12px}.uwd-welcome p{max-width:610px;color:#b5c0d2;margin:6px auto}.uwd-welcome-note{color:#86efac!important}.uwd-desk{display:grid;grid-template-columns:210px minmax(390px,1fr) 340px;min-height:0;flex:1}.uwd-sidebar{overflow:auto;border-right:1px solid #273246;background:#101722;padding:12px}.uwd-sidebar-title{display:flex;justify-content:space-between;color:#c8d3e6;font-weight:700;padding:4px 5px 9px}.uwd-sidebar-title span{color:#8291a8}.uwd-sidebar button{display:block;width:100%;text-align:left;border:1px solid transparent;background:transparent;color:#dce4f1;border-radius:8px;padding:10px 8px;margin:4px 0;cursor:pointer}.uwd-sidebar button:hover,.uwd-sidebar button.selected{background:#1b2940;border-color:#40557a}.uwd-sidebar b,.uwd-sidebar small{display:block}.uwd-sidebar small{color:#9aa8bc;margin-top:3px}.uwd-stage{overflow:auto;padding:18px;background:#0d1118}.uwd-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:14px}.uwd-metric{border:1px solid #273246;background:#131c2b;padding:10px;border-radius:9px}.uwd-metric b{font-size:19px;display:block}.uwd-metric small{color:#9aa8bc}.uwd-timeline-card{border:1px solid #273246;border-radius:12px;background:#121925;padding:17px}.uwd-timeline-title{display:flex;justify-content:space-between;gap:12px}.uwd-timeline-title h1{font-size:16px;margin:0}.uwd-timeline-title small{color:#9aa8bc}.uwd-timeline-title>span{border-radius:999px;background:#273b5c;padding:4px 8px;height:min-content;color:#cfe0ff;white-space:nowrap}.uwd-ruler{position:relative;height:25px;margin:15px 4px 0;border-top:1px solid #45516a}.uwd-ruler i{position:absolute;top:5px;transform:translateX(-50%);font-style:normal;font-size:11px;color:#8e9ab0}.uwd-track{position:relative;height:94px;border-radius:8px;background:linear-gradient(90deg,#182031 1px,transparent 1px);background-size:10% 100%;overflow:hidden}.uwd-segment{position:absolute;top:13px;bottom:13px;min-width:20px;border:1px solid #536a98;border-radius:6px;background:#274b75;color:#eef5ff;padding:7px;text-align:left;overflow:hidden;cursor:pointer}.uwd-segment b,.uwd-segment small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.uwd-segment small{color:#d0e0fa;font-size:10px;margin-top:4px}.uwd-segment.selected{outline:2px solid #fbbf24;z-index:2}.uwd-segment.ready_to_generate{background:#176b52;border-color:#39a980}.uwd-segment.blocked{background:#7b2637;border-color:#e06980}.uwd-segment.generating{background:#55418a;border-color:#9179d5}.uwd-segment.review_required{background:#70551a;border-color:#cba345}.uwd-help{color:#9aa8bc;margin:11px 2px}.uwd-inspector{overflow:auto;border-left:1px solid #273246;background:#101722;padding:17px}.uwd-inspector h1{font-size:17px;margin:2px 0 8px}.uwd-id{color:#8493ab}.uwd-state{display:inline-block;border-radius:999px;padding:3px 7px;font-size:11px;background:#273246}.uwd-details{display:grid;grid-template-columns:1fr 1fr;gap:10px;border-top:1px solid #273246;border-bottom:1px solid #273246;padding:11px 0;margin:13px 0}.uwd-details dt{font-size:11px;color:#91a0b7}.uwd-details dd{margin:2px 0 0}.uwd-inspector h2{font-size:12px;color:#c9d5e8;margin:15px 0 6px}.uwd-inspector p,.uwd-prompt p{color:#d4deec;margin:0;white-space:pre-wrap}.uwd-chips{display:flex;gap:5px;flex-wrap:wrap}.uwd-chips span{background:#223149;color:#cfe0ff;border-radius:999px;padding:3px 7px;font-size:11px}.uwd-prompt{border:1px solid #2a374c;background:#121b2a;border-radius:8px;padding:9px;margin-top:10px}.uwd-prompt div{display:flex;justify-content:space-between;align-items:center}.uwd-prompt h2{margin:0 0 7px}.uwd-prompt button{border:1px solid #41516d;background:#1c2a40;color:#dce8f9;border-radius:5px;padding:3px 6px;cursor:pointer}.uwd-exception{border-left:3px solid #fbbf24;padding-left:8px;color:#fde68a!important}.uwd-table-page,.uwd-problem-page{overflow:auto;flex:1;padding:22px}.uwd-table-page h1,.uwd-problem-page h1{font-size:18px;margin:0 0 7px}.uwd-table-page>p{color:#9aa8bc}.uwd-table-page table{width:100%;border-collapse:collapse;text-align:left}.uwd-table-page th,.uwd-table-page td{padding:10px 8px;border-bottom:1px solid #273246}.uwd-table-page th{color:#9aa8bc;font-weight:600}.uwd-problem-page{display:grid;grid-template-columns:1fr 1fr;gap:30px}.uwd-problem-page ul{list-style:none;padding:0;margin:0}.uwd-problem-page li{border-bottom:1px solid #273246;padding:9px 3px}.uwd-problem-page b,.uwd-problem-page span,.uwd-problem-page small{display:block}.uwd-problem-page span{color:#a8c9ff;margin:2px 0}.uwd-problem-page small{color:#8f9eb4}.uwd-problem-page li.error{color:#fda4af;cursor:pointer}.uwd-problem-page li.warning{color:#fde68a;cursor:pointer}.uwd-ok{color:#86efac}@media(max-width:980px){.uwd-desk{grid-template-columns:170px minmax(310px,1fr)}.uwd-inspector{grid-column:1/-1;border-left:0;border-top:1px solid #273246;max-height:340px}.uwd-stage{min-height:360px}}@media(max-width:650px){.uwd-topbar{padding:0 12px}.uwd-topbar strong{font-size:13px}.uwd-desk{grid-template-columns:1fr}.uwd-sidebar{display:flex;gap:5px;overflow:auto;border-right:0;border-bottom:1px solid #273246}.uwd-sidebar-title{display:none}.uwd-sidebar button{min-width:150px}.uwd-metrics{grid-template-columns:repeat(2,1fr)}.uwd-problem-page{grid-template-columns:1fr}.uwd-timeline-card{padding:12px}.uwd-segment{font-size:10px;padding:5px}}'

const treeStyles = '.uwd-top-actions{display:flex;gap:10px;align-items:center}.uwd-import-state{color:#a7f3d0;font-size:12px}.uwd-episode-tree{margin:0 5px 8px;padding:7px 8px;border-left:2px solid #f472b6;color:#dbeafe;background:#151f30}.uwd-video-tree{border-left:1px solid #34425a;margin-left:7px;padding-left:7px}.uwd-sidebar .uwd-tree-shot{margin-left:7px;width:calc(100% - 7px);padding:7px 8px;background:#111a29}.uwd-sidebar .uwd-tree-shot b{font-weight:500;font-size:12px}'

export function apply(context) {
  assertP1Compatibility(context)
  context.slots.inject('shell.overlay', () => context.slots.register({
    name: 'shell.overlay',
    id: 'us-vertical-drama-workbench',
  }, () => h('div', null, h('style', null, styles + treeStyles), h(WorkbenchPanel))))
}

export default { name, inject, apply }
