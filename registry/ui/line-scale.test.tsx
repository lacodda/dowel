import { describe, expect, it } from 'vitest'
import { boundsOf, pathOf, runs, ticksFor, yOf, type Point } from './line-scale'

/*
 * The arithmetic, without a DOM.
 *
 * A line lies quietly: drawn through a hole it invents a reading, drawn over a
 * zero-based axis it flattens the change it exists to show, and ticked at
 * 4,950 it gives the reader nothing to hold on to. None of it throws.
 */

const at = (n: number, value: number | null): Point => ({ at: n, value })

describe('the bounds', () => {
  it('reads the range from the points when nothing is stated', () => {
    const bounds = boundsOf([at(0, 10), at(1, 30)])
    expect(bounds).toMatchObject({ from: 0, to: 1, min: 10, max: 30 })
  })

  it('does not force the floor to zero, which would flatten the shape', () => {
    /* A bar's length IS the quantity, so its baseline must be zero. A line's
     * job is the shape of a change, and a balance moving 4,900 to 5,100 on a
     * zero-based axis is a horizontal rule - the very thing the reader opened
     * the chart to see, erased. The axis labels are what keep it honest. */
    const bounds = boundsOf([at(0, 4900), at(1, 5100)])
    expect(bounds!.min).toBe(4900)
  })

  it('takes a stated floor, for a count where zero is the truth', () => {
    const bounds = boundsOf([at(0, 4900), at(1, 5100)], { min: 0 })
    expect(bounds!.min).toBe(0)
  })

  it('gives a flat series a band rather than a division by zero', () => {
    // Every point at the same value has no range to scale against: the line
    // would land at NaN, or all at one y by accident.
    const bounds = boundsOf([at(0, 50), at(1, 50), at(2, 50)])!
    expect(bounds.max).toBeGreaterThan(bounds.min)
    expect(yOf(50, bounds)).toBeCloseTo(50, 5)
  })

  it('gives a flat series of zeroes a band too', () => {
    const bounds = boundsOf([at(0, 0), at(1, 0)])!
    expect(bounds.max).toBeGreaterThan(bounds.min)
    expect(Number.isFinite(yOf(0, bounds)!)).toBe(true)
  })

  it('has no bounds for a series with nothing in it', () => {
    expect(boundsOf([])).toBeNull()
    expect(boundsOf([at(0, null), at(1, null)])).toBeNull()
  })
})

describe('a hole in the series, which is where a line lies most easily', () => {
  const holed = [at(0, 10), at(1, 20), at(2, null), at(3, 40), at(4, 50)]
  const bounds = { from: 0, to: 4, min: 0, max: 50 }

  it('breaks the line rather than drawing through the hole', () => {
    // Interpolating across invents a reading nobody took.
    expect(runs(holed, bounds)).toHaveLength(2)
  })

  it('leaves every other point where it belongs', () => {
    /* Dropping the hole would close the line up and shift every later reading
     * left - a chart saying the value was 40 in March when it was 40 in April. */
    const [, second] = runs(holed, bounds)
    expect(second![0]!.at).toBe(3)
    expect(second![0]!.x).toBe(75)
  })

  it('keeps a lone reading between two holes', () => {
    // It has no line, but it has a dot, and dropping it hides a measurement.
    const lonely = runs([at(0, null), at(1, 20), at(2, null)], bounds)
    expect(lonely).toHaveLength(1)
    expect(lonely[0]).toHaveLength(1)
  })

  it('draws nothing at all for a series that is only holes', () => {
    expect(runs([at(0, null), at(1, null)], bounds)).toEqual([])
  })
})

