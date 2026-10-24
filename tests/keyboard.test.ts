import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { surfaces } from './ceilings'
import { SECTIONS } from './visual/sections'

/*
 * Every overlay and menu is driven by the keyboard in a real browser.
 *
 * The driving is `tests/visual/keyboard.spec.ts`, against the stand, in the
 * CI job that serves it. This holds that nothing escapes it: each surface the
 * set draws over the page (found in the source, the same way the ceiling gate
 * finds them) and each component that opens one - a date picker is a popover,
 * a product switcher is a menu - has a block there named for its stand
 * section. A new popup without one fails here, in the ordinary test run, not
 * months later in a reader's hands.
 */

const ui = resolve(import.meta.dirname, '../registry/ui')
const spec = readFileSync(resolve(import.meta.dirname, 'visual/keyboard.spec.ts'), 'utf8')
const driven = new Set([...spec.matchAll(/test\.describe\('([a-z0-9-]+)'/g)].map((match) => match[1]!))

/** The registry's own modules, each with the siblings it imports. */
const modules = new Map(
  readdirSync(ui)
    .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
    .map((file) => {
      const text = readFileSync(resolve(ui, file), 'utf8')
      const siblings = [...text.matchAll(/from '\.\/([a-z0-9-]+)'/g)].map((match) => match[1]!)
      return [file.replace(/\.tsx$/, ''), siblings] as const
    }),
)

/** The surfaces, and everything that reaches one through its imports. */
function opensSomething(): string[] {
  const opening = new Set(surfaces().map((surface) => surface.file.replace(/^ui\//, '').replace(/\.tsx$/, '')))
  for (let grew = true; grew; ) {
    grew = false
    for (const [name, siblings] of modules) {
      if (!opening.has(name) && siblings.some((sibling) => opening.has(sibling))) {
        opening.add(name)
        grew = true
      }
    }
  }
  return [...opening].sort()
}

describe('the keyboard contract', () => {
  it('drives every overlay, and every component that opens one', () => {
    const opening = opensSomething()
    // The reader is not blind: the dialogs, menus and pickers are all in it.
    for (const known of ['dialog', 'menu', 'select', 'date-picker', 'product-switcher']) expect(opening).toContain(known)
    expect(opening.filter((name) => !driven.has(name))).toEqual([])
  })

  it('names only sections the stand has', () => {
    expect([...driven].filter((name) => !(SECTIONS as readonly string[]).includes(name))).toEqual([])
  })
})
