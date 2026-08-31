import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { lineProducts } from './line'

/*
 * Contrast, computed rather than asserted by eye.
 *
 * The theme derives the accent family and `--on-accent` from one hue per
 * product, which means a rule that is wrong is wrong for every product at
 * once. The first version of this theme put white glyphs on the accent for
 * twelve of the line's fourteen colours at around 3:1 - it looked deliberate,
 * it passed every structural test, and it was unreadable.
 *
 * So the rules are checked against the real accents of the line: the theme has
 * to clear WCAG AA for all of them, not for the one the author happened to
 * look at.
 */

const themeCss = readFileSync(fileURLToPath(new URL('./theme.css', import.meta.url)), 'utf8')

/** Every accent of the line, from its registry of marks. A product's colour is
 * fixed for the life of the product, so this is the real input space of the
 * theme rather than a sample - and a product added there is contrast-checked
 * without anyone remembering to add it here. */
const lineAccents: Record<string, string> = Object.fromEntries(
  lineProducts.map(({ name, accent }) => [name, accent]),
)

type Rgb = [number, number, number]
type Oklab = [number, number, number]

function hexToLinear(hex: string): Rgb {
  const h = hex.replace('#', '')
  const channel = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return [channel(0), channel(2), channel(4)]
}

function linearToOklab([r, g, b]: Rgb): Oklab {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklabToLinear([L, a, b]: Oklab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

function relativeLuminance([r, g, b]: Rgb): number {
  const clamp = (c: number) => Math.max(0, Math.min(1, c))
  return 0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(b)
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

const lightness = (hex: string) => linearToOklab(hexToLinear(hex))[0]

/** The accent as the light theme renders it: same hue and chroma, pinned to a
 * darker lightness. Mirrors `oklch(from var(--accent-base) 0.5 c h)`. */
function atLightness(hex: string, L: number): Rgb {
  const [, a, b] = linearToOklab(hexToLinear(hex))
  return oklabToLinear([L, a, b])
}

const WHITE: Rgb = [1, 1, 1]
const BLACK: Rgb = [0, 0, 0]
const AA = 4.5

/** The thresholds the theme actually states, read out of it rather than
 * repeated here - a test that hard-codes them would keep passing after someone
 * edits the CSS. */
function statedNumber(pattern: RegExp, what: string): number {
  const match = themeCss.match(pattern)
  expect(match, `the theme no longer states ${what}`).not.toBeNull()
  return Number(match![1])
}

const onAccentThreshold = statedNumber(
  /--on-accent:\s*oklch\(from var\(--accent\) clamp\(0,\s*\(([\d.]+) - l\)/,
  'the on-accent lightness threshold',
)
const lightAccentL = statedNumber(
  /--accent:\s*oklch\(from var\(--accent-base\) ([\d.]+) c h\)/,
  'the light-theme accent lightness',
)
const onStatusThreshold = statedNumber(
  /--on-warn:\s*oklch\(from var\(--warn\) clamp\(0,\s*\(([\d.]+) - l\)/,
  'the on-status lightness threshold',
)

describe('on-accent, dark theme', () => {
  it.each(Object.entries(lineAccents))('%s is legible under its own glyphs', (_product, accent) => {
    // What the theme's rule picks for this accent.
    const chosen = lightness(accent) > onAccentThreshold ? BLACK : WHITE
    expect(contrast(chosen, hexToLinear(accent))).toBeGreaterThanOrEqual(AA)
  })

  it.each(Object.entries(lineAccents))('%s gets the better of black and white', (_product, accent) => {
    // Not merely passable - the rule should agree with the better choice, or
    // it is leaving contrast on the table for no reason.
    const rgb = hexToLinear(accent)
    const chosen = lightness(accent) > onAccentThreshold ? BLACK : WHITE
    const best = contrast(BLACK, rgb) > contrast(WHITE, rgb) ? BLACK : WHITE
    expect(chosen).toEqual(best)
  })
})

describe('accent, light theme', () => {
  it.each(Object.entries(lineAccents))('%s stays readable as text on the light ground', (_product, accent) => {
    const ground = hexToLinear('#f6f5f7')
    expect(contrast(atLightness(accent, lightAccentL), ground)).toBeGreaterThanOrEqual(AA)
  })

  it.each(Object.entries(lineAccents))('%s carries white glyphs as a fill', (_product, accent) => {
    expect(contrast(atLightness(accent, lightAccentL), WHITE)).toBeGreaterThanOrEqual(AA)
  })
})

/** The dark theme's block, and the light theme's. Every value under test is
 * read from these rather than repeated in the test, or the test measures a
 * number that was true the day it was written and says nothing afterwards. */
const darkBlock = themeCss.slice(0, themeCss.indexOf('@media (prefers-color-scheme: light)'))
const lightBlock = themeCss.slice(themeCss.indexOf(':root.light'))

/** A literal colour the given block states for a token. */
function statedColor(block: string, token: string): string {
  // Either declared outright, or as the base a `color-mix` tints.
  const direct = block.match(new RegExp(`--${token}:\\s*(#[0-9a-f]{6});`, 'i'))
  const mixed = block.match(new RegExp(`--${token}: color-mix\\([^;]*?(#[0-9a-f]{6})\\);`, 'i'))
  const found = direct?.[1] ?? mixed?.[1]
  expect(found, `the theme no longer states a colour for \`--${token}\``).toBeDefined()
  return found!
}

describe('on-status, both themes', () => {
  /* The same question as `on-accent`, asked of the status fills, and it has to
   * be asked separately: `--on-accent` follows the *accent*, so wearing it on a
   * `warn` fill is right only by accident. kilna did exactly that - a count on
   * the yellow badge, white at 1.95:1 - and it looked correct for as long as
   * that product happened to pin white. These four exist so no product can
   * repeat it, and are checked in both themes because the status hues change
   * with the theme even though they do not follow the accent. */
  const statuses = ['good', 'warn', 'bad', 'info'] as const
  const themes = [
    ['dark', darkBlock],
    ['light', lightBlock],
  ] as const

  const cases = themes.flatMap(([theme, block]) =>
    statuses.map((status) => [theme, status, statedColor(block, status)] as const),
  )

  it.each(cases)('%s %s is legible under its own glyphs', (_theme, _status, fill) => {
    const chosen = lightness(fill) > onStatusThreshold ? BLACK : WHITE
    expect(contrast(chosen, hexToLinear(fill))).toBeGreaterThanOrEqual(AA)
  })

  it.each(cases)('%s %s gets the better of black and white', (_theme, _status, fill) => {
    const rgb = hexToLinear(fill)
    const chosen = lightness(fill) > onStatusThreshold ? BLACK : WHITE
    const best = contrast(BLACK, rgb) > contrast(WHITE, rgb) ? BLACK : WHITE
    expect(chosen).toEqual(best)
  })

  it('uses the same threshold as the accent, so one rule governs both', () => {
    expect(onStatusThreshold).toBe(onAccentThreshold)
  })

  it('derives one partner per status fill, and no fill is left without one', () => {
    for (const status of statuses) {
      expect(
        themeCss,
        `\`--on-${status}\` is missing; a fill without a partner is what put white on yellow`,
      ).toContain(`--on-${status}: oklch(from var(--${status})`)
    }
  })
})

describe('ink on grounds', () => {
  // The neutral tint is mixed from the accent, so the greys are product-
  // dependent too. These check the untinted bases the theme mixes from: the
  // tint is a few percent and moves them very little, and a base that fails
  // here fails for every product in the line.
  const darkGround = statedColor(darkBlock, 'ground')
  const lightGround = statedColor(lightBlock, 'ground')

  it('reads text against the dark ground', () => {
    expect(contrast(hexToLinear(statedColor(darkBlock, 'ink')), hexToLinear(darkGround))).toBeGreaterThanOrEqual(AA)
  })

  it('reads text against the light ground', () => {
    expect(contrast(hexToLinear(statedColor(lightBlock, 'ink')), hexToLinear(lightGround))).toBeGreaterThanOrEqual(AA)
  })

  it('reads the dim ink against the dark ground', () => {
    expect(contrast(hexToLinear(statedColor(darkBlock, 'dim')), hexToLinear(darkGround))).toBeGreaterThanOrEqual(AA)
  })

  it('reads the dim ink against the light ground', () => {
    expect(contrast(hexToLinear(statedColor(lightBlock, 'dim')), hexToLinear(lightGround))).toBeGreaterThanOrEqual(AA)
  })

  it('keeps the faint ink visible, if only just', () => {
    // `faint` is deliberately below AA for body text - it is for marks you
    // find when you look for them - but it still has to be seen at all.
    expect(contrast(hexToLinear(statedColor(darkBlock, 'faint')), hexToLinear(darkGround))).toBeGreaterThanOrEqual(3)
    expect(contrast(hexToLinear(statedColor(lightBlock, 'faint')), hexToLinear(lightGround))).toBeGreaterThanOrEqual(3)
  })
})
