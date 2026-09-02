import { describe, expect, it } from 'vitest'
import { diagnose, type ProjectFacts } from './doctor.js'

/*
 * Whether an installation is wired correctly.
 *
 * `diagnose` takes facts rather than a directory precisely so these can be
 * written: every case below is a project shape that has to be recognised, and
 * building each one on disk would make the suite slow enough that the awkward
 * cases would quietly not get written.
 */

/** A project with nothing wrong with it, which each test then breaks in one
 * place. Starting from a healthy project rather than an empty object is what
 * keeps a test honest: an assertion that "there is a problem" passes trivially
 * when everything is missing. */
function healthy(overrides: Partial<ProjectFacts> = {}): ProjectFacts {
  return {
    root: '/project',
    manifest: { dependencies: { 'dowel-ui': '^0.14.0' } },
    installedVersion: '0.14.0',
    stylesheets: [
      {
        path: 'src/styles.css',
        source: "@import 'tailwindcss';\n@import 'dowel-ui/theme.css';\n@import 'dowel-ui/accents/kilna.css';\n",
      },
    ],
    componentsConfig: { aliases: { ui: '@/components/ui' } },
    catalogue: {
      items: [
        { name: 'button', type: 'registry:ui', dependencies: ['dowel-ui@^0.13.0'] },
        { name: 'dialog', type: 'registry:ui', dependencies: ['dowel-ui@^0.13.0'] },
      ],
    },
    installedComponents: [{ name: 'button', source: "import { cn } from 'dowel-ui'" }],
    ...overrides,
  }
}

const checks = (facts: ProjectFacts) => diagnose(facts).map((finding) => finding.check)
const problems = (facts: ProjectFacts) =>
  diagnose(facts).filter((finding) => finding.severity === 'problem')

describe('a healthy project', () => {
  it('has nothing to report', () => {
    expect(diagnose(healthy())).toEqual([])
  })
})

describe('the package', () => {
  it('reports it missing entirely', () => {
    const facts = healthy({ manifest: {}, installedVersion: undefined })
    expect(problems(facts).map((finding) => finding.check)).toContain('package')
  })

  it('distinguishes declared-but-not-installed from absent', () => {
    const declared = diagnose(healthy({ installedVersion: undefined }))
    expect(declared[0]!.message).toContain('not installed')

    const absent = diagnose(healthy({ manifest: {}, installedVersion: undefined }))
    expect(absent[0]!.message).toContain('not a dependency')
  })

  it('accepts it as a dev dependency', () => {
    const facts = healthy({ manifest: { devDependencies: { 'dowel-ui': '^0.14.0' } } })
    expect(checks(facts)).not.toContain('package')
  })
})

describe('the theme', () => {
  it('reports a project that never imports it', () => {
    /* The quietest failure this system has: every token resolves to nothing,
     * CSS drops the property rather than erroring, and the screen renders in
     * browser defaults with the layout intact. It looks like broken
     * components. */
    const facts = healthy({ stylesheets: [{ path: 'src/styles.css', source: "@import 'tailwindcss';" }] })
    expect(problems(facts).map((finding) => finding.check)).toContain('theme')
  })

  it('accepts it imported from a copied file rather than the package', () => {
    const facts = healthy({
      stylesheets: [{ path: 'src/app.css', source: "@import './dowel/theme.css';\n--accent-base: #123456;" }],
    })
    expect(checks(facts)).not.toContain('theme')
  })

  it('notes it being imported twice, without calling it a problem', () => {
    const facts = healthy({
      stylesheets: [
        { path: 'a.css', source: "@import 'dowel-ui/theme.css';\n@import 'dowel-ui/accents/kilna.css';" },
        { path: 'b.css', source: "@import 'dowel-ui/theme.css';" },
      ],
    })
    const theme = diagnose(facts).find((finding) => finding.check === 'theme')
    expect(theme?.severity).toBe('note')
  })
})

describe('the accent', () => {
  it('notes a project that sets none', () => {
    const facts = healthy({
      stylesheets: [{ path: 'a.css', source: "@import 'dowel-ui/theme.css';" }],
    })
    const accent = diagnose(facts).find((finding) => finding.check === 'accent')
    expect(accent?.severity).toBe('note')
    expect(accent?.message).toContain('No accent')
  })

  it('reports two accent files as a problem, because one wins silently', () => {
    const facts = healthy({
      stylesheets: [
        {
          path: 'a.css',
          source: "@import 'dowel-ui/theme.css';\n@import 'dowel-ui/accents/kilna.css';\n@import 'dowel-ui/accents/lyrid.css';",
        },
      ],
    })
    const accent = problems(facts).find((finding) => finding.check === 'accent')
    expect(accent?.message).toContain('kilna')
    expect(accent?.message).toContain('lyrid')
  })

  it('notes an accent file and a hand-set value together, since one is dead', () => {
    const facts = healthy({
      stylesheets: [
        {
          path: 'a.css',
          source: "@import 'dowel-ui/theme.css';\n@import 'dowel-ui/accents/kilna.css';\n:root { --accent-base: #123456; }",
        },
      ],
    })
    const accent = diagnose(facts).find((finding) => finding.check === 'accent')
    expect(accent?.severity).toBe('note')
  })

  it('accepts a product outside the line setting the value by hand', () => {
    const facts = healthy({
      stylesheets: [
        { path: 'a.css', source: "@import 'dowel-ui/theme.css';\n:root { --accent-base: #2f7d6b; }" },
      ],
    })
    expect(checks(facts)).not.toContain('accent')
  })
})

describe('components.json', () => {
  it('notes its absence', () => {
    const facts = healthy({ componentsConfig: undefined })
    expect(checks(facts)).toContain('components.json')
  })

  it('reports a config with no ui alias, which every component targets', () => {
    const facts = healthy({ componentsConfig: { aliases: {} } })
    expect(problems(facts).map((finding) => finding.check)).toContain('components.json')
  })
})

describe('copied components against the installed package', () => {
  it('reports one that needs a newer package than is installed', () => {
    const facts = healthy({
      installedVersion: '0.12.0',
      catalogue: { items: [{ name: 'button', type: 'registry:ui', dependencies: ['dowel-ui@^0.13.0'] }] },
    })
    const found = problems(facts).find((finding) => finding.check === 'components')
    expect(found?.message).toContain('button')
  })

  it('accepts a component older than the installed package', () => {
    // The common and harmless case: copied in at 0.13, package now at 0.14.
    const facts = healthy({ installedVersion: '0.14.0' })
    expect(checks(facts)).not.toContain('components')
  })

  it('notes a project with the package but no components copied in', () => {
    const facts = healthy({ installedComponents: [] })
    const found = diagnose(facts).find((finding) => finding.check === 'components')
    expect(found?.severity).toBe('note')
  })

  it('says nothing about versions when there is no catalogue to compare with', () => {
    const facts = healthy({ catalogue: undefined })
    expect(checks(facts)).not.toContain('components')
  })
})
