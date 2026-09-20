import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

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

/** Utilities that take a length from the spacing or sizing scale. Colour,
 * border width and the rest have their own gates or their own scales. */
const SIZING =
  '(?:size|w|h|min-w|min-h|max-w|max-h|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y|top|bottom|left|right|inset|inset-x|inset-y|translate-x|translate-y|basis)'

/**
 * Fixed lengths written by hand, as `utility-[12px]`.
 *
 * A negative utility (`-ml-[2px]`) counts: the sign is a direction, not a
 * different kind of measurement.
 */
function fixedLengths(source: string): Array<{ at: number; text: string }> {
  const found: Array<{ at: number; text: string }> = []
  const pattern = new RegExp(`-?\\b${SIZING}-\\[([^\\]]+)\\]`, 'g')

  for (const match of source.matchAll(pattern)) {
    const value = match[1]!
    // Computed, relative or proportional - a relationship rather than a
    // measurement somebody chose.
    if (/calc|min\(|max\(|clamp|var\(|%|vw|vh|dvh|dvw|lh|ch|em\b|fr\b|auto|100/.test(value)) continue
    // What is left is a plain length: `22px`, `1.5rem`, `13`.
    if (!/^-?[\d.]+(px|rem)?$/.test(value)) continue
    found.push({ at: match.index, text: match[0] })
  }

  return found
}

/*
 * The exceptions, each with the argument that earns it.
 *
 * Adding an entry is the deliberate act this gate exists to force. The reason
 * has to say why no step of the scale can carry the value - "it looked right"
 * is what every drifted number says about itself.
 */
const ALLOWED: Record<string, Record<string, string>> = {
  sparkline: {
    'w-[52px]':
      'the width of the sparkline beside a figure in a row. Not a box in the layout but a drawing surface: it is the viewBox the line is plotted into, and a step of the spacing scale would change the aspect the data is read at',
    'w-[120px]':
      'the same surface at the size meant to be read rather than glanced at',
  },
}

describe('size comes from the scale', () => {
  it.each(components.map((c) => [c.name, c.source] as const))(
    '%s measures in steps, or says why not',
    (name, source) => {
      const allowed = ALLOWED[name] ?? {}

      const unexplained = fixedLengths(source)
        .filter((found) => allowed[found.text] === undefined)
        .map((found) => `line ${source.slice(0, found.at).split('\n').length}: ${found.text}`)

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
