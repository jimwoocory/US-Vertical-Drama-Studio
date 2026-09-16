import assert from 'node:assert/strict'
import test from 'node:test'
import { apply, createProvider, parseSkill } from '../index.js'

test('parses a canonical skill frontmatter block', () => {
  assert.deepEqual(
    parseSkill('---\nname: demo-skill\ndescription: "Demo description"\n---\n\n# Demo\n', 'demo-skill'),
    { name: 'demo-skill', description: 'Demo description', content: '# Demo' },
  )
})

test('registers a native provider and exposes the eight canonical skills', async () => {
  let providerFactory
  let disposed = false
  const ctx = { skills: { registerProvider: factory => {
    providerFactory = factory
    return () => { disposed = true }
  } } }
  const dispose = apply(ctx)
  const provider = providerFactory()
  const candidates = await provider.list()
  assert.equal(provider.name, 'us-vertical-drama-studio-bundled')
  assert.equal(candidates.length, 8)
  assert.deepEqual(candidates.map(item => item.name), [
    'us-vertical-drama-studio',
    'us-vertical-drama-adapter',
    'us-vertical-drama-showrunner',
    'us-vertical-drama-episode-architect',
    'us-vertical-drama-screenwriter',
    'us-vertical-drama-script-doctor',
    'us-vertical-drama-continuity-editor',
    'us-vertical-drama-storyboard-director',
  ])
  assert.equal(candidates[7].resourceBase.kind, 'directory')
  assert.equal(candidates[7].invocation.userInvocable, true)
  const screenplay = await provider.get(candidates[4])
  assert.match(screenplay.content, /US Vertical Drama Screenwriter/i)
  assert.equal(await provider.get({ name: 'not-a-real-skill' }), undefined)
  dispose()
  assert.equal(disposed, true)
})

test('provider catalog cannot be redirected by a forged path', async () => {
  const provider = createProvider()
  const [candidate] = await provider.list()
  const skill = await provider.get({ ...candidate, path: '/etc/passwd' })
  assert.match(skill.content, /US Vertical Drama/i)
})
