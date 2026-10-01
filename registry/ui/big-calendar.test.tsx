// @vitest-environment jsdom
import { useState, type DragEvent } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { BigCalendar, LINE_GAP, LINE_HEIGHT, dayOf, foldDay, linesThatFit, type BigCalendarProps } from './big-calendar'
import { BigCalendarItem } from './big-calendar-item'

/*
 * BigCalendar.
 *
 * Most of what can go wrong with a month view is quiet: a day that grows and
 * pushes the last week off the screen, a count that says "2 more" over a day
 * showing everything, a keyboard that walks off the edge of the month into
 * nothing, a click on a release that also books the day under it. These tests
 * are about those.
 *
 * jsdom lays nothing out, so a day is assumed to have room for three lines
 * until something measures it; the measuring itself is tested with a stand-in
 * ResizeObserver and a day given a height.
 */

/* Today, pinned inside the month the tests look at. Only `Date` is faked -
 * user-event waits on real timers. */
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 9, 12))
})
afterEach(() => vi.useRealTimers())

const busy: Record<string, string[]> = {
  '2026-09-02': ['Clip'],
  '2026-09-14': ['Clip', 'Single', 'Short', 'Teaser', 'Live'],
  '2026-08-31': ['Premiere'],
}

function Example(props: Partial<BigCalendarProps> & { onOpen?: (title: string) => void }) {
  const { onOpen, ...rest } = props
  return (
    <BigCalendar
      month="2026-09-01"
      locale="en-GB"
      moreLabel={(count) => `${count} more`}
      fewerLabel="Show fewer"
      renderDay={(date) =>
        (busy[date] ?? []).map((title) => (
          <BigCalendarItem key={title} onClick={() => onOpen?.(title)}>
            {title}
          </BigCalendarItem>
        ))
      }
      {...(rest as object)}
    />
  )
}

const day = (date: string) => document.querySelector<HTMLElement>(`[data-day="${date}"]`)!

