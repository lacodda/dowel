import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { lineProducts } from '../packages/dowel/src/line'
import { markLevel, marks, type MarkName } from '../packages/dowel/src/marks'
import { renderMarksModule } from '../tools/marks-module.mjs'

/*
 * The marks of the line.
 *
 * Two copies ship - the SVG files and the module a component draws from - and
 * one fact sits in two places besides: a product's colour is in `line.ts` and
 * in its tile. Each check below keeps one of those pairs from drifting.
 */

const root = resolve(import.meta.dirname, '..')

describe('the module', () => {
  it('is what the files produce now', () => {
    // A master replaced by hand without re-running the import would ship a
    // file that says one thing and a component that draws another.
    const committed = readFileSync(resolve(root, 'packages/dowel/src/marks.ts'), 'utf8')
    expect(committed.replace(/\r\n/g, '\n')).toBe(renderMarksModule(resolve(root, 'assets/marks')))
  })

  it('has a mark for every product of the line, and the line itself', () => {
    expect(Object.keys(marks).sort()).toEqual([...lineProducts.map((p) => p.name), 'lacodda'].sort())
  })

  it('has the three levels of each, and the files to match', () => {
    const files = readdirSync(resolve(root, 'assets/marks')).sort()
    expect(files).toEqual(
      Object.keys(marks)
        .flatMap((name) => ['L', 'M', 'S'].map((level) => `${name}-${level}.svg`))
        .sort(),
    )
  })

  it('leaves no id a second mark on the screen would share', () => {
    for (const [name, levels] of Object.entries(marks)) {
      for (const markup of Object.values(levels)) {
        expect(markup.match(/\bid="([^"]*)"/g) ?? [], name).toEqual(
          markup.includes('{{id}}') ? ['id="{{id}}"'] : [],
        )
      }
    }
  })
})

describe('the colour', () => {
  it('fills each small tile with the accent the theme uses', () => {
    // S is the tile filled with the product's colour - for a pair, the pair's
    // first colour, which is the one the theme takes as the accent.
    for (const { name, accent } of lineProducts) {
      expect(marks[name as MarkName].S.toUpperCase(), name).toContain(accent.toUpperCase())
    }
  })
})

describe('the level', () => {
  it('follows the line rule at its edges', () => {
    // L carries the metaphor from 64px; M is the code alone from 28; S is the
    // filled tile at 27 and under.
    expect([16, 27, 28, 63, 64, 512].map(markLevel)).toEqual(['S', 'S', 'M', 'M', 'L', 'L'])
  })
})
