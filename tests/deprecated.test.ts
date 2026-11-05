import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import Ajv2020 from 'ajv/dist/2020'
import { afterAll, describe, expect, inject, it } from 'vitest'
import { deprecationNote, deprecations, type Deprecation } from '../packages/dowel/src/deprecated'
import { lineProducts } from '../packages/dowel/src/line'
import { aliasBlock, aliasItem, itemRows, namesInTokensJson, withAliases, withoutAliases } from '../tools/build-aliases.mjs'
import { rustModule } from '../tools/tokens/rust.mjs'
import { scales } from '../tools/tokens/scales.mjs'
import { compileClasses, utilityRules } from './compile'
import { RENAMED } from './deprecated.fixture'

/*
 * The one way to change a name inside a major.
 *
 * The promise is that a product writing the old name notices nothing but a line
 * in `dowel check`. So what is held here is the old name against the new one at
 * every place a product can read the vocabulary: the stylesheet, the compiler,
 * the browser, the palette, the Rust module, and the registry's address.
 */

const root = resolve(import.meta.dirname, '..')
const theme = readFileSync(resolve(root, 'packages/dowel/src/theme.css'), 'utf8')
const version: string = JSON.parse(readFileSync(resolve(root, 'packages/dowel/package.json'), 'utf8')).version
const major = (value: string) => Number(value.split('.')[0])

describe('the table as it stands', () => {
  it('is what the theme carries', () => {
    expect(withAliases(deprecations, theme), 'run node tools/build-aliases.mjs').toBe(theme)
  })

  it('states dates that hold', () => {
    for (const row of deprecations) {
      expect(row.since, `${row.from} is dated after this release`).not.toBe('')
      expect(major(row.removeIn), `${row.from} would go in the major it was renamed in`).toBeGreaterThan(major(row.since))
      expect(row.removeIn, `${row.from} goes in a major`).toMatch(/^\d+\.0\.0$/)
      expect(major(version), `${row.from} was due to go in ${row.removeIn}`).toBeLessThan(major(row.removeIn))
    }
  })

  it('renames a name to one that is not itself on its way out', () => {
    const leaving = new Set(deprecations.map((row) => row.from))
    expect(deprecations.filter((row) => leaving.has(row.to))).toEqual([])
  })

  it('has really moved each token', () => {
    const own = withoutAliases(theme)
    for (const row of deprecations.filter((entry) => entry.kind === 'token')) {
      expect(own, `the theme still declares --${row.from} itself`).not.toMatch(new RegExp(`(?<![\\w-])--${row.from}\\s*:`))
    }
  })
})

describe('the block in the theme', () => {
  it('declares a colour for a stylesheet and for the compiler', () => {
    const block = aliasBlock(RENAMED, theme)
    expect(block).toContain('--was-raise: var(--raise);')
    expect(block).toContain('--color-was-raise: var(--raise);')
  })

  it('leaves a name the compiler has a namespace for to the compiler', () => {
    const block = aliasBlock(RENAMED, theme)
    // Its value rather than a `var()`: the compiler inlines these, and an alias
    // should make the same rule the name it stands for makes.
    expect(block).toMatch(/@theme inline \{[^}]*--spacing-was-rail: \d+px;/)
    expect(block).not.toMatch(/:root \{[^}]*--spacing-was-rail/)
  })

  it('writes a utility the theme writes by hand, and not one a token gives', () => {
    const block = aliasBlock(RENAMED, theme)
    expect(block).toContain('@utility h-was-control {\n  @apply h-control;\n}')
    expect(block).not.toContain('@utility w-was-rail')
  })

  it('is empty for an empty table, and for an item', () => {
    expect(aliasBlock([], theme)).toBe('')
    expect(aliasBlock(RENAMED.filter((row) => row.kind === 'item'), theme)).toBe('')
  })

  it('replaces what was there rather than adding to it', () => {
    const once = withAliases(RENAMED, theme)
    expect(withAliases(RENAMED, once)).toBe(once)
    expect(withAliases([], once)).toBe(withAliases([], theme))
  })

  it('refuses a rename to a name that does not exist', () => {
    const row: Deprecation = { kind: 'token', from: 'old', to: 'nothing-of-the-kind', since: '1.1.0', removeIn: '2.0.0' }
    expect(() => aliasBlock([row], theme)).toThrow('does not declare')
  })

  it('does not count an alias as what makes its own target exist', () => {
    const once = withAliases(RENAMED, theme)
    const row: Deprecation = { kind: 'token', from: 'older', to: 'was-raise', since: '1.1.0', removeIn: '2.0.0' }
    expect(() => aliasBlock([row], once)).toThrow('does not declare')
  })

  it('refuses what tokens.json and the Rust modules name in their own shape', () => {
    for (const to of ['radius-md', 'good', 'series-1', 'text-sm', 'duration-base', 'z-menu']) {
      const row: Deprecation = { kind: 'token', from: 'old', to, since: '1.1.0', removeIn: '2.0.0' }
      expect(() => aliasBlock([row], theme), to).toThrow('renaming it is a major')
    }
  })

  it('knows every name those forms carry', () => {
    // Read from the file those forms are generated from, so a group added there
    // cannot quietly become renamable here.
    const tokens = scales(theme) as Record<string, Record<string, unknown>>
    const groups = Object.keys(tokens).filter((key) => !key.startsWith('$'))
    expect(groups.sort()).toEqual(
      ['duration', 'easing', 'fontFamily', 'fontWeight', 'heat', 'icon', 'layer', 'radius', 'scale', 'series', 'status', 'syntax', 'typography'].sort(),
    )
    expect(namesInTokensJson(theme).has('accent'), 'the accent is resolved, not carried').toBe(false)
    expect(namesInTokensJson(theme).has('line-2'), 'a hairline is resolved, not carried').toBe(false)
  })
})

