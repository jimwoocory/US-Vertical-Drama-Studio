import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

test('published DSH package exposes writing skills without bundling a browser workbench', () => {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
  const command = process.platform === 'win32' ? (process.env.ComSpec ?? 'cmd.exe') : 'npm'
  const args = process.platform === 'win32'
    ? ['/d', '/s', '/c', 'npm pack --dry-run --json --ignore-scripts']
    : ['pack', '--dry-run', '--json', '--ignore-scripts']
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' })

  assert.equal(result.status, 0, result.stderr)
  const [archive] = JSON.parse(result.stdout)
  const files = new Set(archive.files.map(file => file.path))

  assert.equal(pkg.dsh.client, undefined)
  assert.equal(pkg.exports['./client'], undefined)
  assert.equal(pkg.peerDependencies['@deepseek-ai/dsh-client-ui-slots'], undefined)
  assert.equal(pkg.peerDependencies.react, undefined)
  assert.ok(files.has('dsh-plugin/index.js'))
  assert.ok(files.has('plugins/us-vertical-drama-studio-v9/skills/usvd-02-story-architecture/SKILL.md'))
  for (const path of [
    'dsh-plugin/client.js',
    'dsh-plugin/client.bundle.cjs',
    'dsh-plugin/production-workbench.js',
    'dsh-plugin/compatibility.js',
  ]) {
    assert.equal(files.has(path), false, `${path} must not ship in the writing-skills package`)
  }
})
