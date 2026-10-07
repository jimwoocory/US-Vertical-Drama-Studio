#!/usr/bin/env node
/** Deterministic structural checkup for USVDS V10 artifacts. Node built-ins only. */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const contracts = resolve(here, '..', 'contracts');
const schemaCache = new Map();
const issues = [];
const unassessed = [
  'US setting and institutional plausibility',
  'Whether adaptation changes the conflict mechanism rather than names and language',
  'Character agency, causal sufficiency, escalation, payoff, and audience appeal',
  'Source rights, market evidence, provenance truth, and human approval',
];

function issue(rule_id, path, message, severity = 'ERROR') {
  issues.push({ rule_id, severity, path, message });
}
function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function nonempty(value) { return typeof value === 'string' && value.trim().length > 0; }
function pointer(path) { return path || '$'; }
function readJson(path) { return JSON.parse(readFileSync(path, 'utf8')); }
function loadSchema(path) {
  const full = resolve(path);
  if (!schemaCache.has(full)) schemaCache.set(full, readJson(full));
  return schemaCache.get(full);
}
function resolveRef(ref, schemaFile) {
  const [relative, fragment = ''] = ref.split('#');
  const file = relative ? resolve(dirname(schemaFile), relative) : schemaFile;
  let schema = loadSchema(file);
  if (fragment) {
    for (const part of fragment.replace(/^\//, '').split('/')) {
      schema = schema?.[part.replace(/~1/g, '/').replace(/~0/g, '~')];
    }
  }
  if (!object(schema)) throw new Error(`Cannot resolve schema reference ${ref} in ${schemaFile}`);
  return { schema, file };
}
function valueType(value, type) {
  if (type === 'object') return object(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'null') return value === null;
  return typeof value === type;
}
function conforms(value, schema, schemaFile) {
  const prior = issues.length;
  validate(value, schema, schemaFile, '$');
  const matches = issues.length === prior;
  issues.length = prior;
  return matches;
}
function validate(value, schema, schemaFile, path) {
  if (schema.$ref) {
    const target = resolveRef(schema.$ref, schemaFile);
    validate(value, target.schema, target.file, path);
    return;
  }
  if (schema.const !== undefined && value !== schema.const) issue('SCHEMA_CONST', path, `Expected ${JSON.stringify(schema.const)}.`);
  if (schema.enum && !schema.enum.includes(value)) issue('SCHEMA_ENUM', path, `Expected one of ${schema.enum.map(JSON.stringify).join(', ')}.`);
  if (schema.type) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!allowed.some(type => valueType(value, type))) {
      issue('SCHEMA_TYPE', path, `Expected ${allowed.join(' or ')}.`);
      return;
    }
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.trim().length < schema.minLength) issue('SCHEMA_MIN_LENGTH', path, `Expected at least ${schema.minLength} non-whitespace character(s).`);
    if (schema.pattern && !(new RegExp(schema.pattern)).test(value)) issue('SCHEMA_PATTERN', path, `Does not match ${schema.pattern}.`);
    if (schema.format === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) issue('SCHEMA_DATE', path, 'Expected YYYY-MM-DD.');
  }
  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) issue('SCHEMA_MINIMUM', path, `Expected at least ${schema.minimum}.`);
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) issue('SCHEMA_MIN_ITEMS', path, `Expected at least ${schema.minItems} item(s).`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) issue('SCHEMA_MAX_ITEMS', path, `Expected no more than ${schema.maxItems} item(s).`);
    if (schema.items) value.forEach((item, index) => validate(item, schema.items, schemaFile, `${path}[${index}]`));
  }
  if (object(value)) {
    for (const key of schema.required || []) if (!(key in value)) issue('SCHEMA_REQUIRED', `${path}.${key}`, 'Required field is missing.');
    for (const [key, child] of Object.entries(schema.properties || {})) {
      if (key in value) validate(value[key], child, schemaFile, `${path}.${key}`);
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties || {}));
      for (const key of Object.keys(value)) if (!allowed.has(key)) issue('SCHEMA_EXTRA_FIELD', `${path}.${key}`, 'Field is outside this contract version.');
    }
  }
  for (const clause of schema.allOf || []) validate(value, clause, schemaFile, path);
  if (schema.if) validate(value, conforms(value, schema.if, schemaFile) ? schema.then || {} : schema.else || {}, schemaFile, path);
}
function duplicates(rows, label, field = 'id') {
  if (!Array.isArray(rows)) return new Set();
  const found = new Set();
  rows.forEach((row, index) => {
    const id = row?.[field];
    if (!nonempty(id)) {
      issue('ID_EMPTY', `$.${label}[${index}].${field}`, 'Declared ID must be a nonempty string.');
      return;
    }
    if (found.has(id)) issue('ID_DUPLICATE', `$.${label}[${index}].${field}`, `Duplicate ${label} ID ${JSON.stringify(id)}.`);
    found.add(id);
  });
  return found;
}
function each(rows, callback) { if (Array.isArray(rows)) rows.forEach(callback); }
function ref(id, targets, path, kind) {
  if (nonempty(id) && !targets.has(id)) issue('REF_UNKNOWN', path, `${kind} ${JSON.stringify(id)} has no matching declaration.`);
}
function refs(values, targets, path, kind) {
  if (Array.isArray(values)) values.forEach((id, i) => ref(id, targets, `${path}[${i}]`, kind));
}
function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (object(value)) return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
function ordinal(id) {
  if (!nonempty(id)) return null;
  const match = id.match(/(?:^|[-_])(?:E|EP|EPISODE)[-_]?(\d+)$/i) || id.match(/^(?:E|EP)(\d+)$/i);
  return match ? Number(match[1]) : null;
}
function checkEpisodes(story, canon, promises, sources, characters) {
  const episodes = story.episodes;
  if (!Array.isArray(episodes)) return;
  const count = story.season_arc?.episode_count;
  if (Number.isInteger(count) && episodes.length !== count) issue('EPISODE_COUNT', '$.episodes', `Found ${episodes.length} entries; season_arc.episode_count is ${count}.`);
  duplicates(episodes, 'episodes', 'episode_id');
  const numbers = episodes.map(e => ordinal(e?.episode_id));
  if (numbers.every(n => n !== null)) {
    const missing = Array.from({ length: Number.isInteger(count) ? count : episodes.length }, (_, i) => i + 1).filter(n => !numbers.includes(n));
    const extras = numbers.filter(n => Number.isInteger(count) && (n < 1 || n > count));
    if (missing.length || extras.length) issue('EPISODE_ID_COVERAGE', '$.episodes', `Episode ordinals must cover 1..${count ?? episodes.length}; missing ${missing.join(', ') || 'none'}, outside range ${extras.join(', ') || 'none'}.`);
  } else if (episodes.length) {
    issue('EPISODE_ID_COVERAGE_NOT_RUN', '$.episodes', 'IDs lack recognized E/EP/EPISODE numeric suffixes; ordinal coverage cannot be checked.', 'NOTE');
  }
  episodes.forEach((e, i) => {
    const p = `$.episodes[${i}]`;
    refs(e?.canon_refs, canon, `${p}.canon_refs`, 'canon fact');
    refs(e?.promise_refs, promises, `${p}.promise_refs`, 'promise');
    refs(e?.source_refs, sources, `${p}.source_refs`, 'source');
    if (Array.isArray(e?.character_changes)) e.character_changes.forEach((change, j) => ref(change?.character_id, characters, `${p}.character_changes[${j}].character_id`, 'character'));
    if (object(e?.entry_state) && !Object.keys(e.entry_state).length) issue('STATE_EMPTY', `${p}.entry_state`, 'Entry state is empty; continuity cannot be meaningfully checked.', 'NOTE');
    if (object(e?.exit_state) && !Object.keys(e.exit_state).length) issue('STATE_EMPTY', `${p}.exit_state`, 'Exit state is empty; continuity cannot be meaningfully checked.', 'NOTE');
    if (i && object(episodes[i - 1]?.exit_state) && object(e?.entry_state) && stable(episodes[i - 1].exit_state) !== stable(e.entry_state)) {
      issue('STATE_HANDOFF', `${p}.entry_state`, `Does not equal episodes[${i - 1}].exit_state.`);
    }
    if (typeof e?.finale === 'boolean' && e.finale !== (i === episodes.length - 1)) issue('FINALE_POSITION', `${p}.finale`, 'Only the final episode may be marked finale.');
  });
}
function checkStory(story) {
  const characters = duplicates(story.characters, 'characters');
  const sources = duplicates(story.source_refs, 'source_refs', 'source_id');
  const canon = duplicates(story.canon_facts, 'canon_facts');
  const promises = duplicates(story.promises, 'promises');
  const secrets = duplicates(story.secrets, 'secrets');
  for (const name of ['relationships', 'narrative_asset_requirements']) duplicates(story[name], name);
  duplicates(story.state_definitions, 'state_definitions', 'character_id');
  for (const name of ['major_turns', 'reveal_windows']) duplicates(story.season_arc?.[name], `season_arc.${name}`);
  ref(story.story_engine?.protagonist_id, characters, '$.story_engine.protagonist_id', 'character');
  ref(story.story_engine?.opposing_force_id, characters, '$.story_engine.opposing_force_id', 'character');
  each(story.characters, (c, i) => refs(c?.secret_refs, secrets, `$.characters[${i}].secret_refs`, 'secret'));
  each(story.relationships, (r, i) => {
    if (!object(r)) return;
    ref(r.from_character_id, characters, `$.relationships[${i}].from_character_id`, 'character');
    ref(r.to_character_id, characters, `$.relationships[${i}].to_character_id`, 'character');
  });
  each(story.state_definitions, (s, i) => ref(s?.character_id, characters, `$.state_definitions[${i}].character_id`, 'character'));
  each(story.secrets, (s, i) => {
    if (!object(s)) return;
    refs(s.holder_ids, characters, `$.secrets[${i}].holder_ids`, 'character');
    refs(s.known_by, characters, `$.secrets[${i}].known_by`, 'character');
  });
  each(story.adaptation_mechanism_map, (m, i) => ref(m?.source_ref, sources, `$.adaptation_mechanism_map[${i}].source_ref`, 'source'));
  function provenance(value, path) {
    if (Array.isArray(value)) return value.forEach((v, i) => provenance(v, `${path}[${i}]`));
    if (!object(value)) return;
    if (object(value.provenance)) provenance(value.provenance, `${path}.provenance`);
    if (value.kind && value.decision_id && value.source_ref) ref(value.source_ref, sources, `${path}.source_ref`, 'source');
    for (const [key, child] of Object.entries(value)) if (key !== 'provenance') {
      if (key === 'source_ref' || key === 'source_refs') continue;
      if (object(child) || Array.isArray(child)) provenance(child, `${path}.${key}`);
    }
  }
  provenance(story, '$');
  checkEpisodes(story, canon, promises, sources, characters);
}
function checkBriefLink(story, brief) {
  if (!brief) {
    if (nonempty(story.selected_direction_id)) issue('DIRECTION_BINDING_NOT_RUN', '$.selected_direction_id', 'Provide --brief to verify the selected direction against its brief.', 'NOTE');
    return;
  }
  if (story.project_id !== brief.project_id) issue('PROJECT_MISMATCH', '$.project_id', 'Story Package and Project Brief project_id differ.');
  if (nonempty(story.brief_ref?.artifact_id) && nonempty(brief.artifact_id) && story.brief_ref.artifact_id !== brief.artifact_id) {
    issue('BRIEF_ARTIFACT_MISMATCH', '$.brief_ref.artifact_id', 'Referenced Brief artifact_id differs from the supplied Project Brief.');
  }
  if (Number.isInteger(story.brief_ref?.revision) && Number.isInteger(brief.revision) && story.brief_ref.revision !== brief.revision) {
    issue('BRIEF_REVISION_MISMATCH', '$.brief_ref.revision', 'Referenced Brief revision differs from the supplied Project Brief.');
  }
  duplicates(brief.direction_candidates, 'brief.direction_candidates', 'direction_id');
  const briefSources = duplicates(brief.source_refs, 'brief.source_refs', 'source_id');
  each(story.source_refs, (s, i) => ref(s?.source_id, briefSources, `$.source_refs[${i}].source_id`, 'brief source'));
  each(brief.adaptation_decisions, (d, i) => refs(d?.source_refs, briefSources, `$.brief.adaptation_decisions[${i}].source_refs`, 'source'));
  each(brief.evidence_and_assumptions, (e, i) => ref(e?.source_ref, briefSources, `$.brief.evidence_and_assumptions[${i}].source_ref`, 'source'));
  const candidates = brief.direction_candidates;
  if (nonempty(story.selected_direction_id)) {
    if (!Array.isArray(candidates)) issue('DIRECTION_BINDING_NOT_RUN', '$.selected_direction_id', 'Brief contract has no recognized candidate directions array.', 'NOTE');
    else {
      const ids = new Set(candidates.map(c => c?.direction_id).filter(nonempty));
      ref(story.selected_direction_id, ids, '$.selected_direction_id', 'brief direction');
    }
  }
  if (brief.direction_selection?.status === 'user_selected' && story.selected_direction_id !== brief.direction_selection.selected_direction_id) {
    issue('DIRECTION_SELECTION_MISMATCH', '$.selected_direction_id', 'Story Package direction differs from the user-selected Brief direction.');
  }
  if (brief.direction_selection?.status && brief.direction_selection.status !== 'user_selected') {
    issue('DIRECTION_NOT_SELECTED', '$.brief.direction_selection.status', 'A Story Package direction requires a selected Brief direction.');
  }
  if (brief.brief_status !== 'BRIEF_READY') issue('BRIEF_NOT_READY', '$.brief.brief_status', 'Story Package development requires a BRIEF_READY Project Brief.');
  if (Number.isInteger(brief.episode_count) && Number.isInteger(story.season_arc?.episode_count) && brief.episode_count !== story.season_arc.episode_count) {
    issue('EPISODE_COUNT_MISMATCH', '$.season_arc.episode_count', 'Story season episode count differs from Project Brief.');
  }
  if (['source_adaptation', 'source_selected_direction'].includes(brief.intake_route) && Array.isArray(story.adaptation_mechanism_map) && story.adaptation_mechanism_map.length === 0) {
    issue('ADAPTATION_MAP_EMPTY', '$.adaptation_mechanism_map', 'Source adaptation route requires at least one declared mechanism mapping.');
  }
  issue('DIGEST_BINDING_NOT_RUN', '$.brief_ref.digest', 'The brief digest requires a canonical serialization and trusted artifact store; this checkup does not verify it.', 'NOTE');
}
function checkReview(story, review) {
  if (!review) return;
  duplicates(review.structural_results, 'review.structural_results', 'check_id');
  duplicates(review.findings, 'review.findings', 'finding_id');
  if (review.mode === 'outline-diagnostic') {
    issue('REVIEW_BINDING_NOT_RUN', '$.review', 'Outline diagnostic is a source assessment, not a Story Package gate.', 'NOTE');
    return;
  }
  if (review.mode !== 'story-draft-review' && review.mode !== 'story-package-review') {
    issue('REVIEW_SCOPE_NOT_RUN', '$.review.mode', 'This command does not bind script or continuity reviews to a Story Package.', 'NOTE');
    return;
  }
  for (const key of ['project_id', 'artifact_id', 'revision']) {
    if (story[key] !== review[key]) issue('REVIEW_BINDING', `$.review.${key}`, `Review ${key} does not match the Story Package.`);
  }
  const validPass = { 'story-draft-review': 'PASS_FOR_EPISODE_ARCHITECTURE', 'story-package-review': 'PASS_AWAITING_HUMAN_APPROVAL' };
  if (typeof review.verdict === 'string' && review.verdict.startsWith('PASS') && validPass[review.mode] !== review.verdict) issue('REVIEW_MODE_VERDICT', '$.review.verdict', `Verdict ${review.verdict} is inconsistent with mode ${review.mode}.`);
  issue('DIGEST_BINDING_NOT_RUN', '$.review.digest', 'Review digest binding requires a canonical serialization and trusted artifact store; this checkup does not verify it.', 'NOTE');
  issue('REVIEW_SEMANTICS_NOT_RUN', '$.review', 'A review report is supplied, but its judgment and independence cannot be machine-verified here.', 'NOTE');
}
function usage() {
  process.stderr.write('Usage: node checkup.mjs <story-package.json> [--brief <project-brief.json>] [--review <review-report.json>] [--json]\n');
}
function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes('--help') || argv.includes('-h')) { usage(); return argv.length ? 0 : 2; }
  const args = { story: null, brief: null, review: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--json') args.json = true;
    else if (argv[i] === '--brief' || argv[i] === '--review') {
      if (!argv[i + 1]) throw new Error(`${argv[i]} needs a path`);
      args[argv[i].slice(2)] = argv[++i];
    } else if (!argv[i].startsWith('-') && !args.story) args.story = argv[i];
    else throw new Error(`Unknown argument ${argv[i]}`);
  }
  if (!args.story) throw new Error('Story Package path is required.');
  const story = readJson(args.story);
  const brief = args.brief ? readJson(args.brief) : null;
  const review = args.review ? readJson(args.review) : null;
  validate(story, loadSchema(resolve(contracts, 'story-package.schema.json')), resolve(contracts, 'story-package.schema.json'), '$');
  if (brief) validate(brief, loadSchema(resolve(contracts, 'project-brief.schema.json')), resolve(contracts, 'project-brief.schema.json'), '$.brief');
  if (review) validate(review, loadSchema(resolve(contracts, 'review-report.schema.json')), resolve(contracts, 'review-report.schema.json'), '$.review');
  if (object(story)) {
    checkStory(story);
    checkBriefLink(story, brief);
    checkReview(story, review);
  }
  const errorCount = issues.filter(x => x.severity === 'ERROR').length;
  const result = {
    tool: 'usvds-v10-checkup/1',
    structural_result: errorCount ? 'FAIL' : 'PASS',
    machine_scope: 'Contract shape, declared references, ID uniqueness, episode coverage, adjacent state equality, and supplied review mode/verdict consistency.',
    findings: issues,
    semantic_result: 'NOT_MACHINE_ASSESSED',
    unassessed_scopes: unassessed,
  };
  if (args.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else {
    process.stdout.write(`USVDS V10 structural checkup: ${result.structural_result} (${errorCount} error(s), ${issues.length - errorCount} note(s))\n`);
    for (const x of issues) process.stdout.write(`  ${x.severity} ${x.rule_id} ${pointer(x.path)}: ${x.message}\n`);
    process.stdout.write('Story quality and US adaptation: NOT_MACHINE_ASSESSED\n');
  }
  return errorCount ? 1 : 0;
}
try { process.exitCode = main(); }
catch (error) { process.stderr.write(`CHECKUP_INPUT_ERROR: ${error.message}\n`); usage(); process.exitCode = 2; }
