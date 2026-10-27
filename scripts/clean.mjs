// Removes the deployed build output from the game directory so a fresh build
// can regenerate it.
//
// The repository is preserved by absolute path rather than by name, so it does
// not matter what the checkout directory is called. Everything else beside it
// in the parent game directory is generated output.
//
// Usage: `npm run clean` from the repository root.

import { readdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const gameDir = resolve(repoDir, '..')

if (gameDir === repoDir) {
  throw new Error('Refusing to clean: the repository is not inside a game directory.')
}

const entries = (await readdir(gameDir)).sort()
const removed = []

for (const entry of entries) {
  const target = resolve(gameDir, entry)

  if (target === repoDir) continue

  await rm(target, { recursive: true, force: true })
  removed.push(entry)
}

console.log(
  removed.length
    ? `Cleaned ${removed.length} item(s) from ${gameDir}: ${removed.join(', ')}`
    : `Nothing to clean in ${gameDir}.`,
)
