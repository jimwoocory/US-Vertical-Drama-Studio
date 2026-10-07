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

metadata.version = '1.2.5'
metadata.description = 'US-facing vertical drama story development, outline diagnosis, adaptation, and the retained legacy writing and production workflow.'
const ui = metadata.extensions['com.openai'].interface
ui.longDescription = '用中文完成美国竖屏短剧的简报、大纲和审查；48 集分集、逐集剧本、分镜与生成提示词逐字段中英对照。默认交付 DOCX 与 HTML，最终可把当前有效资产打包 ZIP。已审故事包可由创作者授权生成明确标注的非投产剧本草稿；正式系统审批仍需可信后端。'
ui.defaultPrompt = [
  '我只有一个短剧想法，请用中文给我两到三个冲突机制不同、适合美国观众的故事方向，并交付 DOCX 和 HTML。',
  '这是已有的大纲，请用中文审查因果链和美国市场合理性，并交付 DOCX 和 HTML。',
  '我想把这部小说或漫剧改成美国竖屏短剧，请用中文分析改编机制，并交付 DOCX 和 HTML。',
  '我已确认当前已审分集 DOCX 和对应 review，请先按 EP01–EP03 起草逐场中英对照的非投产剧本草稿，交付 DOCX 和 HTML。',
  '请把已审 R4 的 48 集分集逐字段做中英对照，保留原修订和剧情事实，交付 DOCX 与 HTML。',
  '请把当前项目已经交付的文档、审查和提示词资产打包成带清单的 ZIP 给作者。',
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
await write('README.md', `# US Vertical Drama Studio ${metadata.version}\n\n本包更新现有的 ChatGPT 插件身份，保留原有八个技能，并加入前期入口判断、完整故事大纲、独立审查、分集结构和创作者授权草稿通道。入口是 \`skills/us-vertical-drama-studio/SKILL.md\`；新增规则来自 \`core/usvd-v10/\`。\n\n项目简报、完整故事和独立审查默认使用简体中文。48 集分集、逐集剧本、分镜与生成提示词在作者阅读版中逐字段中英对照。英语对白是实际表演版，旁边的中文是明确标注的不念出参考译文。生成提示词标明提交给模型的单一语言版本；另一语言仅供作者审阅，不改变机器导入字段。每份面向作者的产物交付内容一致的 DOCX 和 HTML，不以 TXT 或聊天文字代替。最终交付或作者要求时，打包当前有效资产 ZIP，附清单、版本、摘要、缺项和 Gate 状态。\n\n创作者在当前对话中直接要求继续某个已审故事包时，\`usvd-v10-03-creator-script-draft\` 可使用完整 canonical 包，或使用标明相同修订和摘要的分集 DOCX/HTML 加匹配 review 起草非投产剧本。后一种来源标为 \`REVIEW_ATTESTED_VIEW\`，不宣称已独立重算 canonical JSON 摘要；如缺少某项必要 Story Truth，只询问该事实。未指定集数时默认先写 EP01–EP03。截图、助手摘要或旧 \`APPROVED\` 标签不能单独证明用户指令。ND-001 的可信人工审批和正式投产 Gate 仍未实现；此草稿通道不改变 Story Truth。\n\n\`tools/checkup.mjs\` 只检查机器可验证的结构，不能判断美国化可信度、因果、对白或观众吸引力。旧制作技能保留给已有批准材料的项目。如果当前环境无法制作 DOCX、HTML 或 ZIP，必须如实说明，不能假称已交付。\n`)

console.log(`Updated existing ChatGPT plugin package ${metadata.name}@${metadata.version} with ${authored.length} V10 skills and retained legacy skills.`)
