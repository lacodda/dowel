import type { HTMLAttributes, ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from 'dowel-ui'

/*
 * Stepper.
 *
 * The steps of a task too long for one screen, and where you stand in them:
 * set up a workspace, import a library, configure a connection. It is a
 * picture of progress on its own, and the top of a Wizard when the steps are
 * a form - a product can show how far along something is without owning the
 * form that moves it, which is why the two are separate components. Base UI
 * has no stepper, so this one is written here rather than wrapped.
 *
 * An ordered list, like Breadcrumbs, because the order is the meaning: a
 * reader hears "list, 4 items" and then the steps in the order they are taken.
 * The step you are on carries `aria-current="step"`, which is what tells a
 * reader which of the four is the one in front of them rather than a list of
 * four equal names.
 *
 * **Meaning does not rest on colour.** A finished step draws a tick, a step
 * that failed its check draws an exclamation mark, the current one a filled
 * number and the ones ahead an outlined number - four shapes, so the stepper
 * reads in a greyscale screenshot and for the one man in twelve who does not
 * separate the accent from the error hue. The same states are written out for
 * a reader, in words the product gives (`stateLabels`): the component has no
 * strings of its own, because "Completed" is the product's vocabulary in the
 * product's language.
 *
 * **Narrow, it keeps the marks and drops the words.** A horizontal stepper in
 * a container narrower than `@xl` shows every step's mark but only the
 * current step's label; the others move off the screen and stay in the
 * accessibility tree. The marks still say how far along you are and which
 * steps are done, and `summary` - "Step 2 of 5", in the product's words - can
 * say it outright. Wrapping five labels onto three lines was the alternative,
 * and it turns a progress line into a paragraph. The breakpoint is the
 * container's, not the viewport's, since a wizard in a dialog is narrow on a
 * wide screen.
 *
 * **Going ahead is not a click away.** Steps are clickable only when the
 * product asks (`onStepSelect`), and even then only the steps already reached
 * - done, failed, or current. Clicking a step ahead is how a wizard's
 * validation is usually skipped: the user lands on step four with step two
 * half-filled and nothing ever checked it. `reach="any"` opens the steps ahead
 * too, and is named so that choosing it is a decision.
 */

/** Where a step stands. `error` is a step whose check failed - it is shown with
 * its own mark whether it is behind you or the one you are on. */
export type StepState = 'done' | 'current' | 'upcoming' | 'error'

export interface StepperStep {
  id: string
  label: ReactNode
  description?: ReactNode
  /**
   * What the step is, stated rather than inferred. Without it a step before
   * the current one is done and a step after it is upcoming; `done` marks a
   * step ahead that was already completed (the user went back), `error` a
   * step that failed its check.
   */
  status?: 'done' | 'error'
}

/** The words a reader hears for the states the marks draw. `current` has none:
 * `aria-current="step"` already says it, in the reader's own language. */
export interface StepStateLabels {
  done: string
  error: string
  /** Optional, because an unmarked step reads as not yet reached. */
  upcoming?: string
}

/** The mark in front of each label. Every state differs in shape as well as in
 * hue - a tick, a mark, a filled number, an outlined number - which is the
 * rule the whole component rests on. */
export const stepMarkerVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
    'transition-colors duration-(--duration-base) ease-(--ease-out)',
  ],
  {
    variants: {
      state: {
        done: 'bg-accent-soft text-accent',
        current: 'bg-accent text-on-accent',
        upcoming: 'border border-line-2 text-dim',
        error: 'bg-bad-soft text-bad',
      },
    },
    defaultVariants: { state: 'upcoming' },
  },
)

export interface StepperProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onSelect'> {
  /** What the list is called for a reader - "Setup steps". */
  label: string
  steps: readonly StepperStep[]
  /** The id of the step being shown. */
  current: string
  /** The words for the states, read by a screen reader beside each label. */
  stateLabels: StepStateLabels
  /**
   * The position in words - `(2, 5) => 'Step 2 of 5'`. Shown only when a
   * horizontal stepper is too narrow for its labels. A function of the two
   * numbers rather than a string, because the product says it in its own
   * language and grammar.
   */
  summary?: (position: number, total: number) => ReactNode
  /** Makes reachable steps buttons. Without it the stepper is a picture of
   * progress and nothing in it is a control. */
  onStepSelect?: (id: string) => void
  /**
   * Which steps can be clicked. `visited` - the default - is done, failed and
   * current ones; `any` also opens the ones ahead, which skips whatever check
   * stands between here and there. Only a product that has made the steps
   * independent should choose it.
   */
  reach?: 'visited' | 'any'
  /** A row across the top, or a column down the side. Only the row folds its
   * labels away when narrow; a column has the height to keep them. */
  orientation?: 'horizontal' | 'vertical'
}

/** A step's state from its place and from what the product said about it. */
export function stepState(step: StepperStep, index: number, currentIndex: number): StepState {
  if (step.status === 'error') return 'error'
  if (index === currentIndex) return 'current'
  if (step.status === 'done' || index < currentIndex) return 'done'
  return 'upcoming'
}

