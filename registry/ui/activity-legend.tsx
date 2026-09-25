import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from 'dowel-ui'
import { activityCellVariants } from './activity-heatmap'
import { STEPS } from './activity-weeks'

/*
 * What the shades mean, in the same tokens the grid paints with.
 *
 * Separate from the grid because a caller showing three grids on one screen
 * wants one legend, and because the words in it are the product's.
 */
export interface ActivityLegendProps extends HTMLAttributes<HTMLDivElement> {
  /** The word at the faint end - "less", usually. */
  less: ReactNode
  /** The word at the dark end. */
  more: ReactNode
  /** What the darkest square stands for, in words: the scale is relative, and
   * without this the shades read as an absolute measure. Omitted when there is
   * no value in the grid to be busiest. */
  busiest?: ReactNode
  /** The other three meanings, each named. Omitted one at a time by a caller
   * whose data cannot produce that kind. */
  none?: ReactNode
  partial?: ReactNode
}

export function ActivityLegend({
  less,
  more,
  busiest,
  none,
  partial,
  className,
  ...props
}: ActivityLegendProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-faint', className)}
      {...props}
    >
      <span className="flex items-center gap-1.5">
        <span>{less}</span>
        {Array.from({ length: STEPS }, (_, index) => (
          <span
            key={index}
            className={cn('size-3', activityCellVariants({ kind: 'value', step: (index + 1) as 1 | 2 | 3 | 4 | 5 }))}
          />
        ))}
        <span>{more}</span>
        {busiest !== undefined && <span className="ml-1">· {busiest}</span>}
      </span>

      {none !== undefined && (
        <span className="flex items-center gap-1.5">
          <span className={cn('size-3', activityCellVariants({ kind: 'none' }))} />
          {none}
        </span>
      )}

      {partial !== undefined && (
        <span className="flex items-center gap-1.5">
          <span className={cn('size-3', activityCellVariants({ kind: 'partial' }))} />
          {partial}
        </span>
      )}
    </div>
  )
}
