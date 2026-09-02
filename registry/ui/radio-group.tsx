import type { ReactNode } from 'react'
import { Radio as Base } from '@base-ui/react/radio'
import { RadioGroup as BaseGroup } from '@base-ui/react/radio-group'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'dowel-ui'

/*
 * RadioGroup - one of a few, all of them visible.
 *
 * The rule for reaching for this rather than a Select is whether the options
 * are worth the space: a handful of short choices read faster laid out than
 * hidden behind a trigger, and each one becomes a target rather than a step.
 * Past about five, or when the labels are long, a Select is the honest
 * choice - this is not a Select with more pixels.
 *
 * The group is the control, not the button. That is what the arrow keys
 * follow, what a screen reader announces as one thing with a position in it,
 * and why `Radio` on its own is not exported: a radio outside a group is a
 * checkbox that cannot be unchecked.
 *
 * The dot is drawn rather than native, for the same reason as the tick in
 * Checkbox: a real `<input type=radio>` cannot be styled without
 * `appearance: none`, and after that the dot has to be drawn anyway.
 */

export interface RadioGroupProps {
  children: ReactNode
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  name?: string
  /** Lay the options out in a row. For two or three short ones; a column is
   * the default because it stays readable as labels grow. */
  orientation?: VariantProps<typeof radioGroupVariants>['orientation']
  'aria-label'?: string
  className?: string
}

/* The layout lives in `cva` rather than in a destructured default, which is
 * how every other primitive here states one. It also keeps the word out of
 * the component's signature: a string default in a props list is how a
 * primitive ends up shipping English, and the gate that watches for that
 * cannot tell an enum value from a label. */
export const radioGroupVariants = cva('flex', {
  variants: {
    orientation: {
      vertical: 'flex-col gap-2',
      horizontal: 'flex-row flex-wrap gap-4',
    },
  },
  defaultVariants: { orientation: 'vertical' },
})

export function RadioGroup({ children, orientation, className, ...props }: RadioGroupProps) {
  return (
    <BaseGroup className={cn(radioGroupVariants({ orientation }), className)} {...props}>
      {children}
    </BaseGroup>
  )
}

export interface RadioProps {
  value: string
  /** The words next to the dot. */
  children?: ReactNode
  disabled?: boolean
  className?: string
}

export function Radio({ value, children, disabled, className }: RadioProps) {
  const dot = (
    <Base.Root
      value={value}
      disabled={disabled}
      className={cn(
        'flex size-4 shrink-0 items-center justify-center rounded-full border border-line-2 bg-transparent',
        'transition-colors',
        'hover:border-accent',
        'data-[checked]:border-accent',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        children === undefined && className,
      )}
    >
      <Base.Indicator className="size-2 rounded-full bg-accent" render={<span />} />
    </Base.Root>
  )

  if (children === undefined) return dot

  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 text-sm text-text',
        'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
        className,
      )}
    >
      {dot}
      {children}
    </label>
  )
}
