// Removes only paths Vite writes or copies into the parent game directory.
// Keep this allowlist in sync with vite.config.ts and public/.
// Usage: `npm run clean` from the repository root.

import { lstat, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const gameDir = resolve(repoDir, '..')

const buildOutputs = ['index.html', 'icon.svg', 'site.webmanifest']

if (gameDir === repoDir) {
  throw new Error('Refusing to clean: the repository is not inside a game directory.')
}

const removed = []

for (const entry of buildOutputs) {
  const target = join(gameDir, entry)

  try {
    const info = await lstat(target)
    // Remove only the allowlisted output itself, plus its Brotli sidecar.
    // lstat ensures a symlink is removed rather than followed.
    await rm(target, { recursive: info.isDirectory(), force: true })
    removed.push(entry)
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error
  }

  try {
    await rm(`${target}.br`, { force: true })
    removed.push(`${entry}.br`)
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error
  }
}

console.log(
  removed.length
    ? `Cleaned ${removed.length} item(s) from ${gameDir}: ${removed.join(', ')}`
    : `Nothing to clean in ${gameDir}.`,
)
