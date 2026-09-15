// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Baseline, BarChart, ChartFrame, type BarDatum } from './bar-chart'

/*
 * BarChart.
 *
 * The tests are about the two things that can be wrong without anything
 * failing: a bar drawn at a height nobody can see, and a gap in the data drawn
 * as a quantity.
 */

const week = (key: string, value: number | null): BarDatum => ({
  key,
  value,
  label: key,
  title: value === null ? `${key}: nothing recorded` : `${key}: ${value} hours`,
})

const bars = [week('w1', 40), week('w2', 32), week('w3', null), week('w4', 8)]

const heights = (container: HTMLElement) =>
  [...container.querySelectorAll('[title]')].map((track) => {
    const fill = track.firstElementChild as HTMLElement | null
    return fill?.style.height ?? null
  })

describe('the height, which is what failed in the wild', () => {
  it('states the plot in pixels rather than inheriting one', () => {
    /* The defect this component exists to prevent, and it cost a patch
     * release: bars drawn as a percentage of a parent that was itself sized
     * from its content resolved to zero, every one of them, and the chart
     * shipped as a row of bare labels. Nothing failed - the owner saw it. */
    const { container } = render(<BarChart bars={bars} label="Four weeks" />)
    const track = container.querySelector('[title]') as HTMLElement
    expect(track.className).toContain('h-[var(--plot)]')
    expect(container.firstElementChild!.className).toMatch(/--plot:\d+px/)
  })

  it('gives the tallest bar the whole plot and the rest their share', () => {
    const { container } = render(<BarChart bars={bars} label="Four weeks" />)
    const [first, second] = heights(container)
    expect(first).toBe('100%')
    expect(second).toBe('80%')
  })

  it('measures against a stated ceiling, so two charts compare', () => {
    // Left to itself every chart has a full-height bar, which is exactly what
    // makes two of them incomparable.
    const { container } = render(<BarChart bars={bars} max={80} label="Four weeks" />)
    expect(heights(container)[0]).toBe('50%')
  })

  it('keeps a very short bar visible rather than rounding it away', () => {
    /* A twenty-minute week against a forty-hour one is half a percent. Drawn
     * to scale it is not there, and a period that was recorded would look like
     * one that was not. */
    const { container } = render(
      <BarChart bars={[week('w1', 40), week('w2', 0.2)]} label="Two weeks" />,
    )
    const short = heights(container)[1]!
    expect(Number.parseFloat(short)).toBeGreaterThanOrEqual(3)
  })

  it('draws a row of floors rather than nothing when every value is zero', () => {
    // Dividing by a ceiling of zero is the obvious trap; the less obvious one
    // is drawing nothing at all, which reads as a chart that failed.
    const { container } = render(
      <BarChart bars={[week('w1', 0), week('w2', 0)]} label="Two empty weeks" />,
    )
    for (const height of heights(container)) {
      expect(Number.parseFloat(height!)).toBeGreaterThan(0)
    }
  })
})

describe('an absent period, which is not a short one', () => {
  it('keeps its place in the row', () => {
    /* Dropping it would close the gap up and turn an absence into continuity -
     * the one thing a trend must not do. */
    const { container } = render(<BarChart bars={bars} label="Four weeks" />)
    expect(container.querySelectorAll('[title]')).toHaveLength(4)
  })

  it('is drawn as a mark of its own, not as a bar of no height', () => {
    // A zero-height bar is indistinguishable from a bar that did not render.
    const { container } = render(<BarChart bars={bars} label="Four weeks" />)
    const gap = [...container.querySelectorAll('[title]')].find((track) =>
      track.getAttribute('title')?.includes('nothing recorded'),
    )!
    const mark = gap.firstElementChild as HTMLElement
    expect(mark.style.height).toBe('')
    expect(mark.className).toContain('border-t')
  })

  it('tells a recorded zero from an absent period', () => {
    // Zero recorded is an answer; nothing recorded is the absence of one.
    const { container } = render(
      <BarChart bars={[week('w1', 0), week('w2', null)]} label="Two weeks" />,
    )
    const [zero, absent] = [...container.querySelectorAll('[title]')].map(
      (track) => track.firstElementChild as HTMLElement,
    )
    expect(zero!.style.height).not.toBe('')
    expect(absent!.style.height).toBe('')
  })
})

