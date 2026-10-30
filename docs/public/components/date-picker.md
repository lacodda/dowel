# DatePicker

Source: https://lacodda.github.io/dowel/components/date-picker

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#date-picker

Empty, chosen, bounded, and inside a Field.

## Notes

**The trigger is a button, not a typable field.** A date input has to answer
"what does `03/04/26` mean" in a locale it cannot be sure of, and it answers
wrong for half the world. A button showing the date spelled out has no such
question. Where typing genuinely matters — a birth date forty years back — a
calendar is the wrong control anyway.

```tsx
<DatePicker
  value={releasedOn}              // '2026-09-02'
  onValueChange={setReleasedOn}
  placeholder="Pick a date"
  previousMonthLabel="Previous month"
  nextMonthLabel="Next month"
/>
```

**What is shown is `Intl`'s own long form** — "2 September 2026" here,
"September 2, 2026" in the United States. The stored value never changes.

**It closes when a day is chosen.** Choosing is the whole errand; waiting for
a second dismissing click is one click too many.

**An optional date can be taken back.** Give `clearLabel` and, while a day is
chosen, the popup offers it under the month in your words; `onValueChange` is
then told `undefined`. In the popup rather than as a cross on the field: the
trigger is a button and cannot hold another, and a cross laid over it is a
second, smaller target against the first. A required field gives no words and
cannot be emptied - and the type agrees: only a picker given `clearLabel` takes
a handler that has to deal with no date.

```tsx
<DatePicker value={due} onValueChange={setDue} clearLabel={t('clear')} ... />
```

**`name` puts the value where a form can find it.** A button is not a field,
so without it a form submits the screen and loses the date — the component
writes a hidden input instead.

```tsx
<DatePicker name="released_on" ... />   // submits 2026-09-02
```

**Inside a `Field` the label names the trigger.** The id the label points at
and the two `aria-` references go on the button, and the button is named by the
label and then the date - "Release, 2 September 2026" - rather than by the date
alone. A press on the label opens the month.

```tsx
<Field label="Release" help="The day it goes out.">
  <DatePicker value={releasedOn} onValueChange={setReleasedOn} ... />
</Field>
```

The value, the arithmetic and the keyboard are the
[Calendar](/dowel/components/calendar/)'s; this is the field around it.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `clearLabel` | `string` |  | The words of the button that takes the date back: "Clear". Leave it out and a chosen date stays chosen - the shape of a required field. |
| `onValueChange` | `(value: string \| undefined) => void \| (value: string) => void` |  | Told the chosen day, or `undefined` when it is taken back. |
| `value` | `string` |  | The chosen day, or `undefined` for none. |
| `min` | `string` |  | The earliest day that can be chosen, inclusive. |
| `max` | `string` |  | The latest day that can be chosen, inclusive. |
| `placeholder` (required) | `string` |  | What the trigger says when nothing is chosen. The product's word, since a default here would be English inside a primitive. |
| `previousMonthLabel` (required) | `string` |  | Names the two month-paging buttons inside the calendar. |
| `nextMonthLabel` (required) | `string` |  | Names the next-month paging button inside the calendar. |
| `locale` | `string` |  | How the date is written and which day starts the week. The application's language unless stated - see `useLocale`. |
| `disabled` | `boolean` | `false` | Stops the trigger opening the calendar. |
| `name` | `string` |  | Puts the value in a form: a hidden input of this name carries the date, because the trigger is a button and a form would otherwise lose it. |
| `id` | `string` |  | Put on the trigger, so a `Field` label can point at it. |
| `aria-label` | `string` |  | The accessible name of the field, in place of a visible label. |
| `aria-labelledby` | `string` |  | Points at the element that names the field; a `Field` label hands this over. The date shown on the trigger is added to the name. |
| `aria-describedby` | `string` |  | Points at the hint or error text, put on the trigger. |
| `aria-invalid` | `true \| false \| boolean` |  | Marks the trigger as holding an invalid value. |
| `className` | `string` |  |  |
