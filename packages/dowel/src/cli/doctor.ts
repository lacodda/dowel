import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/*
 * Is this project's dowel installation coherent?
 *
 * `check` reads a project's code and finds what is written wrong. `doctor`
 * reads a project's *setup* and finds what is wired wrong - which is a
 * different and quieter class of problem, because a mis-wired installation
 * usually still compiles. The theme not imported, an accent set twice, a
 * component copied in a year ago against a version of the package that no
 * longer exists: none of these fail a build, they just make a screen wrong in
 * a way nobody can attribute.
 *
 * Everything here reads the filesystem and the catalogue that ships inside the
 * package. Nothing reaches the network - a health check that needs the site to
 * be up is a health check that stops working exactly when a consumer is most
 * likely to be running it, and it would also make the result depend on what
 * has been published since, rather than on this project.
 */

/** How serious a finding is.
 *
 * `problem` is something that is wrong now; `note` is something worth knowing
 * that may be deliberate. The split matters because the exit code follows it -
 * a tool that fails a build over a preference gets removed from the build. */
export type Severity = 'problem' | 'note'

export interface Diagnosis {
  readonly severity: Severity
  /** What was checked, as a short label the reader can scan a column of. */
  readonly check: string
  /** What was found. */
  readonly message: string
  /** What to do about it, when there is a single obvious thing. */
  readonly fix?: string
}

/** The bits of a registry catalogue this reads. Deliberately a narrow shape:
 * the catalogue is a published contract with a schema of its own, and copying
 * that schema in here as types would be a second place for it to drift. */
export interface Catalogue {
  readonly items: readonly {
    readonly name: string
    readonly type: string
    readonly dependencies?: readonly string[]
    readonly files?: readonly { readonly path: string; readonly target?: string }[]
  }[]
}

/** What the project looks like from the outside. Passed in rather than read
 * here, so the checks below are pure and can be tested without a directory
 * tree on disk for every case. */
export interface ProjectFacts {
  /** Absolute path to the project root, for messages. */
  readonly root: string
  /** The project's `package.json`, if it has one. */
  readonly manifest?: {
    readonly dependencies?: Record<string, string>
    readonly devDependencies?: Record<string, string>
  }
  /** The version of `dowel-ui` actually installed, from its own manifest in
   * `node_modules` - which is the only honest answer. A range in the project
   * manifest says what was asked for, not what resolved. */
  readonly installedVersion?: string
  /** Every stylesheet in the project, by path, with its text. */
  readonly stylesheets: readonly { readonly path: string; readonly source: string }[]
  /** The project's `components.json`, if shadcn has been configured. */
  readonly componentsConfig?: {
    readonly aliases?: Record<string, string>
    readonly tailwind?: { readonly css?: string }
  }
  /** The catalogue shipped by the installed package, if it is there. */
  readonly catalogue?: Catalogue
  /** Files that look like copied registry components, by the registry path
   * they correspond to. */
  readonly installedComponents: readonly { readonly name: string; readonly source: string }[]
}

/** Every accent file the line publishes is named for its product; a project
 * importing two has two accents, and the later import wins silently. */
const ACCENT_IMPORT = /@import\s+['"](?:dowel-ui\/accents\/([a-z-]+)\.css|[^'"]*accents\/([a-z-]+)\.css)['"]/g

/** The theme, however it is reached: from the package, or copied in by the
 * registry and imported from wherever the project put it. */
const THEME_IMPORT = /@import\s+['"](?:dowel-ui\/theme\.css|[^'"]*dowel\/theme\.css)['"]/

/** The one declaration a product outside the line makes for itself. */
const ACCENT_BASE = /--accent-base\s*:/

/** Which version of the package a copied component was built against, from the
 * dependency the registry records: `dowel-ui@^0.13.0`. */
function requiredVersion(dependencies: readonly string[] | undefined): string | undefined {
  const entry = dependencies?.find((name) => name.startsWith('dowel-ui@'))
  return entry?.slice('dowel-ui@'.length)
}

/** The major and minor of a version, as numbers. Returns undefined for
 * anything that is not a plain semver - a git URL, a workspace protocol - so
 * a caller can decline to reason about it rather than guess. */
function parseVersion(version: string): { major: number; minor: number } | undefined {
  const match = /^\D*(\d+)\.(\d+)\./.exec(version)
  if (!match) return undefined
  return { major: Number(match[1]), minor: Number(match[2]) }
}

/**
 * Examine a project and say what is wrong with its installation.
 *
 * The order is the order a reader can act in: whether the package is there at
 * all, then whether the theme is reaching the screen, then the accent, then
 * what has been copied in and whether it still matches.
 */
