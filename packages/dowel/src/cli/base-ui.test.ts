import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { baseUiChanges, rewriteBaseUi } from './base-ui.js'

/*
 * What Base UI renamed, carried across by the codemod.
 *
 * Two kinds of check. The rules are tested on code shaped the way a product
 * writes it, including the shapes that should be left alone. And the table is
 * held to Base UI's own changelog: every breaking change since 1.0 has an
 * entry, so the stack update that brings a new Base UI cannot slip a rename
 * past the codemod by not reading its release notes.
 */

const rewrite = (source: string) => rewriteBaseUi(source).source

describe('the package that moved', () => {
  it('rewrites the root and every subpath, in imports and dynamic imports', () => {
    const before = [
      "import { Menu } from '@base-ui-components/react/menu'",
      'import { mergeProps } from "@base-ui-components/react"',
      "const Dialog = await import('@base-ui-components/react/dialog')",
    ].join('\n')
    expect(rewrite(before)).toBe(
      [
        "import { Menu } from '@base-ui/react/menu'",
        'import { mergeProps } from "@base-ui/react"',
        "const Dialog = await import('@base-ui/react/dialog')",
      ].join('\n'),
    )
  })

  it('leaves a package that only starts with the same name alone', () => {
    const source = "import x from '@base-ui-components/react-extra'"
    expect(rewrite(source)).toBe(source)
  })
})

describe('a namespace that lost its Preview', () => {
  it('renames the import, and the uses when it was imported by its own name', () => {
    const before = [
      "import { DrawerPreview } from '@base-ui/react/drawer'",
      'const props: DrawerPreview.Root.Props = {}',
      '<DrawerPreview.Root><DrawerPreview.Popup /></DrawerPreview.Root>',
    ].join('\n')
    expect(rewrite(before)).toBe(
      [
        "import { Drawer } from '@base-ui/react/drawer'",
        'const props: Drawer.Root.Props = {}',
        '<Drawer.Root><Drawer.Popup /></Drawer.Root>',
      ].join('\n'),
    )
  })

  it('renames only the import when the file calls it something else', () => {
    // dowel's own components import it as `Base`; the file's uses are already
    // the alias and stay.
    const before = "import { DrawerPreview as Base } from '@base-ui/react/drawer'\n<Base.Root />"
    expect(rewrite(before)).toBe("import { Drawer as Base } from '@base-ui/react/drawer'\n<Base.Root />")
  })

  it('touches no DrawerPreview that is not imported from Base UI', () => {
    const source = "import { DrawerPreview } from './my-drawer'\n<DrawerPreview.Root />"
    expect(rewrite(source)).toBe(source)
  })
})

describe('a prop that was renamed', () => {
  it('follows the namespace through its alias, and the namespace through its rename', () => {
    const before = [
      "import { OTPFieldPreview as OTP } from '@base-ui-components/react/otp-field'",
      '<OTP.Root length={6} sanitizeValue={(value) => value.trim()} />',
    ].join('\n')
    // The package, then the prop, then the namespace - in the order they shipped.
    expect(rewrite(before)).toBe(
      [
        "import { OTPField as OTP } from '@base-ui/react/otp-field'",
        '<OTP.Root length={6} normalizeValue={(value) => value.trim()} />',
      ].join('\n'),
    )
  })

  it('renames it on the parts of that namespace only', () => {
    const before = [
      "import { OTPField } from '@base-ui/react/otp-field'",
      '<OTPField.Root sanitizeValue={clean} />',
      '<Input sanitizeValue={clean} />',
    ].join('\n')
    const after = rewrite(before).split('\n')
    expect(after[1]).toBe('<OTPField.Root normalizeValue={clean} />')
    expect(after[2]).toBe('<Input sanitizeValue={clean} />')
  })

  it('reads past an arrow inside the tag to find where it ends', () => {
    const before = [
      "import { OTPField } from '@base-ui/react/otp-field'",
      '<OTPField.Root onValueChange={(v) => v > 3 && go()} sanitizeValue={clean}>',
    ].join('\n')
    expect(rewrite(before)).toContain('normalizeValue={clean}')
  })
})

