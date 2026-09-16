/** P1 browser surface for the US Vertical Drama production manifest. */
import { createElement as h, useMemo, useState } from 'react'
import { assertP1Compatibility, P1_DSH_VERSION } from './compatibility.js'
import { buildProductionSnapshot } from './production-workbench.js'

export const name = 'us-vertical-drama-studio'
export const inject = ['slots']
export const p1Compatibility = { dsh: P1_DSH_VERSION, mode: 'exact' }

const tabs = ['总览', '资产', '镜头', '任务']

function WorkbenchPanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('总览')
  const [snapshot, setSnapshot] = useState()
  const [filename, setFilename] = useState()
  const [error, setError] = useState()
  const content = useMemo(() => snapshot === undefined
    ? h('p', { className: 'uwd-empty' }, '选择由分镜导演输出的 production-workbench.json，即可显示资产、镜头、任务与阻塞原因。')
    : renderTab(snapshot, tab), [snapshot, tab])

  const readManifest = event => {
    const file = event.target.files?.[0]
    if (file === undefined) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const value = JSON.parse(String(reader.result))
        setSnapshot(buildProductionSnapshot(value))
        setFilename(file.name)
        setError(undefined)
      } catch (reason) {
        setSnapshot(undefined)
        setError(reason instanceof Error ? reason.message : '无法读取 production-workbench.json')
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  if (!open) return h('button', { type: 'button', className: 'uwd-launcher', onClick: () => setOpen(true) }, '短剧工作台')
  return h('aside', { className: 'uwd-panel', 'aria-label': 'US Vertical Drama Production Workbench' },
    h('header', null,
      h('div', null, h('strong', null, 'US Vertical Drama'), h('span', null, filename ?? 'Production Workbench · P1')),
      h('button', { type: 'button', onClick: () => setOpen(false), 'aria-label': '关闭工作台' }, '×')),
    h('div', { className: 'uwd-import' },
      h('label', null, '载入生产清单', h('input', { type: 'file', accept: 'application/json,.json', onChange: readManifest })),
      error === undefined ? null : h('p', { role: 'alert' }, error)),
    h('nav', { role: 'tablist', 'aria-label': '工作台页签' }, tabs.map(label => h('button', {
      type: 'button', role: 'tab', key: label, 'aria-selected': tab === label, onClick: () => setTab(label),
    }, label))),
    h('section', { className: 'uwd-content' }, content))
}

function renderTab(snapshot, tab) {
  if (tab === '总览') return h('div', null,
    h('h2', null, snapshot.episode_id ?? '未命名集'),
    h('div', { className: 'uwd-stats' },
      stat('资产', `${snapshot.summary.approved_assets}/${snapshot.summary.assets}`),
      stat('镜头', snapshot.summary.shots),
      stat('可生成', snapshot.summary.ready_to_generate),
      stat('待审核', snapshot.summary.review_required),
      stat('已阻塞', snapshot.summary.blocked)),
    h('h3', null, '需要处理'),
    renderDiagnostics(snapshot.diagnostics))
  if (tab === '资产') return renderTable(['ID', '类型', '状态'], snapshot.assets.map(asset => [asset.id, asset.kind, asset.status]))
  if (tab === '镜头') return renderTable(['镜头', '来源', '时长', '状态'], snapshot.shots.map(shot => [shot.shot_id, shot.source_scene_id, `${shot.duration_seconds ?? '?'}s`, shot.status]))
  return renderTable(['任务', '状态', '关联对象'], snapshot.tasks.map(task => [task.id, task.status, (task.targets ?? []).join(', ') || '—']))
}

function stat(label, value) { return h('div', { className: 'uwd-stat', key: label }, h('span', null, value), h('small', null, label)) }
function renderDiagnostics(items) {
  if (items.length === 0) return h('p', { className: 'uwd-ok' }, '没有阻塞项，生成前仍请确认目标模型与媒体能力。')
  return h('ul', { className: 'uwd-diagnostics' }, items.map((item, index) => h('li', { key: `${item.code}-${index}`, 'data-severity': item.severity }, `${item.target_id === undefined ? '' : `${item.target_id} · `}${item.message}`)))
}
function renderTable(headers, rows) {
  const body = rows.length === 0
    ? h('tr', null, h('td', { colSpan: headers.length }, '暂无记录'))
    : rows.map((row, index) => h('tr', { key: index }, row.map((cell, cellIndex) => h('td', { key: cellIndex }, String(cell)))))
  return h('div', { className: 'uwd-table-wrap' }, h('table', null,
    h('thead', null, h('tr', null, headers.map(header => h('th', { key: header }, header)))),
    h('tbody', null, body)))
}

const styles = `
.uwd-launcher{position:fixed;right:20px;bottom:22px;z-index:30;border:0;border-radius:999px;background:#e11d48;color:#fff;padding:10px 15px;font:600 13px system-ui;box-shadow:0 8px 28px #0005;cursor:pointer}.uwd-panel{position:fixed;right:18px;bottom:18px;width:min(560px,calc(100vw - 36px));max-height:min(720px,calc(100vh - 36px));overflow:auto;z-index:31;background:#101216;color:#edf0f6;border:1px solid #2b3039;border-radius:16px;box-shadow:0 20px 60px #0009;font:13px/1.45 system-ui}.uwd-panel header{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 12px}.uwd-panel header strong{display:block;font-size:15px}.uwd-panel header span{display:block;color:#9aa3b2;font-size:12px}.uwd-panel button{cursor:pointer}.uwd-panel header button{border:0;background:transparent;color:#c8cfda;font-size:25px}.uwd-import{display:flex;align-items:center;gap:12px;padding:0 18px 12px;color:#c8cfda}.uwd-import label{display:flex;gap:8px;align-items:center}.uwd-import input{max-width:205px;color:#c8cfda}.uwd-import p{margin:0;color:#fda4af}.uwd-panel nav{display:flex;gap:4px;padding:0 14px;border-bottom:1px solid #2b3039}.uwd-panel nav button{border:0;background:transparent;color:#aab2bf;padding:10px 9px}.uwd-panel nav button[aria-selected=true]{color:#fff;border-bottom:2px solid #fb7185}.uwd-content{padding:16px 18px 20px}.uwd-empty{color:#aab2bf}.uwd-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.uwd-stat{background:#191d24;border-radius:9px;padding:9px;text-align:center}.uwd-stat span{display:block;font-size:17px;font-weight:700}.uwd-stat small{color:#9aa3b2}.uwd-diagnostics{margin:0;padding-left:18px}.uwd-diagnostics li{margin:7px 0}.uwd-diagnostics li[data-severity=error]{color:#fda4af}.uwd-diagnostics li[data-severity=warning]{color:#fde68a}.uwd-ok{color:#86efac}.uwd-table-wrap{overflow:auto}.uwd-table-wrap table{width:100%;border-collapse:collapse;text-align:left}.uwd-table-wrap th,.uwd-table-wrap td{padding:9px 7px;border-bottom:1px solid #2b3039;vertical-align:top}.uwd-table-wrap th{color:#9aa3b2;font-weight:600}@media(max-width:520px){.uwd-stats{grid-template-columns:repeat(3,1fr)}}`

export function apply(context) {
  assertP1Compatibility(context)
  context.slots.inject('shell.overlay', () => context.slots.register({
    name: 'shell.overlay',
    id: 'us-vertical-drama-workbench',
  }, () => h('div', null, h('style', null, styles), h(WorkbenchPanel))))
}

export default { name, inject, apply }
