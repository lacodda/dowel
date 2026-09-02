import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { lineProducts } from '../packages/dowel/src/line'

/*
 * The registry, as a consumer's CLI reads it.
 *
 * A registry is a promise made to a command run in someone else's project, and
 * the ways it breaks are quiet: an item that names a dependency which does not
 * resolve, a theme decomposed into key-value pairs and reassembled wrong, a
 * file whose target lands outside the project. None of that shows up in a
 * build log - `shadcn add` simply fails in a stranger's terminal.
 *
 * These are the checks that can run without a network. The live install is a
 * separate instrument and was run by hand: `shadcn add` against the served
 * registry, into a clean project, both items, and the theme compared byte for
 * byte with the source.
 */

const root = resolve(import.meta.dirname, '..')
const registryDir = resolve(root, 'docs/public/r')

interface RegistryFile {
  path: string
  target?: string
  type: string
  content?: string
}

interface RegistryItem {
  $schema?: string
  name: string
  type: string
  title?: string
  description?: string
  extends?: string
  registryDependencies?: string[]
  files?: RegistryFile[]
  docs?: string
}

let items: RegistryItem[]
let catalogue: { name: string; homepage: string; items: RegistryItem[] }

/** Every file the registry serves, snapshot directories included, as paths
 * relative to `docs/public/r`. Flat `readdirSync` stopped being enough when
 * the pinned snapshot arrived: it hands back the directory name and reading
 * it throws, which is a failure that says nothing about the registry. */
function served(dir = registryDir, prefix = ''): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? served(resolve(dir, entry.name), `${prefix}${entry.name}/`)
      : [`${prefix}${entry.name}`],
  )
}

/** The registry as committed, before anything regenerates it. It is checked
 * in rather than built in CI - the docs workflow runs only `astro build` - so
 * what is committed is what gets deployed. */
const committed = new Map(served().map((file) => [file, readFileSync(resolve(registryDir, file), 'utf8')]))

/** The snapshot directory of the version being released: `r/v0.12`. */
const pinned = (() => {
  const [major, minor] = JSON.parse(readFileSync(resolve(root, 'packages/dowel/package.json'), 'utf8'))
    .version.split('.')
  return `v${major}.${minor}`
})()

let pinnedItems: RegistryItem[]

beforeAll(() => {
  execFileSync('node', ['tools/build-registry.mjs'], { cwd: root })
  const read = (file: string) => JSON.parse(readFileSync(resolve(registryDir, file), 'utf8'))
  catalogue = read('registry.json')
  /* `registry.json` is the catalogue and `schema.json` describes the items
   * rather than being one - both live in the same directory because both are
   * served from it, and neither is something a consumer installs. */
  const notAnItem = new Set(['registry.json', 'schema.json'])
  const isItem = (file: string) => !file.includes('/') && !notAnItem.has(file)
  items = served().filter(isItem).map(read)
  pinnedItems = served()
    .filter((file) => file.startsWith(`${pinned}/`) && !notAnItem.has(file.slice(pinned.length + 1)))
    .map(read)
})

/** Line endings are not content. A checkout on Windows can hand back CRLF for
 * a file the generator wrote with LF, and comparing those byte for byte fails
 * on one operating system and passes on the other - which says nothing about
 * whether the registry is current. */
const sameText = (text: string) => text.replace(/\r\n/g, '\n')

describe('what is deployed', () => {
  it('is what the generator produces now', () => {
    // The registry is served from `docs/public`, which the docs workflow
    // publishes as-is: it never runs this generator. So a theme edited without
    // rebuilding the registry would ship a stale theme to every consumer,
    // while every other check passed.
    const current = new Map(served().map((file) => [file, readFileSync(resolve(registryDir, file), 'utf8')]))

    expect([...current.keys()].sort(), 'the registry gained or lost an item').toEqual(
      [...committed.keys()].sort(),
    )
    for (const [file, content] of current) {
      expect(sameText(committed.get(file) ?? ''), `\`${file}\` is stale; run \`pnpm build\``).toBe(
        sameText(content),
      )
    }
  })
})

describe('the catalogue', () => {
  it('lists every item that is served', () => {
    expect(catalogue.items.map((item) => item.name).sort()).toEqual(items.map((item) => item.name).sort())
  })

  it('points at the site that serves it', () => {
    expect(catalogue.homepage).toBe('https://lacodda.github.io/dowel')
  })
})

