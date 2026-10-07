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
addText('README.md', `# US Vertical Drama Studio V10 — GPT plugin preview\n\nThis Agent Plugins package exposes the V10-authored workflow: Intake/Adaptation, Story Architect, Episode Architect, independent story review, and a controller that routes only one allowed stage at a time. The source of truth for skill instructions and contracts is \`core/usvd-v10/\`.\n\n## Make the workflow visible\n\n- Adaptation produces a source-backed retain/cut/merge/redesign decision table and identifies downstream consequences.\n- Story Architect creates the complete causal story, character/relationship states, season arc, reveals, promises, and narrative asset requirements.\n- Episode Architect is separate and maps every episode as a mini dramatic arc with entry/exit state and canon references.\n- Review is a separate skill and binds its evidence to the exact artifact revision and digest.\n- The controller reports the current gate and one next action; it never writes story content itself.\n\n## Import and limitation\n\nThe ZIP contains one plugin directory with a root \`plugin.json\` and skills under \`skills/\`. Import it only in a client that supports Agent Plugins. V10 trusted human approval and protected Screenwriter execution are not implemented (ND-001); this preview stops at \`AWAITING_HUMAN_APPROVAL\` and must not be treated as an approval runtime. This package does not invoke image/video services or external production APIs.\n\nAll included skills are marked authored but unvalidated in the Core manifest. This is a workflow preview, not a claim that the V10 pipeline is fully operational.\n`)

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
