import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compare, scoreOf, scores } from '../tools/mutation-floor.mjs'
import { mutable, shard } from '../tools/mutation-shard.mjs'

/*
 * The floor under each file's mutation score (`tools/mutation-floor.mjs`).
 *
 * The weekly mutation run is the gate; this holds the gate's arithmetic and
 * its reach in the ordinary test run - so a primitive cannot be added without
 * a floor and wait a week to find out it needed one.
 */

const root = resolve(import.meta.dirname, '..')
const floors: Record<string, number> = JSON.parse(readFileSync(resolve(root, 'tests/mutation-floor.json'), 'utf8'))

const mutants = (...statuses: string[]) => statuses.map((status) => ({ status }))

describe('a file’s mutation score', () => {
  it('counts what was caught out of what could be', () => {
    expect(scoreOf(mutants('Killed', 'Killed', 'Survived', 'NoCoverage'))).toBe(50)
    // A mutant that hangs the tests is one they noticed.
    expect(scoreOf(mutants('Timeout', 'Survived'))).toBe(50)
  })

  it('leaves out what could not be run', () => {
    expect(scoreOf(mutants('Killed', 'Survived', 'Ignored', 'CompileError', 'RuntimeError'))).toBe(50)
    // Only class lists: nothing escaped, and the floor stays when logic comes.
    expect(scoreOf(mutants('Ignored'))).toBe(100)
    expect(scoreOf([])).toBe(100)
  })

  it('rounds down, so a floor is never met by rounding', () => {
    expect(scoreOf(mutants('Killed', 'Killed', 'Survived'))).toBe(66.6)
  })

  it('names files the way the floors do, on any platform', () => {
    const report = { files: { 'registry\\ui\\menu.tsx': { mutants: mutants('Killed') } } }
    expect(scores(report)).toEqual({ 'registry/ui/menu.tsx': 100 })
  })
})

describe('the floor', () => {
  it('fails a file under it, and one with none', () => {
    const { under } = compare({ 'a.tsx': 80, 'b.tsx': 90, 'c.tsx': 70 }, { 'a.tsx': 85, 'b.tsx': 90 })
    expect(under).toEqual(['a.tsx: 80 under its floor of 85', 'c.tsx: 70, and no floor yet'])
  })

  it('leaves a file the run did not measure alone', () => {
    expect(compare({}, { 'a.tsx': 85 }).under).toEqual([])
  })

  it('only ever rises', () => {
    const { raised } = compare({ 'a.tsx': 80, 'b.tsx': 95, 'c.tsx': 70 }, { 'a.tsx': 85, 'b.tsx': 90 })
    expect(raised).toEqual({ 'a.tsx': 85, 'b.tsx': 95, 'c.tsx': 70 })
  })

  it('is set for every file that is mutated', () => {
    // Written by `node tools/mutation-floor.mjs --raise` after a run that
    // measured the file - the floor of a new primitive is decided, not
    // assumed.
    expect(mutable().filter((file) => floors[file] === undefined)).toEqual([])
  })

  it('names no file that is no longer mutated', () => {
    const files = new Set(mutable())
    expect(Object.keys(floors).filter((file) => !files.has(file))).toEqual([])
  })
})

describe('the shards of the weekly run', () => {
  const files = mutable()

  it('mutate every file once, and only once', () => {
    const dealt = Array.from({ length: 8 }, (_, index) => shard(files, index, 8)).flat()
    expect(dealt.sort()).toEqual([...files].sort())
  })

  it('are near each other in size', () => {
    const sizes = Array.from({ length: 8 }, (_, index) => shard(files, index, 8).length)
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1)
  })

  it('include the primitives, the blocks and the package', () => {
    // A walk that went blind would deal out nothing, and every shard would
    // pass with nothing measured.
    for (const place of ['registry/ui/', 'registry/blocks/', 'packages/dowel/src/']) {
      expect(files.some((file) => file.startsWith(place)), place).toBe(true)
    }
    expect(files).toContain('registry/ui/menu.tsx')
    expect(files.some((file) => file.endsWith('.test.tsx') || file.endsWith('.test.ts') || file.endsWith('.d.ts'))).toBe(false)
  })
})
