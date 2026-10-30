# DurationField

Source: https://lacodda.github.io/dowel/components/duration-field

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#duration-field

Filled, empty, and inside a Field with a hint.

## Notes

**The alternative is two number boxes.** Labelled "hours" and "minutes", they
mean two tab stops, two validations, and a reader who has to divide 90 minutes
in their head before typing. Here they write it the way they say it.

```tsx
<DurationField value={minutes} onValueChange={setMinutes} />
```

**The value is minutes** — a plain number, not a string and not a Duration
object. A field whose value has to be parsed by its caller has moved the
problem rather than solved it.

**Loose going in, strict coming out.** Everything below means ninety minutes,
and all of them are written back as `1h 30m`:

| Typed | Means |
| --- | --- |
| `1h 30m`, `1h30m` | the canonical spelling, spaced or not |
| `90`, `90m` | a bare number is minutes |
| `1.5h`, `1,5h` | a decimal, with either separator |
| `1:30` | the clock spelling |

That asymmetry is the design: being strict on input means rejecting people,
being loose on output means the column of values never lines up.

**What it will not do is guess.** `1h banana` is refused rather than read as an
hour — a typo that parses is a value nobody questions afterwards. When what was
typed cannot be read, the box is put back to the value the form actually holds
rather than left saying something untrue.

**Empty is `null`.** No estimate is not an estimate of nothing.

**It does not reformat under the cursor.** Typing `1h 3` leaves `1h 3` alone
until you leave the field or press Enter; a field that reformats on every
keystroke fights the person using it.

`parseDuration` and `formatDuration` are exported beside the component, for a
product that has to read or write the same spellings elsewhere.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value` (required) | `number \| null` |  | Minutes, or `null` for empty. |
| `onValueChange` (required) | `(value: number \| null) => void` |  | Told the new minutes (or `null` when emptied) on blur and on Enter, not on every key, and only when the parsed value differs from `value`. |
| `placeholder` | `string` |  | What a reader sees before they type. A duration in the canonical spelling is the best hint there is, so this is the product's to give. |
| `disabled` | `boolean` |  | Stops the field taking input. |
| `readOnly` | `boolean` |  | Shows the value but does not let it be edited. |
| `required` | `boolean` |  | Marks the field as required for form validation. |
| `name` | `string` |  | The field name submitted with a form. |
| `id` | `string` |  | Put on the input, so a label can point at it. |
| `ref` | `Ref<HTMLInputElement>` |  | A ref to the underlying `<input>`. |
| `aria-label` | `string` |  | The accessible name, when there is no visible label. |
| `aria-describedby` | `string` |  | Points at the hint or error text for the field. |
| `className` | `string` |  |  |
