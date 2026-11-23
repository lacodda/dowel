import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { fieldClasses } from '../registry/ui/input'
import { compileClasses, utilityRules } from './compile'

/*
 * A field's focus ring is drawn inside its box.
 *
 * A field stands at the edge of something that clips more often than not - a
 * ScrollArea's viewport, a dialog's body, a panel with `overflow: hidden` -
 * and the ring used to be drawn outside the border, so the side that touched
 * the edge was cut off. kilna overrode the offset for every field in its own
 * stylesheet to get it back (order 8065). A fix that lives in a product is a
 * fix the next product does not have, so this holds the set to it: every file
 * that dresses a field in `fieldClasses` draws its focus ring with a negative
 * offset, whether the ring is on the input or on a box around it.
 */

const root = resolve(import.meta.dirname, '..')
const componentDir = resolve(root, 'registry/ui')

/** Every class list a field wears: the `cn(...)` call that holds
 * `fieldClasses`, parentheses counted. A swatch or a clear button inside a
 * field is a control of its own, and its ring is not the field's. */
function fieldClassLists(source: string): string[] {
  const lists: string[] = []
  for (const match of source.matchAll(/\bfieldClasses\b(?!\s*=)/g)) {
    const start = source.lastIndexOf('cn(', match.index)
    if (start < 0 || source.lastIndexOf(')', match.index) > start) continue
    let depth = 0
    for (let i = start + 2; i < source.length; i += 1) {
      if (source[i] === '(') depth += 1
      else if (source[i] === ')' && --depth === 0) {
        lists.push(source.slice(start, i + 1))
        break
      }
    }
  }
  return lists
}

const fields = readdirSync(componentDir)
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
  .map((file) => ({ file, lists: fieldClassLists(readFileSync(resolve(componentDir, file), 'utf8')) }))
  .filter(({ lists }) => lists.length > 0)

describe('a field’s focus ring', () => {
  it('is inside the box, over the border', async () => {
    const css = await compileClasses(fieldClasses.split(/\s+/))
    const offset = utilityRules(css).find((rule) => rule.body.startsWith('outline-offset'))
    expect(offset?.selector).toContain(':focus-visible')
    expect(offset?.body).toBe('outline-offset: calc(2px * -1);')
  })

  it('finds the fields it holds', () => {
    // The scan below is only as good as what it reads.
    expect(fields.map(({ file }) => file)).toEqual(
      expect.arrayContaining(['input.tsx', 'number-field.tsx', 'password-field.tsx', 'tag-input.tsx', 'combobox.tsx']),
    )
  })

  it('reads the class lists around a field, and only those', () => {
    const lists = fieldClassLists(`
      const a = cn(fieldClasses, 'focus-within:-outline-offset-2', cn('x'))
      const b = cn('focus-visible:outline-offset-1')`)
    expect(lists).toEqual([`cn(fieldClasses, 'focus-within:-outline-offset-2', cn('x'))`])
  })

  it.each(fields.map(({ file, lists }) => [file, lists] as const))(
    '%s draws no ring outside its box',
    (_, lists) => {
      // An offset of zero or more on a focus ring is a ring the edge can cut.
      const outside = lists.flatMap((list) => list.match(/(?<!-)focus-(?:visible|within):outline-offset-\d+/g) ?? [])
      expect(outside).toEqual([])
    },
  )
})
