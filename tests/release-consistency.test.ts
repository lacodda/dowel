import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  lineProducts,
  elevationTokens,
  layerTokens,
  motionTokens,
  radiusTokens,
  typeTokens,
} from '../packages/dowel/src/index'

/*
 * The storefront gate.
 *
 * dowel is described in several places at once - the package manifest, the
 * README that npm shows, the docs site, the registry - and a release is only
 * coherent if they agree. Checking that by eye at tag time is exactly the
 * ritual that gets skipped when a release is in a hurry, so it runs as an
 * ordinary test instead.
 */

const root = resolve(import.meta.dirname, '..')
const read = (path: string) => readFileSync(resolve(root, path), 'utf8')
const json = (path: string) => JSON.parse(read(path))

const pkg = json('packages/dowel/package.json')
const rootReadme = read('README.md')

describe('one description', () => {
  it('is the same in the package and on the docs site', () => {
    const config = read('docs/astro.config.mjs')
    expect(config).toContain(pkg.description)
  })

  it('is the same in the package and in the README', () => {
    // The README leads with it, so the npm page and the repository open with
    // the same sentence.
    expect(rootReadme).toContain(pkg.description)
  })
})

describe('one README', () => {
  it('has no second copy committed in the package', () => {
    // `prepack` copies the root README in at publish time, so a copy in the
    // working tree is expected right after a publish and means nothing. What
    // must never exist is a *tracked* one: that is the copy that goes stale
    // while the root file moves on.
    const tracked = execFileSync('git', ['ls-files', 'packages/*/README.md'], {
      cwd: root,
      encoding: 'utf8',
    }).trim()
    expect(tracked, 'a README is committed inside a package; there is one README, at the root').toBe('')
  })

  it('links absolutely, because npm renders it off-site', () => {
    // A relative link works in the repository and 404s on npm.
    const links = [...rootReadme.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]!)
    for (const link of links) {
      const isAbsolute = /^(https?:|#)/.test(link)
      expect(isAbsolute, `\`${link}\` is relative; npm renders the README off-site`).toBe(true)
    }
  })
})

describe('version', () => {
  it('is not the scaffold placeholder', () => {
    expect(pkg.version).not.toBe('0.0.0')
  })

  it('is a plain semantic version', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/)
  })
})