describe('every item', () => {
  it('has the two fields the schema requires', () => {
    for (const item of items) {
      expect(item.name, 'an item has no name').toBeTruthy()
      expect(item.type, `\`${item.name}\` has no type`).toMatch(/^registry:/)
    }
  })

  it('says what it is, for the CLI to print', () => {
    for (const item of items) {
      expect(item.title, `\`${item.name}\` has no title`).toBeTruthy()
      expect(item.description, `\`${item.name}\` has no description`).toBeTruthy()
    }
  })

  it('writes only inside the consumer project', () => {
    // Two safe forms. `~/` is the project root, for files that have no
    // conventional home - the theme, the accents. `@ui/` and its siblings are
    // shadcn's aliases, resolved from the consumer's own `components.json`,
    // which is where a component belongs: whatever directory that project
    // already keeps its components in.
    const safe = /^(~|@components|@ui|@lib|@hooks)\//
    for (const item of items) {
      for (const file of item.files ?? []) {
        expect(file.target, `\`${item.name}\` has a file with no target`).toBeDefined()
        expect(safe.test(file.target!), `\`${item.name}\` writes to \`${file.target}\``).toBe(true)
        expect(file.target, `\`${item.name}\` climbs out of the project`).not.toContain('..')
      }
    }
  })

  it('names a sibling by its full URL, never by a bare name', () => {
    // A bare name means *shadcn's* component: the CLI resolves plain names
    // against shadcn/ui. Declaring `input` installed a stranger's Input beside
    // ours, and the textarea could not find the `fieldClasses` it imports.
    for (const item of items) {
      for (const dependency of item.registryDependencies ?? []) {
        expect(
          dependency.startsWith('https://lacodda.github.io/dowel/r/'),
          `\`${item.name}\` depends on \`${dependency}\` - a bare name resolves to shadcn's registry`,
        ).toBe(true)
      }
    }
  })

  it('names only siblings that exist', () => {
    // A dependency on a component that is not in the registry is an install
    // that fails halfway, leaving the consumer with part of what they asked
    // for.
    const names = new Set(items.map((item) => item.name))
    for (const item of items) {
      for (const dependency of item.registryDependencies ?? []) {
        const name = dependency.split('/').pop()!.replace(/\.json$/, '')
        expect(names, `\`${item.name}\` depends on \`${name}\`, which is not in the registry`).toContain(name)
      }
    }
  })
})

