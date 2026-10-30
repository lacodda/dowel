import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import { lineProducts } from '../packages/dowel/src/line'

/*
 * The theme as Rust, compiled and run - not read as text.
 *
 * A generated module that only looks right is the failure this exists for: a
 * token renamed to a word Rust reserves, a colour written in the wrong order,
 * a constant two products spell differently. So every product's module is
 * built into one program by the real compiler, with `[u8; 4]` as the colour a
 * native product would plug in, and the program prints what it holds. What it
 * prints is compared with the palettes the browser resolved.
 *
 * rustc is on every runner CI uses and on every machine that builds the line's
 * native products; without it this fails, rather than passing unasked.
 */

const tokensDir = inject('tokensDir')
const work = mkdtempSync(resolve(tmpdir(), 'dowel-rust-'))
const MODES = ['DARK', 'LIGHT', 'DARK_CONTRAST_MORE', 'LIGHT_CONTRAST_MORE'] as const
const GROUPS = ['dark', 'light', 'dark-contrast-more', 'light-contrast-more'] as const

type Printed = Record<string, Record<string, string>>
let printed: Printed

beforeAll(() => {
  const modules = lineProducts
    .map(
      ({ name }) => `mod ${name.replaceAll('-', '_')} {
    #![allow(dead_code)]
    pub type Color = [u8; 4];
    const fn rgba(r: u8, g: u8, b: u8, a: u8) -> Color { [r, g, b, a] }
    include!(${JSON.stringify(resolve(tokensDir, 'rust', `${name}.rs`))});
}`,
    )
    .join('\n')
  const prints = lineProducts
    .flatMap(({ name }) => {
      const module = name.replaceAll('-', '_')
      return [
        ...MODES.map((mode) => `    println!("${name} ${mode} {:?}", ${module}::${mode});`),
        `    println!("${name} VERSION {}", ${module}::VERSION);`,
        `    println!("${name} RADIUS_MD {}", ${module}::radius::MD);`,
        `    println!("${name} TEXT_BASE {:?}", ${module}::text::BASE);`,
        `    println!("${name} DURATION_BASE {}", ${module}::duration::BASE.as_millis());`,
      ]
    })
    .join('\n')
  const source = resolve(work, 'main.rs')
  writeFileSync(source, `${modules}\n\nfn main() {\n${prints}\n}\n`)
  const binary = resolve(work, process.platform === 'win32' ? 'main.exe' : 'main')
  execFileSync('rustc', ['--edition', '2021', '-O', '-o', binary, source], { cwd: work, stdio: 'pipe' })
  printed = {}
  for (const line of execFileSync(binary, { encoding: 'utf8' }).trim().split(/\r?\n/)) {
    const [product, what, ...rest] = line.split(' ')
    printed[product!] ??= {}
    printed[product!]![what!] = rest.join(' ')
  }
}, 120_000)

afterAll(() => rmSync(work, { recursive: true, force: true }))

/** `Palette { bg: [12, 13, 15, 255], line_2: … }` -> field -> RGBA. */
function fields(debug: string): Map<string, number[]> {
  return new Map(
    [...debug.matchAll(/(\w+): \[(\d+), (\d+), (\d+), (\d+)\]/g)].map((m) => [
      m[1]!,
      [Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5])],
    ]),
  )
}

function rgba(hex: string): number[] {
  const digits = hex.slice(1)
  const byte = (at: number) => Number.parseInt(digits.slice(at, at + 2), 16)
  return [byte(0), byte(2), byte(4), digits.length === 8 ? byte(6) : 255]
}

describe('the Rust form of the theme', () => {
  it('is written for every product of the line', () => {
    expect(readdirSync(resolve(tokensDir, 'rust')).sort()).toEqual(lineProducts.map(({ name }) => `${name}.rs`).sort())
  })

  it('compiles, and holds every colour the browser resolved, in every mode', () => {
    for (const { name } of lineProducts) {
      const palette = JSON.parse(readFileSync(resolve(tokensDir, 'palettes', `${name}.json`), 'utf8'))
      MODES.forEach((mode, index) => {
        const held = fields(printed[name]![mode]!)
        const resolved = Object.entries(palette.color[GROUPS[index]!] as Record<string, { $value: string }>)
        expect(held.size, `${name} ${mode} holds a different number of colours`).toBe(resolved.length)
        for (const [token, { $value }] of resolved) {
          expect(held.get(token.replaceAll('-', '_')), `${name} ${mode} ${token}`).toEqual(rgba($value))
        }
      })
    }
  })

  it('carries the scales and the release they came from', () => {
    const tokens = JSON.parse(readFileSync(resolve(tokensDir, 'tokens.json'), 'utf8'))
    const { version } = JSON.parse(readFileSync(resolve(import.meta.dirname, '../packages/dowel/package.json'), 'utf8'))
    for (const { name } of lineProducts) {
      const at = printed[name]!
      expect(at.VERSION).toBe(version)
      expect(Number(at.RADIUS_MD)).toBe(tokens.radius.md.$value.value)
      expect(at.TEXT_BASE).toBe(
        `(${tokens.typography.base.$value.fontSize.value}.0, ${tokens.typography.base.$value.lineHeight.value}.0)`,
      )
      expect(Number(at.DURATION_BASE)).toBe(tokens.duration.base.$value.value)
    }
  })
})
