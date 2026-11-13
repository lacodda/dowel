import { describe, expect, it } from 'vitest'
import {
  composite,
  contrastFloor,
  contrastPromises,
  contrastRatio,
  isLargeText,
  luminance,
  measure,
  promiseName,
  type ContrastPromise,
  type Rgba,
} from './contrast'

/*
 * The sums the contrast gates stand on, held where the mutation run can see
 * them.
 *
 * The gates in `tests/` measure every ink on every ground in a real browser,
 * and Stryker does not run them: a wrong sum here would have been found by
 * those gates and by nothing the mutation run reads, so this module scored
 * nothing. These are the sums, against WCAG's own numbers.
 */

describe('the sums of WCAG 2', () => {
  it('gives black and white their luminance, and a mid grey between', () => {
    expect(luminance([0, 0, 0])).toBe(0)
    expect(luminance([255, 255, 255])).toBeCloseTo(1, 10)
    // The two halves of the sRGB curve meet at 0.04045 of a channel (10.3).
    expect(luminance([10, 10, 10])).toBeCloseTo(10 / 255 / 12.92, 10)
    expect(luminance([11, 11, 11])).toBeCloseTo(((11 / 255 + 0.055) / 1.055) ** 2.4, 10)
    // Green weighs most, blue least.
    expect(luminance([0, 255, 0])).toBeCloseTo(0.7152, 4)
    expect(luminance([255, 0, 0])).toBeCloseTo(0.2126, 4)
    expect(luminance([0, 0, 255])).toBeCloseTo(0.0722, 4)
  })

  it('measures twenty-one to one at the extremes, the same either way round', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 6)
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 6)
    expect(contrastRatio([119, 119, 119], [255, 255, 255])).toBeCloseTo(4.48, 2)
    expect(contrastRatio([90, 90, 90], [90, 90, 90])).toBe(1)
  })

  it('lays a translucent colour over an opaque one as a browser does', () => {
    expect(composite([255, 255, 255, 0.5], [0, 0, 0])).toEqual([127.5, 127.5, 127.5])
    expect(composite([200, 100, 50], [0, 0, 0])).toEqual([200, 100, 50])
    expect(composite([0, 0, 0, 0], [10, 20, 30])).toEqual([10, 20, 30])
    expect(composite([100, 0, 0, 0.25], [0, 200, 0])).toEqual([25, 150, 0])
  })
})

describe('the floor a pair has to clear', () => {
  it('calls 24px large, and 18.66px large only when bold', () => {
    expect(isLargeText({ size: 24, weight: 400 })).toBe(true)
    expect(isLargeText({ size: 23.9, weight: 400 })).toBe(false)
    expect(isLargeText({ size: 18.66, weight: 700 })).toBe(true)
    expect(isLargeText({ size: 18.66, weight: 600 })).toBe(false)
    expect(isLargeText({ size: 18.6, weight: 700 })).toBe(false)
  })

  it('asks 4.5 and 7 of body text, 3 and 4.5 of large, and 3 of a boundary', () => {
    expect(contrastFloor({ kind: 'text', level: 'AA' })).toBe(4.5)
    expect(contrastFloor({ kind: 'text', level: 'AAA' })).toBe(7)
    expect(contrastFloor({ kind: 'text', level: 'AA' }, { size: 24, weight: 400 })).toBe(3)
    expect(contrastFloor({ kind: 'text', level: 'AAA' }, { size: 24, weight: 400 })).toBe(4.5)
    expect(contrastFloor({ kind: 'boundary', level: 'AAA' }, { size: 10, weight: 400 })).toBe(3)
  })
})

describe('what the theme promises', () => {
  const normal = contrastPromises()
  const more = contrastPromises('more')
  const named = (list: ContrastPromise[]) => list.map(promiseName)

  it('promises body text at AAA on every ground, a selected row and a status included', () => {
    const body = normal.filter((promise) => promise.ink === 'text')
    expect(body.every((promise) => promise.level === 'AAA' && promise.kind === 'text')).toBe(true)
    expect(named(body)).toEqual(expect.arrayContaining(['text on bg', 'text on soft over raise', 'text on warn-soft over bg']))
    expect(body).toHaveLength(6 + 10)
  })

  it('raises what more contrast asks for, and leaves the rest', () => {
    const dim = (list: ContrastPromise[]) => list.find((promise) => promise.ink === 'dim')!.level
    expect(dim(normal)).toBe('AA')
    expect(dim(more)).toBe('AAA')
    // Quiet text is promised on tinted grounds only under more contrast.
    expect(named(normal)).not.toContain('faint on accent-soft over bg')
    expect(named(more)).toContain('faint on accent-soft over bg')
    // Boundaries are promised only there.
    expect(normal.some((promise) => promise.kind === 'boundary')).toBe(false)
    expect(named(more)).toEqual(expect.arrayContaining(['line on bg', 'line-2 on soft over raise']))
  })

  it('promises the ink on each fill and each status on its own tint', () => {
    expect(named(normal)).toEqual(
      expect.arrayContaining([
        'on-accent on accent',
        'on-accent on accent-2',
        'on-bad on bad',
        'bg on faint',
        'good on good-soft over raise',
        'accent on accent-soft over bg',
        'accent-2 on raise',
      ]),
    )
    expect(named(normal)).not.toContain('good on bad-soft over raise')
  })

  it('names a pair by its ink, its ground and what the ground lies over', () => {
    expect(promiseName({ ink: 'faint', ground: 'soft', over: 'raise', kind: 'text', level: 'AA', role: '' })).toBe('faint on soft over raise')
    expect(promiseName({ ink: 'text', ground: 'bg', kind: 'text', level: 'AAA', role: '' })).toBe('text on bg')
  })

  it('measures a pair on a translucent ground over its surface, as the screen draws it', () => {
    const colours: Record<string, Rgba> = { text: [255, 255, 255], bg: [0, 0, 0], soft: [255, 255, 255, 0.5], raise: [40, 40, 40] }
    const colour = (token: string) => colours[token]!
    expect(measure({ ink: 'text', ground: 'bg', kind: 'text', level: 'AA', role: '' }, colour)).toBeCloseTo(21, 6)
    // White text on half-white over black: a ground of 127.5 grey.
    const overBg = measure({ ink: 'text', ground: 'soft', over: 'bg', kind: 'text', level: 'AA', role: '' }, colour)
    expect(overBg).toBeCloseTo(contrastRatio([255, 255, 255], [127.5, 127.5, 127.5]), 6)
    const overRaise = measure({ ink: 'text', ground: 'soft', over: 'raise', kind: 'text', level: 'AA', role: '' }, colour)
    expect(overRaise).toBeCloseTo(contrastRatio([255, 255, 255], [147.5, 147.5, 147.5]), 6)
  })
})