describe('BigCalendar', () => {
  it('draws only the weeks the month touches', () => {
    // September 2026 from Monday: 31 August to 4 October, five rows - not the
    // six a date picker keeps, which would add a week of October.
    render(<Example />)
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(6) // the weekday names, and five weeks
    expect(day('2026-08-31')).not.toBeNull()
    expect(day('2026-10-04')).not.toBeNull()
    expect(day('2026-10-05')).toBeNull()
  })

  it('starts the week where the locale does', () => {
    const { unmount } = render(<Example locale="en-US" />)
    expect(screen.getAllByRole('columnheader')[0]!.textContent).toBe('Sun')
    unmount()
    // A product that wants Monday whatever the region says so in the tag,
    // and a date picker beside the month agrees with it.
    render(<Example locale="en-US-u-fw-mon" />)
    expect(screen.getAllByRole('columnheader')[0]!.textContent).toBe('Mon')
  })

  it('names the grid by its month unless told otherwise', () => {
    const { rerender } = render(<Example />)
    expect(screen.getByRole('grid', { name: 'September 2026' })).toBeDefined()
    rerender(<Example aria-label="Releases" />)
    expect(screen.getByRole('grid', { name: 'Releases' })).toBeDefined()
  })

  it('names every day in full', () => {
    // "14" on its own is not a date to anything reading the page aloud.
    render(<Example />)
    expect(day('2026-09-14').textContent).toMatch(/Monday,? 14 September 2026/)
  })

  it('marks today, and the days of the neighbouring months', () => {
    render(<Example />)
    expect(day('2026-09-09').getAttribute('aria-current')).toBe('date')
    expect(day('2026-09-10').getAttribute('aria-current')).toBeNull()
    expect(day('2026-08-31').hasAttribute('data-outside')).toBe(true)
    expect(day('2026-09-01').hasAttribute('data-outside')).toBe(false)
  })

  it('draws what a neighbouring day holds too', () => {
    // A real day on a quieter ground, not a blank: a release can sit on the
    // 31st of August on the September page.
    render(<Example />)
    expect(within(day('2026-08-31')).getByText('Premiere')).toBeDefined()
  })

  it('folds what a day has no room for into a count', () => {
    // Three lines of room: two items and the count, never three items and a
    // count cut off at the foot of the day.
    render(<Example />)
    const busiest = within(day('2026-09-14'))
    expect(busiest.getByText('Clip')).toBeDefined()
    expect(busiest.getByText('Single')).toBeDefined()
    expect(busiest.queryByText('Short')).toBeNull()
    expect(busiest.getByRole('button', { name: '3 more' })).toBeDefined()
    // A day that fits says nothing.
    expect(within(day('2026-09-02')).queryByRole('button', { name: /more/ })).toBeNull()
  })

  it('opens a folded day in place, one at a time', async () => {
    const user = userEvent.setup()
    busy['2026-09-15'] = ['A', 'B', 'C', 'D']
    try {
      render(<Example />)
      await user.click(within(day('2026-09-14')).getByRole('button', { name: '3 more' }))
      expect(within(day('2026-09-14')).getByText('Live')).toBeDefined()
      expect(within(day('2026-09-14')).getByRole('group', { name: /^Monday,? 14 September 2026$/ })).toBeDefined()

      await user.click(within(day('2026-09-15')).getByRole('button', { name: '2 more' }))
      expect(within(day('2026-09-15')).getByText('D')).toBeDefined()
      expect(within(day('2026-09-14')).queryByText('Live')).toBeNull()

      await user.click(within(day('2026-09-15')).getByRole('button', { name: 'Show fewer' }))
      expect(within(day('2026-09-15')).queryByText('D')).toBeNull()
      // Focus is not dropped on the floor with the button that went away.
      expect(document.activeElement).toBe(day('2026-09-15'))
    } finally {
      delete busy['2026-09-15']
    }
  })

  it('folds an open day again on Escape, from inside it', async () => {
    const user = userEvent.setup()
    render(<Example />)
    await user.click(within(day('2026-09-14')).getByRole('button', { name: '3 more' }))
    within(day('2026-09-14')).getByRole('button', { name: 'Live' }).focus()
    await user.keyboard('{Escape}')
    expect(within(day('2026-09-14')).queryByText('Live')).toBeNull()
    expect(document.activeElement).toBe(day('2026-09-14'))
  })

  it('measures the room a day has and shows as many lines as fit', () => {
    /* The wiring, not the sum: a stand-in observer is fired after a day has
     * been given a height, and the day must show more lines than it did. Cut
     * the observer out of the component and this stays at three. */
    let fire = () => {}
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          fire = callback
        }
        observe() {}
        disconnect() {}
      },
    )
    const height = Object.getOwnPropertyDescriptor(Element.prototype, 'clientHeight')
    Object.defineProperty(Element.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return (this as Element).hasAttribute('data-day-lines') ? 5 * LINE_HEIGHT + 4 * LINE_GAP : 0
      },
    })
    try {
      render(<Example />)
      expect(within(day('2026-09-14')).queryByText('Live')).toBeNull()
      act(() => fire())
      expect(within(day('2026-09-14')).getByText('Live')).toBeDefined()
      expect(within(day('2026-09-14')).queryByRole('button', { name: /more/ })).toBeNull()
    } finally {
      if (height) Object.defineProperty(Element.prototype, 'clientHeight', height)
      vi.unstubAllGlobals()
    }
  })

  it('is one tab stop, on today', () => {
    render(<Example />)
    const stops = screen.getAllByRole('gridcell').filter((cell) => cell.tabIndex === 0)
    expect(stops).toEqual([day('2026-09-09')])
  })

  it('keeps the lines of every day but the cursor’s out of the tab order', async () => {
    /* A month holding forty releases is not forty tab stops. Tab from the day
     * goes into it and then out of the month; the arrows are how the other
     * days are reached. */
    const user = userEvent.setup()
    render(
      <>
        <Example />
        <button type="button">After</button>
      </>,
    )
    const lines = screen.getAllByRole('button').filter((button) => button.closest('[data-day]'))
    expect(lines.length).toBeGreaterThan(0)
    expect(lines.every((button) => button.tabIndex === -1)).toBe(true)

    await user.tab()
    expect(document.activeElement).toBe(day('2026-09-09'))
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}')
    expect(document.activeElement).toBe(day('2026-09-14'))
    // Now the 14th's lines, its count, and then out.
    await user.tab()
    expect(document.activeElement?.textContent).toBe('Clip')
    await user.tab()
    expect(document.activeElement?.textContent).toBe('Single')
    await user.tab()
    expect(document.activeElement?.textContent).toBe('3 more')
    await user.tab()
    expect(document.activeElement?.textContent).toBe('After')
  })

  it('moves the cursor to a day whose line is clicked', async () => {
    // Otherwise the next Tab would start from a day the reader has left.
    const user = userEvent.setup()
    render(<Example />)
    await user.click(within(day('2026-09-14')).getByRole('button', { name: 'Clip' }))
    expect(day('2026-09-14').tabIndex).toBe(0)
    expect(day('2026-09-09').tabIndex).toBe(-1)
    expect(within(day('2026-09-14')).getByRole('button', { name: 'Clip' }).tabIndex).toBe(0)
  })

  it('walks the days with the arrows, and turns the month off the edge', async () => {
    const user = userEvent.setup()
    const onMonthChange = vi.fn()
    function Host() {
      const [month, setMonth] = useState('2026-09-01')
      return (
        <Example
          month={month}
          onMonthChange={(next) => {
            onMonthChange(next)
            setMonth(next)
          }}
        />
      )
    }
    render(<Host />)
    await user.tab()
    expect(document.activeElement).toBe(day('2026-09-09'))

    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(day('2026-09-10'))
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(document.activeElement).toBe(day('2026-10-01'))
    // Still on the September page: the first of October is drawn on it.
    expect(onMonthChange).not.toHaveBeenCalled()

    await user.keyboard('{ArrowDown}')
    expect(onMonthChange).toHaveBeenCalledWith('2026-10-08')
    expect(document.activeElement).toBe(day('2026-10-08'))
    expect(screen.getByRole('grid', { name: 'October 2026' })).toBeDefined()

    await user.keyboard('{PageUp}')
    expect(onMonthChange).toHaveBeenLastCalledWith('2026-09-08')
    expect(document.activeElement).toBe(day('2026-09-08'))
  })

  it('stops at the edge when the month is not the product’s to turn', async () => {
    const user = userEvent.setup()
    render(<Example />)
    await user.tab()
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')
    expect(document.activeElement).toBe(day('2026-09-30'))
  })

  it('presses the day with Enter, and not when the key is pressed on a line inside it', async () => {
    const user = userEvent.setup()
    const onDaySelect = vi.fn()
    const onOpen = vi.fn()
    render(<Example onDaySelect={onDaySelect} onOpen={onOpen} />)
    await user.tab()
    await user.keyboard('{Enter}')
    expect(onDaySelect).toHaveBeenCalledWith('2026-09-09')

    onDaySelect.mockClear()
    within(day('2026-09-14')).getByRole('button', { name: 'Clip' }).focus()
    await user.keyboard('{Enter}')
    expect(onOpen).toHaveBeenCalledWith('Clip')
    expect(onDaySelect).not.toHaveBeenCalled()
  })

  it('presses the day on its ground, and not through a line or a control in it', async () => {
    /* The product's chip opens a release; the day under it books one. A
     * click that did both would book the day every time a release was opened -
     * which is why kilna's chip stopped the event, and why no product should
     * have to. */
    const user = userEvent.setup()
    const onDaySelect = vi.fn()
    const onOpen = vi.fn()
    render(<Example onDaySelect={onDaySelect} onOpen={onOpen} onAddDay={() => {}} addDayLabel="Add" />)

    await user.click(day('2026-09-03'))
    expect(onDaySelect).toHaveBeenCalledWith('2026-09-03')

    onDaySelect.mockClear()
    await user.click(within(day('2026-09-14')).getByRole('button', { name: 'Clip' }))
    await user.click(within(day('2026-09-14')).getByRole('button', { name: '3 more' }))
    await user.click(within(day('2026-09-03')).getByRole('button', { name: 'Add' }))
    expect(onOpen).toHaveBeenCalledWith('Clip')
    expect(onDaySelect).not.toHaveBeenCalled()
  })

  it('adds on a day through its plus, named by the product', async () => {
    const user = userEvent.setup()
    const onAddDay = vi.fn()
    render(<Example onAddDay={onAddDay} addDayLabel="Add a release on this day" />)
    await user.click(within(day('2026-09-21')).getByRole('button', { name: 'Add a release on this day' }))
    expect(onAddDay).toHaveBeenCalledWith('2026-09-21')
  })

  it('lets Tab reach the plus of the day the keyboard is on, and no other', async () => {
    // Thirty-five plus signs in the tab order is not a month, it is a chore.
    const user = userEvent.setup()
    const onAddDay = vi.fn()
    render(<Example onAddDay={onAddDay} addDayLabel="Add" />)
    const pluses = screen.getAllByRole('button', { name: 'Add' }).filter((button) => button.tabIndex === 0)
    expect(pluses).toEqual([within(day('2026-09-09')).getByRole('button', { name: 'Add' })])

    await user.tab()
    await user.tab()
    expect(document.activeElement).toBe(pluses[0])
    await user.keyboard('{Enter}')
    expect(onAddDay).toHaveBeenCalledWith('2026-09-09')
  })

  it('lights the day something would land on, and says what landing means there only', () => {
    render(<Example dropTarget="2026-09-14" dropHint="Already holds five" />)
    expect(day('2026-09-14').hasAttribute('data-drop-target')).toBe(true)
    expect(day('2026-09-14').className).toContain('bg-accent-soft')
    expect(within(day('2026-09-14')).getByText('Already holds five')).toBeDefined()
    expect(day('2026-09-15').hasAttribute('data-drop-target')).toBe(false)
    expect(screen.getAllByText('Already holds five')).toHaveLength(1)
  })

  it('hands a drop to the product with the day it landed on', () => {
    /* The handlers go on the calendar, not on forty-two cells, and the day is
     * read back from the element: the same path an HTML drop and a pointer
     * drag both take. */
    const onDrop = vi.fn((event: DragEvent) => dayOf(event.target))
    render(<Example onDrop={onDrop} />)
    fireEvent.drop(within(day('2026-09-21')).getByText('21'))
    expect(onDrop).toHaveReturnedWith('2026-09-21')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Example dropTarget="2026-09-14" dropHint="Here" onAddDay={() => {}} addDayLabel="Add" />)
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe, folded and with every control it can carry', async () => {
    await expectNoA11yViolations(
      <Example onAddDay={() => {}} addDayLabel="Add" onDaySelect={() => {}} dropTarget="2026-09-02" dropHint="Here" />,
    )
  })

  it('passes axe with a day open', async () => {
    const user = userEvent.setup()
    const { container } = await expectNoA11yViolations(<Example />)
    await user.click(within(day('2026-09-14')).getByRole('button', { name: '3 more' }))
    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    })
    expect(results.violations.map((violation) => violation.id)).toEqual([])
  })
})

