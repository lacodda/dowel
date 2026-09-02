import { useId, type KeyboardEvent } from 'react'
import { cn } from 'dowel-ui'

/*
 * RatingScale - a judgement on a short scale, and the absence of one.
 *
 * Generalised from kilna, where it is how a work is scored on each of its
 * axes. The shape is a row of marks rather than stars: stars carry a meaning
 * of their own - a review, a public verdict - and this is as often "how hard
 * was this" or "how finished is it" as it is "how good".
 *
 * The part worth keeping from the donor, and the reason this is not a Slider
 * with a small range: **not judged yet is a state, not a zero.** "I have not
 * scored this" and "I scored it nothing" are different facts, and a control
 * that collapses them makes the difference unrecoverable the moment it is
 * saved. So `value` is `number | undefined`, clicking the current mark clears
 * it, and Backspace does the same from the keyboard.
 *
 * One tab stop, arrows within it - the arrangement a radio group has. The
 * marks are not buttons: the container is the control, and a `<button>` inside
 * an element with `role="slider"` is a nested interactive control - axe calls
 * it out, and it is right, because assistive technology is not promised to
 * announce or reach the inner one. The donor had them as `aria-hidden`
 * buttons, which hides them from a reader without making them stop being
 * controls.
 *
 * So a mark is a plain element that happens to accept a click. Everything
 * that makes the control usable - the tab stop, the keyboard, the announced
 * value - belongs to the container, and the pointer is served by the marks.
 */

export interface RatingScaleProps {
  /** How many marks. */
  scale: number
  /** The score, or `undefined` for not judged yet. */
  value: number | undefined
  onValueChange: (value: number | undefined) => void
  /** What is being judged. Required: a bare row of marks names nothing, and
   * this is the only thing a screen reader has to go on. */
  label: string
  /** What a screen reader hears in place of a number when nothing is chosen.
   * Required rather than defaulted, because a default here would be English
   * shipped inside a primitive. */
  emptyLabel: string
  disabled?: boolean
  className?: string
}

export function RatingScale({
  scale,
  value,
  onValueChange,
  label,
  emptyLabel,
  disabled = false,
  className,
}: RatingScaleProps) {
  const id = useId()
  const marks = Math.max(1, Math.round(scale))

  const clamp = (next: number) => Math.min(Math.max(next, 0), marks)

  const step = (delta: number) => {
    if (disabled) return
    // From nothing, a step forward lands on the first mark and a step back on
    // the last - so either arrow starts scoring rather than doing nothing.
    const next = value === undefined ? (delta > 0 ? 1 : marks) : value + delta
    onValueChange(clamp(next))
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (disabled) return
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        event.preventDefault()
        step(1)
        break
      case 'ArrowLeft':
      case 'ArrowDown':
        event.preventDefault()
        step(-1)
        break
      case 'Home':
        event.preventDefault()
        onValueChange(0)
        break
      case 'End':
        event.preventDefault()
        onValueChange(marks)
        break
      case 'Backspace':
      case 'Delete':
        // The keyboard's way back to not judged. Without it the state is
        // reachable only by clicking the mark that is already chosen.
        event.preventDefault()
        onValueChange(undefined)
        break
      default:
        break
    }
  }

  return (
    <div
      id={id}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={marks}
      aria-valuenow={value}
      aria-valuetext={value === undefined ? emptyLabel : String(value)}
      aria-disabled={disabled || undefined}
      onKeyDown={onKeyDown}
      className={cn(
        'flex gap-[3px] rounded-md',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {Array.from({ length: marks }, (_, index) => {
        const mark = index + 1
        const filled = value !== undefined && mark <= value
        return (
          <span
            key={mark}
            // Deliberately not a button. The container is the control; a
            // nested one would be a second interactive element inside a
            // `slider`, which assistive technology is not promised to handle.
            aria-hidden
            // Clicking the mark already chosen clears the score. That is the
            // pointer's way back to not judged, and it is why a rating is not
            // a five-option radio group.
            onClick={() => {
              if (disabled) return
              onValueChange(value === mark ? undefined : mark)
            }}
            className={cn(
              'h-[22px] flex-1 rounded-sm transition-colors',
              disabled ? 'cursor-not-allowed' : 'cursor-pointer',
              filled ? 'bg-accent' : 'bg-soft',
              !disabled && (filled ? 'hover:bg-accent-2' : 'hover:bg-line-2'),
            )}
          />
        )
      })}
    </div>
  )
}
