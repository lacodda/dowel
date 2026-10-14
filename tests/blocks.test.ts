import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { findArbitraryScale } from '../packages/dowel/src/eslint/no-arbitrary-scale'

/*
 * What a block is held to.
 *
 * A block is a screen made of the components - and it is copied into a
 * product to be changed, which is exactly why it has to arrive right. A
 * primitive that is wrong gets fixed here and re-installed; a block that is
 * wrong gets fixed in every product that took it, separately, because by
 * then each has made it its own.
 *
 * So it is held to what a primitive is held to, wherever the rule still means
 * something for a screen: four parts (the block, its test, its page, its
 * place on the stand), photographed, no word of its own, no length off the
 * scale. And to two things only a block needs: it names the primitives it
 * stands on through the consumer's alias, never by a relative path, and the
 * registry lists exactly those primitives, so `shadcn add` brings each one.
 */

const root = resolve(import.meta.dirname, '..')
const blockDir = resolve(root, 'registry/blocks')

const blocks = readdirSync(blockDir)
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
  .map((file) => ({
    name: file.replace(/\.tsx$/, ''),
    source: readFileSync(resolve(blockDir, file), 'utf8'),
  }))

const named = blocks.map((block) => [block.name, block] as const)

const pascal = (name: string) =>
  name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

interface Item {
  name: string
  type: string
  title: string
  registryDependencies?: string[]
  files?: { path: string; target: string; type: string; content: string }[]
}

const catalogue: { items: Item[] } = JSON.parse(
  readFileSync(resolve(root, 'docs/public/r/registry.json'), 'utf8'),
)

/** The source with its comments blanked out. */
function codeOnly(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

const importsOf = (source: string) => [...source.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1]!)

describe('the blocks', () => {
  it('there are some', () => {
    expect(blocks.length).toBeGreaterThan(0)
  })

  it('are scanned for classes wherever they are drawn', () => {
    // Tailwind writes CSS for the classes it finds in the files it scans,
    // and the blocks live outside every app that draws them. Left out of a
    // stylesheet's sources, a block renders with every class it shares with
    // a primitive and none of its own - cramped rather than broken, which is
    // why it was found by measuring a padding of zero, not by looking.
    for (const sheet of ['stand/src/styles.css', 'demo/src/styles.css']) {
      const css = readFileSync(resolve(root, sheet), 'utf8')
      expect(css, `${sheet} does not scan the blocks`).toMatch(/@source '[^']*registry\/blocks'/)
    }
  })
})

