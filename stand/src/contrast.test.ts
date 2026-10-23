// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { contrastFloor, contrastRatio, measure, promisesInForce } from './contrast'

/*
 * The arithmetic behind the stand's contrast report. The measuring itself
 * needs a browser that paints; what can be pinned here is that the numbers it
 * reports are the WCAG numbers, and that the pairs follow the mode on screen.
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

describe('measure', () => {
  it('lays a translucent ground over its surface before it measures', () => {
    // White at half strength over black is mid-grey, not white: measured as
    // if it were opaque, black text on it would read at 21:1.
    const colours: Record<string, [number, number, number, number]> = {
      ink: [0, 0, 0, 1],
      veil: [255, 255, 255, 0.5],
      bg: [0, 0, 0, 1],
    }
    const ratio = measure({ ink: 'ink', ground: 'veil', over: 'bg', kind: 'text', level: 'AA', role: '' }, (t) => colours[t]!)
    expect(ratio).toBeCloseTo(contrastRatio([0, 0, 0], [127.5, 127.5, 127.5]), 5)
  })
})

describe('the pairs in force', () => {
  it('follows the root pin', () => {
    const root = document.documentElement
    root.classList.add('contrast-more')
    const more = promisesInForce(root)
    root.classList.remove('contrast-more')
    const normal = promisesInForce(root)
    expect(more.length).toBeGreaterThan(normal.length)
    expect(more.find((p) => p.ink === 'dim' && p.ground === 'bg')!.level).toBe('AAA')
    expect(normal.find((p) => p.ink === 'dim' && p.ground === 'bg')!.level).toBe('AA')
  })

  it('holds body text to AAA and nothing below the AA floor for its kind', () => {
    for (const promise of promisesInForce()) {
      const floor = contrastFloor(promise)
      if (promise.ink === 'text') expect(floor).toBe(7)
      else expect(floor).toBeGreaterThanOrEqual(promise.kind === 'boundary' ? 3 : 4.5)
    }
  })
})
