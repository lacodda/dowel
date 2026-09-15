/*
 * Laying a run of dates out in weeks, with no React in it.
 *
 * Split out for the reason `table-sort` and `track-segments` are - a product
 * that draws this somewhere other than the DOM needs the arithmetic, not a
 * component. One of the line's consumers draws it in a terminal.
 *
 * The rule the whole grid rests on, and the one worth stating loudest:
 * **a cell has four meanings and only one of them is a number.** Nothing
 * recorded, a value, a day still in progress, and a date outside the range
 * asked for are four different facts. A grid that paints "nothing recorded" as
 * the palest shade of "a value" tells the reader somebody did nothing on a day
 * nobody reported - which is a claim invented by the drawing.
 */

/** What one square of the grid is. */
export type CellKind =
  /** No entry for this date. Not zero - no data at all. */
  | 'none'
  /** An entry with a figure behind it. */
  | 'value'
  /** Under way, with no total yet: today's row, a day still open. */
  | 'partial'
  /** A date the grid draws to keep its shape, outside the range asked for. */
  | 'outside'

/** What the caller knows about one date. */
export interface ActivityEntry {
  /** `YYYY-MM-DD`. A label, never a moment: no zone shifts a date here. */
  date: string
  /** The figure. `null` for a day under way, which has no total yet. */
  value: number | null
}

export interface Cell {
  date: string
  kind: CellKind
  value: number | null
  /** Which of the five steps this lands on, 1-5; `null` unless `kind` is
   * `value`. Discrete rather than continuous, because five shades can be told
   * apart and matched against a legend where a smooth gradient can only say
   * "more" and "less". */
  step: number | null
  /** Saturday or Sunday, read from the date itself.
   *
   * Only the weekend, never "a day off": which days someone actually rests is
   * a calendar this does not have, and guessing would mark an ordinary
   * Saturday shift as unusual. */
  weekend: boolean
}

/** Five steps, and the reason there are five: a legend a reader can count. */
export const STEPS = 5

/** Sunday-first, because that is what `Date#getUTCDay` counts from. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

const DAY = 86_400_000

function parse(date: string): number {
  return Date.parse(`${date}T00:00:00Z`)
}

function format(time: number): string {
  return new Date(time).toISOString().slice(0, 10)
}

/** Every date from `from` to `to` inclusive, as `YYYY-MM-DD`.
 *
 * Stepped through UTC so no local zone can shift a day: a date here is a
 * label, not a moment. */
export function datesBetween(from: string, to: string): string[] {
  const start = parse(from)
  const end = parse(to)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return []

  const dates: string[] = []
  for (let time = start; time <= end; time += DAY) dates.push(format(time))
  return dates
}

export function isWeekend(date: string): boolean {
  const day = new Date(parse(date)).getUTCDay()
  return day === 0 || day === 6
}

export interface WeeksOptions {
  /** First date of the range the caller asked for. */
  from: string
  /** Last date. */
  to: string
  /** The day a week starts on. Monday in most of the world, Sunday in the US -
   * and it changes which column a date lands in, so it is stated rather than
   * guessed from a locale the grid cannot see. */
  weekStartsOn?: Weekday
  /** The ceiling the steps are measured against. Defaults to the largest value
   * present.
   *
   * Shared rather than per-column, so two grids can be compared: scaled to
   * itself, a quiet month and a heavy one each get their own darkest square,
   * which is the one thing a heatmap is for. */
  busiest?: number
}

/**
 * The range as columns of weeks, each column seven cells from the top.
 *
 * Columns rather than rows because that is the shape the grid is read in: a
 * week is a column, a weekday is a row, and time runs left to right.
 *
 * The first and last columns are padded to seven with `outside` cells, so
 * every column is the same height and a weekday stays on its own row. They are
 * not "no data" - the caller never asked about them - and drawing them as
 * empty squares would add days to the range that the reader did not request.
 */
export function weeks(entries: ActivityEntry[], options: WeeksOptions): Cell[][] {
  const { from, to, weekStartsOn = 1 } = options
  const dates = datesBetween(from, to)
  if (dates.length === 0) return []

  const byDate = new Map(entries.map((entry) => [entry.date, entry]))

  const values = entries
    .map((entry) => entry.value)
    .filter((value): value is number => value !== null && Number.isFinite(value))
  const busiest = options.busiest ?? (values.length > 0 ? Math.max(...values) : 0)

  const cellFor = (date: string): Cell => {
    const entry = byDate.get(date)
    const weekend = isWeekend(date)

    if (entry === undefined) return { date, kind: 'none', value: null, step: null, weekend }
    if (entry.value === null) return { date, kind: 'partial', value: null, step: null, weekend }

    return { date, kind: 'value', value: entry.value, step: stepFor(entry.value, busiest), weekend }
  }

  const outside = (date: string): Cell => ({
    date,
    kind: 'outside',
    value: null,
    step: null,
    weekend: isWeekend(date),
  })

  /* Where the first date sits in its own week, so the run starts on the right
   * row rather than at the top of the first column. */
  const columnOf = (date: string) => (new Date(parse(date)).getUTCDay() - weekStartsOn + 7) % 7

  const columns: Cell[][] = []
  let column: Cell[] = []

  // Pad the head, back-dating the squares so each one is the date it stands
  // for - a reader hovering the first column should not find a blank.
  const lead = columnOf(dates[0]!)
  for (let i = lead; i > 0; i--) column.push(outside(format(parse(dates[0]!) - i * DAY)))

  for (const date of dates) {
    column.push(cellFor(date))
    if (column.length === 7) {
      columns.push(column)
      column = []
    }
  }

  if (column.length > 0) {
    const last = parse(dates.at(-1)!)
    for (let i = 1; column.length < 7; i++) column.push(outside(format(last + i * DAY)))
    columns.push(column)
  }

  return columns
}

/**
 * Which step a value lands on, 1 to `STEPS`.
 *
 * The floor is 1 rather than 0: any value at all is a value, and a square
 * indistinguishable from an empty one would file a twenty-minute day under
 * "nothing recorded" - the confusion this module exists to prevent. A value of
 * zero is the exception, and it is the caller's own statement: zero measured is
 * not the same as nothing measured, and it still earns the faintest step.
 */
export function stepFor(value: number, busiest: number): number {
  /* No ceiling to measure against. That happens two ways and they mean
   * opposite things: a caller who stated no `busiest` and whose only values
   * are zero (every day measured, every day empty - the faintest step, because
   * that is what they are), or a caller who stated a ceiling of zero while
   * sending a real figure (the ceiling is wrong, and the figure is all the
   * grid has - the darkest, so it is not hidden). */
  if (!(busiest > 0)) return value > 0 ? STEPS : 1
  const share = Math.min(1, Math.max(0, value / busiest))
  return Math.max(1, Math.ceil(share * STEPS))
}

/** The weekday rows, in the order the grid draws them, as offsets from Sunday.
 *
 * Returned rather than assumed so a caller labelling the rows and a grid
 * drawing them cannot disagree about which row is Monday. */
export function weekdayRows(weekStartsOn: Weekday = 1): Weekday[] {
  return [0, 1, 2, 3, 4, 5, 6].map((offset) => ((weekStartsOn + offset) % 7) as Weekday)
}
