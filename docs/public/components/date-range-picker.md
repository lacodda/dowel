# DateRangePicker

Source: https://lacodda.github.io/dowel/components/date-range-picker

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#date-range-picker

Empty, half made, whole, and bounded.

## Notes

**The state between the two clicks is the component.** After the first click
there is a start and no end — not an incomplete value to hide, and not a range
of one day. It is the normal middle of the interaction, and the reader has to
see it: the first day marked, the popup still open, the trigger already saying
something.

```tsx
<DateRangePicker
  value={period}                 // { start: '2026-09-02' } while deciding
  onValueChange={setPeriod}      // fires on both clicks
  placeholder="Pick a range"
  previousMonthLabel="Previous month"
  nextMonthLabel="Next month"
/>
```

`onValueChange` firing on the first click is what lets a product show "from 2
September" while the reader is still choosing the other end. A picker that
reports nothing until the range is whole appears to do nothing at all.

**The clicks can come in either order.** Clicking the 20th and then the 10th
means the 10th to the 20th, because that is plainly what was meant. Refusing it
would be correct and unhelpful.

**Clicking again starts over.** Once a range is whole, the next click is a new
start rather than an edit of the old end — which is what a reader means by
clicking a third time.

**A range can be taken back.** Give `clearLabel` and, while anything is chosen
- half made or whole - the popup offers it under the month, the way DatePicker
does; `onValueChange` is told the empty range, `{}`.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value` | `DateRange` |  | The chosen range. Either end may be absent: a start with no end is the range while it is half made. |
| `onValueChange` | `(value: DateRange) => void` |  | Called on both clicks, so a product sees the half-made range as well as the whole one. |
| `clearLabel` | `string` |  | The words of the button that takes the range back: "Clear". Leave it out and a chosen range can only be replaced, not emptied. |
| `min` | `string` |  | The earliest day that can be chosen, as `YYYY-MM-DD`. |
| `max` | `string` |  | The latest day that can be chosen, as `YYYY-MM-DD`. |
| `placeholder` (required) | `string` |  | What the trigger says when nothing is chosen. |
| `previousMonthLabel` (required) | `string` |  | Names the two month-paging buttons inside the calendar. |
| `nextMonthLabel` (required) | `string` |  | Names the button that pages to the next month, for the same reason as `previousMonthLabel`. |
| `locale` | `string` |  | The language the dates and the calendar are written in. Defaults to the locale from `useLocale`. |
| `disabled` | `boolean` | `false` | Stops the trigger opening the calendar. |
| `id` | `string` |  | Put on the trigger, so a `Field` label can point at it. |
| `aria-label` | `string` |  | Names the trigger when there is no visible label. The trigger's name is this and then the date it shows. |
| `aria-labelledby` | `string` |  | Points the trigger at its visible label. The date it shows is added to the name. |
| `aria-describedby` | `string` |  | Points the trigger at a hint or an error message. |
| `aria-invalid` | `true \| false \| boolean` |  | Marks the trigger as holding a value that is not accepted. |
| `className` | `string` |  |  |
