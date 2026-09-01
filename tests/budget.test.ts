import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * What a primitive is allowed to cost, and what it is allowed to say.
 *
 * Both are budgets, and both exist for the same reason: a component library
 * decays by accretion, one reasonable addition at a time. Nobody ever decides
 * to make the Dialog drag in three packages or to hard-code a word - it
 * happens in a hurry, once, and then it is precedent.
 *
 * The numbers here are ceilings with room in them, not targets. A component
 * that grows past one is not necessarily wrong; it is required to be a
 * decision, made by editing this file with a reason.
 */

const root = resolve(import.meta.dirname, '..')
const componentDir = resolve(root, 'registry/ui')

const components = readdirSync(componentDir)
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
  .map((file) => ({
    name: file.replace(/\.tsx$/, ''),
    source: readFileSync(resolve(componentDir, file), 'utf8'),
  }))

/** The source with its comments removed.
 *
 * Comments are the point of this codebase - a primitive explains why it is
 * shaped the way it is - so measuring the file would tax exactly what should
 * be encouraged. What is measured is the code. */
function codeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

describe('what a primitive weighs', () => {
  /* Today's largest is Copyable at about 2.4 kB of code: a clipboard call, a
   * timer, two icons and a live region. That is the shape of an involved
   * primitive, and 4 kB leaves room for one to grow without a second look
   * while still catching a component that has quietly become a screen. */
  const CEILING = 4096

  it.each(components.map((c) => [c.name, c.source] as const))(
    '%s is under the ceiling',
    (name, source) => {
      const size = codeOnly(source).length
      expect(
        size,
        `\`${name}\` is ${size} bytes of code, over the ${CEILING} ceiling. ` +
          'Either it is doing two things and should be two components, or the ceiling ' +
          'needs raising here with a reason.',
      ).toBeLessThanOrEqual(CEILING)
    },
  )
})

describe('what a primitive drags in', () => {
  /*
   * The real weight of a component is not its own bytes - the largest here is
   * smaller than this comment's file - but what it makes a product install.
   *
   * So the dependency list is declared rather than observed. A component that
   * starts importing something new fails here, and adding it to this map is
   * the decision. `dowel-ui` is not listed: every component imports `cn` from
   * it, and a product installing any of them already has the theme.
   */
  const ALLOWED: Record<string, string[]> = {
    badge: ['class-variance-authority'],
    button: ['@base-ui/react', 'class-variance-authority'],
    chip: ['class-variance-authority'],
    // A Select you can type in, and it says so in its imports: the field
    // clothes from Input, the popup and row clothes from Select. Only the
    // input, the chips and the empty state are its own.
    combobox: ['@base-ui/react', 'class-variance-authority', 'input', 'select'],
    'confirm-dialog': ['@base-ui/react', 'class-variance-authority'],
    // Wears Menu's clothes rather than its own: the popup below the root is
    // literally Menu's, so two `cva` calls would only drift apart.
    'context-menu': ['@base-ui/react', 'menu'],
    copyable: [],
    dialog: ['@base-ui/react', 'class-variance-authority'],
    drawer: ['@base-ui/react', 'class-variance-authority'],
    input: [],
    kbd: [],
    menu: ['@base-ui/react', 'class-variance-authority'],
    panel: ['class-variance-authority'],
    popover: ['@base-ui/react', 'class-variance-authority'],
    // The trigger is a field, so it wears Input's field clothes: a select and
    // a text input sit next to each other in every form there is.
    select: ['@base-ui/react', 'class-variance-authority', 'input'],
    'preview-card': ['@base-ui/react', 'class-variance-authority'],
    spinner: ['class-variance-authority'],
    // Shares Input's field clothes, so a field and a multi-line field cannot
    // come out looking like two different controls.
    textarea: ['input'],
    tooltip: ['@base-ui/react', 'class-variance-authority'],
    truncate: [],
  }

  /** What the file imports: bare module specifiers minus React and the
   * package, plus any sibling component in this directory.
   *
   * A sibling counts as a dependency even though it costs no install. One
   * primitive importing another is what turns a set of components into a
   * graph, and a product copying a single file out of the registry has to be
   * told which other file comes with it. Reusing a neighbour's `cva` is
   * usually right - the alternative is two class lists that drift - but it is
   * a decision, so it is declared here like any other. */
  function importsOf(source: string): string[] {
    const found = new Set<string>()
    for (const match of source.matchAll(/from\s+'([^']+)'/g)) {
      const specifier = match[1]!
      if (specifier.startsWith('.')) {
        // `./menu` is the component named `menu`. Anything reaching further
        // out than a sibling is not a component and is not counted.
        const sibling = specifier.match(/^\.\/([\w-]+)$/)?.[1]
        if (sibling) found.add(sibling)
        continue
      }
      if (specifier === 'react' || specifier === 'react-dom') continue
      if (specifier === 'dowel-ui') continue
      // `@scope/name/deep/path` counts as `@scope/name`.
      const parts = specifier.split('/')
      found.add(specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]!)
    }
    return [...found].sort()
  }

  it('has a declared budget for every component', () => {
    // A new component must be added here deliberately, or its dependencies
    // would go unchecked from the day it lands.
    expect(components.map((c) => c.name).sort()).toEqual(Object.keys(ALLOWED).sort())
  })

  it.each(components.map((c) => [c.name, c.source] as const))(
    '%s imports only what it is allowed to',
    (name, source) => {
      const allowed = ALLOWED[name] ?? []
      const actual = importsOf(source)
      expect(
        actual,
        `\`${name}\` imports ${JSON.stringify(actual)}, and its budget is ${JSON.stringify(allowed)}. ` +
          'A new dependency is a cost every product pays - add it here if it is worth paying.',
      ).toEqual([...allowed].sort())
    },
  )
})

