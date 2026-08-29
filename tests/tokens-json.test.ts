import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

/*
 * The JSON form, checked against the stylesheet it came from.
 *
 * The point of generating it is that there is no second copy to drift. This
 * proves that: every value in the file has to be the one the theme declares,
 * and the shape has to be what the spec asks for - Design Tokens Format Module
 * 2025.10, where `dimension` and `duration` are objects, not strings.
 */

const root = resolve(import.meta.dirname, '..')
const theme = readFileSync(resolve(root, 'packages/dowel/src/theme.css'), 'utf8')

interface DimensionValue {
  value: number
  unit: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tokens: any

beforeAll(() => {
  // Run the generator rather than trusting whatever `dist` happens to hold, so
  // these checks describe what the next build produces. Whether the *shipped*
  // file matches the theme is a different question, and the release gate is
  // where it is asked.
  execFileSync('node', ['tools/build-tokens-json.mjs'], { cwd: root })
  tokens = JSON.parse(readFileSync(resolve(root, 'packages/dowel/dist/tokens.json'), 'utf8'))
})

/** The value the theme declares for a custom property. */
function declared(name: string): string {
  const match = theme.match(new RegExp(`(?<![\\w-])--${name}\\s*:\\s*([^;]+);`))
  expect(match, `the theme no longer declares \`--${name}\``).not.toBeNull()
  return match![1]!.trim()
}

/** A dimension or duration object, back as the CSS it came from. */
function asCss(value: DimensionValue): string {
  return `${value.value}${value.unit}`
}

describe('shape', () => {
  it('groups tokens by type, as the spec allows', () => {
    for (const [group, type] of [
      ['radius', 'dimension'],
      ['typography', 'typography'],
      ['fontFamily', 'fontFamily'],
      ['fontWeight', 'fontWeight'],
      ['duration', 'duration'],
      ['easing', 'cubicBezier'],
      ['layer', 'number'],
    ]) {
      expect(tokens[group!]?.$type, `\`${group}\` has the wrong or missing \`$type\``).toBe(type)
    }
  })

  it('writes dimensions as objects, not strings', () => {
    // The 2025.10 spec dropped the string form. A `"9px"` here would be read
    // by older tooling and rejected by current tooling.
    for (const step of Object.keys(tokens.radius).filter((k) => !k.startsWith('$'))) {
      const value = tokens.radius[step].$value
      expect(typeof value, `radius.${step} is not an object`).toBe('object')
      expect(value).toHaveProperty('value')
      expect(value).toHaveProperty('unit')
      expect(['px', 'rem'], `radius.${step} uses a unit the spec does not allow`).toContain(value.unit)
    }
  })

  it('writes durations as objects too', () => {
    for (const step of ['quick', 'base', 'slow']) {
      const value = tokens.duration[step].$value
      expect(typeof value).toBe('object')
      expect(['ms', 's']).toContain(value.unit)
    }
  })

  it('writes easings as four control points', () => {
    for (const name of ['out', 'in-out']) {
      const value = tokens.easing[name].$value
      expect(Array.isArray(value), `easing.${name} is not an array`).toBe(true)
      expect(value).toHaveLength(4)
      for (const point of value) expect(typeof point).toBe('number')
    }
  })
})

describe('nothing is invented', () => {
  it('takes every radius from the theme', () => {
    for (const step of ['xs', 'sm', 'md', 'lg', 'xl', '2xl']) {
      expect(asCss(tokens.radius[step].$value), `radius.${step} does not match the theme`).toBe(
        declared(`radius-${step}`),
      )
    }
  })

  it('takes every type step and its line height from the theme', () => {
    for (const step of ['2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl']) {
      const { fontSize, lineHeight } = tokens.typography[step].$value
      expect(asCss(fontSize), `typography.${step} font size does not match`).toBe(declared(`text-${step}`))
      expect(asCss(lineHeight), `typography.${step} line height does not match`).toBe(
        declared(`text-${step}--line-height`),
      )
    }
  })

  it('takes every duration from the theme', () => {
    for (const step of ['quick', 'base', 'slow']) {
      expect(asCss(tokens.duration[step].$value)).toBe(declared(`duration-${step}`))
    }
  })

  it('takes every layer from the theme', () => {
    for (const name of ['popup', 'sticky', 'menu', 'floating', 'overlay', 'modal', 'palette', 'toast']) {
      expect(String(tokens.layer[name].$value), `layer.${name} does not match`).toBe(declared(`z-${name}`))
    }
  })

  it('takes the weights from the theme', () => {
    for (const name of ['normal', 'medium', 'semibold']) {
      expect(String(tokens.fontWeight[name].$value)).toBe(declared(`font-weight-${name}`))
    }
  })
})

describe('what it leaves out', () => {
  it('omits colours, which have no fixed value', () => {
    // Most of them are `color-mix()` or `oklch(from …)` over whatever accent a
    // product chose. Writing today's amber into the file would state as fact
    // something true for exactly one product.
    expect(tokens).not.toHaveProperty('color')
    expect(JSON.stringify(tokens)).not.toContain('color-mix')
  })
})
