import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = fileURLToPath(new URL('../../', import.meta.url))
const checker = join(root, 'scripts/check-v10-v9-isolation.mjs')
const protectedPaths = [
  'core/usvd-v9/sample.txt',
  'plugins/us-vertical-drama-studio-v9/sample.txt',
  'direct-upload/v9/sample.txt', 'tabbit/v9/sample.txt', 'mediago/v9/sample.txt',
  'scripts/sync-v9-distributions.mjs', 'scripts/sync-dsh-v9.mjs',
]

function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
}

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'v10-isolation-'))
  t.after(() => rmSync(cwd, { recursive: true, force: true }))
  git(cwd, 'init', '--quiet')
  git(cwd, 'config', 'user.name', 'Isolation Test')
  git(cwd, 'config', 'user.email', 'isolation@example.invalid')
  git(cwd, 'config', 'core.autocrlf', 'false')
  for (const path of protectedPaths) {
    mkdirSync(dirname(join(cwd, path)), { recursive: true })
    writeFileSync(join(cwd, path), 'baseline\n')
  }
  writeFileSync(join(cwd, '.gitignore'), '**/ignored.tmp\n')
  git(cwd, 'add', '.')
  git(cwd, 'commit', '--quiet', '-m', 'isolated baseline')
  return { cwd, baseline: git(cwd, 'rev-parse', 'HEAD') }
}

function check(repo) {
  assert.ok(existsSync(checker), 'V9 isolation checker must exist')
  return spawnSync(process.execPath, [checker, '--test-root', repo.cwd, '--test-baseline', repo.baseline], { encoding: 'utf8' })
}

test('V10 manifest is a planned, non-runnable US writing scaffold with explicit audited routing', () => {
  const path = join(root, 'core/usvd-v10/manifest.json')
  assert.ok(existsSync(path), 'V10-only manifest must exist')
  const manifest = JSON.parse(readFileSync(path, 'utf8'))
  assert.equal(manifest.core_id, 'usvd-v10')
  assert.equal(manifest.version, '0.10.0-preview.1')
  assert.equal(manifest.status, 'in-development')
  assert.equal(manifest.canonical_root, 'core/usvd-v10')
  assert.equal(manifest.runnable, false)
  assert.equal(manifest.writing_profile.market, 'US')
  assert.equal(manifest.writing_profile.delivery_scope, 'writing-only')
  assert.equal(manifest.writing_profile.bilingual_on_request, true)
  assert.equal(manifest.dsh_catalog_exposed, false)
  const expected = [
    ['controller', 'controller'], ['00-intake-adaptation', '01'],
    ['01-story-architect', '02'], ['02-episode-architect', '02'],
    ['03-screenwriter', '03'], ['04-review-continuity', '04'],
    ['05-asset-lock', '05'], ['06-storyboard', '06'],
    ['07-performance-cinematography', '07'], ['08-seedance-2-mini-adapter', '08'], ['09-prompt-qa', '09'],
  ]
  assert.deepEqual(manifest.skill_order, expected.map(([id]) => id))
  assert.deepEqual(manifest.skills.map(({ id, routing_role }) => [id, routing_role]), expected)
  for (const skill of manifest.skills) {
    assert.equal(skill.name, `usvd-v10-${skill.id}`)
    assert.equal(skill.status, 'planned')
    assert.equal(skill.runnable, false)
    assert.equal(skill.canonical_path, `skills/${skill.id}/SKILL.md`)
    assert.equal(existsSync(join(root, manifest.canonical_root, skill.canonical_path)), false)
  }
  assert.deepEqual(manifest.model_routes, { '01': 'glm-5.3-flashx', '02': 'glm-5.3', '03': 'glm-5.3', '04': 'glm-5.3' })
})

test('checker accepts identical protected baseline and unrelated V10 additions', t => {
  const repo = fixture(t)
  mkdirSync(join(repo.cwd, 'core/usvd-v10'), { recursive: true })
  writeFileSync(join(repo.cwd, 'core/usvd-v10/new.txt'), 'allowed\n')
  const result = check(repo)
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /PASS/)
})

for (const path of protectedPaths) {
  test(`checker rejects tracked content drift in ${path}`, t => {
    const repo = fixture(t)
    writeFileSync(join(repo.cwd, path), 'changed\n')
    const result = check(repo)
    assert.equal(result.status, 1, result.stdout + result.stderr)
    assert.ok((result.stdout + result.stderr).includes(path))
  })
}

test('checker rejects tracked deletion', t => {
  const repo = fixture(t)
  rmSync(join(repo.cwd, protectedPaths[0]))
  const result = check(repo)
  assert.equal(result.status, 1)
  assert.ok((result.stdout + result.stderr).includes(protectedPaths[0]))
})

test('checker rejects staged content drift even after restoring baseline worktree contents', t => {
  const repo = fixture(t)
  writeFileSync(join(repo.cwd, protectedPaths[0]), 'changed\n')
  git(repo.cwd, 'add', protectedPaths[0])
  writeFileSync(join(repo.cwd, protectedPaths[0]), 'baseline\n')
  const result = check(repo)
  assert.equal(result.status, 1)
  assert.ok((result.stdout + result.stderr).includes(protectedPaths[0]))
})

test('checker rejects a tracked path added after baseline', t => {
  const repo = fixture(t)
  const path = 'tabbit/v9/added.txt'
  writeFileSync(join(repo.cwd, path), 'added\n')
  git(repo.cwd, 'add', path)
  git(repo.cwd, 'commit', '--quiet', '-m', 'protected addition')
  const result = check(repo)
  assert.equal(result.status, 1)
  assert.ok((result.stdout + result.stderr).includes(path))
})

for (const filename of ['extra.txt', 'ignored.tmp']) {
  test(`checker rejects untracked protected file ${filename}, including ignored files`, t => {
    const repo = fixture(t)
    const path = `core/usvd-v9/${filename}`
    writeFileSync(join(repo.cwd, path), 'unexpected\n')
    const result = check(repo)
    assert.equal(result.status, 1)
    assert.ok((result.stdout + result.stderr).includes(path))
  })
}

test('checker fails closed for an unavailable baseline', t => {
  const repo = fixture(t)
  const result = check({ ...repo, baseline: 'invalid-baseline' })
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /baseline/i)
})
