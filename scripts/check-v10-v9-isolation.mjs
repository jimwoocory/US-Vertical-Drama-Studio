import { spawnSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const baselineCommit = '67647579153fe73891ee2a6ce3ef1f92842ed9ca'
const protectedPaths = [
  'core/usvd-v9/',
  'plugins/us-vertical-drama-studio-v9/',
  'direct-upload/v9/',
  'tabbit/v9/',
  'mediago/v9/',
  'scripts/sync-v9-distributions.mjs',
  'scripts/sync-dsh-v9.mjs',
]

function git(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], {
    encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
  })
  if (result.error || result.status !== 0) {
    throw new Error(result.error?.message || result.stderr.trim() || `Git exited ${result.status}`)
  }
  return result.stdout
}

function options(args) {
  if (args.length === 0) {
    return { root: fileURLToPath(new URL('../', import.meta.url)), baseline: baselineCommit }
  }
  // Both overrides are required; normal repository checks always use the fixed baseline.
  if (args.length !== 4 || args[0] !== '--test-root' || args[2] !== '--test-baseline' || !args[1] || !args[3]) {
    throw new Error('Usage: node scripts/check-v10-v9-isolation.mjs [--test-root <temporary-repo> --test-baseline <commit>]')
  }
  return { root: resolve(args[1]), baseline: args[3] }
}

function check({ root, baseline }) {
  const top = git(root, ['rev-parse', '--show-toplevel']).trim()
  if (realpathSync(top) !== realpathSync(root)) throw new Error('Isolation root must be the Git repository root')
  let commit
  try {
    commit = git(root, ['rev-parse', '--verify', '--end-of-options', `${baseline}^{commit}`]).trim()
  } catch (error) {
    throw new Error(`Cannot resolve isolation baseline ${baseline}: ${error.message}`)
  }
  const pathspecs = protectedPaths.map(path => `:(top,literal)${path.replace(/\/$/u, '')}`)
  const differences = new Set()
  for (const [scope, extra] of [['index', ['--cached']], ['worktree', []]]) {
    const fields = git(root, ['diff', ...extra, '--no-ext-diff', '--no-textconv', '--no-renames', '--name-status', '-z', commit, '--', ...pathspecs]).split('\0')
    for (let i = 0; i < fields.length - 1; i += 2) {
      differences.add(`${scope} ${fields[i]} ${JSON.stringify(fields[i + 1])}`)
    }
  }
  // Deliberately omit --exclude-standard: ignored files are also forbidden additions.
  const untracked = git(root, ['ls-files', '--others', '-z', '--', ...pathspecs]).split('\0').filter(Boolean)
  for (const path of untracked) differences.add(`untracked ${JSON.stringify(path)}`)
  if (differences.size) {
    console.error(`V9 isolation FAIL against ${commit}:`)
    for (const difference of [...differences].sort()) console.error(`- ${difference}`)
    return 1
  }
  console.log(`V9 isolation PASS: ${protectedPaths.length} protected paths match ${commit}; no untracked additions.`)
  return 0
}

try {
  process.exitCode = check(options(process.argv.slice(2)))
} catch (error) {
  console.error(`V9 isolation ERROR: ${error.message}`)
  process.exitCode = 2
}
