import { useState, type Ref } from 'react'
import { cn } from 'dowel-ui'
import { fieldClasses } from './input'

/*
 * DurationField - a length of time, typed the way people say it.
 *
 * The alternative is what products keep building: two number boxes labelled
 * "hours" and "minutes", which means two tab stops, two validations, and a
 * reader who has to divide 90 minutes in their head before typing. Here they
 * write `1h 30m`, or `90m`, or `1.5h`, and it means the same thing.
 *
 * The value is **minutes**, a plain number. Not a string, not a Duration
 * object: the products of this line store durations as minutes already, and
 * a field whose value has to be parsed by its caller has moved the problem
 * rather than solved it.
 *
 * Parsing is deliberately generous and formatting is strict. Anything a
 * person plausibly types is accepted - `2h`, `2 h`, `2:30`, `150`, `2h30`,
 * with or without spaces - and what comes back on blur is always the one
 * canonical spelling. That asymmetry is the whole design: being strict on
 * input means rejecting people, being loose on output means the column of
 * values never lines up.
 *
 * Empty is `null`, like NumberField: "no duration" and "zero minutes" are
 * different answers, and a task with no estimate is not a task estimated at
 * nothing.
 */

/** Minutes from whatever was typed, or `null` for empty, or `undefined` when
 * it cannot be read as a duration at all.
 *
 * Exported because the parsing *is* the component - a test that goes through
 * the DOM checks React's state handling, and what needs checking is this. */
export function parseDuration(text: string): number | null | undefined {
  const input = text.trim().toLowerCase()
  if (input === '') return null

  // `2:30` - the clock spelling, which is unambiguous and worth taking.
  const clock = /^(\d+):([0-5]?\d)$/.exec(input)
  if (clock) return Number(clock[1]) * 60 + Number(clock[2])

  // A bare number is minutes. `90` is an hour and a half, not ninety hours:
  // the field is most often used for something that takes minutes, and a
  // reader typing hours writes the `h`.
  if (/^\d+(?:[.,]\d+)?$/.test(input)) return Math.round(Number(input.replace(',', '.')))

  /* The general form: any number of `<number><unit>` pairs. A decimal is
   * allowed on the hours (`1.5h`) because people write it, and a comma counts
   * as a decimal point because half the world uses one. */
  const pattern = /(\d+(?:[.,]\d+)?)\s*([hm])/g
  let total = 0
  let matched = false
  let consumed = 0

  for (const match of input.matchAll(pattern)) {
    matched = true
    consumed += match[0].length
    const amount = Number(match[1]!.replace(',', '.'))
    total += match[2] === 'h' ? amount * 60 : amount
  }

  // Everything that is not whitespace has to have been part of a pair -
  // otherwise `1h banana` would quietly parse as an hour.
  if (!matched || consumed !== input.replace(/\s+/g, '').length) return undefined

  return Math.round(total)
}

/** The one spelling a duration is written back as: `1h 30m`, `45m`, `2h`.
 *
 * Zero is `0m` rather than blank, because a duration of zero is an answer -
 * blank is what `null` renders as. */
export function formatDuration(minutes: number): string {
  const whole = Math.max(0, Math.round(minutes))
  const hours = Math.floor(whole / 60)
  const rest = whole % 60
  if (hours === 0) return `${rest}m`
  if (rest === 0) return `${hours}h`
  return `${hours}h ${rest}m`
}

export interface DurationFieldProps {
  /** Minutes, or `null` for empty. */
  value: number | null
  onValueChange: (value: number | null) => void
  /** What a reader sees before they type. A duration in the canonical
   * spelling is the best hint there is, so this is the product's to give. */
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  name?: string
  id?: string
  ref?: Ref<HTMLInputElement>
  'aria-label'?: string
  'aria-describedby'?: string
  className?: string
}

export function DurationField({
  value,
  onValueChange,
  className,
  ref,
  ...props
}: DurationFieldProps) {
  /* The field holds text while it is being typed and a number the rest of the
   * time. Without the local copy, typing `1h 3` would reformat under the
   * cursor after every keystroke - the classic controlled-input-with-parsing
   * bug, where the field fights the person using it. */
  const [text, setText] = useState(() => (value === null ? '' : formatDuration(value)))
  const [editing, setEditing] = useState(false)

  /* The `value` this box last saw from outside, adjusted during render rather
   * than in an effect - React's own pattern for a state that has to follow a
   * prop, and the one the `set-state-in-effect` rule points at.
   *
   * The comparison has to be against what was last *seen*, not against
   * `value`. After a commit the two differ in exactly the case that must be
   * left alone: `commit` writes `1h 30m` and tells the parent, the parent
   * still holds `null` for a tick, and comparing with `value` would clear the
   * box under the reader. Asking "has the outside changed?" answers it. */
  const [seen, setSeen] = useState<number | null>(value)

  if (value !== seen) {
    setSeen(value)
    // A value that changed while someone is typing is remembered, not shown:
    // reformatting under the cursor is the bug the local copy exists for.
    if (!editing) setText(value === null ? '' : formatDuration(value))
  }

  const commit = () => {
    setEditing(false)
    const parsed = parseDuration(text)
    if (parsed === undefined) {
      // Unreadable: put back what the value actually is rather than leaving
      // the box saying something the form does not believe.
      setText(value === null ? '' : formatDuration(value))
      return
    }
    setText(parsed === null ? '' : formatDuration(parsed))
    if (parsed !== value) onValueChange(parsed)
  }

  return (
    <input
      {...props}
      ref={ref}
      type="text"
      inputMode="text"
      value={text}
      onFocus={() => setEditing(true)}
      onChange={(event) => setText(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          commit()
        }
      }}
      className={cn(fieldClasses, 'h-9 tabular-nums', className)}
    />
  )
}
