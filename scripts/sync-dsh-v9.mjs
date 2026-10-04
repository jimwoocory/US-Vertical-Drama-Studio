import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildDistributionPlan } from './sync-v9-distributions.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pluginRoot = 'plugins/us-vertical-drama-studio-v9/'
const { files, sourceDigest, skills } = buildDistributionPlan()

for (const [relativePath, content] of files) {
  if (!relativePath.startsWith(pluginRoot)) continue
  const destination = join(repoRoot, relativePath)
  mkdirSync(dirname(destination), { recursive: true })
  writeFileSync(destination, content)
}

console.log(`Synchronized DSH V9 catalog: ${skills.length} skills, source ${sourceDigest}`)
