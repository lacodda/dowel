import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { syntaxTokens } from './index'

/*
 * The syntax palette, checked by computation.
 *
 * These eight are chosen rather than derived, like the series and the heat
 * ramps, so nothing catches a bad edit by itself. What this file checks is the
 * one property that decides whether code can be read: every slot is legible AS
 * TEXT against the surface code is drawn on.
 *
 * That threshold is why the palette exists at all. Reusing `--series-*` for
 * syntax was the first plan and it failed here: measured against this same
 * surface, five of the eight light-theme series values sat under 3:1 and one
 * at 1.90:1. A series colour is a filled mark and 3:1 is the bar it was chosen
 * against; a 12px glyph is text and needs 4.5:1. The mistake is worth naming
 * because it sounded like thrift.
 *
 * WHAT IS DELIBERATELY NOT CHECKED HERE, and this is a decision rather than an
 * omission: the colour-blind floor that `series.test.ts` enforces at ΔE 6.
 *
 * The series floor exists because a series colour IS the identity of its mark.
 * Two lines a protanope cannot separate is data destroyed - nothing else on
 * the chart says which is which. Syntax colour is the opposite kind of signal:
 * it restates, in a second channel, information the text already carries in
 * full. A keyword is a keyword by its spelling and its position; a string is
 * delimited by quotes that remain on screen; and CodeBlock renders no colour
 * at all unless a caller passes tokens, which is the proof that none of it is
 * load-bearing.
 *
 * Holding eight hues to ΔE 6 under simulation AND 4.5:1 as text in both themes
 * leaves a set of muddy near-greys - it would cost the readers colour helps in
 * order to protect readers who lose nothing when it is absent. So the floor is
 * not applied, and it says so here, in the file someone would reach for to
 * "fix" the gap.
 */

const themeCss = readFileSync(fileURLToPath(new URL('./theme.css', import.meta.url)), 'utf8')

type Rgb = [number, number, number]

function hexToLinear(hex: string): Rgb {
  const h = hex.replace('#', '')
  const channel = (i: number) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return [channel(0), channel(2), channel(4)]
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(hexToLinear(a)), luminance(hexToLinear(b))].sort((x, y) => y - x) as [
    number,
    number,
  ]
  return (hi + 0.05) / (lo + 0.05)
}

function linearToOklab([r, g, b]: Rgb): [number, number, number] {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** Euclidean distance in OKLab, ×100 - the unit the thresholds here are in,
 * the same one `series.test.ts` uses. */
function deltaE(a: string, b: string): number {
  const [l1, a1, b1] = linearToOklab(hexToLinear(a))
  const [l2, a2, b2] = linearToOklab(hexToLinear(b))
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2) * 100
}

