import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, inject, it } from 'vitest'
import { lineProducts } from '../packages/dowel/src/line'
import { paintedProducts } from './browser.setup'

/*
 * The resolved palettes - the colours a native product paints with.
 *
 * These files are written by a browser, so the risk is not a wrong formula
 * (there is none here) but a wrong question: the accent not reaching the page,
 * the light theme never switching on, a colour silently dropped because the
 * probe did not recognise it. Each check below is aimed at one of those.
 */

const root = resolve(import.meta.dirname, '..')

type Theme = Record<string, { $value: string }>
interface Palette {
  $extensions: { 'com.lacodda.dowel': { version: string; product: string; accent: string } }
  color: { $type: string; dark: Theme; light: Theme }
}

const palettes = new Map<string, Palette>()

beforeAll(() => {
  // Built for this run rather than trusted from `dist`, for the reason the
  // token test gives: these checks describe what the next build ships. The
  // browser ran once in the global setup, before any worker started.
  const dir = inject('palettesDir')
  for (const file of readdirSync(dir)) {
    palettes.set(file.replace(/\.json$/, ''), JSON.parse(readFileSync(resolve(dir, file), 'utf8')))
  }
})

const value = (theme: Theme, name: string): string => {
  expect(theme, `the palette has no \`${name}\``).toHaveProperty(name)
  return theme[name]!.$value
}

/** WCAG 2 contrast of two opaque colours. */
function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!
  }
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

