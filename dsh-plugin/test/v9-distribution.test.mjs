import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { checkDistributionSync, loadCore } from '../../scripts/sync-v9-distributions.mjs'
import { createProvider, V9_DISTRIBUTION_MANIFEST } from '../index.js'

const root = new URL('../../', import.meta.url)

function readJson(path) {
  return JSON.parse(readFileSync(new URL(path, root), 'utf8'))
}

test('V9 generated distributions are byte-synchronized with canonical Core', () => {
  const result = checkDistributionSync()
  assert.equal(result.ok, true, result.problems.join('\n'))
  assert.equal(result.skills.length, 10)
})

test('generated ChatGPT/Codex V9 plugin mirrors all canonical Skill files', () => {
  const { skills } = loadCore()
  const generated = readJson('plugins/us-vertical-drama-studio-v9/manifest.json')
  assert.equal(generated.status, 'preview')
  assert.equal(generated.skill_count, 10)
  assert.deepEqual(generated.skills.map(item => item.name), skills.map(item => item.name))
  for (const skill of skills) {
    const distributed = readFileSync(new URL(`plugins/us-vertical-drama-studio-v9/skills/${skill.name}/SKILL.md`, root))
    assert.equal(distributed.equals(skill.content), true, skill.name)
  }
})

test('DSH enumerates the generated manifest instead of a hard-coded catalog', async () => {
  const provider = createProvider()
  const candidates = await provider.list()
  assert.equal(candidates.length, 10)
  assert.deepEqual(candidates.map(item => item.name), V9_DISTRIBUTION_MANIFEST.skills.map(item => item.name))
  assert.ok(candidates.some(item => item.name === 'usvd-v9-07-performance-cinematography'))
  assert.ok(candidates.some(item => item.name === 'usvd-v9-08-seedance-2-mini-adapter'))
  assert.ok(candidates.some(item => item.name === 'usvd-v9-09-prompt-qa'))
})

test('Tabbit and direct-upload V9 surfaces contain ten generated skills and deterministic ZIP bundles', () => {
  const tabbit = readJson('tabbit/v9/manifest.json')
  assert.equal(tabbit.status, 'preview')
  assert.equal(tabbit.skills.length, 10)
  const chatgptZip = readFileSync(new URL('direct-upload/v9/chatgpt/usvd-v9-09-prompt-qa.zip', root))
  const tabbitZip = readFileSync(new URL('tabbit/v9/bundles/usvd-v9-09-prompt-qa.zip', root))
  assert.equal(chatgptZip.readUInt32LE(0), 0x04034b50)
  assert.equal(tabbitZip.readUInt32LE(0), 0x04034b50)
  const claudeSkill = readFileSync(new URL('direct-upload/v9/claude/usvd-v9-09-prompt-qa/skill.md', root))
  const coreSkill = readFileSync(new URL('core/usvd-v9/skills/09-prompt-qa/SKILL.md', root))
  assert.equal(claudeSkill.equals(coreSkill), true)
})

test('stable V1/V2 distribution surfaces remain present while V9 is preview-only', () => {
  const marketplace = readJson('.agents/plugins/marketplace.json')
  assert.ok(marketplace.plugins.some(item => item.name === 'us-vertical-drama-studio'))
  assert.ok(marketplace.plugins.some(item => item.name === 'us-vertical-drama-studio-v9'))
  const stableTabbit = readJson('tabbit/v2/manifest.json')
  assert.equal(stableTabbit.version, '2.0.1')
  const stablePlugin = readJson('plugins/us-vertical-drama-studio/.codex-plugin/plugin.json')
  assert.equal(stablePlugin.name, 'us-vertical-drama-studio')
  const v9Plugin = readJson('plugins/us-vertical-drama-studio-v9/.codex-plugin/plugin.json')
  assert.equal(v9Plugin.name, 'us-vertical-drama-studio-v9')
  assert.match(v9Plugin.interface.displayName, /V9 Preview/)
})

test('MediaGo V9 source is generated without fabricating an unverified MGPK container', () => {
  const media = readJson('mediago/v9/manifest.json')
  const readme = readFileSync(new URL('mediago/v9/README.md', root), 'utf8')
  assert.equal(media.skills.length, 10)
  assert.equal(media.native_mgpack.status, 'not-generated')
  assert.match(media.native_mgpack.reason, /No verified MediaGo-native V9 MGPK packager/)
  assert.match(readme, /custom `MGPK` container/)
})
