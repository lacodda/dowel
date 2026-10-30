import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { run } from './index.js'

/*
 * The commands end to end, over a real directory.
 *
 * The modules below `run` are tested on their own, and those tests are where
 * the logic lives. What only shows up here is what a person actually sees: the
 * exit code, and the sentence printed when a command has nothing to say. Both
 * of those were wrong at least once in a way no unit test could have caught,
 * because neither is a property of the scanner or the differ - they are
 * properties of the command wrapped around them.
 *
 * `run` returns its exit code instead of calling `process.exit` precisely so
 * this file can exist.
 */

let directory: string
let out: string[]

beforeEach(() => {
  directory = mkdtempSync(resolve(tmpdir(), 'dowel-cli-'))
  out = []
  vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    out.push(String(chunk))
    return true
  })
  vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
    out.push(String(chunk))
    return true
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  rmSync(directory, { recursive: true, force: true })
})

const printed = () => out.join('')

/** A file inside the temporary project. */
function file(path: string, contents: string): void {
  const full = resolve(directory, path)
  mkdirSync(resolve(full, '..'), { recursive: true })
  writeFileSync(full, contents)
}

/** A minimal installed `dowel-ui`, so the commands that read the catalogue
 * have one without the test depending on a real install. */
function installPackage(items: unknown[] = []): void {
  file('node_modules/dowel-ui/package.json', JSON.stringify({ name: 'dowel-ui', version: '0.14.0' }))
  file('node_modules/dowel-ui/dist/registry.json', JSON.stringify({ items }))
}

describe('exit codes', () => {
  it('is 0 when a project has nothing to migrate', () => {
    file('src/a.tsx', 'export const a = <div className="bg-raise" />')
    expect(run(['check', '--cwd', directory])).toBe(0)
  })

  it('is 1 when there is something to migrate', () => {
    file('src/a.tsx', 'export const a = <div className="bg-muted" />')
    expect(run(['check', '--cwd', directory])).toBe(1)
  })

  it('is 0 for a project whose only findings are names in both vocabularies', () => {
    /* The defect the first live run found, at the level a build would meet it:
     * a fully migrated project uses `--accent` everywhere, and an exit code
     * that called that a failure would make the check unusable in CI. */
    file('src/a.tsx', 'export const a = <div className="bg-accent text-accent" />')
    expect(run(['check', '--cwd', directory])).toBe(0)
    expect(printed()).toContain('both vocabularies')
  })

  it('is 2 for an unknown command', () => {
    expect(run(['bogus'])).toBe(2)
    expect(printed()).toContain('Unknown command')
  })

  it('is 2 with no command at all, and prints the usage', () => {
    expect(run([])).toBe(2)
    expect(printed()).toContain('migration tools')
  })

  it('is 0 for `help`, which was asked for', () => {
    expect(run(['help'])).toBe(0)
  })

  it('is 2 when the directory does not exist', () => {
    expect(run(['check', '--cwd', resolve(directory, 'nowhere')])).toBe(2)
  })
})

describe('diff with nothing to compare', () => {
  it('does not report agreement when no components are installed', () => {
    /* Found by running the published command against a project that had none.
     * "0 components match the registry" is true and reads as reassurance about
     * a comparison that never happened. */
    installPackage()
    expect(run(['diff', '--cwd', directory])).toBe(0)
    expect(printed()).toContain('nothing to compare')
    expect(printed()).not.toContain('match the registry')
  })

  it('still reports agreement when a component is installed and unchanged', () => {
    const source = "import { cn } from 'dowel-ui'\nexport const Button = () => null\n"
    installPackage([
      { name: 'button', type: 'registry:ui', files: [{ path: 'ui/button.tsx', content: source }] },
    ])
    file('src/ui/button.tsx', source)
    expect(run(['diff', '--cwd', directory])).toBe(0)
    expect(printed()).toContain('Unchanged')
  })

  it('shows the difference when the copy has been edited', () => {
    installPackage([
      {
        name: 'button',
        type: 'registry:ui',
        files: [{ path: 'ui/button.tsx', content: "import { cn } from 'dowel-ui'\nconst a = 1\n" }],
      },
    ])
    file('src/ui/button.tsx', "import { cn } from 'dowel-ui'\nconst a = 2\n")
    expect(run(['diff', '--cwd', directory])).toBe(0)
    expect(printed()).toContain('differs from the registry')
  })

  it('fails with 2 when asked for a component the project does not have', () => {
    installPackage([{ name: 'button', type: 'registry:ui', files: [] }])
    expect(run(['diff', 'dialog', '--cwd', directory])).toBe(2)
  })

  it('fails with 2 when the package is not installed at all', () => {
    expect(run(['diff', '--cwd', directory])).toBe(2)
    expect(printed()).toContain('No catalogue')
  })
})

