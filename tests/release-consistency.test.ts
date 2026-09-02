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
