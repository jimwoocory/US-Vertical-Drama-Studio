import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
import {planDirectorEpisode} from '../../scripts/v11-director-planner.mjs'
const load=()=>JSON.parse(readFileSync(new URL('./fixtures/v11-ep01-girl-wearing-my-name-rehearsal.json',import.meta.url)))
test('paraphrased user EP01 produces a traceable playable candidate without claiming approval',()=>{
 const input=load();const r=planDirectorEpisode(input)
 assert.equal(r.status,'draft',JSON.stringify(r.diagnostics))
 assert.ok(r.estimates.source_raw_heuristic_seconds>120)
 assert.ok(r.episode_timing.total_duration_seconds>=60&&r.episode_timing.total_duration_seconds<=120)
 assert.equal(r.director_revision.units.length,input.source_units.length)
 assert.ok(r.selected_take_ids.some(x=>x.startsWith('DIRECTOR-')))
 assert.equal(r.director_revision.story_guards.emotional_setup_payoff,'unverified')
 assert.equal(r.estimates.measured_readthrough,false)
 assert.equal(r.video_slots.every(s=>s.status==='planning_only'&&s.end_seconds-s.start_seconds<=15),true)
 assert.equal(r.director_revision.units.at(-1).delivered_event_ids.includes('VIP_BLACKOUT_HOOK'),true)
})
test('source-protected chronology and knowledge facts block fabricated director alternatives',()=>{
 const x=load();x.source_units[0].options[1].delivers=['PUBLIC_SIENNA_ASSUMES_EVELYN']
 assert.equal(planDirectorEpisode(x).status,'blocked')
 const y=load();y.source_units.at(-1).options[1].delivers=[]
 assert.equal(planDirectorEpisode(y).status,'blocked')
})
test('program time includes transitions and allows multiple ordered beats within one source unit',()=>{
 const x=load();const a=planDirectorEpisode(x)
 assert.equal(a.status,'draft')
 assert.ok(a.episode_timing.timeline.some(t=>t.kind==='transition'))
 assert.deepEqual(a.director_revision.units[1].delivered_event_ids,['MASON_PASSES_ADRIAN_GOAL','MASON_CREDITS_TEAM'])
})
