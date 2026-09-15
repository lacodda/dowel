import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { datesBetween, isWeekend, stepFor, STEPS, weekdayRows, weeks } from './activity-weeks'

/*
 * The arithmetic, tested without a DOM.
 *
 * Everything that can be quietly wrong about an activity grid is in here. A
 * cell painted the wrong shade still looks like a heatmap; a date landing in
 * the wrong column still looks like a calendar; a missing day drawn as zero
 * still looks like a day. None of it throws.
 */

const value = (date: string, n: number) => ({ date, value: n })

describe('the four meanings of a cell, which is the rule the grid rests on', () => {
  const range = { from: '2026-09-07', to: '2026-09-13' } as const

  it('draws a date with no entry as nothing recorded, not as zero', () => {
    /* The confusion this module exists to prevent: painted as the palest
     * shade of a value, a missing day tells the reader somebody did nothing
     * on a day nobody reported. */
    const [column] = weeks([value('2026-09-07', 5)], range)
    expect(column![1]).toMatchObject({ date: '2026-09-08', kind: 'none', value: null, step: null })
  })

  it('draws an entry with no figure as under way, not as nothing', () => {
    // A day still open has no total yet. It is not absent, and any shade would
    // be a number the caller did not give.
    const [column] = weeks([{ date: '2026-09-07', value: null }], range)
    expect(column![0]).toMatchObject({ kind: 'partial', value: null, step: null })
  })

  it('draws a figure as a value, with a step behind it', () => {
    const [column] = weeks([value('2026-09-07', 5)], range)
    expect(column![0]).toMatchObject({ kind: 'value', value: 5, step: STEPS })
  })

  it('marks the padding as outside the range, never as missing data', () => {
    /* The caller asked about a week; the grid draws a column. The squares that
     * make the column square are not days anyone asked about, and drawing them
     * as "nothing recorded" would add days to the question. */
    const [column] = weeks([value('2026-09-09', 1)], { from: '2026-09-09', to: '2026-09-09' })
    // 2026-09-09 is a Wednesday: third row of a Monday-first week.
    const kinds = column!.map((cell) => cell.kind)
    expect(kinds).toEqual(['outside', 'outside', 'value', 'outside', 'outside', 'outside', 'outside'])
  })

  it('gives every padding square the date it stands for', () => {
    // A reader hovering the first column should find a date, not a blank.
    const [column] = weeks([], { from: '2026-09-09', to: '2026-09-09' })
    expect(column!.map((cell) => cell.date)).toEqual([
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ])
  })
})

