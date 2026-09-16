import assert from 'node:assert/strict'
import test from 'node:test'
import { apply, parseSkill } from '../index.js'

test('parses a canonical skill frontmatter block', () => {
  assert.deepEqual(
    parseSkill('---\nname: demo-skill\ndescription: "Demo description"\n---\n\n# Demo\n', 'demo-skill'),
    { name: 'demo-skill', description: 'Demo description', content: '# Demo' },
  )
})

test('registers the eight canonical US Vertical Drama skills', () => {
  const registrations = []
  const ctx = { skills: { register: registration => {
    registrations.push(registration)
    return () => {}
  } } }
  const dispose = apply(ctx)
  assert.equal(registrations.length, 8)
  assert.deepEqual(registrations.map(item => item.name), [
    'us-vertical-drama-studio',
    'us-vertical-drama-adapter',
    'us-vertical-drama-showrunner',
    'us-vertical-drama-episode-architect',
    'us-vertical-drama-screenwriter',
    'us-vertical-drama-script-doctor',
    'us-vertical-drama-continuity-editor',
    'us-vertical-drama-storyboard-director',
  ])
  assert.equal(registrations[7].resourceBase.kind, 'directory')
  dispose()
})