describe('diff sees the whole directory of copies', () => {
  const component = "import { cn } from 'dowel-ui'\nimport { days } from './calendar-math'\nexport const Calendar = () => null\n"
  const helper = 'export function days() {\n  return 7\n}\n'

  function catalogue() {
    installPackage([
      { name: 'calendar', type: 'registry:ui', files: [{ path: 'ui/calendar.tsx', content: component }] },
      { name: 'calendar-math', type: 'registry:ui', files: [{ path: 'ui/calendar-math.tsx', content: helper }] },
    ])
  }

  it('compares a helper that imports nothing from the package', () => {
    // calendar-math is pure functions. Recognised by the package import alone,
    // it was never compared, and kilna's copy drifted with nothing saying so.
    catalogue()
    file('src/ui/calendar.tsx', component)
    file('src/ui/calendar-math.tsx', helper.replace('7', '8'))
    run(['diff', '--json', '--cwd', directory])
    const parsed = JSON.parse(printed()) as { changed: { name: string }[] }
    expect(parsed.changed.map((entry) => entry.name)).toEqual(['calendar-math'])
  })

  it('does not claim a file that only shares a name, away from the copies', () => {
    // The package import is what proves a copy; a helper borrows that proof
    // from the copies beside it, and a file with neither is the product's own.
    catalogue()
    file('src/ui/calendar.tsx', component)
    file('src/pages/calendar-math.tsx', 'export const page = 1\n')
    run(['diff', '--json', '--cwd', directory])
    expect((JSON.parse(printed()) as { changed: unknown[] }).changed).toEqual([])
  })

  it('names a file among the copies that has no twin in the registry', () => {
    catalogue()
    file('src/ui/calendar.tsx', component)
    file('src/ui/calendar-math.tsx', helper)
    file('src/ui/layer.tsx', 'export const layer = 1\n')
    expect(run(['diff', '--cwd', directory])).toBe(0)
    expect(printed()).toContain('Unchanged')
    expect(printed()).toContain('Not from the registry')
    expect(printed()).toContain('src/ui/layer.tsx')
  })

  it("leaves the product's own components and tests out of that list", () => {
    catalogue()
    file('src/ui/calendar.tsx', component)
    file('src/ui/calendar.test.tsx', 'test file\n')
    file('src/ui/AppSelect.tsx', 'export const AppSelect = 1\n')
    file('src/views/layer.tsx', 'export const layer = 1\n')
    run(['diff', '--json', '--cwd', directory])
    expect((JSON.parse(printed()) as { local: string[] }).local).toEqual([])
  })

  it('keeps the list out of an answer about one component', () => {
    catalogue()
    file('src/ui/calendar.tsx', component)
    file('src/ui/layer.tsx', 'export const layer = 1\n')
    run(['diff', 'calendar', '--cwd', directory])
    expect(printed()).not.toContain('Not from the registry')
  })
})

describe('codemod writes only when asked', () => {
  it('leaves the file alone without --write', () => {
    file('src/a.tsx', '<div className="bg-muted" />')
    expect(run(['codemod', '--cwd', directory])).toBe(0)
    expect(printed()).toContain('Nothing was written')
  })

  it('rewrites with --write, and says so', () => {
    file('src/a.tsx', '<div className="bg-muted" />')
    run(['codemod', '--write', '--cwd', directory])
    expect(printed()).toContain('Rewrote')
  })
})

describe('json output', () => {
  it('is parseable and carries the findings', () => {
    file('src/a.tsx', '<div className="bg-muted" />')
    run(['check', '--json', '--cwd', directory])
    const parsed = JSON.parse(printed()) as { findings: { kind: string }[] }
    expect(parsed.findings.map((finding) => finding.kind)).toEqual(['stock'])
  })
})

describe('snippets', () => {
  const source = "import { cn } from 'dowel-ui'\nexport const Badge = () => null\n"
  const props = {
    badge: {
      dir: 'ui',
      components: [{ name: 'Badge', props: [{ name: 'variant', type: 'outline | soft', default: "'outline'", variant: true }], inherits: [{ kind: 'react', type: 'HTMLAttributes<HTMLSpanElement>' }] }],
    },
    dialog: { dir: 'ui', components: [{ name: 'Dialog', is: { kind: 'base-ui', part: 'Dialog.Root' } }] },
  }

  function project(): void {
    installPackage([{ name: 'badge', type: 'registry:ui', files: [{ path: 'ui/badge.tsx', content: source }] }])
    file('node_modules/dowel-ui/dist/props.json', JSON.stringify(props))
    file('src/ui/badge.tsx', source)
  }

  it('says what it would write, and writes nothing without --write', () => {
    project()
    expect(run(['snippets', '--cwd', directory])).toBe(0)
    expect(printed()).toContain('dw-badge')
    expect(existsSync(resolve(directory, '.vscode/dowel.code-snippets'))).toBe(false)
  })

  it('writes snippets for the components the project has, and only those', () => {
    project()
    expect(run(['snippets', '--write', '--cwd', directory])).toBe(0)
    const written = readFileSync(resolve(directory, '.vscode/dowel.code-snippets'), 'utf8')
    // VS Code reads the file as JSON with comments; the comments are the
    // header, and what follows them is plain JSON.
    const snippets = JSON.parse(written.replace(/^\/\/.*$/gm, '')) as Record<string, { body: string[] }>
    expect(Object.keys(snippets)).toEqual(['Badge'])
    expect(snippets.Badge!.body[0]).toBe('<Badge variant="${1|outline,soft|}">')
  })

  it('fails with 2 on a package too old to carry the props', () => {
    installPackage()
    expect(run(['snippets', '--cwd', directory])).toBe(2)
    expect(printed()).toContain('0.41 or later')
  })
})

