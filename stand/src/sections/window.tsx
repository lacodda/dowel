import type { ReactNode } from 'react'
import { cn } from 'dowel-ui'
import { Segment, SegmentedControl } from '../../../registry/ui/segmented-control'

/*
 * A window for a block to stand in.
 *
 * A block is a screen, and a screen is drawn against a window's edges - the
 * frame it is laid out in hands the height down and scrolls nowhere, so on a
 * page that grows with its content it would have no height to hand. This is
 * the window: a box of a fixed height, at the page's margins, with the ground
 * a screen sits on.
 *
 * The width switch is the other half. A block is written for a desktop
 * window and a phone, and the phone is where it changes shape - so the stand
 * shows both rather than leaving the narrow one to whoever opens it on one.
 */

export type WindowWidth = 'wide' | 'phone'

export function WidthSwitch({ value, onChange }: { value: WindowWidth; onChange: (next: WindowWidth) => void }) {
  return (
    <SegmentedControl aria-label="Width" value={value} onValueChange={(next) => onChange(next as WindowWidth)}>
      <Segment value="wide">Wide</Segment>
      <Segment value="phone">Phone</Segment>
    </SegmentedControl>
  )
}

export function Window({
  width = 'wide',
  short = false,
  children,
}: {
  width?: WindowWidth
  /** For a block whose point is made in less than a screen. */
  short?: boolean
  children: ReactNode
}) {
  return (
    <div
      data-window
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-lg border border-line bg-bg px-6 pt-4 pb-6',
        short ? 'h-96' : 'h-150',
        // 390px: the phone a layout is usually checked on.
        width === 'phone' && 'max-w-sm px-4 pb-4',
      )}
    >
      {children}
    </div>
  )
}
