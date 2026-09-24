import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * An icon's own size wins.
 *
 * A primitive that sizes the icons inside it writes a descendant selector:
 * `[&_svg]:size-4` compiles to `.that-class svg`, one class and one element.
 * The size a call site writes on the icon itself is one class - so it loses,
 * every time, and nothing reports it. That was eight primitives of the set at
 * once when it was found: a `+` meant to be 10px drew at 14 on kilna's title
 * bar, and three other explicit sizes there did nothing at all.
 *
 * The guard is `:not([class*=size-])` inside the variant: the primitive sizes
 * an icon that has no size of its own and leaves alone one that does. This
 * holds it across the set, so the next primitive to size its icons cannot
 * bring the old form back.
 */

const componentDir = resolve(import.meta.dirname, '../registry/ui')

const sources = readdirSync(componentDir)
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
  .map((file) => ({ file, source: readFileSync(resolve(componentDir, file), 'utf8') }))

/** Every arbitrary variant that reaches an svg and sets its size. */
function svgSizings(source: string): string[] {
  return [...source.matchAll(/\[&[_>]svg[^\]\s'"`]*(?:\([^)]*\))?[^\]\s'"`]*\]:size-[\w.]+/g)].map(
    (match) => match[0],
  )
}

describe('an icon keeps the size it is given', () => {
  it('finds what it is looking for', () => {
    // A scanner that finds nothing is green whatever the set does. Button
    // sizes an icon at every one of its six sizes, so the scan must see them.
    const button = sources.find((entry) => entry.file === 'button.tsx')!
    expect(svgSizings(button.source).length).toBeGreaterThanOrEqual(6)
    // And it must see the unguarded form, or it could never go red.
    expect(svgSizings("'[&_svg]:size-4 [&>svg]:size-full'")).toEqual(['[&_svg]:size-4', '[&>svg]:size-full'])
  })

  it.each(sources.map((entry) => entry.file))('%s sizes only an icon with no size of its own', (file) => {
    const { source } = sources.find((entry) => entry.file === file)!
    const unguarded = svgSizings(source).filter((variant) => !variant.includes(':not([class*=size-])'))
    expect(unguarded, `${file} overrules an icon's own size: ${unguarded.join(', ')}`).toEqual([])
  })
})
