# Stepper

Source: https://lacodda.github.io/dowel/components/stepper

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#stepper

Done, current, upcoming and failed steps; clickable steps; the fold in a narrow container; a vertical stepper.

## Notes

Base UI has no stepper, so this one is written rather than wrapped. It is a
picture of progress on its own. When the steps are a form, the
[`Wizard`](/dowel/components/wizard/) puts one on top of the step's content
and the Back / Next / Finish row. The two are separate because a product can
show how far along something is without owning the form that moves it.

```tsx
<Stepper
  label={t('import.steps')}
  steps={steps}
  current={job.step}
  stateLabels={{ done: t('step.done'), error: t('step.error') }}
  summary={(position, total) => t('step.position', { position, total })}
/>
```

**An ordered list, and `aria-current="step"`.** Like
[`Breadcrumbs`](/dowel/components/breadcrumbs/), the order is the meaning, so
the steps are an `<ol>`. The step you are on is the one marked current, so a
reader hears which of the names is in front of them.

**Meaning does not rest on colour.** A done step draws a tick, a failed step
an exclamation mark, the current one a filled number, the ones ahead an
outlined number. The same states are written out for a screen reader in the
words the product passes as `stateLabels`. The component has no strings of
its own, so every word it shows or speaks comes from a prop.

**Narrow, it keeps the marks and drops the words.** A horizontal stepper in a
container narrower than `@xl` (36rem) shows every mark but only the current
step's label. The other labels leave the screen but stay in the accessibility
tree. `summary` adds the position in words, such as "Step 2 of 5", in the
narrow form only. The fold uses the container's width, not the viewport's,
because a wizard in a dialog is narrow on a wide screen. A vertical stepper
never folds.

**Going ahead is a decision.** Steps are buttons only when `onStepSelect` is
given, and then only the steps already reached: done, failed and current.
Clicking a step ahead is the usual way a wizard's validation gets skipped, so
`reach="any"` has to be chosen on purpose. The Wizard goes further: a click
forward still runs every check in between.

**A step's state is stated or inferred.** `StepperStep.status` is `done` or `error`; without it a step before the current one is done and a step after it is upcoming.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` (required) | `string` |  | What the list is called for a reader - "Setup steps". |
| `steps` (required) | `readonly StepperStep[]` |  | The steps in the order they are taken. Each has an `id`, a `label` and an optional `description` and `status`. |
| `current` (required) | `string` |  | The id of the step being shown. |
| `stateLabels` (required) | `StepStateLabels` |  | The words for the states, read by a screen reader beside each label. |
| `summary` | `(position: number, total: number) => ReactNode` |  | The position in words - `(2, 5) => 'Step 2 of 5'`. Shown only when a horizontal stepper is too narrow for its labels. A function of the two numbers rather than a string, because the product says it in its own language and grammar. |
| `onStepSelect` | `(id: string) => void` |  | Makes reachable steps buttons. Without it the stepper is a picture of progress and nothing in it is a control. |
| `reach` | `visited \| any` | `'visited'` | Which steps can be clicked. `visited` - the default - is done, failed and current ones; `any` also opens the ones ahead, which skips whatever check stands between here and there. Only a product that has made the steps independent should choose it. |
| `orientation` | `horizontal \| vertical` | `'horizontal'` | A row across the top, or a column down the side. Only the row folds its labels away when narrow; a column has the height to keep them. |

And every prop of `HTMLAttributes<HTMLElement>` except `children`, `onSelect`, passed on.
