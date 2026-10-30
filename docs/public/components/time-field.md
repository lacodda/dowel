# TimeField

Source: https://lacodda.github.io/dowel/components/time-field

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#time-field

Filled, empty, and inside a Field with a hint.

## Notes

**The value is `HH:MM` in twenty-four hours, always** — whatever was typed and
whatever is shown. That is what a database column holds and what sorts
correctly as a string; whether the reader sees `21:30` or `9:30 PM` is a matter
of where they live, and `Intl` answers it.

```tsx
<TimeField value={startsAt} onValueChange={setStartsAt} />   // '21:30'
```

Stored and shown are not the same string. `Intl` writes the hour without a
leading zero, so `09:30` is displayed as `9:30` — and as `9:30 AM` in the
United States. What leaves the component is always the padded form.

**Loose going in.** Everything below means half past nine in the morning:

| Typed | |
| --- | --- |
| `9:30`, `09:30` | the plain spellings |
| `930`, `0930` | no colon, which is what a phone keyboard invites |
| `9.30` | a full stop, which plenty of people use |
| `9:30 am`, `9:30AM` | with a meridiem, spaced or not |

A bare `9` is nine o'clock, not nine minutes past midnight — someone typing a
time means the hour.

**Midnight and noon are the pair that breaks twelve-hour clocks.** `12am` is
`00:00` and `12pm` is `12:00`, which is not "add twelve if pm".

**What it will not do is guess.** `25:00`, `9:60` and `13pm` are refused rather
than clamped, and when what was typed cannot be read the box is put back to the
value the form actually holds.

**Not `<input type="time">`.** The browser draws its own control, its own
spinner and its own clock popup, none of which a stylesheet reaches — so a form
of the product's own fields would have one that is visibly not.

**Empty is `null`.** No time is not midnight.

`parseTime` and `formatTime` are exported beside the component, for a product that has to read or write the same spellings elsewhere.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value` (required) | `string \| null` |  | `HH:MM` in twenty-four hours, or `null` for empty. |
| `onValueChange` (required) | `(value: string \| null) => void` |  | Told the next time as `HH:MM`, or `null` when the box is cleared. Fires on blur and on Enter, not on every key, and not when the text parses to the time already held. |
| `locale` | `string` |  | How the time is shown while the field is not being typed into. The application's language unless stated - see `useLocale`. |
| `placeholder` | `string` |  | What the empty box says. Pass the product's own words. |
| `disabled` | `boolean` |  | Stops the box taking focus or input. Passed to the `<input>`. |
| `readOnly` | `boolean` |  | The box can be focused and read but not typed into. Passed to the `<input>`. |
| `required` | `boolean` |  | Marks the `<input>` as required for a form. |
| `name` | `string` |  | The `<input>`'s name, for a form. |
| `id` | `string` |  | The `<input>`'s id, so a label can point at it. |
| `ref` | `Ref<HTMLInputElement>` |  | Reaches the `<input>`, for focusing it or reading its selection. |
| `aria-label` | `string` |  | Names the box for a screen reader when no visible label does. |
| `aria-describedby` | `string` |  | The id of the element that describes the box, such as a hint. |
| `className` | `string` |  |  |
