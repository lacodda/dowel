# Wizard

Source: https://lacodda.github.io/dowel/components/wizard

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#wizard

A workspace-setup wizard that checks each step, waits on a slow check, keeps what was typed on Back - above and beside its stepper.

## Notes

The [`Stepper`](/dowel/components/stepper/) on top, the current step's
content under it, and a Back / Next / Finish row. It installs the Stepper
with it.

```tsx
<Wizard
  stepperLabel={t('setup.steps')}
  stateLabels={{ done: t('step.done'), error: t('step.error') }}
  summary={(position, total) => t('step.position', { position, total })}
  backLabel={t('back')}
  nextLabel={t('next')}
  finishLabel={t('setup.create')}
  onFinish={createWorkspace}
  steps={[
    { id: 'name', label: t('setup.name'), canAdvance: () => name !== '', content: <NameStep /> },
    { id: 'storage', label: t('setup.storage'), onNext: checkFolder, content: <StorageStep /> },
    { id: 'review', label: t('setup.review'), content: <Review /> },
  ]}
/>
```

**Clicking a step.** Clicking a step behind you is free. Clicking a completed
step ahead runs every check between here and there, and stops on the first
step that fails. The Stepper's default `reach` applies, so steps never reached
cannot be clicked.

**A step counts as done only once it passes.** When you go back, a step you
have seen but never completed stays upcoming. It is not a way forward.

**Every step is checked in the same order.** Next, Enter in a field, and a
click on a step ahead all run the same checks: the browser's own constraints
on the step's fields (`required`, `pattern`), then `canAdvance`, then the
async `onNext`. If any returns `false` or throws, the user stays on the step
and it is marked failed. While `onNext` runs, the controls are disabled, so
a second press does not run it twice. A thrown error goes to `onError`, or is
rethrown if there is none, so it is never swallowed. The form is `noValidate`
because the browser would otherwise check the hidden fields of earlier steps
too.

**Enter is Next, never Finish.** Enter in a field goes through the same checks
as Next. On the last step Enter does nothing: finishing creates something, so
it takes a press of the button that says so.

**Focus moves to the new step's heading.** When the step changes, the
keyboard lands on the step's `h2`, which is focusable by script only. Without
that, focus would stay on the Next button with a new page above it, and a
screen reader would say nothing. The Wizard does not take focus when it first
renders.

**Back keeps what was typed.** A step's panel stays mounted once visited and
is hidden rather than unmounted. Going Back finds text, choices and toggles
as they were left, whether or not the product lifted that state out.

**Every word is the product's.** The button labels and the stepper's words
are required props. There are no English defaults.

**Controlled or not.** `defaultStep` covers the common case. `step` with
`onStepChange` is for a step kept in the URL or restored from storage. A
controlled product decides whether to move. It never decides whether to
check: `onStepChange` is called only after the checks pass.

**A server can fail a step from outside.** A step's `error` marks it failed
when something the wizard cannot see rejected what it holds.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `steps` (required) | `readonly WizardStep[]` |  | The steps, in order. Each has an `id`, a label, its `content`, and optional checks that run before the wizard moves on. |
| `step` | `string` |  | The step shown, for a controlled wizard. |
| `defaultStep` | `string` |  | The step shown first, for an uncontrolled one. The first step if omitted. |
| `onStepChange` | `(id: string) => void` |  | Called with the step to move to - after its checks have passed, when moving forward. A controlled wizard moves when the product sets `step`. |
| `onFinish` (required) | `() => void \| Promise<void>` |  | Called when Finish is pressed on the last step and its checks pass. |
| `onError` | `(error: unknown, stepId: string) => void` |  | Called when a step's `onNext` throws. The step is blocked and marked failed either way; without this the error is rethrown so it is not lost. |
| `stepperLabel` (required) | `string` |  | The stepper's name for a reader. |
| `stateLabels` (required) | `StepStateLabels` |  | The words for a step's state - done, failed, and optionally not yet reached - which the stepper says to a screen reader beside the mark. |
| `summary` | `(position: number, total: number) => ReactNode` |  | The position in words, such as `(2, 5) => 'Step 2 of 5'`. The stepper shows it when it is too narrow for its labels. |
| `backLabel` (required) | `ReactNode` |  | The buttons' words. Required: the component has none of its own. |
| `nextLabel` (required) | `ReactNode` |  | The words of the button that goes to the next step. |
| `finishLabel` (required) | `ReactNode` |  | The words of the button on the last step that finishes the wizard. |
| `orientation` | `horizontal \| vertical` | `'horizontal'` | Stepper above the content, or beside it. |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `2` | Where a step's title stands in the page's outline: `2` by default, under the screen's title. |

And every prop of `HTMLAttributes<HTMLFormElement>` except `children`, `onSubmit`, `onError`, passed on.
