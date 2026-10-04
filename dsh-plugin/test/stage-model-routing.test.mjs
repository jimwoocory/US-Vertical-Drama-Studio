import assert from 'node:assert/strict'
import test from 'node:test'

import {
  STAGE_MODEL_ROUTES,
  resolveStageModel,
  stageRouteFor,
} from '../model-routing/routes.js'
import {
  ROUTING_SCHEMA,
  routeStageModel,
} from '../model-routing/router.js'
import {
  ROUTING_MARKER,
  registerStageModelRoutingHook,
} from '../model-routing/tool.js'

const catalog = {
  groups: [
    {
      id: 'anthropic',
      models: [
        { id: 'claude-sonnet-5', name: 'Claude Sonnet 5.5' },
        { id: 'claude-opus-5', name: 'Claude Opus 5.5' },
      ],
    },
    {
      id: 'openai',
      models: [
        { id: 'deployment-sol-prod', name: 'GPT-6.1 Sol' },
      ],
    },
  ],
}

test('V10 fixes stages 01-04 to the requested model contract', () => {
  assert.equal(stageRouteFor('usvd-01-adaptation').target, 'Claude Sonnet 5.5')
  assert.equal(stageRouteFor('usvd-02-story-architecture').target, 'Claude Opus 5.5')
  assert.equal(stageRouteFor('usvd-03-screenwriter').target, 'Claude Opus 5.5')
  assert.equal(stageRouteFor('usvd-04-review-continuity').target, 'GPT-6.1 Sol')
  assert.equal(stageRouteFor('usvd-05-asset-lock'), undefined)

  const expectations = [
    ['usvd-01-adaptation', 'anthropic', 'claude-sonnet-5', 'Claude Sonnet 5.5'],
    ['usvd-02-story-architecture', 'anthropic', 'claude-opus-5', 'Claude Opus 5.5'],
    ['usvd-03-screenwriter', 'anthropic', 'claude-opus-5', 'Claude Opus 5.5'],
    ['usvd-04-review-continuity', 'openai', 'deployment-sol-prod', 'GPT-6.1 Sol'],
  ]

  for (const [skill, provider, model, target] of expectations) {
    const resolved = resolveStageModel(catalog, skill)
    assert.equal(resolved.kind, 'resolved')
    assert.equal(resolved.target, target)
    assert.deepEqual(
      { provider: resolved.selected.provider, model: resolved.selected.model },
      { provider, model },
    )
  }

  assert.deepEqual(Object.keys(STAGE_MODEL_ROUTES), [
    'usvd-01-adaptation',
    'usvd-02-story-architecture',
    'usvd-03-screenwriter',
    'usvd-04-review-continuity',
  ])
})

test('legacy-looking ids are not accepted unless live catalog proves the required version', () => {
  const misleading = {
    groups: [{
      id: 'anthropic',
      models: [
        { id: 'claude-opus-5', name: 'Claude Opus 5' },
        { id: 'claude-sonnet-5', name: 'Claude Sonnet 5' },
      ],
    }],
  }

  assert.deepEqual(
    resolveStageModel(misleading, 'usvd-02-story-architecture'),
    {
      kind: 'unavailable',
      skill: 'usvd-02-story-architecture',
      target: 'Claude Opus 5.5',
      reason: 'REQUIRED_MODEL_UNAVAILABLE',
    },
  )

  assert.deepEqual(
    resolveStageModel(misleading, 'usvd-01-adaptation'),
    {
      kind: 'unavailable',
      skill: 'usvd-01-adaptation',
      target: 'Claude Sonnet 5.5',
      reason: 'REQUIRED_MODEL_UNAVAILABLE',
    },
  )
})

test('missing fixed target fails closed and never calls selectModel', async () => {
  let selects = 0
  const deps = {
    async modelCatalog() {
      return { groups: [{ id: 'anthropic', models: [{ id: 'other', name: 'Claude Fable 5.5' }] }] }
    },
    async selectModel() {
      selects += 1
      throw new Error('must not be called')
    },
    currentDefault() {
      return { provider: 'baseline', model: 'chat' }
    },
    async saveDefault() {},
  }

  const decision = await routeStageModel({
    deps,
    skill: 'usvd-03-screenwriter',
    sessionId: 'session-1',
    baselineSession: { provider: 'baseline', model: 'chat' },
  })

  assert.equal(decision.schema, ROUTING_SCHEMA)
  assert.equal(decision.status, 'blocked')
  assert.equal(decision.reason, 'REQUIRED_MODEL_UNAVAILABLE')
  assert.equal(decision.target, 'Claude Opus 5.5')
  assert.equal(decision.selected, null)
  assert.equal(selects, 0)
})

