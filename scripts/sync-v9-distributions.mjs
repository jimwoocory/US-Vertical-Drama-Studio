import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const coreRoot = join(repoRoot, 'core', 'usvd-v9')
const coreManifestPath = join(coreRoot, 'manifest.json')
const V9_VERSION = '0.9.0-preview.1'
const V9_STATUS = 'preview'

const managedRoots = [
  'plugins/us-vertical-drama-studio-v9',
  'direct-upload/v9',
  'tabbit/v9',
  'mediago/v9',
]

const resourceMap = {
  '06-storyboard': ['contracts/stage-06-storyboard.json'],
  '07-performance-cinematography': ['contracts/stage-07-performance-cinematography.json'],
  '08-seedance-2-mini-adapter': ['contracts/stage-08-seedance-2-mini-adapter.json'],
  '09-prompt-qa': [
    'contracts/stage-09-prompt-qa.json',
    'references/prompt-qa-human-checklist.md',
  ],
}

const displayNames = {
  controller: 'USVD V9 总控',
  '01-adaptation': 'USVD 01 欧美本土化',
  '02-story-architecture': 'USVD 02 故事架构',
  '03-screenwriter': 'USVD 03 剧本编写',
  '04-review-continuity': 'USVD 04 审稿连续性',
  '05-asset-lock': 'USVD 05 资产锁定',
  '06-storyboard': 'USVD V9 06 分镜导演',
  '07-performance-cinematography': 'USVD V9 07 表演与摄影导演',
  '08-seedance-2-mini-adapter': 'USVD V9 08 Seedance 2.0 Mini Adapter',
  '09-prompt-qa': 'USVD V9 09 Prompt QA',
}

export function loadCore() {
  const manifest = JSON.parse(readFileSync(coreManifestPath, 'utf8'))
  const skills = manifest.skills
    .toSorted((a, b) => a.order - b.order)
    .map(entry => {
      const sourcePath = join(coreRoot, entry.canonical_path)
      const content = normalizedTextBuffer(readFileSync(sourcePath))
      const parsed = parseSkill(content.toString('utf8'), entry.id)
      return {
        ...entry,
        ...parsed,
        sourcePath,
        sourceRelative: relative(repoRoot, sourcePath).replaceAll('\\', '/'),
        content,
        resources: (resourceMap[entry.id] ?? []).map(rel => ({
          sourceRelative: `core/usvd-v9/${rel}`,
          basename: basename(rel),
          content: normalizedTextBuffer(readFileSync(join(coreRoot, rel))),
        })),
      }
    })
  return { manifest, skills }
}

