import type { HTMLAttributes, MouseEvent } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'dowel-ui'

/*
 * Chip.
 *
 * A badge you can act on: a filter that can be removed, a tag with a count, a
 * selected value in a field. The difference from a Badge is entirely about
 * whether something happens when you click it - and if something does, that
 * part is a real `<button>` with a real label, not a decorative cross.
 *
 * `onRemove` is the reason this exists separately. Every product wrote the
 * same removable tag and every one of them made the cross a `<span>`, which
 * the keyboard cannot reach and a screen reader does not announce.
 */
export const chipVariants = cva(
  'inline-flex items-center gap-1 rounded-full border py-0.5 pl-2.5 text-xs whitespace-nowrap transition-colors',
  {
    variants: {
      variant: {
        outline: 'border-line text-dim',
        accent: 'border-transparent bg-accent-soft text-accent',
        soft: 'border-transparent bg-soft text-dim',
      },
      /** Padding on the right depends on whether a remove button sits there. */
      removable: {
        true: 'pr-1',
        false: 'pr-2.5',
      },
    },
    defaultVariants: { variant: 'outline', removable: false },
  },
)

export interface ChipProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'onSelect'>,
    Omit<VariantProps<typeof chipVariants>, 'removable'> {
  /** Shown after the label, for a count. */
  count?: number
  /** Makes the chip removable. The button is labelled from `removeLabel`. */
  onRemove?: () => void
  /** What the remove button is called, for the keyboard and the screen reader.
   * A component cannot invent this: it would be a string of its own, and a
   * string of its own cannot be translated. */
  removeLabel?: string
}

export function Chip({
  variant,
  count,
  onRemove,
  removeLabel = 'Remove',
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <span className={cn(chipVariants({ variant, removable: Boolean(onRemove) }), className)} {...props}>
      {children}

      {count !== undefined && <span className="text-faint tabular-nums">{count}</span>}

      {onRemove && (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            // A chip is often inside something else that is also clickable.
            event.stopPropagation()
            onRemove()
          }}
          className={cn(
            'grid size-4 place-items-center rounded-full text-faint transition-colors',
            'hover:bg-line hover:text-text',
            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
          )}
        >
          <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  )
}