describe('where a point lands', () => {
  const bounds = { from: 0, to: 10, min: 0, max: 100 }

  it('puts a larger value higher up, because SVG grows downward', () => {
    const [run] = runs([at(0, 10), at(10, 90)], bounds)
    expect(run![1]!.y).toBeLessThan(run![0]!.y)
  })

  it('spreads points by their position, not by their order', () => {
    /* Readings are rarely evenly spaced - a gap of a week between two of them
     * has to show as a gap, or the chart redraws the calendar. */
    const [run] = runs([at(0, 50), at(1, 50), at(10, 50)], bounds)
    expect(run!.map((point) => point.x)).toEqual([0, 10, 100])
  })

  it('clamps a value outside the stated bounds instead of drawing past the edge', () => {
    const [run] = runs([at(0, 150), at(10, -50)], bounds)
    expect(run![0]!.y).toBe(0)
    expect(run![1]!.y).toBe(100)
  })

  it('keeps the reading itself unclamped, so a label can say the real figure', () => {
    const [run] = runs([at(0, 150)], bounds)
    expect(run![0]!.value).toBe(150)
  })

  it('draws straight segments rather than a curve', () => {
    /* A spline through measured points overshoots between them, inventing
     * highs and lows nobody recorded - the same lie as interpolating across a
     * gap, drawn more prettily. */
    const [run] = runs([at(0, 10), at(5, 90), at(10, 10)], bounds)
    const path = pathOf(run!)
    expect(path).toMatch(/^M[\d.]+ [\d.]+ L/)
    expect(path).not.toMatch(/[CQSTA]/)
  })
})

describe('the ticks, which have to be recognisable at a glance', () => {
  it('lands on round numbers rather than cutting the range in equal parts', () => {
    /* The example has to be a range where the two answers differ. 4,900 to
     * 5,100 in four parts gives a step of exactly 50, which is also the round
     * step - a tidy-looking case that proves nothing, and a first draft of
     * this test used it. 0 to 37 separates them: equal parts give 9.25, round
     * numbers give 10. */
    const ticks = ticksFor({ from: 0, to: 1, min: 0, max: 37 })
    expect(ticks).toEqual([0, 10, 20, 30])

    // And the landmark case itself, now that roundness is established.
    expect(ticksFor({ from: 0, to: 1, min: 4900, max: 5100 })).toEqual([4900, 4950, 5000, 5050, 5100])
  })

  it('uses a 1, 2, 5 or 10 step, whatever the range', () => {
    for (const [min, max] of [
      [0, 10],
      [0, 37],
      [0, 8000],
      [0, 0.4],
    ] as const) {
      const ticks = ticksFor({ from: 0, to: 1, min, max })
      const step = ticks.length > 1 ? ticks[1]! - ticks[0]! : 0
      const mantissa = step / 10 ** Math.floor(Math.log10(step))
      expect([1, 2, 5, 10], `step ${step} for ${min}..${max}`).toContain(Math.round(mantissa))
    }
  })

  it('stays inside the plot', () => {
    const bounds = { from: 0, to: 1, min: 12, max: 88 }
    for (const tick of ticksFor(bounds)) {
      expect(tick).toBeGreaterThanOrEqual(bounds.min)
      expect(tick).toBeLessThanOrEqual(bounds.max)
    }
  })

  it('does not leave floating-point dust in a label', () => {
    // 0.1 + 0.2 territory: a tick reading 0.30000000000000004 is worse than
    // no tick at all.
    for (const tick of ticksFor({ from: 0, to: 1, min: 0, max: 1 })) {
      expect(String(tick).length).toBeLessThan(6)
    }
  })

  it('offers none for a range too narrow to hold a round number', () => {
    expect(ticksFor({ from: 0, to: 1, min: 5, max: 5 })).toEqual([])
  })
})

describe('placing a value on the axis', () => {
  const bounds = { from: 0, to: 1, min: 0, max: 100 }

  it('measures from the top, as the plot does', () => {
    expect(yOf(100, bounds)).toBe(0)
    expect(yOf(0, bounds)).toBe(100)
    expect(yOf(25, bounds)).toBe(75)
  })

  it('is absent outside the plot rather than pinned to an edge', () => {
    // Clamped, a threshold of 200 would sit on the ceiling and read as though
    // the series had reached it.
    expect(yOf(200, bounds)).toBeNull()
    expect(yOf(-1, bounds)).toBeNull()
  })
})