export function buildDistributionPlan() {
  const { manifest, skills } = loadCore()
  const files = new Map()
  const sourceDigest = digestCore(manifest, skills)
  const generatedSkills = skills.map(skill => ({
    id: skill.id,
    order: skill.order,
    name: skill.name,
    description: skill.description,
    folder: skill.name,
    canonical_path: skill.sourceRelative,
    sha256: sha256(skill.content),
  }))

  const distributionManifest = {
    schema_version: 'usvd-v9-distribution-1',
    core_id: manifest.core_id,
    version: V9_VERSION,
    status: V9_STATUS,
    generated_from: 'core/usvd-v9/manifest.json',
    source_sha256: sourceDigest,
    skill_count: generatedSkills.length,
    skills: generatedSkills,
  }

  const pluginRoot = 'plugins/us-vertical-drama-studio-v9'
  addJson(files, `${pluginRoot}/manifest.json`, distributionManifest)
  addJson(files, `${pluginRoot}/.codex-plugin/plugin.json`, {
    author: { name: 'MediaGo Drama' },
    description: 'US Vertical Drama Studio V9 preview generated from the canonical V9 Core.',
    interface: {
      capabilities: ['Creative Writing', 'Analysis'],
      category: 'Creative',
      defaultPrompt: [
        'Route this US vertical drama project through the V9 gated production workflow.',
        'Create a model-agnostic V9 storyboard and performance/cinematography director package.',
        'Translate an approved director package into Seedance 2.0 Mini prompts and run Prompt QA.',
      ],
      developerName: 'MediaGo Drama',
      displayName: 'US Vertical Drama Studio V9 Preview',
      longDescription: 'Preview of the canonical USVD V9 workflow with separate Storyboard, Performance+Cinematography, Seedance 2.0 Mini Adapter, and Prompt QA stages.',
      shortDescription: 'USVD V9 preview generated from canonical Core.',
    },
    name: 'us-vertical-drama-studio-v9',
    skills: './skills/',
    version: V9_VERSION,
  })
  addText(files, `${pluginRoot}/README.md`, generatedReadme('ChatGPT / Codex plugin', sourceDigest))
  addSkills(files, `${pluginRoot}/skills`, skills, 'SKILL.md')

  for (const target of ['chatgpt', 'claude']) {
    const base = `direct-upload/v9/${target}`
    const filename = target === 'claude' ? 'skill.md' : 'SKILL.md'
    addText(files, `${base}/README.md`, generatedReadme(`${target} direct upload`, sourceDigest))
    for (const skill of skills) {
      const skillFiles = buildSkillFileMap(skill, filename)
      for (const [rel, content] of skillFiles) files.set(`${base}/${skill.name}/${rel}`, content)
      files.set(`${base}/${skill.name}.zip`, buildZip(skillFiles))
    }
  }

  const tabbitRoot = 'tabbit/v9'
  addText(files, `${tabbitRoot}/README.md`, generatedReadme('Tabbit V9', sourceDigest))
  addSkills(files, `${tabbitRoot}/skills`, skills, 'SKILL.md')
  const tabbitSkills = skills.map(skill => ({
    slug: skill.name,
    display_name: displayNames[skill.id] ?? skill.name,
    bundle: `bundles/${skill.name}.zip`,
    description: skill.description,
    canonical_path: skill.sourceRelative,
    sha256: sha256(skill.content),
  }))
  addJson(files, `${tabbitRoot}/manifest.json`, {
    version: V9_VERSION,
    status: V9_STATUS,
    generated_from: 'core/usvd-v9/manifest.json',
    source_sha256: sourceDigest,
    skills: tabbitSkills,
  })
  for (const skill of skills) files.set(`${tabbitRoot}/bundles/${skill.name}.zip`, buildZip(buildSkillFileMap(skill, 'SKILL.md')))

  const mediaRoot = 'mediago/v9'
  addText(files, `${mediaRoot}/README.md`, [
    '# MediaGo V9 generated source',
    '',
    'This directory is generated from `core/usvd-v9` by `scripts/sync-v9-distributions.mjs`.',
    '',
    'It provides the canonical V9 Skill source and machine-readable manifest for MediaGo integration. The existing `US-Vertical-Drama-Studio-v1.0.0.mgpack` is preserved unchanged. The `.mgpack` format is a custom `MGPK` container, not a ZIP, and this repository does not contain a verified MediaGo-native V9 packager; therefore this build intentionally does not fabricate a V9 `.mgpack`.',
    '',
    'A MediaGo-native pack may be produced only by a verified MediaGo packager/import pipeline. Until then, use `manifest.json` and `skills/` as the V9 integration source.',
    '',
    `Core source SHA-256: \`${sourceDigest}\``,
    '',
  ].join('\n'))
  addSkills(files, `${mediaRoot}/skills`, skills, 'SKILL.md')
  addJson(files, `${mediaRoot}/manifest.json`, {
    ...distributionManifest,
    distribution: 'mediago-source',
    native_mgpack: {
      status: 'not-generated',
      reason: 'No verified MediaGo-native V9 MGPK packager is present in this repository.',
      preserved_legacy_pack: 'mediago/US-Vertical-Drama-Studio-v1.0.0.mgpack',
    },
  })

  return { files, distributionManifest, sourceDigest, skills }
}

export function syncDistributions() {
  const plan = buildDistributionPlan()
  for (const root of managedRoots) rmSync(join(repoRoot, root), { recursive: true, force: true })
  for (const [rel, content] of plan.files) {
    const full = join(repoRoot, rel)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, content)
  }
  updateMarketplace(true)
  return plan
}

export function checkDistributionSync() {
  const plan = buildDistributionPlan()
  const problems = []
  for (const [rel, expected] of plan.files) {
    const full = join(repoRoot, rel)
    if (!existsSync(full)) {
      problems.push(`missing: ${rel}`)
      continue
    }
    const actual = readFileSync(full)
    if (!distributionBuffersEqual(rel, actual, expected)) problems.push(`out-of-sync: ${rel}`)
  }
  const expectedPaths = new Set(plan.files.keys())
  for (const root of managedRoots) {
    const fullRoot = join(repoRoot, root)
    if (!existsSync(fullRoot)) continue
    for (const file of walkFiles(fullRoot)) {
      const rel = relative(repoRoot, file).replaceAll('\\', '/')
      if (!expectedPaths.has(rel)) problems.push(`unexpected-generated-file: ${rel}`)
    }
  }
  problems.push(...updateMarketplace(false))
  return { ok: problems.length === 0, problems, ...plan }
}

function updateMarketplace(write) {
  const path = join(repoRoot, '.agents', 'plugins', 'marketplace.json')
  const marketplace = JSON.parse(readFileSync(path, 'utf8'))
  const entry = {
    category: 'Creative',
    name: 'us-vertical-drama-studio-v9',
    policy: { authentication: 'ON_INSTALL', installation: 'AVAILABLE' },
    source: { path: './plugins/us-vertical-drama-studio-v9', source: 'local' },
  }
  marketplace.plugins = marketplace.plugins.filter(item => item.name !== entry.name)
  marketplace.plugins.push(entry)
  const expected = jsonBuffer(marketplace)
  if (write) {
    writeFileSync(path, expected)
    return []
  }
  const actual = readFileSync(path)
  return normalizedTextBuffer(actual).equals(normalizedTextBuffer(expected)) ? [] : ['out-of-sync: .agents/plugins/marketplace.json']
}

function addSkills(files, base, skills, skillFilename) {
  for (const skill of skills) {
    for (const [rel, content] of buildSkillFileMap(skill, skillFilename)) {
      files.set(`${base}/${skill.name}/${rel}`, content)
    }
  }
}

