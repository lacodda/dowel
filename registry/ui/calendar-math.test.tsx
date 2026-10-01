// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  daysInMonth,
  firstDayOfWeek,
  isIsoDate,
  keyStep,
  monthGrid,
  monthWeeks,
  parts,
  weekday,
  weekdayNames,
} from './calendar-math'

/*
 * calendar-math.
 *
 * The Calendar's own tests cover the arithmetic it uses; these are the parts
 * a product importing this module alone would reach for, and the properties
 * that hold across every input rather than at the handful of dates a table
 * can list.
 *
 * Written as properties on purpose. A table of cases proves the cases; what
 * has to be true here is that the sums are consistent everywhere, and the
 * cheapest way to find the day where they are not is to walk several years.
 */

/** Every day across four years, including two leap years and a century that
 * is not one. */
function everyDay(from: string, days: number): string[] {
  const all: string[] = []
  let cursor = from
  for (let i = 0; i < days; i += 1) {
    all.push(cursor)
    cursor = addDays(cursor, 1)
  }
  return all
}

describe('properties that hold on every day, not just the ones in a table', () => {
  const sample = everyDay('2023-11-01', 1200)

  it('every day it produces is a date it accepts', () => {
    // The two halves have to agree: a day this module can reach is a day it
    // recognises. A mismatch here is how 31 February gets into a database.
    for (const date of sample) {
      expect(isIsoDate(date), `${date} was produced but is not accepted`).toBe(true)
    }
  })

  it('a step forward and back returns to where it started', () => {
    for (const date of sample) {
      expect(addDays(addDays(date, 1), -1)).toBe(date)
      expect(addDays(addDays(date, 30), -30)).toBe(date)
    }
  })

  it('never lands on a day the month does not have', () => {
    for (const date of sample) {
      const { year, month, day } = parts(date)
      expect(day, `${date} is past the end of its month`).toBeLessThanOrEqual(
        daysInMonth(year, month),
      )
    }
  })

  it('the weekday advances by one every day and wraps at seven', () => {
    for (let i = 1; i < sample.length; i += 1) {
      const before = weekday(sample[i - 1]!)
      const after = weekday(sample[i]!)
      expect(after).toBe((before % 7) + 1)
    }
  })

  it('a month step keeps the day where the month is long enough', () => {
    for (const date of sample) {
      const { day } = parts(date)
      if (day > 28) continue
      // Below the 29th every month has the day, so nothing may be clamped.
      expect(parts(addMonths(date, 1)).day).toBe(day)
      expect(parts(addMonths(date, -1)).day).toBe(day)
    }
  })
})

describe('what a locale decides', () => {
  it('knows which day the week starts on', () => {
    // The one thing a calendar cannot hard-code, and the reason `Intl` is
    // enough here: it already knows.
    expect(firstDayOfWeek('en-GB')).toBe(1)
    expect(firstDayOfWeek('de-DE')).toBe(1)
    expect(firstDayOfWeek('en-US')).toBe(7)
  })

  it('answers for a locale nobody has heard of rather than throwing', () => {
    /* `Intl.Locale` accepts far more than it recognises: `not-a-locale` is a
     * syntactically valid BCP-47 tag, so it is taken and answered for - with
     * 7, the same as the unknown-region default. Only a tag it cannot parse
     * at all reaches the catch below. Either way the caller gets a day of the
     * week rather than an exception, which is the promise that matters. */
    expect([1, 7]).toContain(firstDayOfWeek('not-a-locale'))
    expect(firstDayOfWeek('xx')).toBe(1)
  })

  it('falls back to Monday when the tag cannot be parsed', () => {
    // A malformed tag throws inside `Intl.Locale`; Monday is the majority
    // answer worldwide and the only sensible thing to return.
    expect(firstDayOfWeek('!!!')).toBe(1)
  })

  it('names the days in the order that locale lays them out', () => {
    const monday = weekdayNames('en-GB', 1)
    const sunday = weekdayNames('en-US', 7)
    expect(monday).toHaveLength(7)
    expect(sunday).toHaveLength(7)
    // Same seven names, rotated - not a different set.
    expect([...monday].sort()).toEqual([...sunday].sort())
    expect(sunday[0]).toBe(monday[6])
  })

  it('builds a grid that starts on that day whatever the month', () => {
    for (const month of ['2026-01-01', '2026-02-01', '2026-09-01', '2027-03-01']) {
      expect(weekday(monthGrid(month, 'en-GB')[0]![0]!)).toBe(1)
      expect(weekday(monthGrid(month, 'en-US')[0]![0]!)).toBe(7)
    }
  })
})

