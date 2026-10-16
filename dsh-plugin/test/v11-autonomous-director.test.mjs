import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  creativeDirectorRequest, directorStoryboardHandoff, extractDirectorSource,
  runAutonomousDirector, DIRECTOR_CREATIVE_POLICY,
} from '../../scripts/v11-autonomous-director.mjs'

const expected = JSON.parse(readFileSync(new URL('./fixtures/v11-ep01-girl-wearing-my-name-rehearsal.json', import.meta.url)))
const checks = ['character_goal_and_strategy', 'opponent_response',
  'causal_and_knowledge_order', 'emotional_setup_and_payoff',
  'cliffhanger_and_next_episode', 'scene_geography_and_continuity']

function source() {
  return {
    ...structuredClone(expected),
    source_units: expected.source_units.map(({ options, ...rest }) => rest),
  }
}
function generatorFromFixture() {
  let called = 0
  return async (request) => {
    called += 1
    assert.equal(request.policy.ordinary_rewrite_requires_human_approval, false)
    assert.equal(request.source_units.length, 9)
    assert.equal(request.source_units.every(u => !Object.hasOwn(u, 'options')), true)
    return {
      generator_id: 'LIVE-WRITER-ADAPTER',
      run_id: 'writer-run-' + called,
      output: { units: expected.source_units.map(u => ({
        source_unit_id: u.source_unit_id,
        options: structuredClone(u.options),
      })) },
    }
  }
}
test('the director requires a real model adapter and will not fake autonomous authorship', async () => {
  const result = await runAutonomousDirector(source(), {})
  assert.equal(result.status, 'blocked')
  assert.equal(result.diagnostics[0].code, 'director_model_not_connected')
})
test('creative model mock returns a draft from original script facts rather than preauthored input options', async () => {
  const input = source()
  const before = structuredClone(input)
  const draft = await runAutonomousDirector(input, {generateAlternatives:generatorFromFixture()})
  assert.deepEqual(input, before, 'No in-place alteration of canonical source.')
  assert.equal(draft.status, 'director_draft_unverified')
  assert.equal(draft.episode_timing.total_duration_seconds, 113.9)
  assert.equal(draft.director_revision.status, 'draft')
  assert.equal(draft.director_revision.story_guards.causal_chain, 'unverified')
  assert.equal(draft.production_gate, 'BLOCKED')
  assert.equal(draft.media_validation.voice_readthrough, 'NOT_RUN')
  assert.equal(draft.planning_slots.length, 8)
  assert.equal(directorStoryboardHandoff(draft, input).ready_to_generate, false)
})
test('distinct audit adapter with matching exact content hash can document a model review, not media readiness', async () => {
  const result = await runAutonomousDirector(source(), {
    generateAlternatives: generatorFromFixture(),
    reviewDrama: async (request) => ({
      status: 'pass', reviewed_hash: request.reference_digest,
      reviewer_id: 'LIVE-ADVERSARIAL-REVIEWER', run_id: 'audit-run-002',
      director_revision_id: request.director_revision.revision_id,
      source_revision_id: request.director_revision.source_revision_id,
      checks: Object.fromEntries(checks.map(k => [k, {
        result:'pass', evidence:'Source SRC-01..SRC-09 mapped to director DU-001..DU-009; review claim, not human attestation.',
      }])),
    }),
  })
  assert.equal(result.status,'director_revision_model_reviewed')
  assert.equal(result.story_review.status,'model_review_pass_claim')
  assert.equal(result.production_gate,'BLOCKED')
  assert.equal(result.media_validation.video,'NOT_RUN')
  assert.equal(result.director_revision.status,'locked')
  const handoff=directorStoryboardHandoff(result, source())
  assert.equal(handoff.status,'planning_only')
  assert.equal(handoff.ready_to_generate,false)
  assert.equal(handoff.slots.every(s=>s.needs_asset_lock&&s.needs_natural_voice_timing),true)
})
test('same-model self review and fake or stale digest remain unverified', async () => {
  const result=await runAutonomousDirector(source(),{
    generateAlternatives:generatorFromFixture(),
    reviewDrama:async request=>({
      status:'pass',reviewer_id:'LIVE-WRITER-ADAPTER',run_id:'writer-run-1',
      source_revision_id:request.source.source_revision_id,
      director_revision_id:request.director_revision.revision_id,
      reviewed_hash:'a'.repeat(64),
      checks:Object.fromEntries(checks.map(k=>[k,{result:'pass',evidence:'Evidence stub'}])),
    }),
  })
  assert.equal(result.status,'director_draft_unverified')
  assert.equal(result.story_review.status,'unverified')
  assert.equal(result.director_revision.status,'draft')
})
test('candidate model cannot rewrite the source ledger, disappear units or claim invented beats', async()=>{
  const input=source()
  const bad=await runAutonomousDirector(input,{
    generateAlternatives:async()=>({
      generator_id:'test',run_id:'test-1',
      output:{units:[{source_unit_id:'NOT-THE-SOURCE',options:[]}]},
    }),
  })
  assert.equal(bad.diagnostics[0].code,'director_alternatives_count_invalid')
  const invented=await runAutonomousDirector(input,{
    generateAlternatives:async()=>({
      generator_id:'test',run_id:'test-2',
      output:{units:expected.source_units.map((u,i)=>({
        source_unit_id:u.source_unit_id,
        options:i===0?[{...u.options[1],delivers:['INVENTED_FACT']}]:u.options,
      }))},
    }),
  })
  assert.equal(invented.status,'blocked')
  assert.ok(invented.diagnostics.some(x=>x.code.includes('new_fact')))
})
test('source extraction rejects fabricated literal excerpts and missing protected beat IDs',async()=>{
  const raw={
    raw_screenplay:'INT. ROOM. Eve learns the true name. Eve walks to the door.',
    protected_event_ids:['RECOGNITION'],
    source_revision_id:'S1',director_revision_id:'D2',
    project_brief:expected.project_brief,
  }
  const bad=await extractDirectorSource(raw, async()=>({
    run_id:'extract-1',
    output:{source_units:[{source_unit_id:'S-1',scene_id:'ROOM',source_text:'AN INVENTED LINE',known_events:['RECOGNITION'],must_preserve:['RECOGNITION']}]},
  }))
  assert.equal(bad.diagnostics[0].code,'director_extraction_unverified_source')
  const good=await extractDirectorSource(raw,async()=>({
    run_id:'extract-2',
    output:{
      episode_direction:structuredClone(expected.episode_direction),
      source_units:[{
        source_unit_id:'S-1',scene_id:'ROOM',
        source_text:'Eve learns the true name.',
        known_events:['RECOGNITION'],must_preserve:['RECOGNITION'],
        options:[{take_id:'FAKE',text:'MODEL ATTEMPT TO INJECT OPTIONS'}],
      }],
    },
  }))
  assert.equal(good.status,'extracted_unverified')
  assert.equal(good.source.source_units[0].options,undefined)
  assert.deepEqual(good.source.required_events,['RECOGNITION'])
})
test('creative request explicitly preserves character agency, payoff and performance budgets',()=>{
  const req=creativeDirectorRequest(source())
  assert.equal(req.policy.max_video_seconds,15)
  assert.ok(req.instructions.some(s=>s.includes('opponent response')))
  assert.ok(DIRECTOR_CREATIVE_POLICY.prohibited.includes('new_canon'))
})