describe('snippets with nothing, and as data', () => {
  it('says there is nothing to write for when no component is copied', () => {
    installPackage()
    file('node_modules/dowel-ui/dist/props.json', '{}')
    expect(run(['snippets', '--write', '--cwd', directory])).toBe(0)
    expect(printed()).toContain('nothing to write snippets for')
    expect(existsSync(resolve(directory, '.vscode/dowel.code-snippets'))).toBe(false)
  })

  it('prints the snippets and where they would go with --json', () => {
    const source = "import { cn } from 'dowel-ui'\nexport const Badge = () => null\n"
    installPackage([{ name: 'badge', type: 'registry:ui', files: [{ path: 'ui/badge.tsx', content: source }] }])
    file('node_modules/dowel-ui/dist/props.json', JSON.stringify({ badge: { dir: 'ui', components: [{ name: 'Badge', props: [] }] } }))
    file('src/ui/badge.tsx', source)
    expect(run(['snippets', '--json', '--cwd', directory])).toBe(0)
    const parsed = JSON.parse(printed()) as { target: string; snippets: Record<string, { prefix: string }> }
    expect(parsed.target).toBe('.vscode/dowel.code-snippets')
    expect(parsed.snippets.Badge!.prefix).toBe('dw-badge')
  })
})

describe('codemod across what Base UI renamed', () => {
  const old = "import { DrawerPreview } from '@base-ui-components/react/drawer'\n<DrawerPreview.Root />\n"

  it('names the renames and counts them, without writing', () => {
    file('src/drawer.tsx', old)
    expect(run(['codemod', '--cwd', directory])).toBe(0)
    expect(printed()).toContain('src/drawer.tsx')
    expect(printed()).toContain('Base UI @base-ui-components/react -> @base-ui/react, DrawerPreview -> Drawer')
    expect(printed()).toContain('Would rewrite 3 names in 1 file.')
    expect(readFileSync(resolve(directory, 'src/drawer.tsx'), 'utf8')).toBe(old)
  })

  it('writes them with --write', () => {
    file('src/drawer.tsx', old)
    run(['codemod', '--write', '--cwd', directory])
    expect(readFileSync(resolve(directory, 'src/drawer.tsx'), 'utf8')).toBe(
      "import { Drawer } from '@base-ui/react/drawer'\n<Drawer.Root />\n",
    )
  })

  it('carries each edit, by file and line, in --json', () => {
    file('src/drawer.tsx', old)
    run(['codemod', '--json', '--cwd', directory])
    const parsed = JSON.parse(printed()) as { baseUi: { file: string; line: number; from: string }[] }
    expect(parsed.baseUi).toContainEqual({ file: 'src/drawer.tsx', line: 2, from: 'DrawerPreview', to: 'Drawer' })
  })

  it('says a project with nothing to rewrite has nothing from Base UI either', () => {
    file('src/a.tsx', "import { Drawer } from '@base-ui/react/drawer'\n")
    run(['codemod', '--cwd', directory])
    expect(printed()).toContain('nothing Base UI has renamed')
  })
})

describe('the plan codemod prints', () => {
  it('lists every rename on its line, in the order of the file, before anything is written', () => {
    file('src/a.tsx', "import { Menu } from '@base-ui-components/react/menu'\n\n<div className=\"bg-muted\" />\n")
    run(['codemod', '--cwd', directory])
    const plan = printed()
    const first = plan.indexOf('@base-ui-components/react -> @base-ui/react')
    const second = plan.indexOf('bg-muted -> bg-soft')
    expect(first).toBeGreaterThan(-1)
    expect(second).toBeGreaterThan(first)
    expect(plan).toMatch(/\s1 {2}@base-ui-components\/react -> @base-ui\/react/)
    expect(plan).toMatch(/\s3 {2}bg-muted -> bg-soft/)
  })
})
