import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { deprecations } from '../packages/dowel/src/deprecated'
import { compare, merged, surface } from '../tools/vocabulary.mjs'

/*
 * The vocabulary is frozen, and this is what freezes it.
 *
 * Every name a product can have written down is on `tests/vocabulary.json`, and
 * a name on the record may only leave through the table in
 * `packages/dowel/src/deprecated.ts`. Without this "frozen at 1.0" is a sentence:
 * a token renamed by hand, an item dropped, an export tidied away would all pass
 * every other gate and break a product on its next minor.
 */

const record = JSON.parse(readFileSync(resolve(import.meta.dirname, 'vocabulary.json'), 'utf8'))

describe('the record', () => {
  const leaving = new Set(deprecations.flatMap((row) => [row.from, `color-${row.from}`]))
  const { gone, unrecorded } = compare(record, surface(), leaving)

  it('still has every name it ever held', () => {
    // A name is gone. Bring it back, or rename it through the table so the old
    // spelling keeps working until the next major.
    expect(gone).toEqual([])
  })

  it('knows every name there is', () => {
    // Something new, and new is a promise too. `node tools/vocabulary.mjs --write`.
    expect(unrecorded).toEqual([])
  })

  it('reads every surface it claims to', () => {
    const live = surface()
    for (const section of ['tokens', 'utilities', 'items', 'entryPoints', 'rules', 'exports']) {
      expect(live[section]?.length, `nothing read for ${section}`).toBeGreaterThan(0)
    }
    expect(live.tokens).toContain('accent')
    expect(live.utilities).toContain('h-control')
    expect(live.items).toContain('button')
    expect(live.entryPoints).toContain('./theme.css')
    expect(live.rules).toContain('no-raw-color')
    // A value and a type, because a product can have imported either.
    expect(live.exports).toContain('cn')
    expect(live.exports).toContain('HeadingLevel')
  })
})

describe('comparing', () => {
  const recorded = { tokens: ['bg', 'old'], items: ['button'] }

  it('names what left, whichever surface it left', () => {
    expect(compare(recorded, { tokens: ['bg'], items: ['button'] }).gone).toEqual(['tokens: old'])
    expect(compare(recorded, { tokens: ['bg', 'old'], items: [] }).gone).toEqual(['items: button'])
  })

  it('lets a name leave through the table, and only that name', () => {
    const live = { tokens: ['bg', 'other'], items: [] }
    expect(compare(recorded, live, new Set(['old'])).gone).toEqual(['items: button'])
  })

  it('names what is new', () => {
    expect(compare(recorded, { tokens: ['bg', 'old', 'new'], items: ['button'] }).unrecorded).toEqual(['tokens: new'])
  })
})

describe('writing the record', () => {
  it('adds what is new', () => {
    expect(merged({ tokens: ['bg'] }, { tokens: ['bg', 'raise'] })).toEqual({ tokens: ['bg', 'raise'] })
  })

  it('never takes a name away', () => {
    expect(merged({ tokens: ['bg', 'old'] }, { tokens: ['bg'] })).toEqual({ tokens: ['bg', 'old'] })
  })

  it('keeps the file in an order a diff can read', () => {
    expect(merged({ tokens: ['raise'] }, { tokens: ['bg', 'raise'] })).toEqual({ tokens: ['bg', 'raise'] })
  })
})
