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
 * Register all canonical skills as DSH runtime skills.
 *
 * DSH's standard profile already supplies the `skill` consumer/tool. This
 * plugin only adds the domain instructions and supplies their directory as a
 * resource base, allowing linked references to resolve at runtime.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @returns {() => void}
 */
export function apply(ctx) {
  const disposers = skillFolders.map(folder => {
    const skillDirectory = join(skillsDirectory, folder)
    const parsed = parseSkill(readFileSync(join(skillDirectory, 'SKILL.md'), 'utf8'), folder)
    return ctx.skills.register({
      name: parsed.name,
      description: parsed.description,
      content: parsed.content,
      provider: 'us-vertical-drama-studio',
      source: 'bundled',
      resourceBase: { kind: 'directory', path: skillDirectory },
      invocation: { modelInvocable: true, userInvocable: true },
    })
  })
  return () => disposers.reverse().forEach(dispose => dispose())
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
