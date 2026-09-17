import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compile } from 'tailwindcss'
import { describe, expect, it } from 'vitest'
import { allTokens, token } from '../packages/dowel/src/index'

/*
 * The prose stylesheet, compiled and read back.
 *
 * Everything else in this system is a component, and a component is checked by
 * rendering it. `prose.css` has nothing to render: it is declarations aimed at
 * tags that arrive from a markdown renderer, so nothing in the suite would
 * touch it and a typo in a selector would ship silently. A stylesheet with no
 * gate is the purest form of "green tests, unverified code".
 *
 * What is checked is what can actually go wrong:
 *
 *   - a value written as a raw colour or a raw size, which is the one rule the
 *     whole system rests on and the one a stylesheet can break without ESLint
 *     noticing (`dowel/no-raw-color` lints TSX, not CSS);
 *   - a `var(--…)` naming a token that does not exist - a typo that produces
 *     no error anywhere, just an unstyled element;
 *   - the tags a markdown renderer actually emits going unstyled;
 *   - the two rules that exist to prevent a specific visible defect: a code
 *     block drawn as a big inline code, and a table setting the width of the
 *     column it sits in.
 */

const root = resolve(import.meta.dirname, '..')
const source = readFileSync(resolve(root, 'packages/dowel/src/prose.css'), 'utf8')
const theme = readFileSync(resolve(root, 'packages/dowel/src/theme.css'), 'utf8')
const tailwindDir = resolve(root, 'node_modules/tailwindcss')

/** The stylesheet as the browser sees it, with the theme in front of it - so a
 * `var()` that resolves to nothing is a `var()` that names nothing. */
async function compiled(): Promise<string> {
  const compiler = await compile(`@import 'tailwindcss';\n${theme}\n${source}`, {
    base: root,
    loadStylesheet: async (id, base) => {
      const file = id === 'tailwindcss' ? 'index.css' : id.replace(/^tailwindcss\//, '')
      const path = resolve(tailwindDir, file)
      return { base, content: readFileSync(path, 'utf8'), path }
    },
  })
  return compiler.build([])
}

/** The stylesheet with its comments removed: it explains itself in prose that
 * mentions hex values and selectors. */
const css = source.replace(/\/\*[\s\S]*?\*\//g, '')

/** Every rule in it, as selector plus body. */
const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
  selector: selector!.trim(),
  body: body!.trim(),
}))

const declarations = rules.flatMap(({ selector, body }) =>
  [...body.matchAll(/([\w-]+)\s*:\s*([^;]+);?/g)].map(([, property, value]) => ({
    selector,
    property: property!,
    value: value!.trim(),
  })),
)

describe('prose is written in the vocabulary', () => {
  it('names no colour of its own', () => {
    /*
     * The rule the whole system rests on, and the one place ESLint cannot
     * reach: `dowel/no-raw-color` reads TSX. A hex in here would be a colour
     * that does not follow the theme, in the one stylesheet a product is most
     * likely to keep as it arrived.
     */
    const raw = declarations.filter(
      ({ value }) => /#[0-9a-f]{3,8}\b/i.test(value) || /\b(rgb|hsl|oklch|oklab)\(/i.test(value),
    )
    expect(raw.map((d) => `${d.selector} { ${d.property}: ${d.value} }`)).toEqual([])
  })

  it('names only tokens that exist', () => {
    // A typo inside `var()` produces no error anywhere: the declaration simply
    // does nothing, and the element is drawn unstyled.
    const known = new Set(allTokens.map(token))
    const named = [...css.matchAll(/var\((--[\w-]+)\)/g)].map((match) => match[1]!)
    expect(named.length, 'the stylesheet suddenly uses no tokens at all').toBeGreaterThan(10)

    for (const name of new Set(named)) {
      expect(known, `\`${name}\` is not a token the package exports`).toContain(name)
    }
  })

  it('takes its sizes from the scale, not from round numbers', () => {
    /*
     * Font sizes only. Margins here are in `em`, deliberately - the rhythm of
     * a paragraph is proportional to its own text - and a token scale in `px`
     * cannot express that.
     */
    const sizes = declarations.filter(({ property }) => property === 'font-size')
    expect(sizes.length).toBeGreaterThan(4)

    for (const { selector, value } of sizes) {
      const fromScale = value.startsWith('var(--text-')
      // A relative size is the exception, and it earns it: monospaced glyphs
      // read larger at the same nominal size, and the correction has to follow
      // whatever size the surrounding text happens to be.
      const relative = /^[\d.]+em$/.test(value)
      // `inherit` is not a size at all - it is the refusal of one, which is
      // what `pre code` needs: the block set the size, and the code inside it
      // must not set a second.
      const refused = value === 'inherit'
      expect(
        fromScale || relative || refused,
        `\`${selector}\` sets \`font-size: ${value}\`, which is neither a scale token nor relative`,
      ).toBe(true)
    }
  })
})

