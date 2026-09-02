import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import Ajv2020 from 'ajv/dist/2020'
import { beforeAll, describe, expect, it } from 'vitest'
import { remainingComponents } from '../tools/build-llms.mjs'

/*
 * What a machine reads.
 *
 * Three artefacts are generated from the same MDX the site is built from:
 * an index (`llms.txt`), one document with everything in it (`llms-full.txt`),
 * and a Markdown twin of every page. Plus a JSON Schema describing what the
 * registry actually serves.
 *
 * The failure they are all exposed to is the same one, and it is quiet: the
 * generated copy drifts from the source and nobody notices, because nobody
 * reads these files with their eyes. A page renamed, a component added, a
 * section dropped - the site stays right and the machine-readable half goes
 * stale, which is worse than not having it. So every check here compares the
 * generated artefact against the source it claims to describe, rather than
 * asserting it exists.
 */

const root = resolve(import.meta.dirname, '..')
const publicDir = resolve(root, 'docs/public')
const contentDir = resolve(root, 'docs/src/content/docs')
const site = 'https://lacodda.github.io/dowel'

const read = (path: string) => readFileSync(resolve(publicDir, path), 'utf8')

/** Every documentation page's slug, from the sources rather than the output. */
function sourceSlugs(dir = contentDir, prefix = ''): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return sourceSlugs(resolve(dir, entry.name), `${prefix}${entry.name}/`)
    if (!/\.mdx?$/.test(entry.name)) return []
    const name = entry.name.replace(/\.mdx?$/, '')
    return [name === 'index' ? '' : `${prefix}${name}`]
  })
}

let index: string
let full: string

beforeAll(() => {
  execFileSync('node', ['tools/build-llms.mjs'], { cwd: root })
  execFileSync('node', ['tools/build-schema.mjs'], { cwd: root })
  index = read('llms.txt')
  full = read('llms-full.txt')
})

describe('the index', () => {
  it('follows the convention a reader expects', () => {
    // `llms.txt` is a convention, not a schema: an H1 naming the project, then
    // a blockquote summarising it, then linked sections. A file that is merely
    // valid Markdown is not one an agent knows how to use.
    expect(index.startsWith('# dowel\n')).toBe(true)
    expect(index).toContain('\n> ')
  })

  it('states the version it describes', () => {
    // An agent that fetches this has no other way to know which dowel it is
    // reading about - the docs site serves one version at a time and says so
    // nowhere else in machine-readable form.
    const version = JSON.parse(readFileSync(resolve(root, 'packages/dowel/package.json'), 'utf8')).version
    expect(index).toContain(version)
  })

  it('links every page, and only pages that exist', () => {
    const linked = [...index.matchAll(/\]\((https:\/\/[^)]+\.md)\)/g)].map((m) => m[1]!)
    const slugs = sourceSlugs().sort()

    expect(linked.length, 'the index links no pages').toBeGreaterThan(0)
    for (const slug of slugs) {
      const url = `${site}/${slug || 'index'}.md`
      expect(linked, `\`${slug || 'index'}\` is a page but is not in the index`).toContain(url)
    }
    for (const url of linked) {
      const path = url.slice(`${site}/`.length)
      expect(existsSync(resolve(publicDir, path)), `the index links \`${path}\`, which was not generated`).toBe(
        true,
      )
    }
  })

  it('points at the registry and its schema', () => {
    // The registry is the thing an agent is most likely to want, and it is not
    // a documentation page - without these lines it would have to guess.
    expect(index).toContain(`${site}/r/registry.json`)
    expect(index).toContain(`${site}/r/schema.json`)
  })
})

