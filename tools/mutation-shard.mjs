#!/usr/bin/env node
import { readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

/*
 * One share of the files Stryker mutates, for one job of a matrix.
 *
 * A full run over the set is hours on one machine - ten thousand mutants, each
 * run against the tests that cover it - so the weekly run is split across
 * jobs, each mutating its own files with its own incremental record. A file's
 * floor is checked by the job that measured it (`mutation-floor.mjs` leaves
 * unmeasured files alone), so the shards need nothing from each other.
 *
 * The files are those `stryker.config.mjs` mutates, and a file's shard comes
 * from its own path, so a new primitive lands in some shard without anyone
 * saying which and every other file stays where it was. They used to be dealt
 * round by position, and one new file then moved most of the others to a shard
 * whose record had never seen them: an ordinary week's run mutated them all
 * again, and each job's report carried the files it used to hold as well.
 *
 *   node tools/mutation-shard.mjs 3 8     # the fourth of eight shares
 */

const root = resolve(import.meta.dirname, '..')

/** Every source file Stryker mutates, with forward slashes, sorted. */
export function mutable() {
  const walk = (dir) =>
    readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory() ? walk(join(dir, entry.name)) : [relative(root, join(root, dir, entry.name)).replaceAll('\\', '/')],
    )
  const component = (file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx')
  const source = (file) => file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.d.ts')
  return [
    ...walk('registry/ui').filter(component),
    ...walk('registry/blocks').filter(component),
    ...walk('packages/dowel/src').filter(source),
  ].sort()
}

/** FNV-1a, finalised: a number from a path alone, the same on every machine. */
function hashOf(text) {
  let hash = 0x811c9dc5
  for (let at = 0; at < text.length; at += 1) {
    hash ^= text.charCodeAt(at)
    hash = Math.imul(hash, 0x01000193)
  }
  // The low bits of this hash are its weakest, and a remainder reads only them:
  // on its own it put 33 of 146 files in one shard and 11 in another. MurmurHash's
  // finaliser spreads every bit into them.
  hash ^= hash >>> 16
  hash = Math.imul(hash, 0x85ebca6b)
  hash ^= hash >>> 13
  hash = Math.imul(hash, 0xc2b2ae35)
  hash ^= hash >>> 16
  return hash >>> 0
}

/** The files of shard `index` out of `count`. */
export function shard(files, index, count) {
  return files.filter((file) => hashOf(file) % count === index)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const [index, count] = process.argv.slice(2).map(Number)
  if (!Number.isInteger(index) || !Number.isInteger(count) || count < 1 || index < 0 || index >= count) {
    console.error('usage: mutation-shard.mjs <index> <count>')
    process.exit(1)
  }
  process.stdout.write(shard(mutable(), index, count).join(','))
}