describe('prose reaches the tags markdown produces', () => {
  /* What `marked`, `remark` and a CMS actually emit. A tag missing from the
   * stylesheet is a tag drawn in the browser's default - Times New Roman for a
   * blockquote, or a list with its markers stripped by Tailwind's preflight
   * and never put back. */
  const TAGS = [
    'h1',
    'h2',
    'h3',
    'h4',
    'ul',
    'ol',
    'li',
    'code',
    'pre',
    'a',
    'blockquote',
    'table',
    'th',
    'td',
    'hr',
    'strong',
    'em',
    'img',
    'kbd',
  ]

  it.each(TAGS)('styles `%s`', (tag) => {
    const pattern = new RegExp(`(^|[\\s,(>])${tag}([\\s,){:]|$)`, 'm')
    expect(
      rules.some(({ selector }) => pattern.test(selector)),
      `nothing in \`prose.css\` reaches \`<${tag}>\``,
    ).toBe(true)
  })

  it('scopes everything to the class', () => {
    // A stylesheet that styled `h2` globally would reach into every component
    // that happens to render one.
    for (const { selector } of rules) {
      expect(selector, `\`${selector}\` is not scoped to \`.prose\``).toMatch(/\.prose/)
    }
  })
})

describe('the two rules that exist to prevent a drawn defect', () => {
  it('strips the inline code clothes off a code block', () => {
    /*
     * `code` gets a background, a radius and padding, and a `<pre><code>` puts
     * the same three inside the block - so the block is drawn with a second
     * inset panel in it. Undoing them on `pre code` is what stops that, and it
     * is exactly what a typography plugin left to apply here gets wrong.
     */
    const rule = rules.find(({ selector }) => /\.prose pre code/.test(selector))
    expect(rule, 'nothing undoes the inline code clothes inside a block').toBeDefined()
    expect(rule!.body).toContain('background-color: transparent')
    expect(rule!.body).toContain('padding: 0')
  })

  it('keeps a table from setting the width of the column it sits in', () => {
    // A note with a six-column table would otherwise push every paragraph
    // around it out to the table's width.
    const rule = rules.find(({ selector }) => /\.prose table/.test(selector))
    expect(rule!.body).toContain('display: block')
    expect(rule!.body).toContain('overflow-x: auto')
  })

  it('gives the column a measure in characters', () => {
    // Prose across a wide window is unreadable: the eye loses the line it is
    // returning from. `ch` states the limit in the terms it is about.
    const rule = rules.find(({ selector }) => selector === '.prose')
    expect(rule!.body).toMatch(/max-width:\s*\d+ch/)
  })

  it('hands selection back, because prose is read to be quoted', () => {
    const rule = rules.find(({ selector }) => selector === '.prose')
    expect(rule!.body).toContain('user-select: text')
  })
})

describe('prose compiles', () => {
  it('survives Tailwind with its declarations intact', async () => {
    // Text checks cannot tell whether the file parses: an unclosed brace or a
    // selector Tailwind chokes on reads fine and produces nothing.
    const built = await compiled()
    expect(built).toContain('.prose')
    expect(built).toContain('.prose-tight')
    // A token reference survived the compiler rather than being dropped.
    expect(built).toContain('var(--text)')
  })

  it('leaves no `var()` pointing at nothing once the theme is in front of it', async () => {
    const built = await compiled()
    const proseBlock = built.slice(built.indexOf('.prose'))
    const named = [...proseBlock.matchAll(/var\((--[\w-]+)\)/g)].map((match) => match[1]!)
    for (const name of new Set(named)) {
      expect(built, `\`${name}\` is used but never declared`).toContain(`${name}:`)
    }
  })
})

describe('prose-tight', () => {
  it('gives up the measure, because in a bubble the container is the measure', () => {
    const rule = rules.find(({ selector }) => selector === '.prose-tight')
    expect(rule!.body).toContain('max-width: none')
  })

  it('changes only the rhythm, never the vocabulary', () => {
    // It is the same stylesheet in a smaller space. A tight variant that also
    // changed colours would be a second theme.
    const tight = declarations.filter(({ selector }) => selector.includes('.prose-tight'))
    expect(tight.length).toBeGreaterThan(4)
    for (const { property, selector } of tight) {
      expect(
        ['font-size', 'line-height', 'margin-block', 'max-width'].includes(property),
        `\`${selector}\` sets \`${property}\`, which is not part of the rhythm`,
      ).toBe(true)
    }
  })
})
