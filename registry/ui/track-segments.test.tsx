import { describe, expect, it } from 'vitest'
import { markerAt, MIN_SEGMENT_WIDTH, place } from './track-segments'

/*
 * The arithmetic, tested without a DOM.
 *
 * Everything that can be quietly wrong about a track is in here: a segment
 * placed against the wrong bounds still draws, a sliver rounded to nothing
 * still leaves a bar that looks complete, and two segments overlapping look
 * like one wide one. None of it throws.
 */

describe('placing segments on the track', () => {
  it('reads the scale from the segments when no bounds are given', () => {
    const [first, last] = place([
      { start: 10, end: 20 },
      { start: 20, end: 30 },
    ])
    expect(first).toMatchObject({ left: 0, width: 50 })
    expect(last).toMatchObject({ left: 50, width: 50 })
  })

  it('reads it against stated bounds when they are given', () => {
    /* The two donors differ here and both are right: a working day is read
     * against itself, a set of tiers against the whole 0-100 scale. */
    const [only] = place([{ start: 40, end: 60 }], { from: 0, to: 100 })
    expect(only).toMatchObject({ left: 40, width: 20 })
  })

  it('keeps a gap between segments as a gap', () => {
    // The track shows through: a break in the data is not the same as two
    // stretches meeting, and a layout that closed the gap would say it was.
    const [first, second] = place([
      { start: 0, end: 10 },
      { start: 30, end: 40 },
    ], { from: 0, to: 40 })
    expect(first!.left + first!.width).toBeLessThan(second!.left)
  })

  it('draws nothing when the track has no span', () => {
    // Every segment would sit at the same place with the same width, which is
    // a drawing of nothing rather than a drawing of an empty day.
    expect(place([{ start: 5, end: 5 }])).toEqual([])
    expect(place([{ start: 0, end: 10 }], { from: 7, to: 7 })).toEqual([])
    expect(place([{ start: 0, end: 10 }], { from: 10, to: 0 })).toEqual([])
  })

  it('draws nothing for no segments', () => {
    expect(place([])).toEqual([])
  })
})

describe('the floor under a segment, which is what makes this worth having once', () => {
  it('widens a sliver to something visible, and says that it did', () => {
    /* A ten-second pause in an eight-hour day is 0.03% of the track: real,
     * measured, and rounding to no pixels at all. */
    const [only] = place([{ start: 0, end: 3 }], { from: 0, to: 10_000 })
    expect(only!.width).toBe(MIN_SEGMENT_WIDTH)
    expect(only!.widened).toBe(true)
  })

  it('leaves a segment that is already wide enough exactly to scale', () => {
    const [only] = place([{ start: 0, end: 50 }], { from: 0, to: 100 })
    expect(only!.width).toBe(50)
    expect(only!.widened).toBe(false)
  })

  it('widens a sliver that touches its neighbours, which is the shape both donors have', () => {
    /* The case the first version of this could not do, and the tests did not
     * catch: capping a sliver at "where the next segment starts" means a
     * segment with no gap after it can never grow. Work, break, work is
     * contiguous; so are tiers. The floor did nothing for either of them. */
    const placed = place([
      { start: 0, end: 239 },
      { start: 239, end: 239.2 },
      { start: 239.2, end: 480 },
    ], { from: 0, to: 480 })

    expect(placed[1]!.width).toBeCloseTo(MIN_SEGMENT_WIDTH, 6)
    expect(placed[1]!.widened).toBe(true)
  })

  it('keeps the bar inside its own track when a sliver pushes the rest along', () => {
    const placed = place([
      { start: 0, end: 239 },
      { start: 239, end: 239.2 },
      { start: 239.2, end: 480 },
    ], { from: 0, to: 480 })
    const end = placed.at(-1)!

    expect(end.left + end.width).toBeCloseTo(100, 6)
  })

  it('leaves no seam where segments used to touch', () => {
    // Paying the debt back moves segments left; done carelessly it opens a gap
    // between two stretches that were flush, and a gap means something here.
    const placed = place([
      { start: 0, end: 239 },
      { start: 239, end: 239.2 },
      { start: 239.2, end: 480 },
    ], { from: 0, to: 480 })

    for (let i = 0; i + 1 < placed.length; i++) {
      expect(placed[i]!.left + placed[i]!.width).toBeCloseTo(placed[i + 1]!.left, 6)
    }
  })

  it('grows into empty track without charging anyone for it', () => {
    /* A sliver with nothing after it is not overflowing: it grows into room
     * nobody was using, and the other segments keep their exact widths. */
    const placed = place([
      { start: 0, end: 10 },
      { start: 50, end: 50.1 },
    ], { from: 0, to: 100 })

    expect(placed[0]!.width).toBe(10)
    expect(placed[1]!.width).toBeCloseTo(MIN_SEGMENT_WIDTH, 6)
  })

  it('never widens one segment over the next', () => {
    /* The subtlety the donors did not have to face, because their short
     * segments were always separated by long ones. Two brief pauses close
     * together both hit the floor, and widening each in isolation draws them
     * overlapping - which reads as one wide stretch, a worse lie than a
     * stretch drawn slightly too wide. */
    const [first, second] = place([
      { start: 1000, end: 1001 },
      { start: 1003, end: 1004 },
    ], { from: 0, to: 10_000 })
    expect(first!.left + first!.width).toBeLessThanOrEqual(second!.left)
  })

  it('holds the last segment inside the track', () => {
    const [only] = place([{ start: 9_999, end: 10_000 }], { from: 0, to: 10_000 })
    expect(only!.left + only!.width).toBeLessThanOrEqual(100)
  })

  it('can be turned off, for a caller who wants everything to scale', () => {
    const [only] = place([{ start: 0, end: 3 }], { from: 0, to: 10_000, minWidth: 0 })
    expect(only!.width).toBeCloseTo(0.03, 5)
    expect(only!.widened).toBe(false)
  })
})

describe('input the caller got wrong', () => {
  it('clamps a segment reaching past the end rather than drawing outside', () => {
    const [only] = place([{ start: 50, end: 500 }], { from: 0, to: 100 })
    expect(only!.left + only!.width).toBeLessThanOrEqual(100)
  })

  it('clamps a segment starting before the beginning', () => {
    const [only] = place([{ start: -50, end: 20 }], { from: 0, to: 100 })
    expect(only!.left).toBe(0)
    expect(only!.width).toBe(20)
  })

  it('treats a backwards segment as empty rather than as a negative width', () => {
    // A negative width is a fill drawn to the left of where it starts, which
    // is not something any caller meant.
    const [only] = place([{ start: 60, end: 40 }], { from: 0, to: 100 })
    expect(only!.width).toBeGreaterThanOrEqual(0)
  })
})

describe('the marker', () => {
  it('sits proportionally along the stated scale', () => {
    expect(markerAt(78, 0, 100)).toBe(78)
    expect(markerAt(5, 0, 10)).toBe(50)
  })

  it('is absent when it falls outside the track, rather than pinned to the edge', () => {
    /* A marker clamped to the end says "here, at the very end", which is a
     * different statement from "not on this track at all". */
    expect(markerAt(120, 0, 100)).toBeNull()
    expect(markerAt(-1, 0, 100)).toBeNull()
  })

  it('is absent when the track has no span', () => {
    expect(markerAt(5, 5, 5)).toBeNull()
  })
})