describe('what is said in words', () => {
  it('names the chart as a whole', () => {
    const { container } = render(<BarChart bars={bars} label="Four weeks of work" />)
    const chart = container.firstElementChild!
    expect(chart.getAttribute('role')).toBe('img')
    expect(chart.getAttribute('aria-label')).toBe('Four weeks of work')
  })

  it('gives every column its own sentence, gaps included', () => {
    // A rectangle announces nothing, and a gap needs saying most of all.
    const { container } = render(<BarChart bars={bars} label="Four weeks" />)
    const titles = [...container.querySelectorAll('[title]')].map((n) => n.getAttribute('title'))
    expect(titles).toEqual([
      'w1: 40 hours',
      'w2: 32 hours',
      'w3: nothing recorded',
      'w4: 8 hours',
    ])
  })

  it('keeps a long label from pushing the column out of shape', () => {
    const { container } = render(
      <BarChart bars={[{ ...week('w1', 40), label: 'a label far wider than its column' }]} label="One week" />,
    )
    const caption = container.querySelector('span')!
    expect(caption.className).toContain('truncate')
  })
})

describe('the baseline', () => {
  it('sits proportionally on the same scale as the bars', () => {
    const { container } = render(<Baseline value={20} max={40}>median 20h</Baseline>)
    expect((container.firstElementChild as HTMLElement).style.bottom).toBe('50%')
  })

  it('is a solid hairline, because a dash means something else', () => {
    /* A dashed rule reads as "projected" or "threshold" when it is neither -
     * the doctrine is explicit that grid and axis lines are solid. */
    const { container } = render(<Baseline value={20} max={40} />)
    const rule = container.querySelector('.h-px')!
    expect(rule.className).not.toContain('dashed')
  })

  it('draws nothing when it falls outside the plot', () => {
    // Clamped to the top it would claim the median is the tallest week.
    expect(render(<Baseline value={80} max={40} />).container.firstElementChild).toBeNull()
    expect(render(<Baseline value={-1} max={40} />).container.firstElementChild).toBeNull()
    expect(render(<Baseline value={1} max={0} />).container.firstElementChild).toBeNull()
  })
})

describe('the frame the two share', () => {
  it('establishes the positioning context the baseline needs', () => {
    /* Left to the caller this is a `relative` remembered or forgotten, and
     * forgotten it puts the rule at the bottom of the page rather than on the
     * plot. */
    const { container } = render(<ChartFrame>{null}</ChartFrame>)
    expect(container.firstElementChild!.className).toContain('relative')
  })

  it('keeps a gutter for the baseline label by default', () => {
    // Without it the label sits on top of the last columns: it is drawn
    // outside the plot, so the plot has to end before it starts.
    const { container } = render(<ChartFrame>{null}</ChartFrame>)
    expect(container.firstElementChild!.className).toContain('pr-16')
  })

  it('gives the gutter up for a chart with no baseline', () => {
    const { container } = render(<ChartFrame gutter={false}>{null}</ChartFrame>)
    expect(container.firstElementChild!.className).not.toContain('pr-16')
  })
})

describe('accessibility', () => {
  it('passes axe with gaps, a zero and a baseline', async () => {
    await expectNoA11yViolations(
      <ChartFrame>
        <BarChart
          bars={[...bars, week('w5', 0)]}
          max={48}
          label="Five weeks of work, one with nothing recorded"
        />
        <Baseline value={24} max={48}>
          median 24h
        </Baseline>
      </ChartFrame>,
    )
  })
})