function buildSkillFileMap(skill, skillFilename) {
  const map = new Map([[skillFilename, skill.content]])
  for (const resource of skill.resources) map.set(`references/${resource.basename}`, resource.content)
  return map
}

function generatedReadme(target, sourceDigest) {
  return [
    `# USVD V9 Preview — ${target}`,
    '',
    'Generated artifact. Do not hand-edit this directory.',
    '',
    'Canonical source: `core/usvd-v9/`.',
    'Regenerate with: `npm run build:v9`.',
    'Verify with: `npm run check:v9`.',
    '',
    `Version: \`${V9_VERSION}\``,
    `Status: \`${V9_STATUS}\``,
    `Core source SHA-256: \`${sourceDigest}\``,
    '',
  ].join('\n')
}

function digestCore(manifest, skills) {
  const hash = createHash('sha256')
  hash.update(JSON.stringify(manifest))
  for (const skill of skills) {
    hash.update(skill.id)
    hash.update(skill.content)
    for (const resource of skill.resources) {
      hash.update(resource.sourceRelative)
      hash.update(resource.content)
    }
  }
  return hash.digest('hex')
}

function parseSkill(raw, id) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/u.exec(raw)
  if (!match) throw new Error(`${id}: missing YAML frontmatter`)
  const name = /^name:\s*([^\r\n]+)$/mu.exec(match[1])?.[1]?.trim()
  const descriptionRaw = /^description:\s*([^\r\n]+)$/mu.exec(match[1])?.[1]?.trim()
  if (!name || !descriptionRaw) throw new Error(`${id}: name/description missing`)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name)) throw new Error(`${id}: invalid skill name ${name}`)
  return { name, description: unquote(descriptionRaw) }
}

function unquote(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) return value.slice(1, -1)
  return value
}

function addText(files, path, text) {
  files.set(path, Buffer.from(text.endsWith('\n') ? text : `${text}\n`, 'utf8'))
}

function addJson(files, path, value) {
  files.set(path, jsonBuffer(value))
}

function jsonBuffer(value) {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function normalizedTextBuffer(buffer) {
  return Buffer.from(buffer.toString('utf8').replace(/\r\n?/gu, '\n'), 'utf8')
}

function distributionBuffersEqual(path, actual, expected) {
  if (path.endsWith('.zip')) return actual.equals(expected)
  return normalizedTextBuffer(actual).equals(normalizedTextBuffer(expected))
}

function walkFiles(root) {
  const files = []
  for (const entry of readdirSync(root)) {
    const full = join(root, entry)
    if (statSync(full).isDirectory()) files.push(...walkFiles(full))
    else files.push(full)
  }
  return files
}

function buildZip(entries) {
  const localParts = []
  const centralParts = []
  let offset = 0
  for (const [nameRaw, contentRaw] of entries) {
    const name = nameRaw.replaceAll('\\', '/')
    const nameBytes = Buffer.from(name, 'utf8')
    const content = Buffer.isBuffer(contentRaw) ? contentRaw : Buffer.from(contentRaw)
    const crc = crc32(content)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0, 6)
    local.writeUInt16LE(0, 8)
    local.writeUInt16LE(0, 10)
    local.writeUInt16LE(0x21, 12)
    local.writeUInt32LE(crc >>> 0, 14)
    local.writeUInt32LE(content.length, 18)
    local.writeUInt32LE(content.length, 22)
    local.writeUInt16LE(nameBytes.length, 26)
    local.writeUInt16LE(0, 28)
    localParts.push(local, nameBytes, content)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0, 8)
    central.writeUInt16LE(0, 10)
    central.writeUInt16LE(0, 12)
    central.writeUInt16LE(0x21, 14)
    central.writeUInt32LE(crc >>> 0, 16)
    central.writeUInt32LE(content.length, 20)
    central.writeUInt32LE(content.length, 24)
    central.writeUInt16LE(nameBytes.length, 28)
    central.writeUInt16LE(0, 30)
    central.writeUInt16LE(0, 32)
    central.writeUInt16LE(0, 34)
    central.writeUInt16LE(0, 36)
    central.writeUInt32LE(0, 38)
    central.writeUInt32LE(offset, 42)
    centralParts.push(central, nameBytes)
    offset += local.length + nameBytes.length + content.length
  }
  const centralBuffer = Buffer.concat(centralParts)
  const end = Buffer.alloc(22)
  const count = entries.size
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(count, 8)
  end.writeUInt16LE(count, 10)
  end.writeUInt32LE(centralBuffer.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)
  return Buffer.concat([...localParts, centralBuffer, end])
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const result = checkDistributionSync()
    if (!result.ok) {
      console.error(result.problems.join('\n'))
      process.exitCode = 1
    } else {
      console.log(`V9 distributions are synchronized: ${result.skills.length} skills, source ${result.sourceDigest}`)
    }
  } else {
    const result = syncDistributions()
    console.log(`Generated V9 distributions: ${result.skills.length} skills, source ${result.sourceDigest}`)
  }
}
