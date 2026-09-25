import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findArbitraryScale } from '../packages/dowel/src/eslint/no-arbitrary-scale'

/*
 * Size and spacing come from the scale, or they are argued for by name.
 *
 * The colour vocabulary has held since v0.1 because `--color-*: initial` makes
 * a raw colour fail to compile - there is no way to write `bg-zinc-800` and
 * have it work. Size has no such wall: `h-[22px]` compiles perfectly, looks
 * deliberate, and is how a set of components drifts into having nine values
 * inside four pixels. The theme says as much about the type scale, which was
 * built by collapsing exactly that.
 *
 * So the wall is this gate. An arbitrary length in a class is either on the
 * scale - in which case write the step - or it is a real exception, in which
 * case it is listed below with the reason. The list is the point: an exception
 * with an argument beside it is a decision, and a hundred of them without one
 * is a set nobody can predict.
 *
 * What is *not* caught, and deliberately:
 *
 * - Anything computed - `calc()`, `min()`, `max()`, `var()`. These are
 *   relationships, not measurements: `w-[min(22rem,calc(100vw-2rem))]` says "as
 *   wide as it wants, but never off the screen", and no scale step can say
 *   that.
 * - Viewport and container units, for the same reason.
 * - Percentages and fractions, which are proportions of something else.
 *
 * The rule is about *fixed lengths chosen by eye*, because those are the ones
 * that drift.
 */

const root = resolve(import.meta.dirname, '..')
const componentDir = resolve(root, 'registry/ui')

const components = readdirSync(componentDir)
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
  .map((file) => ({
    name: file.replace(/\.tsx$/, ''),
    source: readFileSync(resolve(componentDir, file), 'utf8'),
  }))

/*
 * What counts as off the scale is the lint rule's to say - `findArbitraryScale`
 * from `dowel/no-arbitrary-scale` - so the set and the products it ships to
 * are held to one definition. Products get it as a lint error; the set gets it
 * here, where each exception keeps its argument beside it and a stale one is
 * caught (the repository's lint config leaves `registry/ui` to this gate).
 *
 * The rule reads type, radius and tracking as well as length, which this gate
 * did not: `text-[10px]` sat in six primitives because only sizing was read.
 */
function fixedLengths(source: string): Array<{ at: number; text: string; message: string }> {
  return findArbitraryScale(source).map((finding) => ({
    at: finding.index,
    text: finding.text,
    message: finding.message,
  }))
}

/*
 * The exceptions, each with the argument that earns it.
 *
 * Adding an entry is the deliberate act this gate exists to force. The reason
 * has to say why no step of the scale can carry the value - "it looked right"
 * is what every drifted number says about itself.
 */
const ALLOWED: Record<string, Record<string, string>> = {
  'activity-heatmap': {
    'rounded-[3px]':
      'a heatmap cell is a pixel of data, ten or twelve pixels across, not a control. The radius scale starts at 4, which rounds a cell that small towards a dot and turns a grid of days into a grid of beads',
  },
  splash: {
    'text-[26px]':
      "the product's name on the splash is the mark's wordmark, set to the mark above it - not text in the interface. The type scale stops at 21 because nothing on a working screen is larger; this is the one thing that is not on a working screen",
    'tracking-[0.02em]':
      'the wordmark is tracked open the way the brand-line wordmarks are, and no interface text is: `tracking-caption` is for 10px capitals and would space a 26px name apart',
  },
}

describe('size comes from the scale', () => {
  it.each(components.map((c) => [c.name, c.source] as const))(
    '%s measures in steps, or says why not',
    (name, source) => {
      const allowed = ALLOWED[name] ?? {}

      const unexplained = fixedLengths(source)
        .filter((found) => allowed[found.text] === undefined)
        .map((found) => `line ${source.slice(0, found.at).split('\n').length}: ${found.message}`)

      expect(
        unexplained,
        `\`${name}\` measures by hand:\n  ${unexplained.join('\n  ')}\n` +
          'Use a step of the scale, or add it to ALLOWED in this file with the reason no ' +
          'step can carry it. A fixed length nobody argued for is how a set ends up with ' +
          'nine values inside four pixels.',
      ).toEqual([])
    },
  )

  it('lists no exception that has gone away', () => {
    // An allowance outliving the code it excused is worse than none: it reads
    // as a rule of the set, and the next person writes `w-[52px]` somewhere
    // else believing it was agreed.
    const stale: string[] = []
    for (const [name, entries] of Object.entries(ALLOWED)) {
      const component = components.find((c) => c.name === name)
      if (!component) {
        stale.push(`\`${name}\` is not a component any more`)
        continue
      }
      for (const value of Object.keys(entries)) {
        if (!component.source.includes(value)) stale.push(`\`${name}\` no longer writes ${value}`)
      }
    }
    expect(stale, `stale allowances:\n  ${stale.join('\n  ')}`).toEqual([])
  })
})

describe('the caption is one utility', () => {
  /*
   * The small uppercase label had seven recipes in the set - with and without
   * `font-medium`, with and without a weight at all - so a Field's label and
   * the SectionLabel above it were two weights of one thing, and kilna's
   * screens copied whichever they saw first, thirty-one times. It is
   * `caption` now, and a recipe written out by hand is the drift starting
   * again.
   */
  it.each(components.map((c) => [c.name, c.source] as const))('%s writes no caption by hand', (name, source) => {
    const byHand = [...source.matchAll(/['"`][^'"`]*\buppercase\b[^'"`]*\btracking-caption\b[^'"`]*['"`]/g)].map(
      (match) => match[0],
    )
    expect(byHand, `\`${name}\` spells out the caption; use the \`caption\` utility`).toEqual([])
  })
})
