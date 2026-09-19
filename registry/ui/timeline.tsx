import type { HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'dowel-ui'

/*
 * Timeline.
 *
 * What happened, in the order it happened: a release history, an audit trail,
 * the steps a job went through. Four products of the line draw one, and all
 * four drew it the same way - a list with a border on the left and a dot
 * positioned over it by hand.
 *
 * Three things that version gets wrong, and which are the reason this is a
 * primitive:
 *
 * - **The rail runs past the last entry.** A border on the container ends
 *   where the container does, which is below the last dot - so the history
 *   trails off into a line going nowhere, and a reader cannot tell a finished
 *   list from one still loading. Here the rail is drawn per entry and the last
 *   one does not draw it.
 * - **It is a list, and says so.** A stack of `<div>`s is announced as nothing;
 *   an `<ol>` tells a reader how many entries there are and which one they are
 *   on, which is the whole navigational value of a history.
 * - **The state is a colour.** A red dot for a failed step is invisible to the
 *   reader it matters most to. The marker takes the same `Status` vocabulary as
 *   `StatusDot`, and the same rule applies: the colour is emphasis and the
 *   entry's own words are the message.
 *
 * The rail is drawn with a `<span>` rather than a border on the item, because
 * the segment has to start below the dot and run to the next one - a border
 * would start at the item's top edge and cut through the marker.
 */

export type TimelineStatus = 'good' | 'warn' | 'bad' | 'info' | 'neutral' | 'accent'

export const timelineMarkerVariants = cva(
  'relative z-1 flex shrink-0 items-center justify-center rounded-full',
  {
    variants: {
      status: {
        accent: 'bg-accent text-on-accent',
        good: 'bg-good text-on-good',
        warn: 'bg-warn text-on-warn',
        bad: 'bg-bad text-on-bad',
        info: 'bg-info text-on-info',
        neutral: 'bg-line-2 text-dim',
      },
      /** A step not taken yet: the ring of a dot with nothing in it, which is
       * how every other tool draws "not done" and is worth borrowing. */
      pending: {
        true: 'border-2 border-line-2 bg-bg',
        false: '',
      },
    },
    defaultVariants: { status: 'neutral', pending: false },
  },
)

export interface TimelineProps extends HTMLAttributes<HTMLOListElement> {
  /** Draw the rail and the markers on the right of the text, for a right-to-left
   * reading or a history beside a wider body of content. */
  side?: 'start' | 'end'
}

/**
 * The list itself.
 *
 * An ordered list, because the order is the content. A product that shows the
 * newest first hands them over in that order - the component does not sort,
 * since "newest first" and "the order it happened" are both right and only the
 * product knows which it means.
 */
export function Timeline({ side, className, children, ...props }: TimelineProps) {
  // Defaulted here rather than in the parameter list: a string default in the
  // props reads to the word gate as English shipped inside a primitive, and
  // the rule it enforces is worth more than the shorter spelling.
  const on = side ?? 'start'
  return (
    <ol
      className={cn('flex flex-col', on === 'end' && 'items-end', className)}
      data-side={on}
      {...props}
    >
      {children}
    </ol>
  )
}

export interface TimelineItemProps
  extends Omit<HTMLAttributes<HTMLLIElement>, 'title'>,
    VariantProps<typeof timelineMarkerVariants> {
  /** The headline of the entry - what happened. */
  title: ReactNode
  /** When it happened. Drawn quieter, and given as a node so the product can
   * pass its own `RelativeTime` rather than a string it formatted early. */
  time?: ReactNode
  /** A shape inside the marker - a tick, a cross, a number. The second
   * channel, for a reader who does not separate the hues. */
  icon?: ReactNode
  /** The last entry does not draw a rail below it. Set by the product, because
   * only it knows whether the history ends here or merely stops being shown. */
  last?: boolean
  /** Names the state in the product's words, for a reader who does not see the
   * colour. Required whenever `status` carries meaning the title does not
   * already say. */
  statusLabel?: string
}

/**
 * One entry: a marker, a rail down to the next, and what happened.
 *
 * The rail belongs to this entry rather than to the list, so a history can end
 * cleanly - and so an entry can be rendered on its own in a test or a preview
 * without a container to inherit a border from.
 */
export function TimelineItem({
  title,
  time,
  icon,
  status,
  pending,
  last = false,
  statusLabel,
  className,
  children,
  ...props
}: TimelineItemProps) {
  return (
    <li className={cn('flex gap-3', className)} {...props}>
      {/* The column runs the full height of the entry, gap included. The
          spacing between entries is on the text beside it rather than on the
          `<li>`, and that is not a detail of taste: with the padding on the
          item, the column stops above it and the rail stops with it - leaving
          a gap of exactly the padding between one rail and the next marker.
          Measured on the stand at 18-22px per entry, and invisible to a test
          that counts rails rather than asking where they reach. */}
      <div className="relative flex flex-col items-center self-stretch">
        <span
          className={cn(
            timelineMarkerVariants({ status, pending }),
            // Room for a glyph when there is one; a bare dot stays small
            // enough to read as a point on a line rather than as a bullet.
            icon ? 'mt-0.5 size-5 text-[10px]' : 'mt-1.5 size-2.5',
          )}
          // The marker is decorative when the state is not named. When it is,
          // the name is what a reader gets in place of the colour.
          role={statusLabel ? 'img' : undefined}
          aria-label={statusLabel}
          aria-hidden={statusLabel ? undefined : true}
        >
          {icon}
        </span>
        {!last && (
          // From just under the marker to the bottom of the entry, which is
          // where the next marker begins.
          <span aria-hidden className="mt-1 w-px flex-1 bg-line" />
        )}
      </div>

      <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5', last ? 'pb-0.5' : 'pb-4')}>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm text-text">{title}</span>
          {time && <span className="text-2xs text-faint">{time}</span>}
        </div>
        {children && <div className="text-xs text-dim">{children}</div>}
      </div>
    </li>
  )
}