describe('shape', () => {
  it('writes one palette per product of the line, and no other', () => {
    expect([...palettes.keys()].sort()).toEqual(lineProducts.map((p) => p.name).sort())
  })

  it('gives every palette both themes with the same names', () => {
    for (const [name, palette] of palettes) {
      expect(palette.color.$type, `${name} is not typed as colour`).toBe('color')
      expect(Object.keys(palette.color.light), `${name} names different colours in each theme`).toEqual(
        Object.keys(palette.color.dark),
      )
    }
  })

  it('writes every colour as hex a native consumer can parse', () => {
    for (const [name, palette] of palettes) {
      for (const theme of ['dark', 'light'] as const) {
        for (const [token, { $value }] of Object.entries(palette.color[theme])) {
          expect($value, `${name} ${theme} ${token}`).toMatch(/^#[0-9a-f]{6}([0-9a-f]{2})?$/)
        }
      }
    }
  })

  it('says which package version it was resolved from', () => {
    // A consumer vendoring this file pins that version and compares against it.
    const { version } = JSON.parse(readFileSync(resolve(root, 'packages/dowel/package.json'), 'utf8'))
    for (const palette of palettes.values()) {
      expect(palette.$extensions['com.lacodda.dowel'].version).toBe(version)
    }
  })
})

describe('it asked the right question', () => {
  it('finds the colours a screen is made of', () => {
    // Guards the rest: a probe that recognised nothing would pass the shape
    // checks with empty themes.
    const dark = palettes.get('nitid')!.color.dark
    for (const token of ['bg', 'raise', 'soft', 'line', 'text', 'dim', 'faint', 'accent', 'accent-2', 'on-accent']) {
      value(dark, token)
    }
    expect(Object.keys(dark).length).toBeGreaterThanOrEqual(50)
  })

  it('paints each product in its own accent', () => {
    // The dark theme uses the accent as it is, so the file must state the
    // registry's value exactly. If the accent never reached the page, every
    // product would come back in dowel's amber.
    for (const { name, accent } of lineProducts) {
      expect(value(palettes.get(name)!.color.dark, 'accent'), name).toBe(accent.toLowerCase())
    }
  })

  it('tints the greys with the accent too', () => {
    // `--bg` carries a trace of the accent; two products with different hues
    // cannot share a ground.
    const grounds = new Set(lineProducts.map(({ name }) => value(palettes.get(name)!.color.dark, 'bg')))
    const hues = new Set(lineProducts.map(({ accent }) => accent.toLowerCase()))
    expect(grounds.size).toBe(hues.size)
  })

  it('switches the light theme on', () => {
    // Pinned to the class and the media query alike; a page left dark would
    // hand back the dark values twice.
    for (const [name, palette] of palettes) {
      expect(value(palette.color.light, 'raise'), name).toBe('#ffffff')
      expect(value(palette.color.light, 'bg'), name).not.toBe(value(palette.color.dark, 'bg'))
      expect(value(palette.color.light, 'accent'), name).not.toBe(value(palette.color.dark, 'accent'))
    }
  })

  it('keeps the translucency the theme states', () => {
    // `--soft` is white at 4.5% on dark: a surface that lifts by alpha. Dropped
    // to opaque, it would paint a white slab.
    expect(value(palettes.get('nitid')!.color.dark, 'soft')).toMatch(/^#ffffff[0-9a-f]{2}$/)
    expect(value(palettes.get('nitid')!.color.dark, 'accent-soft')).toHaveLength(9)
  })

  it('agrees with tokens.json on the colours that are fixed', () => {
    execFileSync('node', ['tools/build-tokens-json.mjs'], { cwd: root })
    const tokens = JSON.parse(readFileSync(resolve(root, 'packages/dowel/dist/tokens.json'), 'utf8'))
    const palette = palettes.get('kilna')!.color
    for (const group of ['series', 'scale', 'heat', 'syntax']) {
      for (const theme of ['dark', 'light'] as const) {
        for (const [token, { $value }] of Object.entries(tokens[group][theme] as Theme)) {
          expect(value(palette[theme], token), `${theme} ${token}`).toBe($value.toLowerCase())
        }
      }
    }
  })
})

describe('the notation is converted, not changed', () => {
  it('writes the colour the browser paints', () => {
    /*
     * The browser answers in `oklab()` for a mix, and the script converts that
     * to sRGB itself. The global setup asked the browser again by a different
     * route - painting each opaque colour into a canvas, converted on its own -
     * so a wrong matrix or sign in the conversion shows up here as a pixel that
     * disagrees, not as a plausible colour nobody questions.
     */
    const painted = inject('painted')
    expect(Object.keys(painted).sort(), 'the canvas painted other products').toEqual([...paintedProducts].sort())
    for (const name of paintedProducts) {
      for (const mode of ['dark', 'light'] as const) {
        const written = palettes.get(name)!.color[mode]
        const opaque = Object.keys(written).filter((token) => written[token]!.$value.length === 7)
        expect(Object.keys(painted[name]![mode]).sort(), `${name} ${mode}: painted other tokens`).toEqual(opaque.sort())
        for (const token of opaque) {
          const hex = written[token]!.$value
          const pixel = painted[name]![mode][token]!
          const expected = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
          expected.forEach((channel, i) => {
            expect(
              Math.abs(channel - pixel[i]!),
              `${name} ${mode} ${token}: written ${hex}, painted ${pixel.slice(0, 3).join(',')}`,
            ).toBeLessThanOrEqual(1)
          })
        }
      }
    }
  })
})

describe('what the numbers promise', () => {
  it('keeps body text legible on both grounds, for every product', () => {
    for (const [name, { color }] of palettes) {
      for (const theme of ['dark', 'light'] as const) {
        const t = color[theme]
        for (const ground of ['bg', 'raise']) {
          expect(contrast(value(t, 'text'), value(t, ground)), `${name} ${theme} text on ${ground}`).toBeGreaterThanOrEqual(7)
          expect(contrast(value(t, 'dim'), value(t, ground)), `${name} ${theme} dim on ${ground}`).toBeGreaterThanOrEqual(4.5)
        }
      }
    }
  })

  it('puts legible glyphs on every fill', () => {
    for (const [name, { color }] of palettes) {
      for (const theme of ['dark', 'light'] as const) {
        const t = color[theme]
        for (const fill of ['accent', 'good', 'warn', 'bad', 'info']) {
          expect(
            contrast(value(t, `on-${fill}`), value(t, fill)),
            `${name} ${theme} on-${fill}`,
          ).toBeGreaterThanOrEqual(4.5)
        }
      }
    }
  })
})