describe.each(named)('%s', (name, { source }) => {
  it('exports the screen its name promises', () => {
    // What `shadcn add` prints and what a product types in its router.
    expect(source).toMatch(new RegExp(String.raw`^export function ${pascal(name)}\b`, 'm'))
  })

  it('is called a screen', () => {
    // Blocks and components share one registry and one namespace; a block
    // named `list-detail` would sit beside the `ListDetail` it is built on.
    expect(name).toMatch(/-screen$/)
  })

  it('opens with an import, so its first comment survives `shadcn add`', () => {
    // The CLI writes back from the first token: a comment above it is cut.
    expect(source.trimStart().startsWith('import ')).toBe(true)
  })

  describe('four parts', () => {
    it('has a test that runs the accessibility gate', () => {
      const test = resolve(blockDir, `${name}.test.tsx`)
      expect(existsSync(test), `\`${name}\` has no test`).toBe(true)
      expect(readFileSync(test, 'utf8')).toContain('expectNoA11yViolations')
    })

    it('has a page that points at the stand', () => {
      const page = resolve(root, `docs/src/content/docs/blocks/${name}.mdx`)
      expect(existsSync(page), `\`${name}\` has no page under docs/blocks`).toBe(true)
      const text = readFileSync(page, 'utf8')
      expect(text).toContain(`<Stand component="${name}"`)
      expect(text).toContain(`/r/${name}.json`)
      // A colon in an unquoted value is a key to YAML, and the page fails to
      // build after every test has passed.
      for (const line of text.match(/^---\n([\s\S]*?)\n---/)![1]!.split('\n')) {
        const value = line.slice(line.indexOf(':') + 1).trim()
        expect(/^['"].*['"]$/.test(value) || !value.includes(': '), line).toBe(true)
      }
    })

    it('stands on the stand, in the group of blocks, linked to its page', () => {
      const app = readFileSync(resolve(root, 'stand/src/App.tsx'), 'utf8')
      const entry = app.match(new RegExp(String.raw`\{\s*id: '${name}',[\s\S]*?\}`))?.[0]
      expect(entry, `the stand has no \`${name}\``).toBeDefined()
      expect(entry).toContain("kind: 'block'")
      expect(entry).toContain(`docs: '/dowel/blocks/${name}/'`)
    })

    it('is photographed', () => {
      // The pictures and the accessibility report walk one list of sections.
      const sections = readFileSync(resolve(root, 'tests/visual/sections.ts'), 'utf8')
      expect(sections).toContain(`  '${name}',`)
    })
  })

  describe('in the registry', () => {
    const item = catalogue.items.find((entry) => entry.name === name)

    it('is a block', () => {
      expect(item?.type).toBe('registry:block')
      expect(item?.title).toBe(pascal(name))
    })

    it('lands among the blocks, not among the primitives', () => {
      // `components/ui` is held to the catalogue by a product's own check;
      // a block landing there would fail it the first time it was changed.
      expect(item?.files?.map((file) => file.target)).toEqual([`@components/blocks/${name}.tsx`])
    })

    it('brings every primitive it stands on, and nothing else', () => {
      const primitives = importsOf(source)
        .filter((specifier) => specifier.startsWith('@/components/ui/'))
        .map((specifier) => `https://lacodda.github.io/dowel/r/${specifier.replace('@/components/ui/', '')}.json`)
      expect([...(item?.registryDependencies ?? [])].sort()).toEqual([...new Set(primitives)].sort())
    })
  })

  it('names the primitives through the consumer alias, never by a relative path', () => {
    // `../ui/button` holds only in a project whose blocks and components sit
    // side by side; `@/components/ui/button` is rewritten by `shadcn add` to
    // wherever the product keeps them.
    const relative = importsOf(source).filter((specifier) => specifier.startsWith('.'))
    expect(relative).toEqual([])
  })

  it('needs nothing a primitive does not already bring', () => {
    // React, `cn`, and the primitives. A block that wanted a package of its
    // own would be a component in disguise.
    const foreign = importsOf(source).filter(
      (specifier) => specifier !== 'react' && specifier !== 'dowel-ui' && !specifier.startsWith('@/components/ui/'),
    )
    expect(foreign).toEqual([])
  })

  it('renders no literal text', () => {
    // The same reading as for a primitive: two or more letters between tags.
    // Not after `=>`: an arrow returning `ref.current?.querySelector<T>` is a
    // generic, not text.
    const code = codeOnly(source)
    const found = [...code.matchAll(/(?<!=)>\s*([A-Za-z][A-Za-z ,.'!?-]{1,})\s*</g)]
      .map((match) => match[1]!.trim())
      .filter((text) => text.length > 1)
    expect(found, 'text belongs to the product: take it in `words`').toEqual([])
  })

  it('puts no English in an attribute', () => {
    // `aria-label="Back"` is a word a screen reader says and no product can
    // translate; it belongs in `words` like the rest.
    const code = codeOnly(source)
    const found = [...code.matchAll(/\b(aria-label|placeholder|title|alt)="([^"]*[A-Za-z]{2}[^"]*)"/g)].map(
      (match) => match[0],
    )
    expect(found).toEqual([])
  })

  it('stays on the scale', () => {
    expect(findArbitraryScale(source).map((finding) => finding.text)).toEqual([])
  })
})