describe('the edges of a rewrite', () => {
  it('reads a type-only import, and an alias written with more than one space', () => {
    const before = [
      "import type { DrawerPreview } from '@base-ui/react/drawer'",
      "import { type DrawerPreview  as  D } from '@base-ui/react/drawer'",
      'type P = DrawerPreview.Root.Props',
    ].join('\n')
    expect(rewrite(before)).toBe(
      [
        "import type { Drawer } from '@base-ui/react/drawer'",
        "import { type Drawer  as  D } from '@base-ui/react/drawer'",
        'type P = Drawer.Root.Props',
      ].join('\n'),
    )
  })

  it('reads `type` inside the braces as a marker, not as part of the name', () => {
    const before = "import { type DrawerPreview } from '@base-ui/react/drawer'\ntype P = DrawerPreview.Root.Props"
    expect(rewrite(before)).toBe("import { type Drawer } from '@base-ui/react/drawer'\ntype P = Drawer.Root.Props")
  })

  it('leaves code that already took the new name under the old one alone', () => {
    // Migrated by hand, keeping the old spelling at the call sites: the
    // import says this `DrawerPreview` is Base UI's `Drawer`, and it stays.
    const source = "import { Drawer as DrawerPreview } from '@base-ui/react/drawer'\n<DrawerPreview.Root />"
    expect(rewrite(source)).toBe(source)
  })

  it('does not rename a DrawerPreview of its own when Base UI is imported under an alias', () => {
    const before = [
      "import { DrawerPreview as Base } from '@base-ui/react/drawer'",
      'const DrawerPreview = mine()',
      'DrawerPreview.open()',
    ].join('\n')
    expect(rewrite(before).split('\n').slice(1)).toEqual(['const DrawerPreview = mine()', 'DrawerPreview.open()'])
  })

  it('renames the uses when one of two imports keeps the name', () => {
    const before = [
      "import { DrawerPreview as D } from '@base-ui/react/drawer'",
      "import { DrawerPreview } from '@base-ui/react/drawer'",
      '<DrawerPreview.Root />',
    ].join('\n')
    expect(rewrite(before).split('\n')[2]).toBe('<Drawer.Root />')
  })

  it('leaves a DrawerPreview of its own alone, beside an import of Base UI under another name', () => {
    const source = [
      "import { Drawer } from '@base-ui/react/drawer'",
      "import { DrawerPreview } from './mine'",
      '<DrawerPreview.Root />',
    ].join('\n')
    expect(rewrite(source)).toBe(source)
  })

  it('renames the prop only on the namespace it belongs to, whatever else the module gives', () => {
    const source = [
      "import { OTPField, OTPFieldInputDataAttributes as Other } from '@base-ui/react/otp-field'",
      '<Other.Root sanitizeValue={clean} />',
    ].join('\n')
    expect(rewrite(source)).toBe(source)
  })

  it('renames it under every name the namespace is imported as', () => {
    const before = [
      "import { OTPField } from '@base-ui/react/otp-field'",
      "import { OTPField  as  O } from '@base-ui/react/otp-field'",
      '<OTPField.Root sanitizeValue={a} />',
      '<O.Root sanitizeValue={b} />',
    ].join('\n')
    const after = rewrite(before).split('\n')
    expect(after.slice(2)).toEqual(['<OTPField.Root normalizeValue={a} />', '<O.Root normalizeValue={b} />'])
  })

  it('reads a tag past a `>` in a string and a `}` in a string inside an expression, and stops at its end', () => {
    const before = [
      "import { OTPField } from '@base-ui/react/otp-field'",
      "<OTPField.Root title=\"a > b\" onFocus={() => say('}', `}`)} sanitizeValue={clean}>",
      '  <Input sanitizeValue={mine} />',
    ].join('\n')
    // The tag ends at its own `>`: the Input after it is not Base UI's.
    expect(rewrite(before).split('\n').slice(1)).toEqual([
      "<OTPField.Root title=\"a > b\" onFocus={() => say('}', `}`)} normalizeValue={clean}>",
      '  <Input sanitizeValue={mine} />',
    ])
  })

  it('renames a tag inside another once, and copies nothing twice', () => {
    const before = [
      "import { OTPField } from '@base-ui/react/otp-field'",
      '<OTPField.Root render={<OTPField.Input sanitizeValue={a} />} sanitizeValue={b}>text</OTPField.Root>',
    ].join('\n')
    expect(rewrite(before).split('\n')[1]).toBe(
      '<OTPField.Root render={<OTPField.Input normalizeValue={a} />} normalizeValue={b}>text</OTPField.Root>',
    )
  })

  it('renames the prop written last and bare, and not a longer name that starts with it', () => {
    const before = [
      "import { OTPField } from '@base-ui/react/otp-field'",
      '<OTPField.Root sanitizeValueLater={x} sanitizeValue>',
    ].join('\n')
    expect(rewrite(before).split('\n')[1]).toBe('<OTPField.Root sanitizeValueLater={x} normalizeValue>')
  })

  it('counts each edit on its own line, for every kind of rule', () => {
    const { edits } = rewriteBaseUi(
      [
        '// a header',
        "import { DrawerPreview } from '@base-ui/react/drawer'",
        "import { OTPField } from '@base-ui/react/otp-field'",
        '',
        '<DrawerPreview.Root />',
        '<OTPField.Root',
        '  sanitizeValue={clean}',
        '/>',
      ].join('\n'),
    )
    expect(edits).toEqual([
      { line: 2, from: 'DrawerPreview', to: 'Drawer' },
      { line: 5, from: 'DrawerPreview', to: 'Drawer' },
      { line: 7, from: 'sanitizeValue', to: 'normalizeValue' },
    ])
  })
})