describe('what the package ships', () => {
  it('exports the theme at the path the docs tell people to import', () => {
    expect(pkg.exports['./theme.css']).toBeDefined()
    expect(read('docs/src/content/docs/reference/tokens.mdx')).toContain("import 'dowel-ui/theme.css'")
  })

  it('ships the files those exports point at', () => {
    // `files` decides what npm actually uploads: an export that points outside
    // it resolves to nothing once installed.
    const shipped: string[] = pkg.files
    const targets = Object.values(pkg.exports as Record<string, unknown>).flatMap((entry) =>
      typeof entry === 'string' ? [entry] : Object.values(entry as Record<string, string>),
    )
    for (const target of targets) {
      const top = target.replace(/^\.\//, '').split('/')[0]!
      expect(shipped, `\`${target}\` is exported but \`${top}\` is not in \`files\``).toContain(top)
    }
  })

  it('ships an entry point Node can actually import', () => {
    // Node, in its own process, on purpose. Importing from inside vitest
    // proves nothing: Vite resolves the specifier, and an extensionless
    // relative import - which typechecks under `moduleResolution: bundler`
    // and which `tsc` emits unchanged - works there and fails in the one
    // place it matters, someone else's `import`. v0.3.0 shipped exactly that.
    const entry = resolve(root, 'packages/dowel/dist/index.js')
    if (!existsSync(entry)) return

    const probe = [
      `const m = await import(${JSON.stringify(pathToFileURL(entry).href)});`,
      'if (!m.lineProducts?.length) throw new Error("lineProducts is empty");',
      'if (typeof m.useTheme !== "function") throw new Error("useTheme is missing");',
      'if (typeof m.token !== "function") throw new Error("token is missing");',
    ].join('\n')

    expect(() => execFileSync('node', ['--input-type=module', '-e', probe], { stdio: 'pipe' })).not.toThrow()
  })

  it('ships no test code', () => {
    // `tsc` compiles whatever it is not told to exclude, and a new test file
    // in an extension the exclude list missed lands in `dist` and then on npm.
    const dist = resolve(root, 'packages/dowel/dist')
    if (!existsSync(dist)) return

    const stray = readdirSync(dist).filter((file) => /\.test\./.test(file))
    expect(stray, 'test files are being built into the package').toEqual([])
  })

  it('ships an accent for every product of the line', () => {
    // A product in the registry with no accent file is a product whose
    // documented one-line import does not resolve.
    const dir = resolve(root, 'packages/dowel/dist/accents')
    if (!existsSync(dir)) return

    const shipped = new Set(readdirSync(dir))
    for (const { name } of lineProducts) {
      expect(shipped, `\`${name}\` has no accent file`).toContain(`${name}.css`)
    }
  })

  it('ships the catalogue, at the version the package is', () => {
    // Not to install from - `shadcn add` wants a URL. It answers "what is in
    // this registry" for a reader that has the package and not the network: a
    // namespace in `components.json`, a script checking whether a component
    // exists, an agent handed the dependency instead of the docs site.
    //
    // A stale copy would be worse than none: it would name components the
    // installed version does not have. So it is compared against the registry
    // this build produced, not merely required to exist.
    const shipped = resolve(root, 'packages/dowel/dist/registry.json')
    if (!existsSync(shipped)) return

    const text = (value: string) => value.replace(/\r\n/g, '\n')
    expect(
      text(readFileSync(shipped, 'utf8')),
      'the catalogue in the package is not the one being served',
    ).toBe(text(read('docs/public/r/registry.json')))
  })

  it('ships a theme and a token file that agree with the source', () => {
    // `dist` is what npm uploads, and it is built rather than committed - so
    // it can be older than the theme it was generated from. A release that
    // shipped last week's tokens would look right in every other check.
    const dist = resolve(root, 'packages/dowel/dist')
    if (!existsSync(dist)) {
      // Nothing built yet: `pnpm build` runs before publishing, and the tests
      // that follow the build are where this bites.
      return
    }

    // Line endings are not content: a Windows checkout can hand back CRLF for
    // a file written with LF, and a byte comparison then fails on one
    // operating system while passing on the other.
    const text = (value: string) => value.replace(/\r\n/g, '\n')

    expect(
      text(readFileSync(resolve(dist, 'theme.css'), 'utf8')),
      'the built theme is not the source theme',
    ).toBe(text(read('packages/dowel/src/theme.css')))

    const shipped = readFileSync(resolve(dist, 'tokens.json'), 'utf8')
    execFileSync('node', ['tools/build-tokens-json.mjs'], { cwd: root })
    expect(text(readFileSync(resolve(dist, 'tokens.json'), 'utf8')), 'the built tokens are stale').toBe(
      text(shipped),
    )
  })
})

describe('the docs do not claim an old version', () => {
  it('states the current one where it states one at all', () => {
    /* The site's front page carried "v0.4.0" through eight releases, naming
     * one primitive when there were twenty-six. Nobody reads their own front
     * page, and no check looked at it: the release ritual verifies the
     * manifests, the registry and the CHANGELOG, none of which is prose.
     *
     * So any page that names a `vX.Y.Z` at all has to name this one. A page
     * that mentions no version is fine - the rule is against a *stale* claim,
     * not a missing one.
     *
     * The README joined this list after the same thing happened to it: while
     * the gate watched two pages under `docs/`, the README's own status line
     * sat at v0.11.1 for four releases, still saying the first product of the
     * line was the only one on the system. A gate that names its files by
     * hand only ever covers the files someone remembered - which is why the
     * one place a reader is most likely to look was the one place unwatched. */
    const pages = [
      'README.md',
      'docs/src/content/docs/index.mdx',
      'docs/src/content/docs/getting-started.md',
    ]
    for (const path of pages) {
      const versions = [...read(path).matchAll(/\bv(\d+\.\d+\.\d+)\b/g)].map((m) => m[1]!)
      for (const version of versions) {
        expect(version, `\`${path}\` still claims v${version}; the package is ${pkg.version}`).toBe(
          pkg.version,
        )
      }
    }
  })

  it('is not typed by hand on the stand', () => {
    /* The stand shows the version it was built from, which makes it one more
     * place a stale number can sit - and the failure above is exactly what
     * happens when a version is written down twice.
     *
     * So it is not written down: Vite substitutes `__DOWEL_VERSION__` out of
     * the package manifest at build time. This checks the wiring rather than
     * the number, because the number is not there to check - a refactor that
     * replaced it with a literal would pass every other test in this file
     * while reintroducing the drift they exist to prevent. */
    const app = read('stand/src/App.tsx')
    expect(app, 'the stand should show the injected version').toContain('__DOWEL_VERSION__')

    const literal = new RegExp(`v${pkg.version.replace(/\./g, '\\.')}`)
    expect(
      literal.test(app),
      'the stand hardcodes the version; it should render `__DOWEL_VERSION__` instead',
    ).toBe(false)

    // And the substitution has to be configured, or the identifier is simply
    // undefined at runtime - which is how it first failed under the test
    // runner, where no Vite build had defined it.
    expect(read('stand/vite.config.ts')).toContain('__DOWEL_VERSION__')
    expect(read('vitest.config.ts')).toContain('__DOWEL_VERSION__')
  })
})

describe('the docs do not miscount the primitives', () => {
  it('states the number there are, wherever it states one', () => {
    /* Second verse of the stale-version defect, and it slipped past that gate
     * because a count is not a `vX.Y.Z`. The README, the site's front page and
     * the vocabulary page all say how many primitives there are, and all three
     * still said twenty-six when there were thirty.
     *
     * Only a number written as a word is checked, and only next to the word
     * it counts. "twenty-six hits" on the anti-patterns page is a fact about a
     * lint run on kilna, not a count of components, and must not be dragged
     * along by this. */
    const WORDS: Record<number, string> = {
      20: 'twenty', 21: 'twenty-one', 22: 'twenty-two', 23: 'twenty-three',
      24: 'twenty-four', 25: 'twenty-five', 26: 'twenty-six', 27: 'twenty-seven',
      28: 'twenty-eight', 29: 'twenty-nine', 30: 'thirty', 31: 'thirty-one',
      32: 'thirty-two', 33: 'thirty-three', 34: 'thirty-four', 35: 'thirty-five',
      36: 'thirty-six', 37: 'thirty-seven', 38: 'thirty-eight', 39: 'thirty-nine',
      40: 'forty',
    }

    const count = readdirSync(resolve(root, 'registry/ui')).filter(
      (file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'),
    ).length

    const expectedWord = WORDS[count]
    expect(expectedWord, `no word for ${count} primitives - extend the table`).toBeDefined()

    /* A number-word immediately before "components", "primitives", or "of
     * them" is a count of these. Anything else is somebody counting something
     * else. */
    const pattern = /\b([a-z]+(?:-[a-z]+)?)\s+(?:components|primitives|of them)\b/gi

    const pages = [
      'README.md',
      'docs/src/content/docs/index.mdx',
      'docs/src/content/docs/concepts/vocabulary.mdx',
    ]
    const known = new Set(Object.values(WORDS))

    for (const path of pages) {
      for (const match of read(path).matchAll(pattern)) {
        const word = match[1]!.toLowerCase()
        if (!known.has(word)) continue
        expect(
          word,
          `\`${path}\` says "${match[0]}" and there are ${count}`,
        ).toBe(expectedWord)
      }
    }
  })
})

describe('the docs show what the theme has', () => {
  it('documents every colour token the theme declares', () => {
    const theme = read('packages/dowel/src/theme.css')
    const page = read('docs/src/content/docs/reference/tokens.mdx')

    // Names mapped into Tailwind are the colour vocabulary; each one should be
    // findable on the token page.
    const mapped = [...theme.matchAll(/--color-([\w-]+): var\(--[\w-]+\);/g)].map((m) => m[1]!)
    for (const name of mapped) {
      expect(page, `\`${name}\` is in the theme but not on the token page`).toContain(`'${name}'`)
    }
  })

  it('documents every scale step the theme declares', () => {
    // A step added to the theme and not to the page is a value nobody knows
    // exists, which is the same as not having it.
    const page = read('docs/src/content/docs/reference/scales.mdx')
    const steps = [
      ...radiusTokens.filter((name) => name !== 'radius-inner'),
      ...typeTokens.filter((name) => !name.startsWith('font-sans') && !name.startsWith('font-mono')),
      ...motionTokens,
      ...layerTokens,
      ...elevationTokens,
    ]
    for (const name of steps) {
      expect(page, `\`${name}\` is in the theme but not on the scales page`).toContain(`'${name}'`)
    }
  })
})