describe('the old name, through the compiler', () => {
  it('makes the same rule for a colour', async () => {
    const css = await compileClasses(['bg-was-raise', 'bg-raise'], withAliases(RENAMED, theme))
    const body = (selector: string) => utilityRules(css).find((rule) => rule.selector === selector)?.body
    expect(body('.bg-was-raise')).toBeTruthy()
    expect(body('.bg-was-raise')).toBe(body('.bg-raise'))
  })

  it('makes the same rule for a utility of a token', async () => {
    const css = await compileClasses(['w-was-rail', 'w-rail'], withAliases(RENAMED, theme))
    const body = (selector: string) => utilityRules(css).find((rule) => rule.selector === selector)?.body
    expect(body('.w-was-rail')).toBeTruthy()
    expect(body('.w-was-rail')).toBe(body('.w-rail'))
  })
})

describe('the old name, in a browser', () => {
  const aliases = inject('aliases')

  it.each(['dark', 'light'] as const)('draws what the new name draws, in the %s theme', (mode) => {
    const { old, current } = aliases[mode]
    expect(old).toEqual(current)
    // Painted, sized and inked at all, or the comparison above is of nothing.
    expect(current.every((value) => value !== '' && value !== '0px' && value !== 'rgba(0, 0, 0, 0)')).toBe(true)
  })

  it('tells the two themes apart, so the old name follows the swap', () => {
    expect(aliases.dark.old[0]).not.toBe(aliases.light.old[0])
  })

  it('is in the palette a native product reads, saying so', () => {
    const { dark, light } = aliases.palette.color
    for (const mode of [dark!, light!]) {
      expect(mode['was-raise']?.$value).toBe(mode.raise?.$value)
      expect(mode['was-raise']?.$deprecated).toContain('--raise')
      expect(mode.raise?.$deprecated).toBeUndefined()
    }
  })
})

// Each case is a run of rustc, which a Windows runner takes well over the default
// five seconds to start.
describe('the old name, in Rust', { timeout: 120_000 }, () => {
  const work = mkdtempSync(resolve(tmpdir(), 'dowel-rust-alias-'))
  afterAll(() => rmSync(work, { recursive: true, force: true }))

  const module = () => {
    const palette = inject('aliases').palette
    const groups = ['dark', 'light', 'dark-contrast-more', 'light-contrast-more']
    expect(groups.every((group) => palette.color[group])).toBe(true)
    return rustModule({ product: lineProducts[0], palette, tokens: scales(theme), version: '0.0.0' })
  }

  const program = (name: string, main: string) => {
    const path = resolve(work, `${name}.rs`)
    writeFileSync(
      path,
      `mod dowel {\n#![allow(dead_code)]\npub type Color = [u8; 4];\nconst fn rgba(r: u8, g: u8, b: u8, a: u8) -> Color { [r, g, b, a] }\n${module()}\n}\nfn main() { ${main} }\n`,
    )
    return path
  }

  const compile = (path: string) =>
    execFileSync('rustc', ['--edition', '2021', '-D', 'warnings', '--emit=metadata', '-o', `${path}.rmeta`, path], {
      cwd: work,
      stdio: 'pipe',
    })

  it('compiles clean while nobody reads the field', () => {
    expect(() => compile(program('clean', 'println!("{:?}", dowel::DARK.raise);'))).not.toThrow()
  })

  it('warns whoever reads it', () => {
    expect(() => compile(program('warned', 'println!("{:?}", dowel::DARK.was_raise);'))).toThrow(/deprecated/)
  })
})

describe('the old address of an item', () => {
  const schema = JSON.parse(readFileSync(resolve(root, 'docs/public/r/schema.json'), 'utf8'))
  const [row] = itemRows(RENAMED)
  const item = aliasItem(row!, 'https://lacodda.github.io/dowel/r')

  it('is an item the registry’s own schema accepts', () => {
    const validate = new Ajv2020({ strict: false }).compile(schema)
    expect(validate(item), JSON.stringify(validate.errors)).toBe(true)
  })

  it('installs the item it became and writes nothing of its own', () => {
    expect(item.registryDependencies).toEqual(['https://lacodda.github.io/dowel/r/button.json'])
    expect(item.files).toEqual([])
  })

  it('says so when it does', () => {
    expect(item.docs).toContain(deprecationNote(row!))
    expect(item.meta).toEqual({ deprecated: { to: 'button', since: '1.1.0', removeIn: '2.0.0' } })
  })

  it('leaves everything else out of the old addresses', () => {
    expect(itemRows(RENAMED)).toHaveLength(1)
  })
})