describe('the Markdown twins', () => {
  it('exist for every page', () => {
    for (const slug of sourceSlugs()) {
      const path = `${slug || 'index'}.md`
      expect(existsSync(resolve(publicDir, path)), `\`${path}\` was not generated`).toBe(true)
    }
  })

  it('say where they came from', () => {
    // A twin that has been copied somewhere else should still lead back to the
    // page it mirrors, which may have moved on.
    for (const slug of sourceSlugs()) {
      const twin = read(`${slug || 'index'}.md`)
      expect(twin, `\`${slug}\` does not name its source`).toContain(`Source: ${site}/${slug}`)
    }
  })

  it('carry no unexpanded component markup', () => {
    // A page is MDX: it renders `<Stand>`, `<TokenTable>`, `<ScaleTable>` and
    // `<AccentGallery>`. Dropping those tags silently would hand the reader a
    // page with a hole in it - the token reference would lose the tokens,
    // which are that page's entire content. Each is expanded into text; a new
    // component with no rule shows up here.
    for (const slug of sourceSlugs()) {
      const twin = read(`${slug || 'index'}.md`)
      expect(
        remainingComponents(twin),
        `\`${slug}\` still contains component markup; add a rule to build-llms.mjs`,
      ).toEqual([])
    }
  })

  it('keep the token vocabulary, which is what the reference page is', () => {
    // The specific hole worth naming: `<TokenTable>` is not decoration on the
    // token page, it *is* the page. Expanded wrongly, the reference would read
    // as prose about a vocabulary it never lists.
    const tokens = read('reference/tokens.md')
    for (const name of ['--bg', '--raise', '--accent', '--on-accent', '--line']) {
      expect(tokens, `the token reference lost \`${name}\``).toContain(name)
    }
  })

  it('keep the code examples intact, import lines included', () => {
    /* Every rule in the generator rewrites something, and the examples are
     * made of exactly what those rules match: tags, and `import` lines.
     * Stripping a page's own imports is right - they are MDX machinery - and
     * doing it to the fenced example is how a reader ends up copying a snippet
     * that will not compile.
     *
     * Asserting `<DialogPopup>` survives is not enough and was the first
     * version of this test: no rule matches that tag, so it survives even with
     * the protection removed. What the protection actually holds is the import
     * line, so that is what is asserted. */
    const examples = ['components/select.md', 'components/combobox.md', 'guides/linting.md']
    for (const path of examples) {
      const page = read(path)
      const fences = page.match(/```[\s\S]*?```/g) ?? []
      expect(fences.length, `\`${path}\` has no code examples left`).toBeGreaterThan(0)
      expect(
        fences.some((fence) => /^import /m.test(fence)),
        `\`${path}\` lost the import line from its example`,
      ).toBe(true)
    }

    // And the tags inside a fence are untouched.
    expect(read('components/dialog.md')).toContain('<DialogPopup')
  })
})

describe('the full text', () => {
  it('contains every page', () => {
    for (const slug of sourceSlugs()) {
      expect(full, `\`${slug || 'index'}\` is missing from the full text`).toContain(
        `Source: ${site}/${slug}\n`,
      )
    }
  })

  it('is the same text as the twins', () => {
    // Two artefacts from one source, and the way they rot is by being
    // generated slightly differently - one keeping a section the other drops.
    for (const slug of sourceSlugs()) {
      const twin = read(`${slug || 'index'}.md`).split('\n').slice(4).join('\n').trim()
      if (!twin) continue
      expect(full, `\`${slug}\` differs between the full text and its twin`).toContain(twin)
    }
  })
})

describe('the registry schema', () => {
  const schema = () => JSON.parse(read('r/schema.json'))
  const registry = () => JSON.parse(read('r/registry.json'))

  it('is itself a valid schema', () => {
    const ajv = new Ajv2020({ strict: false })
    expect(() => ajv.compile(schema())).not.toThrow()
  })

  it('accepts every item the registry actually serves', () => {
    // A schema nobody validates against is a description of what someone
    // believed. This is the check that makes it a description of what is.
    const ajv = new Ajv2020({ strict: false })
    const validate = ajv.compile(schema())

    for (const item of registry().items) {
      const ok = validate(item)
      expect(ok, `\`${item.name}\` fails its own schema: ${ajv.errorsText(validate.errors)}`).toBe(true)
    }
  })

  it('rejects the three mistakes it exists to catch', () => {
    // A schema that accepts everything is decoration. These are the three the
    // registry tests enforce on every build, and the ones someone generating
    // an item by hand would get wrong.
    const ajv = new Ajv2020({ strict: false })
    const validate = ajv.compile(schema())
    const base = registry().items.find((item: { name: string }) => item.name === 'button')

    const climbing = { ...base, files: [{ ...base.files[0], target: '@ui/../../etc/passwd' }] }
    expect(validate(climbing), 'a target climbing out of the project passes').toBe(false)

    const bareSibling = { ...base, registryDependencies: ['input'] }
    expect(validate(bareSibling), "a bare sibling name - shadcn's component - passes").toBe(false)

    const inheriting = { ...registry().items.find((item: { name: string }) => item.name === 'theme'), extends: 'index' }
    expect(validate(inheriting), "a style inheriting shadcn's defaults passes").toBe(false)
  })

  it('describes the types the registry has, and no others', () => {
    const served = [...new Set(registry().items.map((item: { type: string }) => item.type))].sort()
    expect(schema().properties.type.enum).toEqual(served)
  })
})
