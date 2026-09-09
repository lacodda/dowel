import type { ReactNode } from 'react'
import { cn } from 'dowel-ui'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from './select'

/*
 * How many rows to a page.
 *
 * Its own file rather than a part of `Pagination`, because the two are needed
 * apart often enough: a list that scrolls for ever wants "how many to load at
 * a time" and no page buttons, and a table with a fixed page size wants the
 * buttons and no choice. Together they were also over the size gate, which
 * asked the right question.
 *
 * A `Select`, because the line has no native `<select>` anywhere - and this is
 * the control most likely to reintroduce one, since it is three numbers in a
 * box and looks like the case where it would not matter.
 */

export interface PageSizeProps {
  pageSize: number
  options?: number[]
  onPageSizeChange: (pageSize: number) => void
  /** Names the control for a screen reader, e.g. "Rows per page". */
  label: string
  /** The visible label, when there is room for one. */
  children?: ReactNode
  className?: string
}

export function PageSize({
  pageSize,
  options = [10, 25, 50, 100],
  onPageSizeChange,
  label,
  children,
  className,
}: PageSizeProps) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-dim', className)}>
      {children}
      <Select
        value={String(pageSize)}
        onValueChange={(value: unknown) => onPageSizeChange(Number(value))}
      >
        <SelectTrigger aria-label={label} className="w-auto min-w-16">
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {options.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
    </div>
  )
}
