import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { scaleTokens, seriesTokens } from './index'

/*
 * The series palette, checked by computation rather than by eye.
 *
 * These eight colours are the one part of the vocabulary that is chosen rather
 * than derived: everything else follows from `--accent-base`, and a series
 * deliberately does not, because a series belongs to the data and not to the
 * product drawing it. Nothing derives them, so nothing catches a bad edit
 * either - and the first draft of this palette had a slot 8 sitting ΔE 1.9
 * from `--bad`, close enough that a series would have read as a verdict. Every
 * structural test passed over it. That is what this file is for.
 *
 * The thresholds are the data-visualisation doctrine's, and they are the
 * reason the palette looks the way it does:
 *
 *   - adjacent slots stay apart under simulated protanopia and deuteranopia,
 *     because those are the pairs a stacked bar or a line chart sets side by
 *     side;
 *   - no slot sits close to a status hue, or a series impersonates a verdict;
 *   - the magnitude scale is monotone, because a ramp that turns back on
 *     itself encodes two different values with one lightness.
 *
 * What is deliberately NOT checked here is the distance from a series to the
 * product accent: 13 of the line's 19 accents sit within ΔE 8 of some slot,
 * and that is accepted rather than fixed. A chart shows one accent and labels
 * its series; hue is never the only thing carrying identity.
 */

const themeCss = readFileSync(fileURLToPath(new URL('./theme.css', import.meta.url)), 'utf8')

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

/*
 * Colour-blind simulation: Machado-Oliveira-Fernandes 2009 at severity 1.0,
 * operating on linear RGB. The model is part of the standard the thresholds
 * come from rather than an implementation detail - a different simulation
 * would need different numbers to mean the same thing.
 */
const CVD: Record<'protan' | 'deutan', number[][]> = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
}

function simulate(rgb: Rgb, kind: keyof typeof CVD): Rgb {
  const m = CVD[kind]!
  return m.map((row) => row[0]! * rgb[0] + row[1]! * rgb[1] + row[2]! * rgb[2]) as Rgb
}

/** Euclidean distance in OKLab, ×100 - the unit every threshold here is in. */
function deltaE(a: Rgb, b: Rgb): number {
  const [l1, a1, b1] = linearToOklab(a)
  const [l2, a2, b2] = linearToOklab(b)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2) * 100
}

/** The worse of protanopia and deuteranopia for a pair. */
function underColourBlindness(x: string, y: string): number {
  const [a, b] = [hexToLinear(x), hexToLinear(y)]
  return Math.min(
    ...(['protan', 'deutan'] as const).map((kind) => deltaE(simulate(a, kind), simulate(b, kind))),
  )
}

/** The dark theme's block, and the light theme's class. Values are read out of
 * the theme rather than repeated here, or this file would be checking numbers
 * that were true the day it was written and silent afterwards. */
const darkBlock = themeCss.slice(0, themeCss.indexOf('@media (prefers-color-scheme: light)'))
const lightBlock = themeCss.slice(themeCss.indexOf(':root.light'))

function statedColor(block: string, token: string): string {
  const match = block.match(new RegExp(`--${token}:\\s*(#[0-9a-f]{6});`, 'i'))
  expect(match, `the theme no longer states a colour for \`--${token}\``).not.toBeNull()
  return match![1]!
}

const themes = [
  ['dark', darkBlock],
  ['light', lightBlock],
] as const

/* The doctrine's numbers. A pair in the 6-8 band is legal only alongside a
 * second channel - a direct label, a gap, a texture - and below 6 nothing
 * rescues it. The normal-vision floor is separate and harder: neighbours have
 * to be easy to tell apart for full-colour readers too. */
const CVD_FLOOR = 6
const NORMAL_FLOOR = 15
const STATUS_FLOOR = 6

