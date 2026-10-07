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

metadata.version = '1.2.2'
metadata.description = 'US-facing vertical drama story development, outline diagnosis, adaptation, and the retained legacy writing and production workflow.'
const ui = metadata.extensions['com.openai'].interface
ui.longDescription = '用中文完成美国竖屏短剧的项目简报、完整故事大纲、分集规划和独立审查，默认交付内容一致的 DOCX 与 HTML 两份文件，不以 TXT 代替。美国市场定位不改变开发文档语言；剧本对白使用自然的美式英语。保留已有项目的写作与制作技能。'
ui.defaultPrompt = [
  '我只有一个短剧想法，请用中文给我两到三个冲突机制不同、适合美国观众的故事方向，并交付 DOCX 和 HTML。',
  '这是已有的大纲，请用中文审查因果链和美国市场合理性，并交付 DOCX 和 HTML。',
  '我想把这部小说或漫剧改成美国竖屏短剧，请用中文分析改编机制，并交付 DOCX 和 HTML。',
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
await write('README.md', `# US Vertical Drama Studio ${metadata.version}\n\n本包更新现有的 ChatGPT 插件身份，保留原有八个技能，并加入五种入口判断、完整故事大纲、独立审查和分集结构。入口是 \`skills/us-vertical-drama-studio/SKILL.md\`；新增规则来自 \`core/usvd-v10/\`。\n\n默认用简体中文写项目简报、故事大纲、分集表和审查报告，并为每份面向创作者的开发产物交付内容一致的 DOCX 和 HTML 两个可下载文件，不以 TXT 或聊天文字代替。美国市场定位决定故事的社会机制；只有进入剧本阶段，角色实际说出的对白才默认使用自然的美式英语。英文 JSON 键名、状态码和必要的人名不改变正文的中文要求。详见 \`references/output-language.md\`、\`references/document-delivery.md\` 和 \`examples/chinese-development-sample.md\`。\n\n\`tools/checkup.mjs\` 只检查机器可验证的结构。它不能判断美国化可信度、因果、对白或观众吸引力。旧制作技能保留给已有批准材料的项目；新的 V10 项目在可信人工批准机制完成前停在 \`AWAITING_HUMAN_APPROVAL\`（ND-001）。如果当前环境无法制作某种文件，必须如实说明，不能假称已交付。\n`)

console.log(`Updated existing ChatGPT plugin package ${metadata.name}@${metadata.version} with ${authored.length} V10 skills and retained legacy skills.`)
