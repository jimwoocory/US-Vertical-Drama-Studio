import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const coreRoot = path.join(root, 'core/usvd-v10')
const pluginRoot = path.join(root, 'plugins/us-vertical-drama-studio')
const core = JSON.parse(await readFile(path.join(coreRoot, 'manifest.json'), 'utf8'))
const metadataPath = path.join(pluginRoot, 'plugin.json')
const metadata = JSON.parse(await readFile(metadataPath, 'utf8'))
const authored = core.skills.filter(skill => skill.status === 'authored-unvalidated')

metadata.version = '1.2.0'
metadata.description = 'US-facing vertical drama story development, outline diagnosis, adaptation, and the retained legacy writing and production workflow.'
const ui = metadata.extensions['com.openai'].interface
ui.longDescription = 'Develop a complete US-facing story before episodes: route a simple idea, diagnose an existing outline or script, or adapt a novel or motion comic with a credible US conflict mechanism. Existing approved projects retain their writing and production skills.'
ui.defaultPrompt = [
  '我只有一个短剧想法，请先给我两到三个冲突机制不同、适合美国观众的故事方向。',
  '这是已有的大纲，请先审查因果链和美国市场合理性，再告诉我哪里需要重建。',
  '我想把这部小说或漫剧改成美国竖屏短剧，请先分析要保留的情绪体验和必须重做的故事机制。',
]

const write = async (relative, content) => {
  const target = path.join(pluginRoot, ...relative.split('/'))
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, content, 'utf8')
}
const copyCore = async (relative, target = relative) => {
  await write(target, await readFile(path.join(coreRoot, ...relative.split('/')), 'utf8'))
}

for (const skill of authored) {
  await copyCore(skill.canonical_path, `skills/${skill.id}/SKILL.md`)
  if (skill.contract_path) await copyCore(skill.contract_path)
}
for (const resource of [...(core.references ?? []), ...(core.tools ?? []), ...(core.examples ?? [])]) {
  await copyCore(resource)
}
await copyCore('manifest.json', 'v10-manifest.json')
await write('plugin.json', `${JSON.stringify(metadata, null, 2)}\n`)
await write('.codex-plugin/plugin.json', `${JSON.stringify({
  name: metadata.name,
  version: metadata.version,
  description: metadata.description,
  author: metadata.author,
  skills: './skills/',
  interface: ui,
}, null, 2)}\n`)
await write('README.md', `# US Vertical Drama Studio ${metadata.version}\n\nThis package updates the existing ChatGPT plugin identity. It retains the original eight skills and adds the V10 story-first workflow: five intake routes, direction cards, an evidence-bound complete Story Package, separate episode architecture, and independent outline or story review. Its entry point is \`skills/us-vertical-drama-studio/SKILL.md\`; V10 instructions come from \`core/usvd-v10/\`.\n\nFor adapted work, map source emotional payoff to credible US power, relationship, cost, and causal mechanisms. A renamed cast or literal English translation is a review blocker when the underlying story still depends on the source culture's power logic.\n\nThe included \`tools/checkup.mjs\` checks machine-readable structure when a Node runtime is available. It cannot judge audience appeal, cultural plausibility, dialogue, or causality; those require the independent Review skill and human judgment.\n\nThe old seven production specialists remain for documented legacy projects with their prior approvals. New V10 projects stop at \`AWAITING_HUMAN_APPROVAL\` after independent story and episode review because trusted human approval and protected screenplay execution are not implemented (ND-001). A text label alone does not open that gate.\n`)

console.log(`Updated existing ChatGPT plugin package ${metadata.name}@${metadata.version} with ${authored.length} V10 skills and retained legacy skills.`)
