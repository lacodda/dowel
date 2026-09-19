import { useCallback, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from 'dowel-ui'

/*
 * SkeletonOf - a placeholder that remembers the shape instead of guessing it.
 *
 * `Skeleton` and its shapes solved half the problem: they gave a product a
 * list, a card and a grid to reach for instead of a spinner. The half left
 * over is the one that actually causes the jump, and it is a human one -
 * somebody has to look at the real thing, judge how many rows it has and how
 * tall they are, and type that in. The judgement is made once, the screen
 * changes a month later, and the placeholder goes on promising the old shape.
 * The line's own calendar is the recorded case: four short lines standing in
 * for a six-row month grid, and the skeleton was itself the jump it existed to
 * prevent.
 *
 * The rule is the same one `Skeleton` is built on:
 *
 *   **A skeleton of the wrong shape is worse than no skeleton.**
 *
 * What is new here is where the shape comes from. The content was on the
 * screen a moment ago; it measured itself, and nothing else knows its shape
 * better. So this keeps what was there - how many rows, how tall each one, how
 * tall the whole block - and draws that back while the next load is in flight.
 *
 * **Why measuring and not reading the source.** The obvious version of "derive
 * the skeleton from the markup" is to parse the component's JSX and emit
 * boxes from it. It cannot work, and the reason is worth writing down: the
 * shape on screen is not in the source. It is the source plus the data (five
 * rows or fifty), plus the viewport (one column or three), plus the theme's
 * own spacing. A generator reading `list.tsx` sees one `<li>` in a `map` and
 * knows nothing about any of that. Measuring the rendered thing sees all of it
 * at once, and it costs a `ResizeObserver` rather than a build step.
 *
 * **The first load has nothing to remember**, and that is the case a product
 * must still answer: `fallback` is what stands in until there is a measurement
 * to use. After that the fallback is never seen again on that screen.
 *
 * Everything drawn here is `aria-hidden`, like every other skeleton - the
 * loading fact belongs to the region and is said once, by whatever owns it.
 */

/** What was measured: the block's own height, and the rows inside it.
 *
 * Kept as plain numbers rather than as a copy of the DOM, because that is all
 * a placeholder needs and because a detached node would pin the whole tree in
 * memory for as long as the screen lives. */
export interface MeasuredShape {
  /** The block's height when it was last full, in pixels. */
  height: number
  /** The height of each row inside it. Empty when nothing matched the row
   * selector - a block with no repeating part is a single box. */
  rows: number[]
}

/**
 * Measure a node: its height, and the heights of the rows inside it.
 *
 * Exported because a product occasionally wants the measurement without the
 * component - to persist it between sessions, for instance, so that even the
 * first load of a screen already knows its shape.
 *
 * Rows are found by selector rather than by walking children, because the
 * repeating part is rarely a direct child: a table's rows are inside a
 * `<tbody>`, a list's inside a `<ul>` that may itself be inside a scroller.
 */
export function measureShape(node: HTMLElement, rowSelector?: string): MeasuredShape {
  const height = node.getBoundingClientRect().height
  const rows = rowSelector
    ? [...node.querySelectorAll(rowSelector)].map((row) => row.getBoundingClientRect().height)
    : []
  return { height, rows }
}

export interface SkeletonOfProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Whether the content is on its way. While false the children are shown and
   * measured; while true the remembered shape is drawn in their place. */
  pending: boolean
  /** The real thing. Rendered and measured when not pending. */
  children: ReactNode
  /**
   * What counts as a row - `'tr'`, `'li'`, `'[data-row]'`. Given, the
   * placeholder draws one box per row at the height that row had; omitted, it
   * draws a single box the height of the whole block.
   */
  rowSelector?: string
  /**
   * What to draw before anything has been measured - the first load of a
   * screen, where there is genuinely nothing to remember. A `SkeletonList` of
   * roughly the right size is the usual answer.
   */
  fallback?: ReactNode
  /**
   * A shape measured earlier - from `measureShape`, stored by the product
   * between sessions. Used until this instance measures something itself, so
   * even a first load can be honest.
   */
  shape?: MeasuredShape
  /** The gap between drawn rows, as a Tailwind class. Matches whatever the
   * real list uses; the rows' own heights come from the measurement. */
  gapClassName?: string
}

/**
 * Shows the children, remembers their shape, and draws that shape back while
 * the next load is in flight.
 *
 * The measurement is taken in a layout effect and on every resize, not once on
 * mount: a list that gains rows, a window that narrows, a font that loads late
 * all change the shape, and a placeholder built from the first measurement
 * would be wrong in exactly the way this component exists to prevent.
 */
export function SkeletonOf({
  pending,
  children,
  rowSelector,
  fallback,
  shape,
  gapClassName,
  className,
  ...props
}: SkeletonOfProps) {
  const [measured, setMeasured] = useState<MeasuredShape | undefined>(shape)
  const node = useRef<HTMLDivElement | null>(null)

  const remember = useCallback(() => {
    const element = node.current
    if (!element) return
    const next = measureShape(element, rowSelector)
    // A block of no height is a block that has not been laid out - a hidden
    // tab, a parent still collapsing. Remembering a zero would draw nothing
    // and claim it was the shape.
    if (next.height <= 0) return
    setMeasured((held) =>
      held && held.height === next.height && sameRows(held.rows, next.rows) ? held : next,
    )
  }, [rowSelector])

  useLayoutEffect(() => {
    // Only the branch that renders the content carries the ref, so while
    // pending there is nothing to measure and `remember` finds no node. That
    // is what keeps the memory from decaying: measuring the placeholder would
    // record the shape it had just drawn from memory, and each load would
    // remember a little less of what the content actually looked like.
    //
    // It is worth stating rather than relying on, because it rests on React
    // clearing a ref when the node it points at unmounts. The guard below is
    // that fact made explicit - if the component ever renders both branches,
    // this is the line that keeps the loop from closing.
    if (pending || !node.current) return
    remember()

    // jsdom has no ResizeObserver, and a product may run in one. The component
    // is still correct without it: it has the mount measurement, it just does
    // not follow later changes.
    if (typeof ResizeObserver === 'undefined') return
    const element = node.current
    if (!element) return
    const observer = new ResizeObserver(remember)
    observer.observe(element)
    return () => observer.disconnect()
  }, [pending, remember, children])

  if (!pending) {
    return (
      <div ref={node} className={className} {...props}>
        {children}
      </div>
    )
  }

  // Nothing measured yet, and nothing handed over: the first load of a screen
  // that did not say what it is waiting for. Saying nothing is better than
  // drawing a shape made up on the spot.
  if (!measured) return <>{fallback ?? null}</>

  return (
    <div aria-hidden className={cn('flex flex-col', gapClassName ?? 'gap-1', className)} {...props}>
      {measured.rows.length > 0 ? (
        measured.rows.map((height, row) => (
          <div
            key={row}
            style={{ height }}
            className="animate-pulse shrink-0 rounded-md bg-soft"
          />
        ))
      ) : (
        <div style={{ height: measured.height }} className="animate-pulse rounded-md bg-soft" />
      )}
    </div>
  )
}

/** Whether two row measurements are the same run of heights.
 *
 * Compared rather than replaced wholesale so that a resize that changes
 * nothing does not hand back a new object every frame - which would re-render
 * the subtree on every pixel of a window drag. */
function sameRows(left: number[], right: number[]): boolean {
  return left.length === right.length && left.every((height, index) => height === right[index])
}
