import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

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

    expect(readFileSync(resolve(dist, 'theme.css'), 'utf8'), 'the built theme is not the source theme').toBe(
      read('packages/dowel/src/theme.css'),
    )

    const shipped = readFileSync(resolve(dist, 'tokens.json'), 'utf8')
    execFileSync('node', ['tools/build-tokens-json.mjs'], { cwd: root })
    expect(readFileSync(resolve(dist, 'tokens.json'), 'utf8'), 'the built tokens are stale').toBe(shipped)
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
})
