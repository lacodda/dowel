import type { HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'dowel-ui'

/*
 * Banner.
 *
 * A strip across the top of the application, about the application: you are
 * offline, this build is a preview, your licence expires on Friday, a new
 * version is ready to install.
 *
 * The difference from Alert is what it speaks about rather than how it looks.
 * An alert belongs to what it sits beside; a banner belongs to the whole
 * screen and is true no matter which one you are on. That is also why it is
 * not dismissed by the component: whether "you are offline" can be dismissed
 * is the product's judgement, not the banner's, so the close button is passed
 * in like any other action.
 *
 * It is a `<div role="status">` by default rather than `role="alert"`: a
 * banner is usually already there when the screen loads, and an alert region
 * that fires on load interrupts whatever a screen reader was saying about the
 * page.
 */

export const bannerVariants = cva(
  [
    'flex w-full items-center gap-3 border-b px-4 py-2 text-sm',
    '[&_svg]:size-4 [&_svg]:shrink-0',
  ],
  {
    variants: {
      tone: {
        neutral: 'border-line bg-raise text-dim',
        accent: 'border-accent/30 bg-accent-soft text-accent',
        good: 'border-good/30 bg-good-soft text-good',
        warn: 'border-warn/30 bg-warn-soft text-warn',
        bad: 'border-bad/30 bg-bad-soft text-bad',
        info: 'border-info/30 bg-info-soft text-info',
      },
      /** Pinned to the top of the viewport, above the application's own
       * chrome. For the ones that must not scroll away - offline, expired. */
      sticky: {
        true: 'sticky top-0 [z-index:var(--z-sticky)]',
        false: '',
      },
    },
    defaultVariants: { tone: 'neutral', sticky: false },
  },
)

export interface BannerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {
  /** Drawn first. The product's own icon, for the same reason as Alert's. */
  icon?: ReactNode
  /** Anything at the end: a button that fixes it, a link, a dismiss the
   * product decides is allowed. */
  action?: ReactNode
}

export function Banner({
  tone,
  sticky,
  icon,
  action,
  role = 'status',
  className,
  children,
  ...props
}: BannerProps) {
  return (
    <div className={cn(bannerVariants({ tone, sticky }), className)} role={role} {...props}>
      {icon}
      <div className="min-w-0 flex-1">{children}</div>
      {action !== undefined && <div className="shrink-0">{action}</div>}
    </div>
  )
}