export function diagnose(facts: ProjectFacts): Diagnosis[] {
  const found: Diagnosis[] = []
  const declared =
    facts.manifest?.dependencies?.['dowel-ui'] ?? facts.manifest?.devDependencies?.['dowel-ui']

  /* The package itself. A project can use the registry without it - the
   * components import `cn` from it, so in practice it cannot, but the check
   * says so rather than assuming. */
  if (!declared && !facts.installedVersion) {
    found.push({
      severity: 'problem',
      check: 'package',
      message: 'dowel-ui is not a dependency of this project.',
      fix: 'pnpm add dowel-ui',
    })
  } else if (declared && !facts.installedVersion) {
    found.push({
      severity: 'problem',
      check: 'package',
      message: `dowel-ui is declared as ${declared} but is not installed.`,
      fix: 'Install dependencies.',
    })
  }

  /* The theme. Without it every token is undefined, which in CSS is not an
   * error - the property is simply dropped, and the screen renders in the
   * browser's defaults with the layout intact. That is the single most
   * confusing state this system has, and it looks like "the components are
   * broken". */
  const themeImports = facts.stylesheets.filter((sheet) => THEME_IMPORT.test(sheet.source))
  if (themeImports.length === 0) {
    found.push({
      severity: 'problem',
      check: 'theme',
      message: 'No stylesheet imports the dowel theme, so every token is undefined.',
      fix: "Add `@import 'dowel-ui/theme.css';` after `@import 'tailwindcss';`.",
    })
  } else if (themeImports.length > 1) {
    found.push({
      severity: 'note',
      check: 'theme',
      message: `The theme is imported in ${themeImports.length} stylesheets: ${themeImports
        .map((sheet) => sheet.path)
        .join(', ')}.`,
      fix: 'Import it once, in the entry stylesheet.',
    })
  }

  /* The accent. A product of the line imports its file; anything else sets the
   * one declaration. Neither is a hard error - the theme has a default - but a
   * product with no accent is a product wearing dowel's own amber, which is
   * almost never what was intended. */
  const accents = new Set<string>()
  for (const sheet of facts.stylesheets) {
    for (const match of sheet.source.matchAll(ACCENT_IMPORT)) {
      accents.add(match[1] ?? match[2] ?? '')
    }
  }
  const setsAccentBase = facts.stylesheets.some((sheet) => ACCENT_BASE.test(sheet.source))

  if (accents.size === 0 && !setsAccentBase) {
    found.push({
      severity: 'note',
      check: 'accent',
      message: 'No accent is set, so the theme uses its own.',
      fix: "Import your product's accent, or set `--accent-base` to your colour.",
    })
  } else if (accents.size > 1) {
    found.push({
      severity: 'problem',
      check: 'accent',
      message: `Two accents are imported (${[...accents].sort().join(', ')}); whichever is imported last wins.`,
      fix: 'Import one.',
    })
  } else if (accents.size === 1 && setsAccentBase) {
    found.push({
      severity: 'note',
      check: 'accent',
      message: `An accent file is imported (${[...accents][0]}) and \`--accent-base\` is also set by hand; one of them is dead.`,
    })
  }

  /* shadcn's own configuration. Without it `shadcn add` has nowhere to put a
   * file, and the failure it produces talks about aliases rather than about
   * this. */
  if (!facts.componentsConfig) {
    found.push({
      severity: 'note',
      check: 'components.json',
      message: 'No components.json, so `shadcn add` cannot resolve where to write a component.',
      fix: 'npx shadcn@latest init',
    })
  } else if (!facts.componentsConfig.aliases?.ui) {
    found.push({
      severity: 'problem',
      check: 'components.json',
      message: 'components.json has no `ui` alias; every dowel component targets it.',
      fix: 'Add an `aliases.ui` entry pointing at your components directory.',
    })
  }

  /* What has been copied in, against what the catalogue says it needs. A
   * component copied at 0.9 and left alone imports `cn` from a package that
   * has moved four minors since; usually fine, occasionally not, and always
   * worth knowing before debugging something else. */
  const installed = parseVersion(facts.installedVersion ?? '')
  if (facts.catalogue && installed) {
    const behind: string[] = []
    for (const component of facts.installedComponents) {
      const item = facts.catalogue.items.find((candidate) => candidate.name === component.name)
      const required = requiredVersion(item?.dependencies)
      const wanted = required ? parseVersion(required) : undefined
      if (!wanted) continue
      if (wanted.major > installed.major || (wanted.major === installed.major && wanted.minor > installed.minor)) {
        behind.push(`${component.name} (needs dowel-ui ${required})`)
      }
    }
    if (behind.length > 0) {
      found.push({
        severity: 'problem',
        check: 'components',
        message: `Components copied in expect a newer package than is installed: ${behind.join(', ')}.`,
        fix: 'Update dowel-ui.',
      })
    }
  }

  if (facts.catalogue && facts.installedComponents.length === 0) {
    found.push({
      severity: 'note',
      check: 'components',
      message: 'No dowel components found in this project.',
      fix: 'npx shadcn@latest add https://lacodda.github.io/dowel/r/app.json',
    })
  }

  return found
}

/** Read the catalogue out of the installed package.
 *
 * This is what makes the tools work offline: the registry a consumer needs to
 * reason about is the one they installed from, and it travelled with the
 * package. Returns undefined rather than throwing - a missing catalogue is one
 * of the things being diagnosed. */
export function readCatalogue(root: string): Catalogue | undefined {
  const path = resolve(root, 'node_modules/dowel-ui/dist/registry.json')
  if (!existsSync(path)) return undefined
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Catalogue
  } catch {
    return undefined
  }
}
