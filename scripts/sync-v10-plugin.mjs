import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const coreRoot = path.join(root, 'core/usvd-v10')
const destRoot = path.join(root, 'plugins/us-vertical-drama-studio-v10')
const checkOnly = process.argv.includes('--check')
const core = JSON.parse(await readFile(path.join(coreRoot, 'manifest.json'), 'utf8'))
const metadata = JSON.parse(await readFile(path.join(coreRoot, 'plugin-metadata.json'), 'utf8'))
const authored = core.skills.filter(skill => skill.status === 'authored-unvalidated')
const expected = new Map()

const addText = (relative, content) => expected.set(relative.replaceAll('\\', '/'), content)
const addFile = async (source, target) => addText(target, await readFile(path.join(coreRoot, source), 'utf8'))

for (const skill of authored) {
  await addFile(skill.canonical_path, `skills/${skill.id}/SKILL.md`)
  if (skill.contract_path) await addFile(skill.contract_path, skill.contract_path)
}
for (const resource of [...(core.references ?? []), ...(core.tools ?? []), ...(core.examples ?? [])]) {
  await addFile(resource, resource)
}
await addFile('manifest.json', 'v10-manifest.json')

addText('plugin.json', `${JSON.stringify(metadata, null, 2)}\n`)
addText('LICENSE', await readFile(path.join(root, 'LICENSE'), 'utf8'))
addText('.codex-plugin/plugin.json', `${JSON.stringify({
  name: metadata.name,
  version: metadata.version,
  description: metadata.description,
  author: metadata.author,
  skills: './skills/',
  interface: metadata.extensions['com.openai'].interface,
}, null, 2)}\n`)
addText('README.md', `# US Vertical Drama Studio V10 — GPT plugin preview\n\nThis package exposes Intake, Story Architect, Episode Architect, independent review, a controller, and a separate creator-authorized screenplay draft skill. The source of truth is \`core/usvd-v10/\`.\n\nEarly development and review documents default to Simplified Chinese. Episode maps, screenplays, shot/asset packages, and generation-prompt reading views use paired Chinese and natural US English, delivered as matching DOCX and HTML files. English dialogue is the performed line; its Chinese meaning is explicitly unspoken. Model prompt import fields retain one selected submission language. The final available project assets can be bundled in a ZIP with a manifest and honest partial/gate status. A directly authorized draft may use the complete canonical Story Package or a same-revision Episode Architecture DOCX/HTML with an exact matching independent review; the latter is labeled \`REVIEW_ATTESTED_VIEW\` because canonical JSON cannot be recomputed from a readable view. It must display \`CREATOR_AUTHORIZED_DRAFT\`, “系统未批准｜不可投产”. An unspecified continuation starts with EP01–EP03 as a stated first-batch assumption.\n\nThe trusted human approval runtime and protected production Screenwriter are not implemented (ND-001). The creator-authorized draft path does not set system \`APPROVED\`, change Story Truth, or authorize downstream production. This package does not invoke image/video services or external production APIs. Authored skills remain unvalidated in the Core manifest.\n`)

const pathSet = new Set(expected.keys())
if (!checkOnly) {
  for (const [relative, content] of expected) {
    const target = path.join(destRoot, ...relative.split('/'))
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, content, 'utf8')
  }
  console.log(`Wrote ${expected.size} V10 plugin files to ${path.relative(root, destRoot)}`)
  process.exit(0)
}

const mismatches = []
for (const [relative, expectedContent] of expected) {
  try {
    const actual = await readFile(path.join(destRoot, ...relative.split('/')), 'utf8')
    if (actual !== expectedContent) mismatches.push(relative)
  } catch {
    mismatches.push(relative)
  }
}
try {
  const actualFiles = await listFiles(destRoot)
  for (const relative of actualFiles) if (!pathSet.has(relative)) mismatches.push(`${relative} (unexpected)`)
} catch {
  mismatches.push('(distribution missing)')
}
if (mismatches.length) {
  console.error(`V10 GPT plugin is out of sync:\n${mismatches.map(item => `- ${item}`).join('\n')}`)
  process.exitCode = 1
} else {
  console.log(`V10 GPT plugin matches ${expected.size} Core-authored files.`)
}

async function listFiles(directory, prefix = '') {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) files.push(...await listFiles(path.join(directory, entry.name), relative))
    else files.push(relative)
  }
  return files
}