describe('the sums a day is folded by', () => {
  it('fits lines at a pitch of twenty-four, the last one needing no gap after it', () => {
    expect(LINE_HEIGHT + LINE_GAP).toBe(24)
    expect(linesThatFit(3 * LINE_HEIGHT + 2 * LINE_GAP)).toBe(3)
    expect(linesThatFit(3 * LINE_HEIGHT + 2 * LINE_GAP - 1)).toBe(2)
    expect(linesThatFit(LINE_HEIGHT)).toBe(1)
    expect(linesThatFit(LINE_HEIGHT - 1)).toBe(0)
  })

  it('fits nothing in no room, or in a height that is not one', () => {
    for (const height of [0, -10, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(linesThatFit(height)).toBe(0)
    }
  })

  it('gives the count a line of its own', () => {
    expect(foldDay(3, 3)).toEqual({ shown: 3, more: 0 })
    expect(foldDay(4, 3)).toEqual({ shown: 2, more: 2 })
    expect(foldDay(5, 1)).toEqual({ shown: 0, more: 5 })
    expect(foldDay(5, 0)).toEqual({ shown: 0, more: 5 })
  })

  it('never shows more than it has, nor hides any', () => {
    for (let count = 0; count < 12; count += 1) {
      for (let lines = 0; lines < 8; lines += 1) {
        const { shown, more } = foldDay(count, lines)
        expect(shown + more).toBe(count)
        // Whatever is drawn - the lines and the count's own line - fits.
        if (lines > 0) expect(shown + (more > 0 ? 1 : 0)).toBeLessThanOrEqual(lines)
      }
    }
  })

  it('draws an item exactly one line tall', () => {
    // The sum is only exact while the item is the line it assumes.
    render(<BigCalendarItem>Clip</BigCalendarItem>)
    expect(screen.getByText('Clip').parentElement!.className).toMatch(/(^|\s)h-5(\s|$)/)
    expect(LINE_HEIGHT).toBe(5 * 4)
  })

  it('finds the day an element is in', () => {
    render(<Example />)
    expect(dayOf(within(day('2026-09-14')).getByText('Clip'))).toBe('2026-09-14')
    expect(dayOf(screen.getByRole('grid'))).toBeNull()
    expect(dayOf(null)).toBeNull()
  })
})
