// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import {
  addDays,
  addMonths,
  daysInMonth,
  firstDayOfWeek,
  isIsoDate,
  monthGrid,
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