export function Stepper({
  label,
  steps,
  current,
  stateLabels,
  summary,
  onStepSelect,
  reach = 'visited',
  orientation = 'horizontal',
  className,
  ...props
}: StepperProps) {
  const horizontal = orientation === 'horizontal'
  const currentIndex = steps.findIndex((step) => step.id === current)

  const list = (
    <>
      {horizontal && summary && currentIndex >= 0 && (
        // Only in the narrow form, where the labels have gone and the position
        // needs saying. `hidden` rather than `sr-only` in the wide form: there
        // the list says it, and a reader hearing it twice is hearing noise.
        <p className="mb-2 text-xs text-dim @xl:hidden">{summary(currentIndex + 1, steps.length)}</p>
      )}
      <ol
        className={cn(
          'flex',
          horizontal ? 'items-center gap-2' : 'flex-col',
        )}
      >
        {steps.map((step, index) => {
          const state = stepState(step, index, currentIndex)
          const isCurrent = index === currentIndex
          const reachable = reach === 'any' || index <= currentIndex || state !== 'upcoming'
          return (
            <StepperItem
              key={step.id}
              step={step}
              index={index}
              state={state}
              isCurrent={isCurrent}
              last={index === steps.length - 1}
              horizontal={horizontal}
              stateLabels={stateLabels}
              onSelect={onStepSelect && reachable ? () => onStepSelect(step.id) : undefined}
            />
          )
        })}
      </ol>
    </>
  )

  // A landmark only when there is somewhere to go. A stepper nobody can click
  // is a progress picture, and announcing it as navigation would promise a
  // reader controls that are not there.
  return onStepSelect ? (
    <nav aria-label={label} className={cn('@container min-w-0', className)} {...props}>
      {list}
    </nav>
  ) : (
    <div
      role="group"
      aria-label={label}
      className={cn('@container min-w-0', className)}
      {...props}
    >
      {list}
    </div>
  )
}

function StepperItem({
  step,
  index,
  state,
  isCurrent,
  last,
  horizontal,
  stateLabels,
  onSelect,
}: {
  step: StepperStep
  index: number
  state: StepState
  isCurrent: boolean
  last: boolean
  horizontal: boolean
  stateLabels: StepStateLabels
  onSelect?: () => void
}) {
  const stateWord =
    state === 'done' ? stateLabels.done : state === 'error' ? stateLabels.error : state === 'upcoming' ? stateLabels.upcoming : undefined

  // Narrow and horizontal, only the current step keeps its words on the
  // screen. The others go to `sr-only`, not `hidden`: a reader still hears
  // every step.
  const collapsible = horizontal && !isCurrent
  const text = (
    <span className={cn('flex min-w-0 flex-col', collapsible && 'sr-only @xl:not-sr-only')}>
      <span
        className={cn(
          'truncate text-sm',
          isCurrent ? 'font-semibold text-text' : 'text-dim',
          state === 'error' && 'text-bad',
        )}
      >
        {step.label}
      </span>
      {step.description !== undefined && (
        <span className={cn('text-xs text-faint', horizontal && 'sr-only @xl:not-sr-only @xl:truncate')}>
          {step.description}
        </span>
      )}
      {stateWord && <span className="sr-only">{stateWord}</span>}
    </span>
  )

  const glyph =
    state === 'done' ? <Tick /> : state === 'error' ? <Mark /> : <span>{index + 1}</span>

  const itemClass = cn(
    'flex min-w-0 items-start gap-2 rounded-md text-left',
    horizontal ? 'items-center' : 'items-start',
  )

  const item = onSelect ? (
    <button
      type="button"
      aria-current={isCurrent ? 'step' : undefined}
      onClick={onSelect}
      className={cn(
        itemClass,
        'cursor-pointer py-1 pr-1 transition-colors duration-(--duration-quick) hover:bg-soft',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
      )}
    >
      <span aria-hidden className={cn('size-6', stepMarkerVariants({ state }))}>
        {glyph}
      </span>
      {text}
    </button>
  ) : (
    <span aria-current={isCurrent ? 'step' : undefined} className={cn(itemClass, 'py-1')}>
      <span aria-hidden className={cn('size-6', stepMarkerVariants({ state }))}>
        {glyph}
      </span>
      {text}
    </span>
  )

  // The line joining a step to the next: accent once the step is behind you,
  // so the run of finished steps reads as one stroke. Drawing, not structure -
  // the list already says the steps are in order.
  const done = state === 'done'
  const connector = last ? null : (
    <span
      aria-hidden
      className={cn(
        'transition-colors duration-(--duration-base) ease-(--ease-out)',
        done ? 'bg-accent' : 'bg-line',
        horizontal ? 'h-px min-w-3 flex-1' : 'absolute top-8 bottom-0 left-3 w-px',
      )}
    />
  )

  return (
    <li
      className={cn(
        horizontal
          ? cn('flex min-w-0 items-center gap-2', last ? 'shrink-0' : 'flex-1', isCurrent && 'shrink')
          : cn('relative', !last && 'pb-4'),
      )}
    >
      {item}
      {connector}
    </li>
  )
}

function Tick() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Mark() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
      <path d="M8 3.5v5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="12.25" r="1.25" fill="currentColor" />
    </svg>
  )
}
