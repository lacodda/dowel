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
| `value` | `IsoDate` | | `YYYY-MM-DD` |
| `onValueChange` | `(value) => void` | | |
| `min`, `max` | `IsoDate` | | Bounds, inclusive |
| `placeholder` | `string` | | Required — what the trigger says when empty |
| `previousMonthLabel` | `string` | | Required |
| `nextMonthLabel` | `string` | | Required |
| `locale` | `string` | the application's (`useLocale`) | |
| `name` | `string` | | Puts the value in the form |
| `id`, `aria-labelledby`, `aria-describedby`, `aria-invalid` | | | Put on the trigger - what a `Field` hands it |
| `disabled` | `boolean` | `false` | |