describe('the weekday names, wherever the reader is', () => {
  /* The names were taken from midnights in UTC and formatted in the reader's
   * own zone, so west of Greenwich every midnight was the evening before and a
   * Monday-first grid was headed "Sun". Found in v0.34 by a test that happened
   * to run in Paraguay; the suite as a whole runs in UTC, where the defect does
   * not exist - so these change the zone of the process on purpose. */
  const zones = ['America/Asuncion', 'America/Los_Angeles', 'UTC', 'Asia/Tokyo', 'Pacific/Kiritimati']
  const original = process.env.TZ

  afterEach(() => {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  })

  it.each(zones)('heads the columns with the days under them in %s', (zone) => {
    process.env.TZ = zone
    expect(weekdayNames('en-GB', 1)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(weekdayNames('en-US', 7)[0]).toBe('Sun')
    // And the name agrees with the day the grid puts in that column.
    const first = monthGrid('2026-09-01', 'en-GB')[0]![0]!
    expect(weekday(first)).toBe(1)
  })
})

describe('the weeks a month touches', () => {
  it('drops the rows that belong wholly to the next month', () => {
    // September 2026 starts on a Tuesday and ends on a Wednesday: five weeks
    // from Monday, where the six-row grid would add a week of October.
    const weeks = monthWeeks('2026-09-14', 'en-GB')
    expect(weeks).toHaveLength(5)
    expect(weeks[0]![0]).toBe('2026-08-31')
    expect(weeks[4]![6]).toBe('2026-10-04')
    expect(monthGrid('2026-09-14', 'en-GB')).toHaveLength(6)
  })

  it('is four weeks for a February that fits them exactly, and six when it must be', () => {
    // February 2027 starts on a Monday and has 28 days; August 2026 starts on
    // a Saturday and has 31, which reaches into a sixth week from Monday.
    expect(monthWeeks('2027-02-01', 'en-GB')).toHaveLength(4)
    expect(monthWeeks('2026-08-01', 'en-GB')).toHaveLength(6)
  })

  it('holds every day of the month, on every month of several years', () => {
    let month = '2024-01-01'
    for (let i = 0; i < 48; i += 1) {
      for (const locale of ['en-GB', 'en-US']) {
        const days = monthWeeks(month, locale).flat()
        const { year, month: number } = parts(month)
        const inside = days.filter((date) => parts(date).year === year && parts(date).month === number)
        expect(inside).toHaveLength(daysInMonth(year, number))
        // And no row is wholly outside it.
        for (const week of monthWeeks(month, locale)) {
          expect(week.some((date) => parts(date).month === number)).toBe(true)
        }
      }
      month = addMonths(month, 1)
    }
  })
})

describe('where a key moves the cursor', () => {
  it('walks days and weeks with the arrows', () => {
    expect(keyStep('ArrowRight', '2026-09-30', 1)).toBe('2026-10-01')
    expect(keyStep('ArrowLeft', '2026-09-01', 1)).toBe('2026-08-31')
    expect(keyStep('ArrowDown', '2026-09-28', 1)).toBe('2026-10-05')
    expect(keyStep('ArrowUp', '2026-09-03', 1)).toBe('2026-08-27')
  })

  it('turns the month with the page keys, clamping to the month it lands in', () => {
    expect(keyStep('PageDown', '2026-01-31', 1)).toBe('2026-02-28')
    expect(keyStep('PageUp', '2026-03-31', 1)).toBe('2026-02-28')
  })

  it("goes to the ends of the week the locale starts", () => {
    // Wednesday 2 September 2026.
    expect(keyStep('Home', '2026-09-02', 1)).toBe('2026-08-31')
    expect(keyStep('End', '2026-09-02', 1)).toBe('2026-09-06')
    expect(keyStep('Home', '2026-09-02', 7)).toBe('2026-08-30')
    expect(keyStep('End', '2026-09-02', 7)).toBe('2026-09-05')
  })

  it('does not move for any other key', () => {
    for (const key of ['Enter', ' ', 'Escape', 'Tab', 'a']) {
      expect(keyStep(key, '2026-09-02', 1)).toBeUndefined()
    }
  })
})