test('routing uses DSH selectModel, restores global default, and reports exact selection', async () => {
  let currentDefault = { provider: 'baseline-provider', model: 'baseline-model' }
  const selectedCalls = []
  const deps = {
    async modelCatalog() {
      return catalog
    },
    async selectModel(input) {
      selectedCalls.push(input)
      currentDefault = { provider: input.provider, model: input.model }
      return { selected: { provider: input.provider, model: input.model } }
    },
    currentDefault() {
      return currentDefault
    },
    async saveDefault(selection) {
      currentDefault = { ...selection }
    },
  }

  const decision = await routeStageModel({
    deps,
    skill: 'usvd-04-review-continuity',
    sessionId: 'session-04',
    baselineSession: { provider: 'baseline-provider', model: 'baseline-model' },
  })

  assert.equal(decision.status, 'routed')
  assert.equal(decision.reason, 'FIXED_STAGE_ROUTE')
  assert.equal(decision.target, 'GPT-6.1 Sol')
  assert.deepEqual(decision.selected, {
    provider: 'openai',
    model: 'deployment-sol-prod',
    name: 'GPT-6.1 Sol',
  })
  assert.deepEqual(selectedCalls, [{
    sessionId: 'session-04',
    provider: 'openai',
    model: 'deployment-sol-prod',
  }])
  assert.deepEqual(currentDefault, {
    provider: 'baseline-provider',
    model: 'baseline-model',
  })
})

test('native skill hook arms fixed route and re-arms the prior Session route after use', async () => {
  let postExecute
  let currentDefault = { provider: 'baseline-provider', model: 'baseline-model' }
  const selectCalls = []
  const logs = []
  let sessionEvent

  const session = {
    requestHeader() {
      return {
        config: { provider: 'baseline-provider', model: 'baseline-model' },
        adapterDefaults: {},
      }
    },
  }
  const agent = {
    id: 'session-hook',
    session,
    ctx: {
      on(event, listener) {
        assert.equal(event, 'session/event')
        sessionEvent = listener
        return () => { sessionEvent = undefined }
      },
    },
  }

  const ctx = {
    on(event, listener) {
      assert.equal(event, 'tools/post-execute')
      postExecute = listener
      return () => {}
    },
    get(name) {
      if (name === 'sessionController') {
        return {
          async modelCatalog() {
            return catalog
          },
          async selectModel(input) {
            selectCalls.push(input)
            currentDefault = { provider: input.provider, model: input.model }
            return { selected: { provider: input.provider, model: input.model } }
          },
        }
      }
      if (name === 'agentDefaultModel') {
        return {
          currentSelection() {
            return currentDefault
          },
          async saveSelection(selection) {
            currentDefault = { ...selection }
          },
        }
      }
      if (name === 'sessionProjections') {
        return {
          stateOf() {
            return { pending: null }
          },
        }
      }
      throw new Error(`unexpected service: ${name}`)
    },
  }

  const dispose = registerStageModelRoutingHook(ctx, { log: event => logs.push(event) })

  const result = await postExecute(
    {
      name: 'skill',
      arguments: { name: 'usvd-01-adaptation' },
      agent,
      signal: new AbortController().signal,
    },
    {
      isError: false,
      content: [{ type: 'text', text: 'skill loaded' }],
    },
    async () => ({ kind: 'accept' }),
  )

  assert.equal(result.kind, 'accept')
  assert.equal(selectCalls.length, 1)
  assert.deepEqual(selectCalls[0], {
    sessionId: 'session-hook',
    provider: 'anthropic',
    model: 'claude-sonnet-5',
  })
  assert.deepEqual(currentDefault, {
    provider: 'baseline-provider',
    model: 'baseline-model',
  })

  const routingBlock = result.content.find(block =>
    block.type === 'text' && block.text.startsWith(ROUTING_MARKER))
  assert.ok(routingBlock)
  const payload = JSON.parse(routingBlock.text.split('\n')[1])
  assert.equal(payload.target, 'Claude Sonnet 5.5')
  assert.equal(payload.status, 'routed')

  assert.equal(typeof sessionEvent, 'function')
  sessionEvent(session, {
    type: 'request/header',
    data: {
      header: {
        config: {
          provider: 'anthropic',
          model: 'claude-sonnet-5',
        },
      },
    },
  })

  await new Promise(resolve => setImmediate(resolve))

  assert.equal(selectCalls.length, 2)
  assert.deepEqual(selectCalls[1], {
    sessionId: 'session-hook',
    provider: 'baseline-provider',
    model: 'baseline-model',
  })
  assert.deepEqual(currentDefault, {
    provider: 'baseline-provider',
    model: 'baseline-model',
  })
  assert.ok(logs.some(item => item.event === 'session_revert_armed'))
  dispose()
})
