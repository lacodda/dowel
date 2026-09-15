// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Sparkline } from './sparkline'

/*
 * Sparkline.
 *
 * The tests are about the geometry, because that is the part that can be
 * quietly wrong: a line still looks like a line when it is drawn against the
 * wrong ceiling, plotted in the wrong direction, or squeezed by a viewBox that
 * does not match the element. None of those throw.
 */

/** The `L`/`M` points of the path, as numbers.
 *
 * The sign is part of the pattern, and it has to be: a coordinate that has
 * gone negative is a point drawn outside the box, which is exactly what the
 * overshoot test is looking for. Matching `[\d.]+` alone reads `-8` as `8` and
 * reports a point safely inside the frame - the test then passes over a line
 * that has left it. */
function pointsOf(container: HTMLElement): [number, number][] {
  const d = container.querySelector('path')!.getAttribute('d')!
  return [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])])
}

function dotOf(container: HTMLElement) {
  const circle = container.querySelector('circle')!
  return { x: Number(circle.getAttribute('cx')), y: Number(circle.getAttribute('cy')) }
}

describe('what it refuses to draw', () => {
  it.each([
    ['no points', []],
    ['one point', [7]],
  ])('draws nothing for %s', (_name, values) => {
    // One point has no direction, and a line through it would be a statement
    // about a history there is none of.
    const { container } = render(<Sparkline values={values} label="Trend" />)
    expect(container.querySelector('svg')).toBeNull()
  })
})

describe('the geometry, which is where a line lies without breaking', () => {
  it('matches the viewBox to the size the element is shown at', () => {
    /* The reason `size` is a variant rather than a class. A viewBox wider than
     * the element scales x and y by different factors: the line bends away
     * from the data and the end dot stretches into a wedge. */
    const { container } = render(<Sparkline values={[1, 2]} label="Trend" size="sm" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('viewBox')).toBe('0 0 52 16')
    expect(svg.getAttribute('class')).toContain('h-4')
    expect(svg.getAttribute('class')).toContain('w-[52px]')
  })

  it('puts a larger value higher up, because SVG grows downward', () => {
    // Getting this backwards draws every history upside down, and it still
    // looks like a perfectly good line.
    const { container } = render(<Sparkline values={[10, 90]} label="Trend" max={100} />)
    const [first, last] = pointsOf(container)
    expect(last![1]).toBeLessThan(first![1])
  })

  it('spaces the points evenly across the width', () => {
    const { container } = render(<Sparkline values={[1, 2, 3, 4, 5]} label="Trend" max={5} />)
    const xs = pointsOf(container).map(([x]) => x)
    const gaps = xs.slice(1).map((x, i) => Number((x - xs[i]!).toFixed(2)))
    expect(new Set(gaps).size).toBe(1)
  })

  it('draws a point for every value, in the order given', () => {
    const { container } = render(<Sparkline values={[3, 1, 4, 1, 5]} label="Trend" max={5} />)
    expect(pointsOf(container)).toHaveLength(5)
  })

  it('scales against the stated ceiling rather than its own range', () => {
    /* The whole reason `max` exists. Self-scaled, 61 → 63 climbs the entire
     * box and reads as a transformation; against a ceiling of 100 it is the
     * small change it was. */
    const stated = render(<Sparkline values={[61, 63]} label="Trend" max={100} />)
    const [firstStated, lastStated] = pointsOf(stated.container)
    const climbStated = firstStated![1] - lastStated![1]

    const selfScaled = render(<Sparkline values={[61, 63]} label="Trend" />)
    const [firstSelf, lastSelf] = pointsOf(selfScaled.container)
    const climbSelf = firstSelf![1] - lastSelf![1]

    expect(climbStated).toBeLessThan(climbSelf)
    expect(climbStated).toBeLessThan(2)
  })

  it('never draws outside the box when a value overshoots the ceiling', () => {
    /* A score above its stated scale is the caller's problem to notice, but it
     * must not become a line leaving the frame. */
    const { container } = render(<Sparkline values={[10, 150]} label="Trend" max={100} />)
    const ys = pointsOf(container).map(([, y]) => y)
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...ys)).toBeLessThanOrEqual(28)
  })

  it('draws a flat line of zeroes along the bottom rather than dividing by zero', () => {
    const { container } = render(<Sparkline values={[0, 0, 0]} label="Trend" />)
    const ys = pointsOf(container).map(([, y]) => y)
    expect(ys.every(Number.isFinite)).toBe(true)
    expect(new Set(ys).size).toBe(1)
  })

  it('marks the newest point, which is the one the eye is looking for', () => {
    const { container } = render(<Sparkline values={[1, 5, 3]} label="Trend" max={5} />)
    const last = pointsOf(container).at(-1)!
    const dot = dotOf(container)
    expect([dot.x, dot.y]).toEqual([last[0], last[1]])
  })
})

describe('the tone, which must not become a verdict on its own', () => {
  it('draws the line muted by default, and the dot in the accent', () => {
    /* The donor coloured the line green when it ended higher and red when it
     * ended lower - a claim the component cannot support, because for
     * time-to-answer down is the good direction. The dot carries the accent so
     * the eye still finds "now" without the line saying what it means. */
    const { container } = render(<Sparkline values={[5, 1]} label="Trend" max={5} />)
    expect(container.querySelector('path')!.getAttribute('class')).toContain('stroke-dim')
    expect(container.querySelector('circle')!.getAttribute('class')).toContain('fill-accent')
  })

  it('does not read the direction off the values', () => {
    // Up and down have to come out identical: the component never infers.
    const up = render(<Sparkline values={[1, 5]} label="Trend" max={5} />)
    const down = render(<Sparkline values={[5, 1]} label="Trend" max={5} />)
    expect(up.container.querySelector('path')!.getAttribute('class')).toBe(
      down.container.querySelector('path')!.getAttribute('class'),
    )
  })

  it.each([
    ['accent', 'stroke-accent', 'fill-accent'],
    ['good', 'stroke-good', 'fill-good'],
    ['bad', 'stroke-bad', 'fill-bad'],
  ] as const)('lets a caller who knows say so: %s', (tone, line, dot) => {
    const { container } = render(<Sparkline values={[1, 5]} label="Trend" max={5} tone={tone} />)
    expect(container.querySelector('path')!.getAttribute('class')).toContain(line)
    expect(container.querySelector('circle')!.getAttribute('class')).toContain(dot)
  })
})

describe('accessibility', () => {
  it('carries its meaning in words, because the shape is unavailable to some readers', () => {
    const { container } = render(
      <Sparkline values={[61, 74, 82]} label="Score, 61 to 82 over three versions" max={100} />,
    )
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('role')).toBe('img')
    expect(svg.getAttribute('aria-label')).toBe('Score, 61 to 82 over three versions')
  })

  it('passes axe at both sizes', async () => {
    await expectNoA11yViolations(
      <div>
        <Sparkline values={[61, 74, 82]} label="Score over three versions" max={100} />
        <Sparkline values={[3, 2, 4]} label="Craft over three versions" max={5} size="sm" />
      </div>,
    )
  })
})
