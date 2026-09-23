import { describe, expect, it } from 'vitest'
import { contrastPairs, contrastRatio } from './contrast'

/*
 * The arithmetic behind the stand's contrast report. The measuring itself
 * needs a browser that paints; what can be pinned here is that the numbers it
 * reports are the WCAG numbers.
 */

describe('contrastRatio', () => {
  it('spans one to twenty-one', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5)
    expect(contrastRatio([119, 119, 119], [119, 119, 119])).toBe(1)
  })

  it('does not care which side is which', () => {
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBe(contrastRatio([0, 0, 0], [255, 255, 255]))
  })

  it('agrees with the published figure for a known pair', () => {
    // #767676 on white is the classic AA edge: 4.54:1.
    expect(contrastRatio([0x76, 0x76, 0x76], [255, 255, 255])).toBeCloseTo(4.54, 2)
  })
})

describe('the pairs', () => {
  it('hold body text to AAA and nothing below the AA floor for its kind', () => {
    for (const pair of contrastPairs) {
      const floor = pair.role === 'body text' ? 7 : pair.role === 'a control against its ground' ? 3 : 4.5
      expect(pair.needs, `${pair.ink} on ${pair.ground}`).toBe(floor)
    }
  })
})
