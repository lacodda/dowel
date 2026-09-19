import type { HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'dowel-ui'
import {
  weekdayRows,
  weeks,
  type ActivityEntry,
  type Cell,
  type Weekday,
} from './activity-weeks'

/*
 * A year of activity, one square per day.
 *
 * The shape everyone recognises: weeks as columns, weekdays as rows, time
 * running left to right, and a value carried by how dark a square is. Two
 * products of the line asked for it by name before it existed.
 *
 * **A cell has four meanings and only one of them is a number.** Nothing
 * recorded, a value, something still under way, and a date outside the range
 * asked for are four different facts. A grid that paints the first as the
 * palest shade of the second tells the reader somebody did nothing on a day
 * nobody reported - a claim invented by the drawing. So each has its own
 * treatment: a value is filled from the heat ramp, nothing recorded is the
 * bare empty square, something under way is outlined rather than filled
 * (there is no figure to shade, and any fill would be a number nobody gave),
 * and a padding square is drawn faintest of all, because the caller never
 * asked about it.
 *
 * **The legend is not decoration.** The scale is relative - the darkest square
 * is the busiest day in *this* grid, not a standard - so the grid says what
 * its own ceiling is. Without that, five shades look like an absolute measure
 * of a full day, which is a thing this component has no opinion about.
 *
 * **Colour is never the only channel.** Every square carries its date and its
 * figure in words, on a `title` and as its accessible name: a grid of five
 * shades says nothing to a screen reader, and little to anyone who does not
 * separate five blues.
 */

export const activityHeatmapVariants = cva('inline-flex flex-col gap-2', {
  variants: {
    size: {
      /* The year view, where a square is small enough that 53 columns fit. */
      sm: '[--cell:10px] [--gap:2px]',
      /* A quarter or a month, where there is room to hover comfortably. */
      md: '[--cell:14px] [--gap:var(--spacing-hair)]',
    },
  },
  defaultVariants: { size: 'md' },
})

export const activityCellVariants = cva('rounded-[3px]', {
  variants: {
    kind: {
      /* The bare square. Not the faintest step of the ramp - that is a value,
       * and this is the absence of one. */
      none: 'bg-soft',
      value: '',
      /* Outlined rather than filled: under way has no total to shade. */
      partial: 'border border-dashed border-accent/60',
      /* Drawn, because the column has to be seven tall, but never as data:
       * the caller did not ask about this date. */
      outside: 'bg-softer/40',
    },
    step: {
      1: 'bg-heat-1',
      2: 'bg-heat-2',
      3: 'bg-heat-3',
      4: 'bg-heat-4',
      5: 'bg-heat-5',
    },
  },
  defaultVariants: { kind: 'none' },
})

export interface ActivityHeatmapProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof activityHeatmapVariants> {
  /** What is known about each date. Dates with no entry are drawn as nothing
   * recorded, which is a different fact from a value of zero. */
  entries: ActivityEntry[]
  /** First date of the range, `YYYY-MM-DD`. */
  from: string
  /** Last date. */
  to: string
  /** The day a week starts on, Sunday-first like `Date#getUTCDay`. Monday by
   * default. It decides which row a date lands on, so it is stated rather than
   * guessed from a locale this cannot see. */
  weekStartsOn?: Weekday
  /** The ceiling the shades are measured against. Defaults to the largest
   * value present; state it to compare two grids by eye. */
  busiest?: number
  /** What the grid as a whole is, for a reader who cannot see it. */
  label: string
  /** What one square says. Given the cell, returns the sentence that becomes
   * its hover title and its accessible name - the caller owns it because only
   * the caller knows whether a value is hours, words or commits. */
  describe: (cell: Cell) => string
  /** Row labels, one per weekday in drawing order. Omitted entirely rather
   * than defaulted: a weekday name is a word in a language this cannot pick. */
  weekdayLabel?: (weekday: Weekday) => ReactNode
}

export function ActivityHeatmap({
  entries,
  from,
  to,
  weekStartsOn = 1,
  busiest,
  label,
  describe,
  weekdayLabel,
  size,
  className,
  ...props
}: ActivityHeatmapProps) {
  const columns = weeks(entries, { from, to, weekStartsOn, busiest })
  const rows = weekdayRows(weekStartsOn)

  return (
    <div className={cn(activityHeatmapVariants({ size }), className)} {...props}>
      <div className="flex gap-[var(--gap)]" role="img" aria-label={label}>
        {weekdayLabel !== undefined && (
          <div
            className="mr-1 flex flex-col gap-[var(--gap)] text-[10px] leading-[var(--cell)] text-faint"
            aria-hidden
          >
            {rows.map((weekday) => (
              <span key={weekday} className="h-[var(--cell)]">
                {weekdayLabel(weekday)}
              </span>
            ))}
          </div>
        )}

        {columns.map((column) => (
          <div key={column[0]!.date} className="flex flex-col gap-[var(--gap)]">
            {column.map((cell) => (
              <span
                key={cell.date}
                title={describe(cell)}
                className={cn(
                  'size-[var(--cell)]',
                  activityCellVariants({
                    kind: cell.kind,
                    step: cell.step as 1 | 2 | 3 | 4 | 5 | undefined,
                  }),
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
