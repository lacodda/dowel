// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { LineChart } from './line-chart'
import type { Point } from './line-scale'

/*
 * LineChart.
 *
 * The arithmetic is tested next door. What is tested here is that it reaches
 * the screen: the plot has a real height, a hole is two paths and not one, and
 * the axis says where the floor is.
 */

const at = (n: number, value: number | null): Point => ({ at: n, value })
const balance = [at(0, 4900), at(1, 5050), at(2, 4980), at(3, 5100)]

const paths = (container: HTMLElement) => [...container.querySelectorAll('path')]

describe('the plot, which has to have a height of its own', () => {
  it('states it in pixels rather than inheriting one', () => {
    /* The same defect that cost the consumer a patch release on its bar
     * chart: a percentage against a parent sized from its content resolves to
     * zero, and the chart disappears without failing. */
    const { container } = render(<LineChart points={balance} label="A balance" />)
    expect(container.firstElementChild!.className).toMatch(/--plot:\d+px/)
    expect(container.querySelector('.h-\\[var\\(--plot\\)\\]')).not.toBeNull()
  })

  it('draws the line at a stroke that does not stretch with the box', () => {
    /* The viewBox is 100x100 with `preserveAspectRatio="none"`, so x and y
     * scale by different factors. Without `non-scaling-stroke` the line would
     * be thick one way and thin the other. */
    const { container } = render(<LineChart points={balance} label="A balance" />)
    expect(paths(container)[0]!.getAttribute('vector-effect')).toBe('non-scaling-stroke')
  })
})

describe('a hole, which is where a line lies most easily', () => {
  const holed = [at(0, 10), at(1, 20), at(2, null), at(3, 40)]

  it('breaks the line into two, rather than drawing through it', () => {
    const { container } = render(<LineChart points={holed} label="With a gap" />)
    expect(paths(container)).toHaveLength(2)
  })

  it('leaves the later readings where they belong', () => {
    // Closing the gap up would shift them left and make the axis lie about
    // when things happened.
    const { container } = render(<LineChart points={holed} label="With a gap" />)
    const second = paths(container)[1]!.getAttribute('d')!
    expect(second).toMatch(/^M100\.00 /)
  })

  it('draws a bare plot when nothing was measured at all', () => {
    /* Not a chart of zeroes, and not nothing: an empty plot with its axis is
     * the honest drawing, and the words beside it say why. */
    const { container } = render(
      <LineChart points={[at(0, null), at(1, null)]} label="Nothing recorded" />,
    )
    expect(paths(container)).toHaveLength(0)
    expect(container.querySelector('.h-\\[var\\(--plot\\)\\]')).not.toBeNull()
  })
})

describe('the axis, which is what keeps a floating floor honest', () => {
  it('labels the ticks, so the bottom of the plot is never a mystery', () => {
    /* The line does not start at zero by default - a balance between 4,900 and
     * 5,100 would flatten - and that is only safe because the reader can see
     * where the floor is. */
    const { container } = render(<LineChart points={balance} label="A balance" />)
    const labels = [...container.querySelectorAll('span')].map((n) => n.textContent)
    expect(labels.length).toBeGreaterThan(0)
    expect(labels.some((text) => Number(text) >= 4900)).toBe(true)
  })

  it('draws the rules solid, because a dash means something else', () => {
    const { container } = render(<LineChart points={balance} label="A balance" />)
    const rule = container.querySelector('.h-px')!
    expect(rule.className).not.toContain('dashed')
  })

  it('formats a tick when the caller knows what the number is', () => {
    const { container } = render(
      <LineChart points={balance} label="A balance" formatTick={(v) => `$${v}`} />,
    )
    const labels = [...container.querySelectorAll('span')].map((n) => n.textContent)
    expect(labels.every((text) => text!.startsWith('$'))).toBe(true)
  })

  it('keeps the tick labels out of the plot, so the line cannot cross them out', () => {
    /* Drawn inside the plot they sit on top of whatever the series is doing
     * there. Found by looking at the stand, with `$5,200` struck through by
     * its own line. */
    const { container } = render(<LineChart points={balance} label="A balance" />)
    expect(container.firstElementChild!.className).toContain('pr-12')
    const label = container.querySelector('span')!
    expect(label.className).toContain('left-full')
  })

  it('gives the gutter up when there are no ticks to put in it', () => {
    const { container } = render(<LineChart points={balance} label="A balance" ticks={0} />)
    expect(container.firstElementChild!.className).not.toContain('pr-12')
  })

  it('draws no ticks when asked for none', () => {
    const { container } = render(<LineChart points={balance} label="A balance" ticks={0} />)
    expect(container.querySelectorAll('span')).toHaveLength(0)
  })

  it('takes a stated floor, for a count where zero is the truth', () => {
    const { container } = render(
      <LineChart points={[at(0, 40), at(1, 60)]} bounds={{ min: 0 }} label="Requests" />,
    )
    const labels = [...container.querySelectorAll('span')].map((n) => Number(n.textContent))
    expect(Math.min(...labels)).toBe(0)
  })
})

describe('what is said in words', () => {
  it('names the chart, because the drawing says nothing to a screen reader', () => {
    const { container } = render(<LineChart points={balance} label="Balance over four weeks" />)
    const chart = container.firstElementChild!
    expect(chart.getAttribute('role')).toBe('img')
    expect(chart.getAttribute('aria-label')).toBe('Balance over four weeks')
  })

  it('hides the drawing itself from the reader who has the label', () => {
    // Otherwise axe finds an unnamed graphic inside a named one.
    const { container } = render(<LineChart points={balance} label="A balance" />)
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true')
  })

  it('carries the footer the caller brings, and no axis of its own', () => {
    /* Two or three labels, not one per point: the axis is not a place for a
     * list, and the caller knows what its readings are called. */
    const { container } = render(
      <LineChart
        points={balance}
        label="A balance"
        footer={
          <>
            <span>1 Jun</span>
            <span>22 Jun</span>
          </>
        }
      />,
    )
    expect(container.textContent).toContain('1 Jun')
    expect(container.textContent).toContain('22 Jun')
  })
})

describe('accessibility', () => {
  it('passes axe with ticks, a gap and a footer', async () => {
    await expectNoA11yViolations(
      <LineChart
        points={[...balance, at(4, null), at(5, 5200)]}
        label="Balance over six weeks, one not measured"
        formatTick={(v) => `$${v.toLocaleString('en')}`}
        footer={
          <>
            <span>1 Jun</span>
            <span>6 Jul</span>
          </>
        }
      />,
    )
  })
})
