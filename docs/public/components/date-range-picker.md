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

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value` | `{ start?, end? }` | | Either end may be absent |
| `onValueChange` | `(value) => void` | | Fires on both clicks |
| `min`, `max` | `IsoDate` | | Bounds, inclusive |
| `placeholder` | `string` | | Required |
| `previousMonthLabel` | `string` | | Required |
| `nextMonthLabel` | `string` | | Required |
| `locale` | `string` | reader's own | |
| `disabled` | `boolean` | `false` | |
