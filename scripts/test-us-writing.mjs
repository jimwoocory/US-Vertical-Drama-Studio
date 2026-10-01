import assert from 'node:assert/strict'
import test from 'node:test'
import { buildDistributionPlan } from './sync-v9-distributions.mjs'

// The plan is in memory: this test writes no distribution/ZIP files.
test('writing reference links survive every future distribution surface', () => {
  const { files, skills } = buildDistributionPlan()
  const roots = [
    ['plugins/us-vertical-drama-studio-v9/skills', 'SKILL.md'],
    ['direct-upload/v9/chatgpt', 'SKILL.md'],
    ['direct-upload/v9/claude', 'skill.md'],
    ['tabbit/v9/skills', 'SKILL.md'],
    ['mediago/v9/skills', 'SKILL.md'],
  ]
  for (const skill of skills.filter(s => /^0[1-4]-/.test(s.id))) {
    for (const match of skill.content.toString().matchAll(/\]\((references\/[^)]+)\)/g)) {
      for (const [root, entry] of roots) {
        const directory = `${root}/${skill.name}`
        assert.ok(files.has(`${directory}/${entry}`), `${directory}/${entry}`)
        assert.ok(files.has(`${directory}/${match[1]}`), `missing linked resource: ${directory}/${match[1]}`)
      }
    }
  }
})
