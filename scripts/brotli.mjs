// Precompresses the production output with Brotli.
//
// Vite builds into the parent game directory, so this walks the shipped files and
// writes a sibling `.br` for each one. Configure the static server to serve
// precompressed files (for nginx: `brotli_static on;`).
//
// Usage:
//   node scripts/brotli.mjs
//   BROTLI_QUALITY=11 node scripts/brotli.mjs

import { readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompress, constants } from 'node:zlib'
import { promisify } from 'node:util'

const brotli = promisify(brotliCompress)
const root = fileURLToPath(new URL('../../', import.meta.url))
const quality = Number(process.env.BROTLI_QUALITY ?? 10)
const concurrency = Math.max(1, Number(process.env.BROTLI_CONCURRENCY ?? 4))
const TEXT_EXTENSIONS = new Set(['.html', '.js', '.css', '.json', '.svg', '.gltf', '.txt'])
const targets = [
  'index.html',
  'favicon.ico',
  'icon.svg',
  'icon-32.png',
  'icon-192.png',
  'icon-512.png',
  'assets',
  'audio',
  'ammo',
]

async function walk(path) {
  let info

  try {
    info = await stat(path)
  } catch {
    return []
  }

  if (info.isFile()) {
    return [path]
  }

  const entries = await readdir(path, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const child = join(path, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await walk(child)))
    } else if (entry.isFile() && !entry.name.endsWith('.br')) {
      files.push(child)
    }
  }

  return files
}

function compressionOptions(file) {
  const dot = file.lastIndexOf('.')
  const extension = dot >= 0 ? file.slice(dot).toLowerCase() : ''
  return {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: TEXT_EXTENSIONS.has(extension) ? quality : Math.min(quality, 9),
      [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_GENERIC,
    },
  }
}

async function compressFile(file) {
  const original = await readFile(file)
  const compressed = await brotli(original, compressionOptions(file))
  const output = `${file}.br`

  if (compressed.length >= original.length) {
    try {
      await unlink(output)
    } catch {
      // No stale .br file to remove.
    }

    return { file, original: original.length, compressed: original.length, skipped: true }
  }

  await writeFile(output, compressed)
  return { file, original: original.length, compressed: compressed.length, skipped: false }
}

async function main() {
  const files = (await Promise.all(targets.map((target) => walk(join(root, target))))).flat()

  // Clear stale .br files so renamed build chunks do not linger.
  await Promise.all(
    files.map(async (file) => {
      try {
        await unlink(`${file}.br`)
      } catch {
        // No stale file.
      }
    }),
  )

  let next = 0
  const results = []

  async function worker() {
    for (;;) {
      const index = next
      next += 1

      if (index >= files.length) {
        return
      }

      results.push(await compressFile(files[index]))
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))

  const totalOriginal = results.reduce((sum, result) => sum + result.original, 0)
  const totalCompressed = results.reduce((sum, result) => sum + result.compressed, 0)
  const written = results.filter((result) => !result.skipped)

  for (const result of results) {
    if (!result.skipped && result.original > 512 * 1024) {
      const ratio = ((1 - result.compressed / result.original) * 100).toFixed(1)
      console.log(`  ${ratio}%  ${relative(root, result.file)}`)
    }
  }

  console.log(
    `Brotli: ${written.length}/${results.length} files written, ` +
      `${(totalOriginal / 1024 / 1024).toFixed(1)} MB -> ` +
      `${(totalCompressed / 1024 / 1024).toFixed(1)} MB`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
