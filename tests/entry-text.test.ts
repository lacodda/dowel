import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileClasses } from './compile'

/*
 * Every field a reader types into is 16px under a finger.
 *
 * iOS Safari zooms the page into a field whose text is smaller than 16px when
 * it takes the focus, and does not zoom back out. The set's fields are 12px,
 * which is right with a mouse - so on a phone every form of the line opened
 * at 130%, and each product that noticed fixed it on its own sign-in screen:
 * kasl-server with the wrong step of the scale, lyrn's template with the
 * right one. A fix that lives in the products is a fix the next product does
 * not have.
 *
 * It lives in the fields now, as `pointer-coarse:text-lg`, and this holds the
 * whole set to it. The reading is static: every element a reader types into
 * - `<input>`, `<textarea>`, Base UI's `Input` - is found in the source, and
 * its class list has to carry the size itself, or carry `fieldClasses`, or
 * name a `cva` whose base does. A new field written with a bare `text-sm` is
 * the case this exists for.
 */

const root = resolve(import.meta.dirname, '..')
const componentDir = resolve(root, 'registry/ui')

/** Input types nobody types text into: there is nothing to zoom into. */
const NOT_TYPED = /\btype=["'](hidden|file|radio|checkbox|range)["']/

/** The opening tag starting at `start`, through its closing `>` - braces
 * counted, so an arrow function inside a prop does not end it early. */
function tagAt(source: string, start: number): string {
  let depth = 0
  for (let i = start; i < source.length; i += 1) {
    const char = source[i]
    if (char === '{') depth += 1
    else if (char === '}') depth -= 1
    else if (char === '>' && depth === 0 && source[i - 1] !== '=') return source.slice(start, i + 1)
  }
  return source.slice(start)
}

/** The base of a `cva` declared in this file, by its name. */
function cvaBase(source: string, name: string): string {
  const declaration = source.indexOf(`const ${name} = cva(`)
  if (declaration === -1) return ''
  // The base and the variants both: a size variant can carry the class too.
  return tagAt(source, declaration).slice(0, 2000)
}

const SIZED = 'pointer-coarse:text-lg'

function carriesTheSize(source: string, tag: string): boolean {
  if (tag.includes(SIZED) || tag.includes('fieldClasses')) return true
  // `className={tagInputBoxVariants({ size })}`: the class list is a `cva`.
  const variants = [...tag.matchAll(/(\w+Variants)\(/g)].map((match) => match[1]!)
  return variants.some((name) => {
    const base = cvaBase(source, name)
    return base.includes(SIZED) || base.includes('fieldClasses')
  })
}

/** The source with its comments blanked out. The set explains itself in
 * prose, and prose says `<input type=checkbox>` - which is not a field. */
function codeOnly(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

const entries = readdirSync(componentDir)
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
  .flatMap((file) => {
    const source = codeOnly(readFileSync(resolve(componentDir, file), 'utf8'))
    // The element, not the type: `Omit<Base.Input.Props, 'size'>` is not a field.
    return [...source.matchAll(/<(input|textarea|Base\.Input)(?=[\s/>])/g)]
      .map((match) => tagAt(source, match.index!))
      .filter((tag) => !NOT_TYPED.test(tag))
      .map((tag, index) => ({ file, index, source, tag }))
  })

describe('every field is 16px under a finger', () => {
  it('finds the fields', () => {
    // A reading that finds nothing passes everything. Input, Textarea,
    // PasswordField, NumberField, SearchField, TagInput, the palette's input
    // and the rest: well over ten today.
    expect(entries.length).toBeGreaterThan(10)
  })

  it.each(entries.map((entry) => [`${entry.file} #${entry.index + 1}`, entry] as const))(
    '%s',
    (_, { source, tag }) => {
      expect(
        carriesTheSize(source, tag),
        `a field here is typed into and does not carry \`${SIZED}\` (or \`fieldClasses\`): ` +
          `iOS zooms the page into it on focus.\n${tag.slice(0, 400)}`,
      ).toBe(true)
    },
  )

  /*
   * The check above trusts a name: `fieldClasses`, or a `cva` that mentions
   * it. Two mutations walked through that trust - the size taken out of
   * `fieldClasses` itself, and out of Combobox's bare variant, whose `cva`
   * mentions `fieldClasses` in the other branch.
   *
   * So the look of a field is held where it is written. A class string that
   * styles a placeholder is the look of something typed into - nothing else
   * has one - and every such string carries the size itself.
   */
  const looks = readdirSync(componentDir)
    .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
    .flatMap((file) => {
      const source = codeOnly(readFileSync(resolve(componentDir, file), 'utf8'))
      return [...source.matchAll(/'([^'\n]*placeholder:[^'\n]*)'/g)].map((match) => [file, match[1]!] as const)
    })

  it('finds the looks', () => {
    expect(looks.length).toBeGreaterThan(5)
  })

  it.each(looks)('%s: %s', (_, look) => {
    expect(look, 'the look of a field without the size it takes under a finger').toContain(SIZED)
  })

  it('compiles to the size, on a coarse pointer only', async () => {
    // The variant has to exist in this Tailwind, and has to mean the pointer:
    // a class that compiled to nothing would pass every check above.
    const css = await compileClasses([SIZED])
    // Tailwind inlines the theme's value; 16px is the floor iOS asks for.
    expect(css).toMatch(/@media \(pointer: coarse\) \{\s*\.pointer-coarse\\:text-lg \{\s*font-size: 16px;/)
  })
})