const withoutComments = themeCss.replace(/\/\*[\s\S]*?\*\//g, '')
const mediaStart = withoutComments.indexOf('@media (prefers-color-scheme: light)')
const classStart = withoutComments.indexOf(':root.light')
const darkBlock = withoutComments.slice(0, mediaStart)
/** The light theme inside the media query, and the light theme under the
 * explicit class - two copies of the same declarations, which is what the
 * theme's own note says they must be. */
const lightMediaBlock = withoutComments.slice(mediaStart, classStart)
const lightBlock = withoutComments.slice(classStart)

function statedColor(block: string, token: string): string {
  const match = block.match(new RegExp(`--${token}:\\s*(#[0-9a-f]{6});`, 'i'))
  expect(match, `the theme no longer states a colour for \`--${token}\``).not.toBeNull()
  return match![1]!
}

/*
 * The surface code is drawn on - the WORST one, not the typical one.
 *
 * Both CodeBlock and `.prose pre` put code on `--soft`, which is translucent:
 * it has no colour of its own, it lifts whatever is behind it. So there is no
 * single surface, and the first version of this file wrote one down anyway -
 * `--soft` over `--bg` - and measured against that. It passed, and a live run
 * on the stand found `--syntax-comment` at 4.0:1, because the stand puts the
 * block inside a `--raise` panel and the real composite came out at
 * `rgb(48,44,45)` rather than the assumed `rgb(27,27,31)`.
 *
 * The lesson is not that the numbers were wrong - they were right for the
 * surface named. It is that naming one surface turns an unknown into a
 * constant and then measures the constant. So these are `--soft` over
 * `--raise`: the lightest ground a product legitimately puts a block on, and
 * therefore the hardest case. A slot that clears this clears everywhere.
 *
 * Still written down rather than computed, because `--raise` depends on the
 * product's accent through `--neutral-tint`, so there is no one value to
 * compute. These are the composite MEASURED in a browser on the stand -
 * `rgb(48,44,45)` dark - rounded up, with headroom for an accent that tints
 * `--raise` further than dowel's own amber does.
 *
 * Rounded UP rather than to the measurement, and that is the second half of
 * the lesson. The first correction here moved the surface to a computed
 * `#2b282a`, which was still darker than what the browser actually drew, and
 * `--syntax-comment` came out at 4.49:1 on the real screen while the gate read
 * 4.75 and passed. A gate that is optimistic by a hair fails the same way as
 * one that is optimistic by a lot; it just takes longer to notice.
 */
const surfaces = {
  dark: { block: darkBlock, surface: '#363231' },
  light: { block: lightBlock, surface: '#faf9f8' },
} as const

const themes = Object.entries(surfaces) as [keyof typeof surfaces, (typeof surfaces)[keyof typeof surfaces]][]

/** WCAG AA for body text. The whole reason this palette is not the series
 * palette. */
const TEXT_FLOOR = 4.5

/** Two slots this close are the same colour with extra steps: a reader cannot
 * use the distinction and an editor will not notice breaking it. Well below
 * the series floor on purpose - see the note at the top of this file. */
const DISTINCT_FLOOR = 4

describe('syntax palette', () => {
  it.each(themes)('%s states every syntax slot', (_theme, { block }) => {
    for (const name of syntaxTokens) expect(statedColor(block, name)).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it.each(themes)('%s is legible as text on the surface code sits on', (_theme, { block, surface }) => {
    // The gate this palette exists for. A slot that fails here is code a
    // reader has to lean in for, and it fails silently: the block renders,
    // the colours are "there", and the comment is a grey smear.
    for (const name of syntaxTokens) {
      const color = statedColor(block, name)
      const ratio = contrast(color, surface)
      expect(
        ratio,
        `\`--${name}\` is ${ratio.toFixed(2)}:1 on ${surface}; text needs ${TEXT_FLOOR}:1`,
      ).toBeGreaterThanOrEqual(TEXT_FLOOR)
    }
  })

  it.each(themes)('%s keeps the eight kinds distinguishable from each other', (_theme, { block }) => {
    const colors = syntaxTokens.map((name) => ({ name, value: statedColor(block, name) }))
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const distance = deltaE(colors[i]!.value, colors[j]!.value)
        expect(
          distance,
          `\`--${colors[i]!.name}\` and \`--${colors[j]!.name}\` are ΔE ${distance.toFixed(1)} apart`,
        ).toBeGreaterThanOrEqual(DISTINCT_FLOOR)
      }
    }
  })

  it.each(themes)('%s keeps a syntax colour from being a status colour', (_theme, { block }) => {
    /* Not the ΔE 6 the series are held to - syntax lives inside a `<pre>` and
     * is rarely set beside a badge. What this catches is the collision the
     * first draft actually had: `--syntax-meta` written as the exact value of
     * `--warn`, which is two names for one colour and a trap for whoever edits
     * either of them. */
    for (const name of syntaxTokens) {
      const color = statedColor(block, name)
      for (const status of ['good', 'warn', 'bad', 'info']) {
        const distance = deltaE(color, statedColor(block, status))
        expect(
          distance,
          `\`--${name}\` is ΔE ${distance.toFixed(1)} from \`--${status}\``,
        ).toBeGreaterThan(2)
      }
    }
  })

  it('does not follow the product accent', () => {
    // Fixed, like the series and the heat ramps. Code is not a property of the
    // product showing it, and a `color-mix` over `--accent-base` here would
    // make `if` a different colour in every product of the line.
    for (const name of syntaxTokens) {
      for (const block of [darkBlock, lightBlock]) {
        const declaration = block.match(new RegExp(`--${name}:\\s*([^;]+);`))
        expect(declaration?.[1], `\`--${name}\` is not stated as a plain colour`).toMatch(
          /^#[0-9a-f]{6}$/i,
        )
      }
    }
  })

  it('states the light theme identically in both of its blocks', () => {
    /*
     * The light theme is written twice - once under `@media (prefers-color-
     * scheme: light)` and once under `:root.light` - so a product can pin a
     * theme against the system setting. Patching one copy and not the other is
     * an easy slip, and it happened while these tokens were being added: a
     * reader on a light desktop and a reader who pressed the light button
     * would have seen different greens.
     *
     * `theme.test.ts` already catches that for the whole vocabulary, by
     * comparing the two blocks wholesale. This one is kept beside it because
     * of what it prints: the wholesale check fails with a diff of ninety
     * declarations, and this one names the token.
     */
    for (const name of syntaxTokens) {
      expect(
        statedColor(lightMediaBlock, name),
        `\`--${name}\` differs between the light media query and \`:root.light\``,
      ).toBe(statedColor(lightBlock, name))
    }
  })

  it('reaches Tailwind, so a highlighted token is written in the vocabulary', () => {
    // Without the `--color-` mapping a product would have to write the custom
    // property by hand - which is exactly the raw-colour habit the theme
    // exists to remove.
    for (const name of syntaxTokens) {
      expect(themeCss, `\`${name}\` has no \`--color-\` mapping`).toContain(
        `--color-${name}: var(--${name});`,
      )
    }
  })
})