describe('a primitive has no words of its own', () => {
  /*
   * A string written into a component is a string the product cannot
   * translate. It ships in English to every reader who does not read English,
   * and no amount of i18n in the product reaches it.
   *
   * So visible text arrives through props, always - and a prop that names
   * something for a screen reader has no default, because a default is the
   * same English string wearing a different hat.
   *
   * The check reads the JSX. Class lists, `aria-*` attribute names, key names
   * and the like are not user-facing text; what is caught is a literal that
   * would be rendered or announced.
   */

  /** String defaults in a destructured props list: `label = 'Copy'`. */
  function stringDefaults(source: string): string[] {
    const body = source.match(/export function \w+\(\{([\s\S]*?)\}:/)?.[1] ?? ''
    return [...body.matchAll(/(\w+)\s*=\s*'([^']*)'/g)]
      .filter(([, , value]) => /[A-Za-z]{2}/.test(value!))
      .map(([, prop, value]) => `${prop} = '${value}'`)
  }

  it.each(components.map((c) => [c.name, c.source] as const))(
    '%s puts no English in a prop default',
    (name, source) => {
      const found = stringDefaults(source)
      expect(
        found,
        `\`${name}\` defaults ${found.join(', ')}. A default word is the product's to give: ` +
          'make the prop required instead, so a product that forgets it fails to compile ' +
          'rather than shipping English.',
      ).toEqual([])
    },
  )

  /** Text sitting directly in JSX: `<span>Copy</span>`. */
  function literalJsxText(source: string): string[] {
    // Two or more letters between tags, ignoring `{expressions}`.
    return [...source.matchAll(/>\s*([A-Za-z][A-Za-z ,.'!?-]{1,})\s*</g)]
      .map((match) => match[1]!.trim())
      .filter((text) => text.length > 1)
  }

  it.each(components.map((c) => [c.name, c.source] as const))(
    '%s renders no literal text',
    (name, source) => {
      const found = literalJsxText(source)
      expect(
        found,
        `\`${name}\` renders the literal text ${JSON.stringify(found)}. ` +
          'Text belongs to the product: take it as a prop.',
      ).toEqual([])
    },
  )
})