describe('where a date lands', () => {
  it('starts the week on Monday by default', () => {
    // 2026-09-09 is a Wednesday: third row of a Monday-first week.
    const [column] = weeks([value('2026-09-09', 1)], { from: '2026-09-09', to: '2026-09-09' })
    expect(column!.findIndex((cell) => cell.kind === 'value')).toBe(2)
  })

  it('moves it when the week starts on Sunday', () => {
    /* Not a cosmetic setting: it changes which column a date lands in, and a
     * grid that guessed from a locale it cannot see would put Sunday's work in
     * last week. */
    const [column] = weeks([value('2026-09-09', 1)], {
      from: '2026-09-09',
      to: '2026-09-09',
      weekStartsOn: 0,
    })
    expect(column!.findIndex((cell) => cell.kind === 'value')).toBe(3)
  })

  it('keeps a weekday on its own row across every column', () => {
    const columns = weeks([], { from: '2026-09-07', to: '2026-10-05' })
    for (const row of [0, 1, 2, 3, 4, 5, 6]) {
      const days = columns.map((column) => new Date(`${column[row]!.date}T00:00:00Z`).getUTCDay())
      expect(new Set(days).size, `row ${row} holds more than one weekday`).toBe(1)
    }
  })

  it('gives every column seven cells', () => {
    const columns = weeks([], { from: '2026-09-09', to: '2026-10-02' })
    for (const column of columns) expect(column).toHaveLength(7)
  })

  it('runs left to right in time', () => {
    const columns = weeks([], { from: '2026-09-07', to: '2026-09-27' })
    const firsts = columns.map((column) => column[0]!.date)
    expect(firsts).toEqual([...firsts].sort())
  })

  it('reports the weekend from the date, and only the weekend', () => {
    // Saturday and Sunday, never "a day off" - which days someone rests is a
    // calendar this does not have.
    expect(isWeekend('2026-09-12')).toBe(true)
    expect(isWeekend('2026-09-13')).toBe(true)
    expect(isWeekend('2026-09-14')).toBe(false)
  })

  it('agrees with itself about which row is which weekday', () => {
    expect(weekdayRows(1)).toEqual([1, 2, 3, 4, 5, 6, 0])
    expect(weekdayRows(0)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})

describe('the steps, which is the only place a number becomes a colour', () => {
  it('gives any value at all at least the faintest step', () => {
    /* A twenty-minute day is a real day. Rounded to nothing it would join the
     * empty squares, and the grid would be lying about a day that was
     * reported. */
    expect(stepFor(1, 100_000)).toBe(1)
    expect(stepFor(0.0001, 100_000)).toBe(1)
  })

  it('gives a measured zero the faintest step too, because it is an answer', () => {
    // Zero measured is not the same as nothing measured, and only the caller
    // knows which one this is - they said so by sending an entry.
    expect(stepFor(0, 100)).toBe(1)
  })

  it('gives the busiest day the darkest step', () => {
    expect(stepFor(100, 100)).toBe(STEPS)
  })

  it('spreads the middle across the steps rather than crowding one end', () => {
    const steps = [10, 30, 50, 70, 90].map((v) => stepFor(v, 100))
    expect(steps).toEqual([1, 2, 3, 4, 5])
  })

  it('measures against the stated ceiling, so two grids compare', () => {
    /* Scaled to itself, a quiet month and a heavy one each get their own
     * darkest square - which is the one thing a heatmap is for. */
    const quiet = weeks([value('2026-09-09', 2)], { from: '2026-09-09', to: '2026-09-09', busiest: 100 })
    const alone = weeks([value('2026-09-09', 2)], { from: '2026-09-09', to: '2026-09-09' })
    expect(quiet[0]![2]!.step).toBe(1)
    expect(alone[0]![2]!.step).toBe(STEPS)
  })

  it('never exceeds the scale when a value overshoots the ceiling', () => {
    expect(stepFor(500, 100)).toBe(STEPS)
  })

  it('does not divide by a ceiling of zero', () => {
    expect(Number.isFinite(stepFor(0, 0))).toBe(true)
    expect(Number.isFinite(stepFor(5, 0))).toBe(true)
  })

  it('reads a ceiling of zero two ways, because it arrives two ways', () => {
    /* A grid whose only values are zero has a ceiling of zero by arithmetic -
     * every day measured, every day empty - and those days are the faintest
     * step, not the darkest. Drawn as the busiest, a single recorded zero
     * became the heaviest day on the grid, which is how this was found.
     *
     * A real figure against a stated ceiling of zero is the other case: the
     * ceiling is wrong, and the figure is all there is, so it is drawn at full
     * strength rather than hidden. */
    expect(stepFor(0, 0)).toBe(1)
    expect(stepFor(5, 0)).toBe(STEPS)
  })
})

describe('the range', () => {
  it('walks dates through UTC, so no zone shifts a day', () => {
    expect(datesBetween('2026-09-07', '2026-09-10')).toEqual([
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
    ])
  })

  it('crosses a month and a year without losing a day', () => {
    expect(datesBetween('2026-12-30', '2027-01-02')).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ])
  })

  it('reads a date as a label, not as a moment in any zone', () => {
    /* A date here is a label. Parsed at local midnight instead, a date in a
     * zone AHEAD of UTC lands on the previous day once it is read back: in
     * Berlin (+2) the walk from 2026-09-07 comes out starting 2026-09-06, and
     * every cell in the grid carries a day it is not.
     *
     * This cannot be asserted by running it: the runner takes the machine's
     * zone, and on a machine BEHIND UTC a local parse survives every check
     * because the offset cancels on the way in and on the way out. A mutation
     * swapping `T00:00:00Z` for `T00:00:00` passed the whole suite here for
     * exactly that reason - the test was measuring the machine, not the code.
     *
     * So the invariant is read off the source instead, which is true in every
     * zone: no date in this module is parsed without one. */
    const source = readFileSync(fileURLToPath(new URL('./activity-weeks.tsx', import.meta.url)), 'utf8')
    const parses = [...source.matchAll(/Date\.parse\(([^)]*)\)/g)].map((match) => match[1]!)

    expect(parses.length, 'the module no longer parses any date - has it moved?').toBeGreaterThan(0)
    for (const call of parses) {
      expect(call, `\`Date.parse(${call})\` reads local midnight: in a zone ahead of UTC that is yesterday`).toContain(
        'Z',
      )
    }
  })

  it('carries a date through the grid unchanged', () => {
    // The same claim from the other end: whatever the zone, a cell wears the
    // date it was given.
    const dates = datesBetween('2026-09-07', '2026-09-10')
    expect(dates[0]).toBe('2026-09-07')
    expect(dates.at(-1)).toBe('2026-09-10')

    const columns = weeks([value('2026-09-07', 1)], { from: '2026-09-07', to: '2026-09-13' })
    expect(columns[0]![0]).toMatchObject({ date: '2026-09-07', kind: 'value' })
  })

  it('keeps every step exactly one day, across a daylight-saving boundary', () => {
    /* Stepping local time over a spring forward gives a 23-hour day, and a
     * fixed 24-hour cursor then either skips a date or sticks on one. In UTC
     * there is no such day. */
    const dates = datesBetween('2026-03-27', '2026-03-31')
    expect(dates).toEqual(['2026-03-27', '2026-03-28', '2026-03-29', '2026-03-30', '2026-03-31'])

    const autumn = datesBetween('2026-10-23', '2026-10-28')
    expect(autumn).toEqual([
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
    ])
  })

  it('draws nothing for a backwards or unreadable range', () => {
    expect(datesBetween('2026-09-10', '2026-09-01')).toEqual([])
    expect(weeks([], { from: 'not a date', to: '2026-09-01' })).toEqual([])
  })
})
