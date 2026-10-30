import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildProps, type PropEntry } from '../tools/build-props.mjs'

/*
 * The props tables, which are read from the TypeScript and nowhere else.
 *
 * They were written by hand on every page until v0.41, and a hand table is a
 * copy of the types: the Menu page credited dowel with defaults Base UI
 * decides, and a prop added in a fix reached its page only when someone
 * remembered. `tools/build-props.mjs` reads the source instead; the site and
 * the Markdown twins draw from what it wrote.
 */

const root = resolve(import.meta.dirname, '..')
const committed = JSON.parse(readFileSync(resolve(root, 'registry/props.json'), 'utf8')) as ReturnType<
  typeof buildProps
>

describe('the props of every component', () => {
  it('are what the source says today', () => {
    // A whole TypeScript program over the registry: seconds, not milliseconds.
    expect(buildProps(), 'registry/props.json is behind the source: run `node tools/build-props.mjs`').toEqual(
      committed,
    )
  }, 120_000)

  /*
   * A prop the file declares is described where it is declared, because that
   * comment is the whole of its documentation - on the site, in the Markdown
   * an assistant reads, and in the editor of the product that copied it.
   *
   * Three kinds are left to their names. A cva variant's choices are its
   * type, and its page shows each one drawn. A prop declared elsewhere and
   * listed for the default this file gives it is described where it is
   * declared. `className`, `children` and `style` mean what they mean
   * everywhere in React; a file that redeclares them does so for the type,
   * not to say something new.
   */
  const selfEvident = new Set(['className', 'children', 'style'])
  const undescribed = (prop: PropEntry) =>
    !prop.description && !prop.variant && !prop.inherited && !selfEvident.has(prop.name)

  it('are each described where they are declared', () => {
    const missing = Object.entries(committed).flatMap(([item, { dir, components }]) =>
      components.flatMap((component) =>
        (component.props ?? []).filter(undescribed).map((prop) => `${dir}/${item}.tsx ${component.name}.${prop.name}`),
      ),
    )
    expect(missing, 'a doc comment on each of these props, in the file that declares it').toEqual([])
  })
})

describe('the pages', () => {
  const pages = ['components', 'blocks'].flatMap((dir) => {
    const at = resolve(root, 'docs/src/content/docs', dir)
    return readdirSync(at)
      .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
      .map((file) => ({ path: `${dir}/${file}`, text: readFileSync(resolve(at, file), 'utf8') }))
  })

  it('keep no props table of their own', () => {
    // The table is drawn under every page by the MarkdownContent override; a
    // page's own `## Props` would be a second one, and the copy that drifts.
    const withTables = pages
      .filter(({ text }) => /^## Props\s*$/m.test(text) || /^\|\s*Prop\s*\|/m.test(text))
      .map(({ path }) => path)
    expect(withTables).toEqual([])
  })
})
