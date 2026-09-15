// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Track, TrackScale } from './track'

/*
 * Track.
 *
 * The arithmetic is tested next door, without a DOM. What is tested here is
 * what the component adds: that the numbers reach the style, that the marker
 * and the segments agree about the scale, and that the bar says in words what
 * its colours say in colour.
 */

const day = [
  { key: 'am', start: 0, end: 180, tone: 'accent' as const, label: 'Worked, 3h' },
  { key: 'lunch', start: 180, end: 225, tone: 'idle' as const, label: 'Break, 45m' },
  { key: 'pm', start: 225, end: 480, tone: 'accent' as const, label: 'Worked, 4h 15m' },
]

const styleOf = (node: Element) => (node as HTMLElement).style

describe('what reaches the screen', () => {
  it('positions every segment by percent of its own box', () => {
    /* Percentages of itself, never of a parent. A consumer put a
     * percentage-height chart inside a flex row and every bar resolved to
     * zero: the graph was empty, and no test or API check could see it. */
    const { container } = render(<Track segments={day} label="A working day" />)
    const spans = [...container.querySelectorAll('span')]
    expect(spans).toHaveLength(3)
    expect(styleOf(spans[0]!).left).toBe('0%')
    expect(styleOf(spans[0]!).width).toBe('37.5%')
    expect(styleOf(spans[1]!).left).toBe('37.5%')
  })

  it('gives each segment its tone', () => {
    const { container } = render(<Track segments={day} label="A working day" />)
    const spans = [...container.querySelectorAll('span')]
    expect(spans[0]!.className).toContain('bg-accent')
    expect(spans[1]!.className).toContain('bg-line-2')
  })

  it('can draw every segment exactly to scale, floor and all', () => {
    /* The floor is right for a day of work, where a short break is a fact
     * worth seeing, and wrong wherever the widths are compared to each other:
     * a widened segment is no longer to scale, and a reader measuring by eye
     * would be measuring the floor. */
    const brief = [
      { key: 'a', start: 0, end: 239, tone: 'accent' as const },
      { key: 'blink', start: 239, end: 239.2, tone: 'idle' as const },
    ]
    const floored = render(<Track segments={brief} from={0} to={480} label="With the floor" />)
    const exact = render(
      <Track segments={brief} from={0} to={480} minWidth={0} label="To scale" />,
    )
    const widthOf = (r: ReturnType<typeof render>) =>
      Number.parseFloat(styleOf([...r.container.querySelectorAll('span')][1]!).width)

    // 0.2 of a 480-minute day is 1/24 of a percent: a sliver the floor is
    // fifteen times wider than.
    expect(widthOf(floored)).toBeCloseTo(0.6, 5)
    expect(widthOf(exact)).toBeCloseTo(0.2 / 480 * 100, 5)
  })

  it('draws a bare track when there is nothing to put on it', () => {
    // An empty day is a bar with nothing in it, which is a true picture. What
    // must not happen is the track vanishing, because an absent bar reads as
    // "no such day" rather than "nothing recorded".
    const { container } = render(<Track segments={[]} label="Nothing recorded" />)
    expect(container.firstElementChild).not.toBeNull()
    expect(container.querySelectorAll('span')).toHaveLength(0)
  })
})

describe('the marker', () => {
  it('stands on the same scale as the segments', () => {
    /* The marker resolves against the track's bounds, not against its own
     * reading of the data - otherwise a tier at 78 and a score of 78 land in
     * different places on the same bar. */
    const tiers = [
      { key: 'draft', start: 0, end: 40, tone: 'past' as const },
      { key: 'good', start: 40, end: 78, tone: 'past' as const },
      { key: 'clip', start: 78, end: 100, tone: 'accent' as const },
    ]
    const { container } = render(
      <Track segments={tiers} from={0} to={100} marker={78} label="Score 78, in Clip" divided />,
    )
    const spans = [...container.querySelectorAll('span')]
    const clip = spans.find((s) => styleOf(s).left === '78%')
    const marker = spans.at(-1)!
    expect(clip).toBeDefined()
    expect(styleOf(marker).left).toBe('78%')
  })

  it('reads the marker against the track, not against the data in it', () => {
    /* The case where the two readings differ, and the one the tier example
     * cannot catch because there the bands fill the scale exactly. A day
     * running to 480 whose last segment ends at 300 still has a midpoint at
     * 50% - resolved against the segments instead, the same moment lands at
     * 80% and the marker drifts further along the bar the less of the day has
     * been recorded. */
    const { container } = render(
      <Track
        segments={[{ key: 'am', start: 0, end: 300, tone: 'accent' }]}
        from={0}
        to={480}
        marker={240}
        label="Half way through the day"
      />,
    )
    const marker = [...container.querySelectorAll('span')].at(-1)!
    expect(styleOf(marker).left).toBe('50%')
  })

  it('draws no marker when there is none to draw', () => {
    // A working day has no "you are here".
    const { container } = render(<Track segments={day} label="A working day" />)
    expect(container.querySelectorAll('span')).toHaveLength(3)
  })

  it('draws no marker when it falls outside the track', () => {
    const { container } = render(
      <Track segments={day} from={0} to={480} marker={900} label="A working day" />,
    )
    expect(container.querySelectorAll('span')).toHaveLength(3)
  })
})

describe('the divider between touching segments', () => {
  it('cuts between bands when asked, and not on the first', () => {
    const { container } = render(
      <Track
        segments={[
          { key: 'a', start: 0, end: 50, tone: 'past' },
          { key: 'b', start: 50, end: 100, tone: 'accent' },
        ]}
        from={0}
        to={100}
        label="Two bands"
        divided
      />,
    )
    const spans = [...container.querySelectorAll('span')]
    expect(spans[0]!.className).not.toContain('border-l')
    expect(spans[1]!.className).toContain('border-l')
  })

  it('leaves spans undivided by default', () => {
    /* A gap in the data has to look different from a boundary between two
     * stretches, and a hairline on every segment erases the difference. */
    const { container } = render(<Track segments={day} label="A working day" />)
    for (const span of container.querySelectorAll('span')) {
      expect(span.className).not.toContain('border-l')
    }
  })
})

describe('accessibility', () => {
  it('says in words what the colours say, because a segment announces nothing', () => {
    const { container } = render(<Track segments={day} label="Worked 7h 15m, one break of 45m" />)
    const track = container.firstElementChild!
    expect(track.getAttribute('role')).toBe('img')
    expect(track.getAttribute('aria-label')).toBe('Worked 7h 15m, one break of 45m')
  })

  it('carries each segment its own hover title', () => {
    const { container } = render(<Track segments={day} label="A working day" />)
    const titles = [...container.querySelectorAll('span')].map((s) => s.getAttribute('title'))
    expect(titles).toEqual(['Worked, 3h', 'Break, 45m', 'Worked, 4h 15m'])
  })

  it('passes axe in both shapes, with a scale under one', async () => {
    await expectNoA11yViolations(
      <div>
        <Track segments={day} label="Worked 7h 15m, one break of 45m" />
        <div>
          <Track
            segments={[
              { key: 'draft', start: 0, end: 40, tone: 'past' },
              { key: 'good', start: 40, end: 78, tone: 'accent' },
              { key: 'clip', start: 78, end: 100, tone: 'idle' },
            ]}
            from={0}
            to={100}
            marker={61}
            label="Score 61, in Good, 17 from Clip"
            divided
            size="sm"
          />
          <TrackScale>
            <span>Draft</span>
            <span>Good</span>
            <span>Clip</span>
          </TrackScale>
        </div>
      </div>,
    )
  })
})
