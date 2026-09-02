// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
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
    const { container } = render(<Example />)
    expect(screen.getByRole('grid').getAttribute('tabindex')).toBe('0')
    for (const day of container.querySelectorAll('[role="gridcell"] button')) {
      expect(day.getAttribute('tabindex')).toBe('-1')
    }
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

    // The grid is focused directly: the first Tab lands on the month-paging
    // button, which comes before it in the DOM. What is under test is the
    // grid's keyboard, not the tab order around it.
    screen.getByRole('grid').focus()
    await user.keyboard('{ArrowRight}{ArrowDown}')
    expect(onValueChange).not.toHaveBeenCalled()

    await user.keyboard('{Enter}')
    expect(onValueChange).toHaveBeenCalledWith('2026-09-22')
  })

  it('pages the month when the cursor leaves it', async () => {
    const user = userEvent.setup()
    const onMonthChange = vi.fn()
    render(<Example value="2026-09-30" onMonthChange={onMonthChange} />)

    screen.getByRole('grid').focus()
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

    /* Found through the DOM rather than by role: `getByRole` skips disabled
     * elements by default, so asking for the day that must be unclickable
     * fails to find it - which reads as the component being wrong when it is
     * the query. */
    const day = (label: string) =>
      Array.from(container.querySelectorAll('[role="gridcell"] button')).find((button) =>
        button.getAttribute('aria-label')?.startsWith(label),
      ) as HTMLButtonElement

    expect(day('2 September').disabled).toBe(true)
    await user.click(day('2 September'))
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