describe('every component is four files', () => {
  // A component here is the component, a test, a page on the stand and the
  // demo island that page renders. Miss one and it half-exists: untested, or
  // undocumented, or documented by a screenshot that will drift. This is the
  // rule `pnpm new-component` exists to keep, and rules like that decay.
  const components = readdirSync(resolve(root, 'registry/ui'))
    .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
    .map((file) => file.replace(/\.tsx$/, ''))

  it('has at least one', () => {
    expect(components.length).toBeGreaterThan(0)
  })

  it.each(components)('%s has a test', (name) => {
    expect(existsSync(resolve(root, `registry/ui/${name}.test.tsx`))).toBe(true)
  })

  it.each(components)('%s has a page on the stand', (name) => {
    expect(existsSync(resolve(root, `docs/src/content/docs/components/${name}.mdx`))).toBe(true)
  })

  it.each(components)('%s has frontmatter a build can parse', (name) => {
    // A colon in a description is a key separator to YAML, and the page fails
    // to build - after the tests have all passed, because nothing here reads
    // the frontmatter.
    const page = readFileSync(resolve(root, `docs/src/content/docs/components/${name}.mdx`), 'utf8')
    const frontmatter = page.match(/^---\n([\s\S]*?)\n---/)
    expect(frontmatter, `\`${name}\` has no frontmatter`).not.toBeNull()

    for (const line of frontmatter![1]!.split('\n')) {
      const value = line.slice(line.indexOf(':') + 1).trim()
      const quoted = /^['"].*['"]$/.test(value)
      expect(
        quoted || !value.includes(': '),
        `\`${name}\`: \`${line}\` needs quoting - YAML reads the second colon as a key`,
      ).toBe(true)
    }
  })

  it.each(components)('%s points at the live stand', (name) => {
    // The page explains; the stand shows. A page with no way through to the
    // live component is a page describing something the reader cannot see.
    const page = readFileSync(resolve(root, `docs/src/content/docs/components/${name}.mdx`), 'utf8')
    expect(page, `\`${name}\` does not link to the stand`).toContain(`<Stand component="${name}"`)
  })

  it.each(components)('%s has a section on the stand', (name) => {
    // The link goes to an anchor, and an anchor that does not exist is a link
    // to the top of the page pretending to be a link to the component.
    const app = readFileSync(resolve(root, 'stand/src/App.tsx'), 'utf8')
    expect(app, `the stand has no \`${name}\` section`).toContain(`id: '${name}'`)
  })

  it.each(components)('%s links back from the stand to its page', (name) => {
    // Both directions, or the pair only works from one side: someone looking
    // at a component on the stand should be one click from why it is that way.
    const app = readFileSync(resolve(root, 'stand/src/App.tsx'), 'utf8')
    expect(app, `the stand does not link \`${name}\` to its documentation`).toContain(
      `docs: '/dowel/components/${name}/'`,
    )
  })

  it.each(components)('%s is in the registry', (name) => {
    expect(items.map((item) => item.name)).toContain(name)
  })
})

describe('the presets', () => {
  const presets = () => items.filter((item) => item.type === 'registry:style' && item.name !== 'theme')

  it('there are some', () => {
    // Guards every check below: `filter` over nothing passes each of them
    // while proving nothing at all.
    expect(presets().length).toBeGreaterThan(0)
  })

  it('carries no file of its own', () => {
    // A preset is a starting point, not a bundle to stay subscribed to. It
    // resolves into the same per-component installs the reader could have
    // typed, and nothing of the preset survives in the consumer's project - so
    // removing a component afterwards is an ordinary edit, with no set to
    // disagree with.
    for (const preset of presets()) {
      expect(preset.files ?? [], `\`${preset.name}\` ships a file of its own`).toEqual([])
    }
  })

  it('starts from nothing, like the theme', () => {
    // Without `extends: none` a set of dowel components drags shadcn's stock
    // palette in underneath - the palette the theme exists to drop.
    for (const preset of presets()) {
      expect(preset.extends, `\`${preset.name}\` inherits shadcn's defaults`).toBe('none')
    }
  })

  it('names only components, and at least two of them', () => {
    // One component is not a set; it is a component with a second name, and a
    // reader who installs it gets less than the singular command would give.
    const componentNames = new Set(items.filter((item) => item.type === 'registry:ui').map((item) => item.name))
    for (const preset of presets()) {
      const named = (preset.registryDependencies ?? []).map((url) => url.split('/').pop()!.replace(/\.json$/, ''))
      expect(named.length, `\`${preset.name}\` is not a set`).toBeGreaterThan(1)
      for (const name of named) {
        expect(componentNames, `\`${preset.name}\` names \`${name}\`, which is not a component`).toContain(name)
      }
    }
  })

  it('lists what a component of it pulls in, rather than leaving it implied', () => {
    // The CLI resolves siblings recursively either way, so this is about the
    // set being *read*: `shadcn list` prints these names, and a set whose
    // printed contents differ from what lands on disk has to be traced through
    // three files to understand.
    const byName = new Map(items.map((item) => [item.name, item]))
    for (const preset of presets()) {
      const named = new Set(
        (preset.registryDependencies ?? []).map((url) => url.split('/').pop()!.replace(/\.json$/, '')),
      )
      for (const name of named) {
        for (const sibling of byName.get(name)?.registryDependencies ?? []) {
          const siblingName = sibling.split('/').pop()!.replace(/\.json$/, '')
          expect(named, `\`${preset.name}\` installs \`${siblingName}\` via \`${name}\` without listing it`).toContain(
            siblingName,
          )
        }
      }
    }
  })
})

describe('the pinned snapshot', () => {
  /* A registry is not a package: nothing in a consumer's lockfile records
   * which version of a component was copied in, so "install what I installed"
   * has no answer unless a version of the registry stays put. `/r/` is always
   * the newest thing built; `/r/v0.12/` never changes again. */

  it('serves every item the unpinned registry serves', () => {
    expect(pinnedItems.map((item) => item.name).sort()).toEqual(items.map((item) => item.name).sort())
  })

  it('ships the same files, byte for byte', () => {
    // The snapshot is the same build, addressed differently - not a second
    // rendering of the components that could drift from the first.
    const byName = new Map(items.map((item) => [item.name, item]))
    for (const item of pinnedItems) {
      expect(item.files ?? [], `\`${item.name}\` differs between the snapshot and the live registry`).toEqual(
        byName.get(item.name)?.files ?? [],
      )
    }
  })

  it('points inside itself, never back at the moving registry', () => {
    // This is the whole reason the snapshot exists. A pinned Textarea whose
    // sibling URL is unpinned installs today's Input beside a year-old
    // Textarea - the one arrangement the snapshot was supposed to rule out.
    for (const item of pinnedItems) {
      for (const dependency of item.registryDependencies ?? []) {
        expect(
          dependency.startsWith(`https://lacodda.github.io/dowel/r/${pinned}/`),
          `pinned \`${item.name}\` depends on \`${dependency}\`, which moves`,
        ).toBe(true)
      }
    }
  })

  it('is named for the version being released', () => {
    // The snapshot is written once per minor, at release. A directory named
    // for a version other than this one means the release was cut without
    // rebuilding, and the version it claims to pin was never in it.
    expect(existsSync(resolve(registryDir, pinned))).toBe(true)
  })
})

describe('the theme item', () => {
  const theme = () => items.find((item) => item.name === 'theme')!

  it('starts from nothing rather than from shadcn defaults', () => {
    // dowel is not shadcn/ui with different colours: it drops the stock
    // palette on purpose, and inheriting the defaults would put back exactly
    // what the theme removes.
    expect(theme().extends).toBe('none')
  })

  it('ships the stylesheet whole', () => {
    // Not as `cssVars`. The theme is `color-mix()` over a product's accent,
    // relative colour, a Tailwind `@theme` block and two media queries;
    // decomposed into flat key-value pairs it would stop being the file that
    // was tested.
    const source = readFileSync(resolve(root, 'packages/dowel/src/theme.css'), 'utf8')
    const shipped = theme().files?.[0]?.content
    expect(shipped, 'the theme item carries no file').toBeDefined()
    expect(shipped).toBe(source)
  })

  it('tells the reader what to do with it', () => {
    expect(theme().docs).toContain('--accent-base')
  })
})

describe('the accents', () => {
  it('has one per product of the line', () => {
    const shipped = new Set(items.filter((item) => item.name.startsWith('accent-')).map((item) => item.name))
    for (const { name } of lineProducts) {
      expect(shipped, `\`${name}\` has no accent item`).toContain(`accent-${name}`)
    }
    expect(shipped.size).toBe(lineProducts.length)
  })

  it('carries the colour the registry states', () => {
    for (const { name, accent } of lineProducts) {
      const item = items.find((entry) => entry.name === `accent-${name}`)!
      expect(item.files?.[0]?.content, `\`${name}\` does not set its own colour`).toContain(
        `--accent-base: ${accent};`,
      )
    }
  })

  it('sets the accent and nothing else', () => {
    // The theme derives the rest. An accent file that also stated
    // `--on-accent` would be a product overriding the one thing this system
    // exists to work out.
    for (const { name } of lineProducts) {
      const item = items.find((entry) => entry.name === `accent-${name}`)!
      const declarations = [...(item.files?.[0]?.content ?? '').matchAll(/^\s*(--[\w-]+)\s*:/gm)].map((m) => m[1])
      expect(declarations, `\`${name}\` declares more than its colour`).toEqual(['--accent-base'])
    }
  })
})

describe('the two sites point at each other', () => {
  it('the documentation offers the stand on every page', () => {
    // In the sidebar rather than in prose: a link that has to be remembered
    // per page is a link that will be missing from most of them.
    const config = readFileSync(resolve(root, 'docs/astro.config.mjs'), 'utf8')
    expect(config, 'no link to the stand in the site navigation').toContain("link: '/stand/'")
  })

  it('the stand offers the documentation', () => {
    const app = readFileSync(resolve(root, 'stand/src/App.tsx'), 'utf8')
    expect(app, 'the stand has no way back to the documentation').toContain('documentation')
  })

  it('the readme names both', () => {
    const readme = readFileSync(resolve(root, 'README.md'), 'utf8')
    expect(readme, 'the readme does not link the documentation').toContain(
      'https://lacodda.github.io/dowel/)',
    )
    expect(readme, 'the readme does not link the stand').toContain(
      'https://lacodda.github.io/dowel/stand/',
    )
  })
})
