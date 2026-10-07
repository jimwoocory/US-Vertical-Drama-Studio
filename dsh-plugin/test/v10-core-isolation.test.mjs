import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
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

function removeFixture(path, filesystem = { lstatSync, readdirSync, rmdirSync, unlinkSync }) {
  // Do not follow links; remove only this test's uniquely created fixture.
  if (filesystem.lstatSync(path).isDirectory()) {
    for (const name of filesystem.readdirSync(path)) removeFixture(join(path, name), filesystem)
    filesystem.rmdirSync(path)
  } else {
    filesystem.unlinkSync(path)
  }
}

function fixtureRoot() {
  // CI may select another writable root; never fall back to the system TEMP.
  const configuredRoot = process.env.USVD_TEST_TMPDIR
  const temporaryRoot = resolve(configuredRoot || join(root, '.superpowers/tmp'))
  mkdirSync(temporaryRoot, { recursive: true })
  if (!configuredRoot) {
    // This checkout need not have a tracked ignore rule. Leave existing metadata intact.
    try {
      writeFileSync(join(temporaryRoot, '.gitignore'), '*\n', { flag: 'wx' })
    } catch (error) {
      if (error.code !== 'EEXIST') throw error
    }
  }
  return realpathSync(temporaryRoot)
}

function fixture(t) {
  const initialStatus = git(root, 'status', '--porcelain', '--untracked-files=all')
  const canonicalRoot = fixtureRoot()
  const cwd = mkdtempSync(join(canonicalRoot, 'v10-isolation-'))
  t.after(() => {
    assert.equal(dirname(cwd), canonicalRoot, 'Cleanup must stay within the selected temporary root')
    assert.ok(basename(cwd).startsWith('v10-isolation-'))
    removeFixture(cwd)
    assert.equal(existsSync(cwd), false, 'Fixture cleanup must actually remove its directory')
    assert.equal(git(root, 'status', '--porcelain', '--untracked-files=all'), initialStatus, 'Fixtures must not change checkout status')
  })
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

test('V10 manifest tracks authored story-stage skills separately while keeping runtime non-runnable', () => {
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
  const authored = new Set(['controller', '00-intake-adaptation', '01-story-architect', '02-episode-architect', '04-review-continuity'])
  for (const skill of manifest.skills) {
    assert.equal(skill.name, `usvd-v10-${skill.id}`)
    assert.equal(skill.runnable, false)
    assert.equal(skill.canonical_path, `skills/${skill.id}/SKILL.md`)
    const skillPath = join(root, manifest.canonical_root, skill.canonical_path)
    assert.equal(existsSync(skillPath), authored.has(skill.id), `${skill.id} authored path status`)
    assert.equal(skill.status, authored.has(skill.id) ? 'authored-unvalidated' : 'planned')
    if (authored.has(skill.id)) {
      const source = readFileSync(skillPath, 'utf8')
      assert.match(source, new RegExp(`^---\\r?\\nname: ${skill.name}\\r?\\ndescription: .+?\\r?\\n---`, 's'))
      const visibleSignals = {
        controller: ['Next allowed action', 'one skill'],
        '00-intake-adaptation': ['retain', 'cut', 'merge', 'source locator'],
        '01-story-architect': ['Full-Series Story Outline', 'Story Engine', 'STORY_DRAFT_READY'],
        '02-episode-architect': ['mini dramatic arc', 'entry_state', 'exit_state'],
        '04-review-continuity': ['PASS_FOR_EPISODE_ARCHITECTURE', 'PASS_AWAITING_HUMAN_APPROVAL', 'evidence'],
      }[skill.id]
      for (const signal of visibleSignals) assert.ok(source.includes(signal), `${skill.id} must expose ${signal}`)
      if (skill.contract_path) assert.ok(existsSync(join(root, manifest.canonical_root, skill.contract_path)))
    }
  }
  for (const contract of manifest.contracts) assert.ok(existsSync(join(root, manifest.canonical_root, contract)))
  assert.deepEqual(manifest.approval_runtime, { status: 'blocked', decision_ref: 'ND-001', implemented: false })
  assert.deepEqual(manifest.model_routes, { '01': 'glm-5.3-flashx', '02': 'glm-5.3', '03': 'glm-5.3', '04': 'glm-5.3' })
})

test('V10 GPT plugin preview is generated from the authored Core and remains limited to those skills', () => {
  const result = spawnSync(process.execPath, [join(root, 'scripts/sync-v10-plugin.mjs'), '--check'], { cwd: root, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const plugin = JSON.parse(readFileSync(join(root, 'plugins/us-vertical-drama-studio-v10/plugin.json'), 'utf8'))
  assert.equal(plugin.name, 'us-vertical-drama-studio-v10')
  assert.ok(plugin.extensions['com.openai'].interface.shortDescription.length <= 30)
  assert.equal(plugin.extensions['com.openai'].interface.defaultPrompt.length, 3)
  assert.equal(manifestStatus(), false, 'plugin preview is not a production approval runtime')
})

function manifestStatus() {
  const core = JSON.parse(readFileSync(join(root, 'core/usvd-v10/manifest.json'), 'utf8'))
  return core.runnable || core.approval_runtime.status !== 'blocked'
}

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
  unlinkSync(join(repo.cwd, protectedPaths[0]))
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

test('explicit temporary roots preserve existing files across repeated fixtures', async t => {
  const parent = fixtureRoot()
  const explicitRoot = mkdtempSync(join(parent, 'v10-explicit-root-'))
  const initialStatus = git(root, 'status', '--porcelain', '--untracked-files=all')
  t.after(() => {
    assert.equal(dirname(explicitRoot), parent)
    removeFixture(explicitRoot)
    assert.equal(existsSync(parent), true, 'Configured parent must remain')
    assert.equal(git(root, 'status', '--porcelain', '--untracked-files=all'), initialStatus)
  })
  writeFileSync(join(explicitRoot, 'sentinel.txt'), 'existing user content\n')
  writeFileSync(join(explicitRoot, '.gitignore'), '# existing user metadata\n')
  for (let run = 1; run <= 2; run++) {
    let fixturePath
    await t.test(`explicit root run ${run}`, child => {
      const previousRoot = process.env.USVD_TEST_TMPDIR
      let repo
      try {
        process.env.USVD_TEST_TMPDIR = explicitRoot
        repo = fixture(child)
      } finally {
        if (previousRoot === undefined) delete process.env.USVD_TEST_TMPDIR
        else process.env.USVD_TEST_TMPDIR = previousRoot
      }
      fixturePath = repo.cwd
      assert.equal(dirname(repo.cwd), realpathSync(explicitRoot))
      const result = check(repo)
      assert.equal(result.status, 0, result.stdout + result.stderr)
    })
    assert.equal(existsSync(fixturePath), false)
    assert.equal(existsSync(explicitRoot), true)
    assert.deepEqual(readdirSync(explicitRoot).sort(), ['.gitignore', 'sentinel.txt'])
    assert.equal(readFileSync(join(explicitRoot, 'sentinel.txt'), 'utf8'), 'existing user content\n')
    assert.equal(readFileSync(join(explicitRoot, '.gitignore'), 'utf8'), '# existing user metadata\n')
  }
})

test('fixture cleanup removes symbolic links without traversing their targets', () => {
  // A virtual filesystem avoids requiring Windows symlink privileges or risking real files.
  const link = 'fixture-link'
  const target = 'outside-target/sentinel.txt'
  const entries = new Map([[link, 'symbolic link'], [target, 'preserve target content']])
  const filesystem = {
    lstatSync: path => {
      assert.equal(entries.get(path), 'symbolic link')
      return { isDirectory: () => false }
    },
    readdirSync: () => assert.fail('Cleanup must not traverse the link target'),
    rmdirSync: () => assert.fail('A symbolic link must not be removed as a directory'),
    unlinkSync: path => { assert.equal(entries.delete(path), true) },
  }
  assert.doesNotThrow(() => removeFixture(link, filesystem))
  assert.equal(entries.has(link), false)
  assert.equal(entries.get(target), 'preserve target content')
})
