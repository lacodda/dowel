import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from 'dowel-ui'
import { Button } from './button'
import { Stepper, type StepStateLabels, type StepperStep } from './stepper'

/*
 * Wizard.
 *
 * A Stepper with the current step's content under it and the Back / Next /
 * Finish row that walks through the steps - checking each one before it lets
 * the user past. The Stepper alone shows progress; this is the form that
 * makes it, and a product that only needs the picture should not install the
 * form.
 *
 * Every way forward runs the same checks: Next, Enter in a field, and a click
 * on a completed step ahead in the stepper. The browser's own constraints on
 * the step's fields come first, then `canAdvance`, then the async `onNext`;
 * `false` or a throw keeps the user where they are and marks the step failed.
 * A wizard whose Enter key or stepper skipped the checks would have checks
 * that only the mouse on the Next button ever met.
 *
 * It is both controlled and uncontrolled, like every input in the set:
 * `defaultStep` for the common case where nothing outside cares which step is
 * showing, `step` + `onStepChange` for the case where something does - a step
 * in the URL, so the browser's Back button walks the wizard, or a product
 * that restores a half-finished setup. Either way the wizard runs the step's
 * checks before it asks to move forward; a controlled product decides whether
 * to move, never whether to validate.
 *
 * Its steps stay mounted once visited and are hidden rather than unmounted,
 * so going Back finds the fields as they were left - typed text, a picked
 * folder, a toggled switch - whether or not the product lifted that state
 * out. Losing a page of input to a Back button is the complaint every wizard
 * collects first, and the cost of keeping a handful of hidden panels in the
 * document is small against it.
 *
 * When the step changes, focus moves to the new step's heading, so a keyboard
 * or screen-reader user lands in the new content rather than on a Next button
 * at the bottom of a page they have not heard. All the words - the buttons,
 * the stepper's - are the product's, and required.
 */

/** What a step's check may return. `false` blocks; so does throwing. Anything
 * else lets the wizard go on. */
type CheckResult = boolean | void

export interface WizardStep extends Omit<StepperStep, 'status'> {
  /** The step itself - its fields, its choices. Stays mounted once visited. */
  content: ReactNode
  /** A synchronous check, run first. `false` keeps the user on the step. */
  canAdvance?: () => boolean
  /**
   * Run when the user asks to leave the step forward, after `canAdvance`. May
   * be async - a name checked against a server, a folder checked for write
   * access. Returning `false` or throwing keeps the user on the step; the
   * controls are disabled while it runs, so a second press does not run it
   * twice.
   */
  onNext?: () => CheckResult | Promise<CheckResult>
  /** Mark the step as failed from outside - a server rejected what it holds. */
  error?: boolean
}

export interface WizardProps extends Omit<HTMLAttributes<HTMLFormElement>, 'children' | 'onSubmit' | 'onError'> {
  steps: readonly WizardStep[]
  /** The step shown, for a controlled wizard. */
  step?: string
  /** The step shown first, for an uncontrolled one. The first step if omitted. */
  defaultStep?: string
  /** Called with the step to move to - after its checks have passed, when
   * moving forward. A controlled wizard moves when the product sets `step`. */
  onStepChange?: (id: string) => void
  /** Called when Finish is pressed on the last step and its checks pass. */
  onFinish: () => void | Promise<void>
  /** Called when a step's `onNext` throws. The step is blocked and marked
   * failed either way; without this the error is rethrown so it is not lost. */
  onError?: (error: unknown, stepId: string) => void
  /** The stepper's name for a reader. */
  stepperLabel: string
  stateLabels: StepStateLabels
  summary?: (position: number, total: number) => ReactNode
  /** The buttons' words. Required: the component has none of its own. */
  backLabel: ReactNode
  nextLabel: ReactNode
  finishLabel: ReactNode
  /** Stepper above the content, or beside it. */
  orientation?: 'horizontal' | 'vertical'
}

