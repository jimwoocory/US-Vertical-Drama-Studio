import test from 'node:test'
import assert from 'node:assert/strict'
import { planDirectorEpisode } from '../../scripts/v11-director-planner.mjs'

function fixture() {
  const names = ['deadline', 'shortfall', 'hope', 'condition', 'choice', 'response']
  const source_units = names.map((name, index) => {
    const id = 'SRC-' + index
    const long = ('I need you to understand the complete situation before we decide anything. ').repeat(10)
    const short = 'We need a decision, but keep the facts and the right to choose.'
    const event = 'BEAT-' + index
    return {
      source_unit_id: id, scene_id: 'FAMILY_ROOM', source_text: long, known_events: [event],
      must_preserve: [event], required: true, raw_timing: { reaction_seconds: 3 },
      options: [
        { take_id: 'FULL-' + index, operation: 'retain', source_unit_ids: [id], text: long,
          delivers: [event], quality_score: 10, timing: { reaction_seconds: 3 } },
        { take_id: 'DIRECTOR-' + index, operation: 'rewrite', source_unit_ids: [id], text: short,
          delivers: [event], quality_score: 8, reason: 'Cut repeated explanations but preserve the choice.',
          timing: { reaction_seconds: 7 } },
      ],
    }
  })
  return {
    source_revision_id: 'SCRIPT-1', director_revision_id: 'DIRECTOR-2',
    duration_policy: { scope: 'complete_episode', min_seconds: 60, max_seconds: 120, video_max_seconds: 15 },
    fixed_time: { opening_seconds: 4, ending_seconds: 3, audio_tail_seconds: 1 },
    episode_direction: Object.fromEntries(['objective','situation_change','character_tactic','opponent_response','knowledge_sequence','emotional_payoff','continuing_hook'].map(x=>[x,'Specific change'])),
    event_dependencies: names.slice(1).map((_,i)=>({before:'BEAT-'+i,after:'BEAT-'+(i+1)})),
    source_units,
  }
}
test('chooses playable 60-120s revision from an overloaded source',()=>{
  const result = planDirectorEpisode(fixture())
  assert.equal(result.status, 'draft', JSON.stringify(result.diagnostics))
  assert.ok(result.episode_timing.total_duration_seconds >= 60)
  assert.ok(result.episode_timing.total_duration_seconds <= 120)
  assert.ok(result.estimates.source_raw_heuristic_seconds > 120)
  assert.equal(result.director_revision.units.length, 6)
  assert.equal(result.director_revision.status, 'draft')
  assert.ok(result.director_revision.units.some(u=>u.operation==='rewrite'))
  assert.ok(result.video_slots.every(s=>s.end_seconds-s.start_seconds<=15))
  assert.ok(result.video_slots.every(s=>s.status==='planning_only'))
  assert.equal(result.estimates.measured_readthrough, false)
  assert.equal(result.director_revision.story_guards.causal_chain, 'unverified')
})
test('rejects invented or missing protected story events',()=>{
  const x=fixture()
  x.source_units[0].options[1].delivers=['UNAPPROVED']
  assert.equal(planDirectorEpisode(x).status,'blocked')
  const y=fixture()
  y.source_units[0].options[1].delivers=[]
  assert.equal(planDirectorEpisode(y).status,'blocked')
})
test('protects causal order and refuses padding',()=>{
 const x=fixture()
 x.source_units.forEach(u=>{u.options=u.options.slice(1);u.options[0].timing={reaction_seconds:0};u.options[0].text='Short.'})
 const r=planDirectorEpisode(x)
 assert.equal(r.status,'blocked')
 assert.ok(r.diagnostics[0].code.includes('minimum'))
})
test('legacy must not receive new autonomous director authority',()=>{
 const x=fixture();delete x.duration_policy
 assert.equal(planDirectorEpisode(x).status,'blocked')
})
