// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Calendar } from './calendar'
import {
  addDays,
  addMonths,
  daysInMonth,
  isIsoDate,
  monthGrid,
  today,
  weekday,
} from './calendar-math'

/*
 * Calendar.
 *
 * The arithmetic is tested directly, and most of it is about the days that
 * break naive date code: the end of a month, the end of a year, February in a
 * leap year, and the century rule that gets left out of the leap rule.
 *
 * Building this rather than taking a library is the decision these tests have
 * to earn - so the cases a library would already have passed are the ones
 * written down.
 */

afterEach(() => {
  vi.useRealTimers()
})

describe('days in a month', () => {
  it('knows the short ones', () => {
    expect(daysInMonth(2026, 4)).toBe(30)
    expect(daysInMonth(2026, 1)).toBe(31)
  })

  it('knows February in an ordinary year and a leap year', () => {
    expect(daysInMonth(2026, 2)).toBe(28)
    expect(daysInMonth(2024, 2)).toBe(29)
  })

  it('applies the century rule, which is the half that gets left out', () => {
    // Divisible by 100 is not a leap year; divisible by 400 is. 1900 had 28
    // days in February and a great deal of software disagreed.
    expect(daysInMonth(1900, 2)).toBe(28)
    expect(daysInMonth(2000, 2)).toBe(29)
  })
})

describe('what counts as a date', () => {
  it('takes a real one', () => {
    expect(isIsoDate('2026-09-02')).toBe(true)
  })

  it.each(['2026-9-2', '02-09-2026', '2026/09/02', 'today', '', '2026-09'])(
    'refuses %s',
    (value) => {
      expect(isIsoDate(value)).toBe(false)
    },
  )

  it('refuses a day that does not exist', () => {
    // Parses arithmetically and is not a day. A naive check on the shape
    // alone lets this through and it becomes 3 March somewhere downstream.
    expect(isIsoDate('2026-02-31')).toBe(false)
    expect(isIsoDate('2026-04-31')).toBe(false)
    expect(isIsoDate('2026-13-01')).toBe(false)
  })

  it('takes 29 February only in a leap year', () => {
    expect(isIsoDate('2024-02-29')).toBe(true)
    expect(isIsoDate('2026-02-29')).toBe(false)
  })
})

describe('adding days', () => {
  it('moves within a month', () => {
    expect(addDays('2026-09-02', 5)).toBe('2026-09-07')
    expect(addDays('2026-09-07', -5)).toBe('2026-09-02')
  })

  it('crosses a month end', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30')
  })

  it('crosses a year end', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
  })

  it('crosses February in a leap year', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2024-02-29', 1)).toBe('2024-03-01')
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
  })
})

describe('adding months', () => {
  it('keeps the day where it exists', () => {
    expect(addMonths('2026-09-02', 1)).toBe('2026-10-02')
    expect(addMonths('2026-09-02', -1)).toBe('2026-08-02')
  })

  it('clamps where the day does not exist in the new month', () => {
    // A step back from 31 March lands on 28 February, not on 3 March - which
    // is what the arithmetic does if it is left to overflow.
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28')
    expect(addMonths('2024-03-31', -1)).toBe('2024-02-29')
    expect(addMonths('2026-05-31', 1)).toBe('2026-06-30')
  })

  it('crosses a year in either direction', () => {
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-15')
    expect(addMonths('2026-01-15', -13)).toBe('2024-12-15')
  })
})

describe('which day of the week', () => {
  it('numbers Monday 1 and Sunday 7, as Intl does', () => {
    // `Date` numbers Sunday 0, which neither sorts nor matches what
    // `getWeekInfo` returns.
    expect(weekday('2026-09-07')).toBe(1)
    expect(weekday('2026-09-13')).toBe(7)
  })
})

describe('the month grid', () => {
  it('is six whole weeks, so the height never changes', () => {
    const grid = monthGrid('2026-09-01', 'en-GB')
    expect(grid).toHaveLength(6)
    for (const week of grid) expect(week).toHaveLength(7)
  })

  it('starts on the locale first day', () => {
    // Monday here, Sunday in the United States - the one thing a calendar
    // cannot hard-code.
    expect(weekday(monthGrid('2026-09-01', 'en-GB')[0]![0]!)).toBe(1)
    expect(weekday(monthGrid('2026-09-01', 'en-US')[0]![0]!)).toBe(7)
  })

  it('runs without a gap', () => {
    const days = monthGrid('2026-09-01', 'en-GB').flat()
    for (let i = 1; i < days.length; i += 1) {
      expect(days[i]).toBe(addDays(days[i - 1]!, 1))
    }
  })

  it('contains every day of the month it is for', () => {
    const days = new Set(monthGrid('2026-02-01', 'en-GB').flat())
    for (let day = 1; day <= 28; day += 1) {
      expect(days.has(`2026-02-${String(day).padStart(2, '0')}`)).toBe(true)
    }
  })
})