export function Wizard({
  steps,
  step: controlledStep,
  defaultStep,
  onStepChange,
  onFinish,
  onError,
  stepperLabel,
  stateLabels,
  summary,
  backLabel,
  nextLabel,
  finishLabel,
  orientation = 'horizontal',
  className,
  ...props
}: WizardProps) {
  const [ownStep, setOwnStep] = useState(defaultStep ?? steps[0]?.id ?? '')
  const current = controlledStep ?? ownStep
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === current),
  )
  const currentStep = steps[currentIndex]

  // Steps that were ever shown stay mounted, so Back finds them as they were.
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set([current]))
  // Steps whose checks passed when they were last left forward. A step ahead
  // of the current one is drawn as done only if it is in here.
  const [passed, setPassed] = useState<ReadonlySet<string>>(() => new Set())
  const [failed, setFailed] = useState<ReadonlySet<string>>(() => new Set())
  const [pending, setPending] = useState(false)
  // The guard against a second press while a check runs reads this rather
  // than `pending`: two presses inside one frame both see the state from
  // before either of them.
  const running = useRef(false)

  const panels = useRef(new Map<string, HTMLElement>())
  const heading = useRef<HTMLHeadingElement>(null)
  const baseId = useId()

  // `visited` is derived from `current` as it changes rather than set where
  // the move is made, because a controlled wizard moves when the product
  // says so and the move is not made here at all.
  if (!visited.has(current)) setVisited(new Set(visited).add(current))

  // The step changed: put the keyboard in its heading. Without this focus
  // stays on the Next button - now at the bottom of a different page - and a
  // screen reader says nothing about the new step at all. Not on the first
  // render: a wizard that steals focus when a screen opens moves the reader
  // away from wherever they were.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    heading.current?.focus()
  }, [current])

  const goTo = useCallback(
    (id: string) => {
      if (controlledStep === undefined) setOwnStep(id)
      onStepChange?.(id)
    },
    [controlledStep, onStepChange],
  )

  const mark = (id: string, ok: boolean) => {
    setFailed((prev) => {
      if (prev.has(id) === !ok) return prev
      const next = new Set(prev)
      if (ok) next.delete(id)
      else next.add(id)
      return next
    })
    setPassed((prev) => {
      if (prev.has(id) === ok) return prev
      const next = new Set(prev)
      if (ok) next.add(id)
      else next.delete(id)
      return next
    })
  }

  /** Run one step's checks, in order: the browser's own constraints on its
   * fields (`required`, `pattern`), then `canAdvance`, then `onNext`. */
  const check = async (target: WizardStep): Promise<boolean> => {
    const panel = panels.current.get(target.id)
    if (panel) {
      // The form is `noValidate`, because the browser would otherwise check
      // every field in it - including the hidden ones of steps already left -
      // and refuse to submit over a field nobody can see. So the check is
      // made here, one step's fields at a time.
      const fields = panel.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        'input, select, textarea',
      )
      for (const field of fields) {
        if (!field.checkValidity()) {
          if (target.id === current) field.reportValidity()
          return false
        }
      }
    }
    if (target.canAdvance && !target.canAdvance()) return false
    if (target.onNext) {
      try {
        const result = await target.onNext()
        if (result === false) return false
      } catch (error) {
        mark(target.id, false)
        if (onError) onError(error, target.id)
        else throw error
        return false
      }
    }
    return true
  }

  /** Move forward to `targetIndex`, checking every step on the way. A step
   * that fails stops the walk there and is the one shown, so the user lands
   * on the thing that needs fixing rather than past it. */
  const advance = async (targetIndex: number, finish: boolean) => {
    if (running.current) return
    running.current = true
    setPending(true)
    try {
      for (let index = currentIndex; index < targetIndex || (finish && index === currentIndex); index += 1) {
        const target = steps[index]!
        const ok = await check(target)
        mark(target.id, ok)
        if (!ok) {
          if (index !== currentIndex) goTo(target.id)
          return
        }
        if (finish) {
          await onFinish()
          return
        }
      }
      const target = steps[targetIndex]
      if (target) goTo(target.id)
    } finally {
      running.current = false
      setPending(false)
    }
  }

  const isLast = currentIndex === steps.length - 1

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Enter in a field is Next, through the same checks the button runs - a
    // wizard is a form and people press Enter in forms. On the last step it
    // does nothing: finishing sets something up, and that should take a
    // press of the button that says so, not a key pressed to leave a field.
    if (isLast) return
    void advance(currentIndex + 1, false)
  }

  const stepperSteps: StepperStep[] = steps.map((step, index) => ({
    id: step.id,
    label: step.label,
    description: step.description,
    status:
      step.error || failed.has(step.id)
        ? 'error'
        : index > currentIndex && passed.has(step.id)
          ? 'done'
          : undefined,
  }))

  const onStepSelect = (id: string) => {
    const index = steps.findIndex((step) => step.id === id)
    if (index < 0 || index === currentIndex || pending) return
    // Back is free; forward walks through every check in between.
    if (index < currentIndex) goTo(id)
    else void advance(index, false)
  }

  const vertical = orientation === 'vertical'

  return (
    <form
      noValidate
      aria-busy={pending || undefined}
      onSubmit={onSubmit}
      className={cn('flex gap-6', vertical ? 'flex-row' : 'flex-col', className)}
      {...props}
    >
      <Stepper
        label={stepperLabel}
        steps={stepperSteps}
        current={current}
        stateLabels={stateLabels}
        summary={summary}
        orientation={orientation}
        onStepSelect={onStepSelect}
        className={vertical ? 'w-56 shrink-0' : undefined}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {steps.map((step) => {
          if (!visited.has(step.id)) return null
          const shown = step.id === currentStep?.id
          const headingId = `${baseId}-${step.id}`
          return (
            <section
              key={step.id}
              hidden={!shown}
              aria-labelledby={headingId}
              ref={(node) => {
                if (node) panels.current.set(step.id, node)
                else panels.current.delete(step.id)
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <h2
                  id={headingId}
                  ref={shown ? heading : undefined}
                  // Focusable by script only: it is where the wizard puts the
                  // reader on a step change, not a stop on the Tab order.
                  tabIndex={-1}
                  className="rounded-xs text-base font-semibold text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {step.label}
                </h2>
                {step.description !== undefined && (
                  <p className="mt-1 text-sm text-dim">{step.description}</p>
                )}
              </div>
              {step.content}
            </section>
          )
        })}

        <div className="flex items-center justify-between gap-2 border-t border-line pt-4">
          {currentIndex > 0 ? (
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => goTo(steps[currentIndex - 1]!.id)}
            >
              {backLabel}
            </Button>
          ) : (
            // Holds Next to the right on the first step, where there is no
            // Back: a disabled Back would be a control that does nothing.
            <span />
          )}
          {isLast ? (
            <Button variant="primary" disabled={pending} onClick={() => void advance(currentIndex, true)}>
              {finishLabel}
            </Button>
          ) : (
            // `submit`, so Enter in a field is this button - and runs the
            // same checks.
            <Button type="submit" variant="primary" disabled={pending}>
              {nextLabel}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
