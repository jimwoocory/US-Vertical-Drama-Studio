/**
 * DeepSeek Harness adapter for US Vertical Drama Studio.
 *
 * The canonical Skill files remain in this repository's plugin directory.
 * At profile startup this adapter exposes them through DSH's `ctx.skills`
 * registry, so DSH's normal skill tool and slash invocation load the same
 * eight instructions and references used by the ChatGPT/Codex distribution.
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'us-vertical-drama-studio'
export const inject = ['skills']

const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const skillsDirectory = join(moduleDirectory, '..', 'plugins', 'us-vertical-drama-studio', 'skills')

const skillFolders = [
  'us-vertical-drama-studio',
  'us-vertical-drama-adapter',
  'us-vertical-drama-showrunner',
  'us-vertical-drama-episode-architect',
  'us-vertical-drama-screenwriter',
  'us-vertical-drama-script-doctor',
  'us-vertical-drama-continuity-editor',
  'us-vertical-drama-storyboard-director',
]

/**
 * Register a native DSH skill provider.
 *
 * `registerProvider()` is deliberately used instead of pushing opaque runtime
 * entries into the registry. It lets DSH enumerate and retrieve the bundled
 * Skills through its normal provider lifecycle, including slash invocation
 * and resource resolution.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @returns {() => void}
 */
export function apply(ctx) {
  return ctx.skills.registerProvider(() => createProvider())
}

/**
 * Build a provider object without importing DSH implementation packages.
 * This keeps the plugin tied to DSH's public `ctx.skills` contract rather
 * than to an internal copy of the skill service.
 */
export function createProvider() {
  const catalog = new Map(skillFolders.map(folder => {
    const skillDirectory = join(skillsDirectory, folder)
    const parsed = readCanonicalSkill(folder)
    return [parsed.name, { folder, skillDirectory, ...parsed }]
  }))

  return {
    name: 'us-vertical-drama-studio-bundled',
    async list() {
      return [...catalog.values()].map(toCandidate)
    },
    async get(candidate) {
      const entry = catalog.get(candidate?.name)
      if (entry === undefined) return undefined

      // Reload only a catalogued file. A candidate must never be able to make
      // this provider read an arbitrary path from the local filesystem.
      const parsed = readCanonicalSkill(entry.folder)
      if (parsed.name !== candidate.name) {
        throw new Error(`Bundled skill name changed unexpectedly: ${entry.folder}`)
      }
      return {
        ...toCandidate({ ...entry, ...parsed }),
        content: parsed.content,
      }
    },
  }
}

function readCanonicalSkill(folder) {
  return parseSkill(readFileSync(join(skillsDirectory, folder, 'SKILL.md'), 'utf8'), folder)
}

function toCandidate(entry) {
  return {
    name: entry.name,
    description: entry.description,
    provider: 'us-vertical-drama-studio-bundled',
    source: 'bundled',
    rank: 600,
    path: join(entry.skillDirectory, 'SKILL.md'),
    locator: { relativePath: `${entry.folder}/SKILL.md` },
    resourceBase: { kind: 'directory', path: entry.skillDirectory },
    invocation: { modelInvocable: true, userInvocable: true },
  }
}

/**
 * Parse the minimal frontmatter contract DSH needs from a canonical Skill.
 * Keeping this parser deliberately small prevents the adapter from becoming a
 * second authoring format.
 */
export function parseSkill(raw, folder) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u.exec(raw)
  if (match === null) throw new Error(`${folder}/SKILL.md must contain YAML frontmatter`)

  const name = /^name:\s*([^\r\n]+)$/mu.exec(match[1])?.[1]?.trim()
  const description = /^description:\s*([^\r\n]+)$/mu.exec(match[1])?.[1]?.trim()
  if (name === undefined || description === undefined) {
    throw new Error(`${folder}/SKILL.md must declare name and description`)
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name)) {
    throw new Error(`${folder}/SKILL.md has an invalid DSH skill name: ${name}`)
  }
  return { name, description: unquote(description), content: match[2].trim() }
}

function unquote(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value
}
