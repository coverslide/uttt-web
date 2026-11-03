// Removes only Vite outputs: the HTML entry, bundled assets, and files copied from public/.
// Keep public/ as the source of truth for copied output paths.
// Usage: npm run clean from the repository root.

import { lstat, readdir, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const gameDir = resolve(repoDir, '..')
const publicDir = join(repoDir, 'public')

if (gameDir === repoDir) {
  throw new Error('Refusing to clean: the repository is not inside a game directory.')
}

const outputs = new Set(['index.html', 'assets'])
try {
  for (const entry of await readdir(publicDir)) outputs.add(entry)
} catch (error) {
  if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error
}

const removed = []
for (const entry of outputs) {
  const target = join(gameDir, entry)
  try {
    const info = await lstat(target)
    // lstat means a symlink is removed itself, never followed.
    await rm(target, { recursive: info.isDirectory(), force: true })
    removed.push(entry)
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error
  }
  try {
    await rm(target + '.br', { force: true })
    removed.push(entry + '.br')
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) throw error
  }
}

console.log(removed.length
  ? 'Cleaned ' + removed.length + ' generated item(s) from ' + gameDir + ': ' + removed.join(', ')
  : 'Nothing to clean in ' + gameDir + '.')