describe('today', () => {
  it('is the local day, not the UTC one', () => {
    /* `new Date().toISOString().slice(0, 10)` is the common spelling and is
     * wrong: it converts to UTC first, so late in the evening east of
     * Greenwich it returns tomorrow. Pinned to 23:30 local to catch it. */
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 2, 23, 30))
    expect(today()).toBe('2026-09-02')
  })
})

function Example(props: Partial<React.ComponentProps<typeof Calendar>> = {}) {
  return (
    <Calendar
      month="2026-09-01"
      locale="en-GB"
      aria-label="Choose a date"
      previousMonthLabel="Previous month"
      nextMonthLabel="Next month"
      {...props}
    />
  )
}

describe('the grid on screen', () => {
  it('is one control, not forty-two tab stops', () => {
    const { container } = render(<Example value="2026-09-14" />)
    const stops = Array.from(container.querySelectorAll('[role="grid"] [tabindex="0"]'))
    expect(stops.map((day) => day.getAttribute('aria-label'))).toEqual(['14 September 2026'])
    // The grid itself is not a stop: the focus is on a day, where a screen
    // reader can say which one.
    expect(screen.getByRole('grid').hasAttribute('tabindex')).toBe(false)
  })

  it('keeps a tab stop on a month the cursor has left', () => {
    // Paged by the buttons to a month with neither the cursor nor the chosen
    // day in it, the grid still has a way in: the first of that month.
    const { container } = render(<Example month="2026-11-01" value="2026-09-14" />)
    const stops = Array.from(container.querySelectorAll('[role="grid"] [tabindex="0"]'))
    expect(stops.map((day) => day.getAttribute('aria-label'))).toEqual(['1 November 2026'])
  })

  it('takes the cursor with the focus, onto the day itself', async () => {
    const user = userEvent.setup()
    render(<Example value="2026-09-14" />)
    screen.getByRole('button', { name: /^14 September 2026/ }).focus()
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^15 September 2026/ }))
    expect(document.activeElement?.getAttribute('tabindex')).toBe('0')
    expect(screen.getByRole('button', { name: /^14 September 2026/ }).getAttribute('tabindex')).toBe('-1')
  })

  it('names every day in full, not by its number', () => {
    // "14" is not a date to anything reading the page aloud.
    render(<Example value="2026-09-14" />)
    expect(screen.getByRole('button', { name: /^14 September 2026/ })).toBeDefined()
  })

  it('chooses a day when it is clicked', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Example onValueChange={onValueChange} />)

    await user.click(screen.getByRole('button', { name: /^14 September 2026/ }))
    expect(onValueChange).toHaveBeenCalledWith('2026-09-14')
  })

  it('moves a cursor with the arrows without choosing anything', async () => {
    /* The distinction that keeps a product from saving five dates on the way
     * to the sixth: arrows move, Enter chooses. */
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Example value="2026-09-14" onValueChange={onValueChange} />)

    // The cursor's day is focused directly: the first Tab lands on the
    // month-paging button, which comes before it in the DOM. What is under
    // test is the grid's keyboard, not the tab order around it.
    screen.getByRole('button', { name: /^14 September 2026/ }).focus()
    await user.keyboard('{ArrowRight}{ArrowDown}')
    expect(onValueChange).not.toHaveBeenCalled()

    await user.keyboard('{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('2026-09-22')
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  it('chooses with Space as well as Enter, once each', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Example value="2026-09-14" onValueChange={onValueChange} />)
    screen.getByRole('button', { name: /^14 September 2026/ }).focus()
    await user.keyboard('{ArrowLeft} ')
    expect(onValueChange.mock.calls).toEqual([['2026-09-13']])
  })

  it('pages the month when the cursor leaves it', async () => {
    const user = userEvent.setup()
    const onMonthChange = vi.fn()
    render(<Example value="2026-09-30" onMonthChange={onMonthChange} />)

    screen.getByRole('button', { name: /^30 September 2026/ }).focus()
    await user.keyboard('{ArrowRight}')
    expect(onMonthChange).toHaveBeenCalledWith('2026-10-01')
  })

  it('pages by month with the buttons', async () => {
    const user = userEvent.setup()
    const onMonthChange = vi.fn()
    render(<Example onMonthChange={onMonthChange} />)

    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(onMonthChange).toHaveBeenCalledWith('2026-10-01')
  })

  it('refuses a day outside its bounds', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { container } = render(
      <Example min="2026-09-10" max="2026-09-20" onValueChange={onValueChange} />,
    )

    const day = (label: string) =>
      Array.from(container.querySelectorAll('[role="gridcell"] button')).find((button) =>
        button.getAttribute('aria-label')?.startsWith(label),
      ) as HTMLButtonElement

    // Said, not enforced by the element: a `disabled` button cannot take the
    // focus, and the cursor has to be able to stand on it.
    expect(day('2 September').getAttribute('aria-disabled')).toBe('true')
    expect(day('2 September').disabled).toBe(false)
    await user.click(day('2 September'))
    expect(onValueChange).not.toHaveBeenCalled()
    day('2 September').focus()
    await user.keyboard('{Enter} ')
    expect(onValueChange).not.toHaveBeenCalled()

    await user.click(day('15 September'))
    expect(onValueChange).toHaveBeenCalledWith('2026-09-15')
  })

  it('marks today', () => {
    // The clock is pinned before the render: `today()` is read while the grid
    // is built, so setting it afterwards changes nothing.
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 2, 12))

    const { container } = render(<Example />)
    const marked = Array.from(container.querySelectorAll('button[aria-current="date"]')).map(
      (button) => button.getAttribute('aria-label'),
    )
    expect(marked).toEqual(['2 September 2026'])
  })

  it('says on each day what state it is in', () => {
    // Said on the element (`data-*`, and `aria-selected` on the cell), so the
    // drawing reads one fact and a screen reader hears the same one.
    const { container } = render(<Example value="2026-09-08" rangeEnd="2026-09-11" />)
    const days = (attribute: string) =>
      Array.from(container.querySelectorAll(`[role="grid"] button[${attribute}]`)).map((day) => day.textContent)
    expect(days('data-selected')).toEqual(['8', '11'])
    expect(days('data-in-range')).toEqual(['9', '10'])
    // September 2026 starts on a Tuesday and ends on a Wednesday: Monday the
    // 31st before it, and the first days of October after it.
    expect(days('data-outside')).toEqual(['31', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'])
    const selectedCells = Array.from(container.querySelectorAll('[role="gridcell"][aria-selected="true"]'))
    expect(selectedCells.map((cell) => cell.textContent)).toEqual(['8', '11'])
    expect(container.querySelectorAll('[role="gridcell"][aria-selected="false"]')).toHaveLength(0)
  })

  it('selects one day when there is no other end', () => {
    const { container } = render(<Example value="2026-09-08" />)
    const selected = Array.from(container.querySelectorAll('[role="grid"] button[data-selected]'))
    expect(selected.map((day) => day.textContent)).toEqual(['8'])
    expect(container.querySelectorAll('[data-in-range]')).toHaveLength(0)
  })

  it('selects nothing without a value, even with an end', () => {
    const { container } = render(<Example rangeEnd="2026-09-11" />)
    expect(container.querySelectorAll('[data-selected], [data-in-range]')).toHaveLength(0)
  })

  it('holds its bounds to the day, inclusive at both ends', () => {
    const { container } = render(<Example min="2026-09-10" max="2026-09-20" />)
    const unavailable = (label: string) =>
      Array.from(container.querySelectorAll('[role="gridcell"] button'))
        .find((day) => day.getAttribute('aria-label') === label)!
        .getAttribute('aria-disabled')
    expect(unavailable('9 September 2026')).toBe('true')
    expect(unavailable('10 September 2026')).toBeNull()
    expect(unavailable('20 September 2026')).toBeNull()
    expect(unavailable('21 September 2026')).toBe('true')
  })

  it('holds one bound without the other', () => {
    const { container, rerender } = render(<Example min="2026-09-10" />)
    const disabled = () => container.querySelectorAll('[role="grid"] [aria-disabled="true"]').length
    // Monday 31 August and the first nine days of September.
    expect(disabled()).toBe(10)
    rerender(<Example max="2026-09-20" />)
    // The rest of September, and the first days of October on the last row.
    expect(disabled()).toBe(10 + 11)
  })

  it('heads the grid with the month and the year, and numbers each day', () => {
    render(<Example />)
    expect(screen.getByText('September 2026')).toBeDefined()
    expect(screen.getByRole('button', { name: /^14 September 2026/ }).textContent).toBe('14')
  })

  it('turns its own month with the buttons when nobody holds it', async () => {
    const user = userEvent.setup()
    render(
      <Calendar
        value="2026-09-14"
        locale="en-GB"
        aria-label="Choose a date"
        previousMonthLabel="Previous month"
        nextMonthLabel="Next month"
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByText('August 2026')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    await user.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByText('October 2026')).toBeDefined()
  })

  it('leaves a month it is given where it is, and only says where it was asked to go', async () => {
    const user = userEvent.setup()
    const onMonthChange = vi.fn()
    render(<Example onMonthChange={onMonthChange} />)
    await user.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(onMonthChange).toHaveBeenCalledWith('2026-08-01')
    expect(screen.getByText('September 2026')).toBeDefined()
  })

  it('pages only when the cursor leaves the month', async () => {
    const user = userEvent.setup()
    const onMonthChange = vi.fn()
    render(<Example value="2026-09-14" onMonthChange={onMonthChange} />)
    screen.getByRole('button', { name: /^14 September 2026/ }).focus()
    await user.keyboard('{ArrowRight}{ArrowDown}{ArrowLeft}')
    expect(onMonthChange).not.toHaveBeenCalled()
  })

  it('pages across a year', async () => {
    const user = userEvent.setup()
    const onMonthChange = vi.fn()
    render(<Example month="2026-12-01" value="2026-12-31" onMonthChange={onMonthChange} />)
    screen.getByRole('button', { name: /^31 December 2026/ }).focus()
    await user.keyboard('{ArrowRight}')
    expect(onMonthChange).toHaveBeenCalledWith('2027-01-01')
  })

  it('keeps the arrows from scrolling the page', () => {
    render(<Example value="2026-09-14" />)
    const day = screen.getByRole('button', { name: /^14 September 2026/ })
    // `fireEvent` answers false when the event was cancelled.
    expect(fireEvent.keyDown(day, { key: 'ArrowDown' })).toBe(false)
    expect(fireEvent.keyDown(day, { key: 'a' })).toBe(true)
  })

  it('starts the cursor on today when nothing is chosen', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 2, 12))
    const { container } = render(<Example />)
    const stops = Array.from(container.querySelectorAll('[role="grid"] [tabindex="0"]'))
    expect(stops.map((day) => day.getAttribute('aria-label'))).toEqual(['2 September 2026'])
  })

  it('brings the cursor back to the chosen day when the month moves to it', () => {
    // The cursor was on a September day; shown November with a November
    // day chosen, the way in is that day, not the first of the month.
    const { container, rerender } = render(<Example month="2026-09-01" value="2026-09-14" />)
    rerender(<Example month="2026-11-01" value="2026-11-20" />)
    const stops = Array.from(container.querySelectorAll('[role="grid"] [tabindex="0"]'))
    expect(stops.map((day) => day.getAttribute('aria-label'))).toEqual(['20 November 2026'])
  })

  it('does not take the focus by being drawn, unless asked', () => {
    const { rerender } = render(<Example value="2026-09-14" />)
    expect(document.activeElement).toBe(document.body)
    rerender(<Example value="2026-09-15" />)
    expect(document.activeElement).toBe(document.body)
    rerender(<Example value="2026-09-15" autoFocus key="again" />)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^15 September 2026/ }))
  })

  it('chooses without a listener, and says so to one', async () => {
    const user = userEvent.setup()
    render(<Example />)
    // No `onValueChange`: a click is still harmless.
    await user.click(screen.getByRole('button', { name: /^14 September 2026/ }))
    expect(screen.getByRole('button', { name: /^14 September 2026/ }).getAttribute('tabindex')).toBe('0')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Example value="2026-09-14" />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe', async () => {
    await expectNoA11yViolations(<Example value="2026-09-14" />)
  })
})
