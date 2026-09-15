// @vitest-environment jsdom
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { ActivityHeatmap } from './activity-heatmap'
import type { Cell } from './activity-weeks'

/*
 * ActivityHeatmap.
 *
 * The layout arithmetic is tested next door, without a DOM. What is tested
 * here is the part that turns a fact into a colour: that the four meanings of
 * a cell stay four, that a step reaches the fill it names, and that nothing in
 * the grid is available only as a colour.
 */

const range = { from: '2026-09-07', to: '2026-09-20' } as const
const describe_ = (cell: Cell) =>
  cell.kind === 'value' ? `${cell.date}: ${cell.value} hours` : `${cell.date}: ${cell.kind}`

const grid = (props: Partial<Parameters<typeof ActivityHeatmap>[0]> = {}) =>
  render(
    <ActivityHeatmap
      entries={[
        { date: '2026-09-07', value: 8 },
        { date: '2026-09-08', value: 2 },
        { date: '2026-09-09', value: null },
      ]}
      label="A fortnight of work"
      describe={describe_}
      {...range}
      {...props}
    />,
  )

const cells = (container: HTMLElement) => [...container.querySelectorAll('span[title]')]

describe('the four meanings, which must stay four on the screen', () => {
  it('fills a value from the heat ramp', () => {
    const { container } = grid()
    const busiest = cells(container).find((cell) => cell.getAttribute('title')?.includes('8 hours'))
    expect(busiest!.className).toContain('bg-heat-5')
  })

  it('leaves nothing recorded as the bare square, not the faintest step', () => {
    /* The confusion the whole component is built against: the palest shade of
     * a value and the absence of one have to be different things, or the grid
     * reports work on a day nobody reported. */
    const { container } = grid()
    const empty = cells(container).find((cell) => cell.getAttribute('title')?.includes('2026-09-10'))
    expect(empty!.className).toContain('bg-soft')
    expect(empty!.className).not.toMatch(/bg-heat-/)
  })

  it('outlines something under way rather than shading it', () => {
    // No total yet, so any fill would be a figure the caller never gave.
    const { container } = grid()
    const open = cells(container).find((cell) => cell.getAttribute('title')?.includes('partial'))
    expect(open!.className).toContain('border-dashed')
    expect(open!.className).not.toMatch(/bg-heat-/)
  })

  it('draws a padding square as neither data nor a gap in it', () => {
    /* A column has to be seven tall. The squares that make it so are dates the
     * caller never asked about, and drawing them like empty days would add
     * days to the question. */
    const { container } = grid({ from: '2026-09-09', to: '2026-09-09' })
    const outside = cells(container).filter((cell) => cell.getAttribute('title')?.includes('outside'))
    expect(outside).toHaveLength(6)
    for (const cell of outside) expect(cell.className).toContain('bg-softer/40')
  })

  it('tells a measured zero from a day with no entry', () => {
    // Zero measured is an answer; no entry is the absence of one. Only the
    // caller knows which, and they said so by sending an entry.
    const { container } = grid({ entries: [{ date: '2026-09-07', value: 0 }] })
    const zero = cells(container).find((cell) => cell.getAttribute('title')?.includes('0 hours'))
    expect(zero!.className).toContain('bg-heat-1')
  })
})

describe('the steps', () => {
  it.each([
    [10, 'bg-heat-1'],
    [30, 'bg-heat-2'],
    [50, 'bg-heat-3'],
    [70, 'bg-heat-4'],
    [90, 'bg-heat-5'],
  ])('paints %d against a ceiling of 100 with %s', (value, fill) => {
    const { container } = grid({
      entries: [{ date: '2026-09-07', value }],
      busiest: 100,
    })
    const cell = cells(container).find((node) => node.getAttribute('title')?.includes(`${value} hours`))
    expect(cell!.className).toContain(fill)
  })

  it('measures against the stated ceiling, so two grids compare', () => {
    /* Scaled to itself a quiet fortnight and a heavy one each get their own
     * darkest square, which is the one thing a heatmap is for. */
    const stated = grid({ entries: [{ date: '2026-09-07', value: 2 }], busiest: 100 })
    const alone = grid({ entries: [{ date: '2026-09-07', value: 2 }] })
    const fillOf = (r: ReturnType<typeof render>) =>
      cells(r.container).find((c) => c.getAttribute('title')?.includes('2 hours'))!.className

    expect(fillOf(stated)).toContain('bg-heat-1')
    expect(fillOf(alone)).toContain('bg-heat-5')
  })
})

describe('what is said in words, because a shade says nothing', () => {
  it('names the grid as a whole', () => {
    const { container } = grid()
    const image = container.querySelector('[role="img"]')!
    expect(image.getAttribute('aria-label')).toBe('A fortnight of work')
  })

  it('gives every square its own sentence, padding included', () => {
    // A reader hovering any square should find a date, never a blank.
    const { container } = grid()
    for (const cell of cells(container)) {
      expect(cell.getAttribute('title')).toMatch(/^\d{4}-\d{2}-\d{2}: /)
    }
  })

  it('leaves the weekday column out entirely rather than inventing names', () => {
    /* A weekday name is a word in a language this component cannot pick, so
     * there is no default - the caller passes the labels or gets none. */
    const { container } = grid()
    expect(container.querySelector('[aria-hidden]')).toBeNull()
  })

  it('draws the weekday column when the caller brings the words', () => {
    const { container } = grid({ weekdayLabel: (day) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][day] })
    const labels = container.querySelector('[aria-hidden]')
    expect(labels).not.toBeNull()
    expect(labels!.textContent).toBe('MTWTFSS')
  })
})

describe('accessibility', () => {
  it('passes axe with a legend and a weekday column', async () => {
    await expectNoA11yViolations(
      <div>
        <ActivityHeatmap
          entries={[
            { date: '2026-09-07', value: 8 },
            { date: '2026-09-08', value: 2 },
            { date: '2026-09-09', value: null },
          ]}
          from="2026-09-07"
          to="2026-10-04"
          label="Four weeks of work, busiest day 8 hours"
          describe={describe_}
          weekdayLabel={(day) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][day]}
          size="sm"
        />
      </div>,
    )
  })
})