describe('the account it gives', () => {
  it('names every edit, on the line it was made', () => {
    const { edits } = rewriteBaseUi("\nimport { Menu } from '@base-ui-components/react/menu'")
    expect(edits).toEqual([{ line: 2, from: '@base-ui-components/react', to: '@base-ui/react' }])
  })

  it('makes no edit to a file that is already current', () => {
    expect(rewriteBaseUi("import { Drawer } from '@base-ui/react/drawer'").edits).toEqual([])
  })
})

describe('the table, against Base UI', () => {
  const require = createRequire(import.meta.url)
  const packageDir = dirname(require.resolve('@base-ui/react/package.json'))
  const changelog = readFileSync(resolve(packageDir, 'CHANGELOG.md'), 'utf8')

  /** Every breaking change of a stable release, by its pull request. A
   * bullet runs on over indented lines, and the pull request is often on the
   * last of them. */
  const breaking = (() => {
    const found: { version: string; pr: number; line: string }[] = []
    let version = ''
    let bullet: string[] = []
    const close = () => {
      const text = bullet.join(' ')
      bullet = []
      if (!version || !/\*\*Breaking change/.test(text)) return
      const pr = text.match(/\(#(\d+)\)/)
      found.push({ version, pr: pr ? Number(pr[1]) : Number.NaN, line: text })
    }
    for (const line of changelog.split(/\r?\n/)) {
      const heading = line.match(/^## v(\d+\.\d+\.\d+)(-\S+)?\s*$/)
      if (heading) {
        close()
        version = heading[2] ? '' : heading[1]!
      } else if (/^- /.test(line)) {
        close()
        bullet = [line]
      } else if (/^\s+\S/.test(line) && bullet.length > 0) {
        bullet.push(line.trim())
      } else {
        close()
      }
    }
    close()
    return found
  })()

  it('reads the breaking changes out of the changelog', () => {
    // A changelog this test cannot read would pass it vacuously.
    expect(breaking.length).toBeGreaterThanOrEqual(4)
  })

  it('has an entry for every breaking change since 1.0', () => {
    const covered = new Set(baseUiChanges.map((change) => change.pr))
    const missing = breaking.filter((change) => !covered.has(change.pr))
    expect(
      missing.map((change) => `v${change.version} #${change.pr}: ${change.line.trim()}`),
      'add each to baseUiChanges in base-ui.ts - a rule, or a note saying what a person has to read',
    ).toEqual([])
  })

  it('renames to what the installed Base UI exports, and away from what it no longer does', () => {
    for (const change of baseUiChanges) {
      for (const rule of change.rules) {
        if (rule.kind !== 'export') continue
        const exported = require(rule.module) as Record<string, unknown>
        expect(exported, `${rule.module} exports ${rule.to}`).toHaveProperty(rule.to)
        expect(exported, `${rule.module} no longer exports ${rule.from}`).not.toHaveProperty(rule.from)
      }
    }
    // Loading Base UI's modules into a VM context takes seconds under load.
  }, 30_000)

  it('gives every entry either a rule or a note', () => {
    for (const change of baseUiChanges) expect(change.rules.length > 0 || Boolean(change.note)).toBe(true)
  })
})
