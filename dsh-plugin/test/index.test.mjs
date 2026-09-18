import assert from 'node:assert/strict'
import test from 'node:test'
import { apply, createProvider, parseSkill, V9_DISTRIBUTION_MANIFEST } from '../index.js'

test('parses a canonical skill frontmatter block', () => {
  assert.deepEqual(
    parseSkill('---\nname: demo-skill\ndescription: "Demo description"\n---\n\n# Demo\n', 'demo-skill'),
    { name: 'demo-skill', description: 'Demo description', content: '# Demo' },
  )
})

test('registers a native provider and exposes the generated V9 skill catalog', async () => {
  let providerFactory
  let disposed = false
  const ctx = { skills: { registerProvider: factory => {
    providerFactory = factory
    return () => { disposed = true }
  } } }
  const dispose = apply(ctx)
  const provider = providerFactory()
  const candidates = await provider.list()
  assert.equal(provider.name, 'us-vertical-drama-studio-v9-bundled')
  assert.equal(candidates.length, 10)
  assert.deepEqual(candidates.map(item => item.name), V9_DISTRIBUTION_MANIFEST.skills.map(item => item.name))
  assert.equal(candidates.at(-1).resourceBase.kind, 'directory')
  assert.equal(candidates.at(-1).invocation.userInvocable, true)
  const screenplay = await provider.get(candidates.find(item => item.name === 'usvd-03-screenwriter'))
  assert.match(screenplay.content, /USVD 03|剧本编写/i)
  assert.equal(await provider.get({ name: 'not-a-real-skill' }), undefined)
  dispose()
  assert.equal(disposed, true)
})

test('provider catalog cannot be redirected by a forged path', async () => {
  const provider = createProvider()
  const [candidate] = await provider.list()
  const skill = await provider.get({ ...candidate, path: '/etc/passwd' })
  assert.match(skill.content, /USVD|US Vertical Drama/i)
})