describe('series palette', () => {
  it.each(themes)('%s states every series slot', (_theme, block) => {
    for (const name of seriesTokens) expect(statedColor(block, name)).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it.each(themes)('%s keeps adjacent slots apart under colour blindness', (_theme, block) => {
    const colors = seriesTokens.map((name) => statedColor(block, name))
    for (let i = 0; i + 1 < colors.length; i++) {
      const apart = underColourBlindness(colors[i]!, colors[i + 1]!)
      expect(
        apart,
        `slots ${i + 1} and ${i + 2} (${colors[i]} / ${colors[i + 1]}) collapse to ΔE ${apart.toFixed(1)} ` +
          `under protanopia or deuteranopia - and those two are what a stacked bar sets side by side`,
      ).toBeGreaterThanOrEqual(CVD_FLOOR)
    }
  })

  it.each(themes)('%s keeps adjacent slots apart for full-colour readers', (_theme, block) => {
    const colors = seriesTokens.map((name) => statedColor(block, name))
    for (let i = 0; i + 1 < colors.length; i++) {
      const apart = deltaE(hexToLinear(colors[i]!), hexToLinear(colors[i + 1]!))
      expect(
        apart,
        `slots ${i + 1} and ${i + 2} (${colors[i]} / ${colors[i + 1]}) are only ΔE ${apart.toFixed(1)} apart`,
      ).toBeGreaterThanOrEqual(NORMAL_FLOOR)
    }
  })

  it.each(themes)('%s keeps every series clear of every status', (_theme, block) => {
    /* The defect this palette already had: slot 8 was the reference palette's
     * red, ΔE 1.9 from `--bad`. A red series beside a red verdict is the one
     * confusion a chart cannot explain away. Perfect separation of eight
     * series and four statuses in one colour body is not available - the
     * doctrine's own default palette has the same overlaps - so the floor here
     * is what "not mistakable for" costs, not what "unrelated to" would. */
    const statuses = ['good', 'warn', 'bad', 'info'] as const
    for (const name of seriesTokens) {
      const series = statedColor(block, name)
      for (const status of statuses) {
        const fill = statedColor(block, status)
        const apart = deltaE(hexToLinear(series), hexToLinear(fill))
        expect(
          apart,
          `\`--${name}\` (${series}) sits ΔE ${apart.toFixed(1)} from \`--${status}\` (${fill}): ` +
            `a series that close reads as a verdict`,
        ).toBeGreaterThanOrEqual(STATUS_FLOOR)
      }
    }
  })

  it('gives a slot the same meaning in both themes', () => {
    /* The light values are the same eight hues chosen again against the light
     * ground rather than the dark ones lightened - but slot 3 has to stay the
     * green one in both, or a product repaints its chart when the theme
     * changes and the legend from yesterday stops matching. */
    const hue = (hex: string) => {
      const [, a, b] = linearToOklab(hexToLinear(hex))
      return (Math.atan2(b, a) * 180) / Math.PI
    }
    for (const name of seriesTokens) {
      const dark = statedColor(darkBlock, name)
      const light = statedColor(lightBlock, name)
      const apart = Math.abs(((hue(dark) - hue(light) + 540) % 360) - 180)
      expect(apart, `\`--${name}\` is ${dark} in the dark theme and ${light} in the light one`).toBeLessThan(40)
    }
  })
})

describe('magnitude scale', () => {
  it.each(themes)('%s steps monotonically, so the ramp cannot lie', (_theme, block) => {
    const steps = scaleTokens.map((name) => linearToOklab(hexToLinear(statedColor(block, name)))[0])
    const rising = steps.every((l, i) => i === 0 || l > steps[i - 1]!)
    const falling = steps.every((l, i) => i === 0 || l < steps[i - 1]!)
    expect(
      rising || falling,
      `the scale turns back on itself: ${steps.map((l) => l.toFixed(2)).join(' -> ')}. ` +
        `A ramp that is not monotone gives two different magnitudes the same lightness.`,
    ).toBe(true)
  })

  it.each(themes)('%s runs away from its own ground as the value grows', (_theme, block) => {
    /* Dark theme: the ramp lightens, because the ground is dark and "more" has
     * to mean "further from the ground". Light theme: the other way. Getting
     * this backwards is the classic heatmap defect, where the emptiest cells
     * end up the loudest thing on the screen. */
    const first = linearToOklab(hexToLinear(statedColor(block, scaleTokens[0]!)))[0]
    const last = linearToOklab(hexToLinear(statedColor(block, scaleTokens.at(-1)!)))[0]
    expect(
      _theme === 'dark' ? last > first : last < first,
      `the ${_theme} scale runs ${first.toFixed(2)} -> ${last.toFixed(2)}`,
    ).toBe(true)
  })
})
