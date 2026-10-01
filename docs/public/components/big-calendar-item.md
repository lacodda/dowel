# BigCalendarItem

Source: https://lacodda.github.io/dowel/components/big-calendar-item

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#big-calendar-item

Neutral and in four series colours, a plan, something already out, and a title too long for its line.

## Notes

**One line, always.** [BigCalendar](/dowel/components/big-calendar/) folds a
day by arithmetic - lines of twenty pixels, four apart - so a line that wrapped
on a narrow day would break the sum and push the last line out of the day. The
words truncate; put the whole of them in `title`, or in a hover card through
`render`. The marks in `start` and `end` do not shrink.

**The colour is the item's, not the product's.** The work it belongs to, the
category it is in. Any CSS colour is taken: `var(--series-3)` for a category,
the work's own colour where a product keeps one. It is drawn as a soft fill with
ink leaning towards the theme's text, so one colour reads on both themes.
Without a colour the line is neutral.

```tsx
<BigCalendarItem
  color="var(--series-2)"
  done={release.status === 'released'}
  end={<KindGlyph kind={release.kind} />}
  title={release.title}
  onClick={() => open(release)}
>
  {release.title}
</BigCalendarItem>
```

**A plan never reads as a fact.** `tentative` draws an outline in the colour and
no fill - a suggestion, a slot the auto-layout would take. `done` is quieter and
still opens.

**What it is follows what it does.** A `<button>` with `onClick`, a plain line
without one, and the product's own element through `render` - a router link, a
hover card's trigger.

**It stands outside the month too.** The queue of things waiting for a date
beside the month, and the copy that travels under the pointer while one is
dragged, are the same line.

**Inside a month it follows the cursor.** Only the lines of the day the month's
keyboard is on are in the tab order; the line reads that from
`BigCalendarDayContext` - `true` in that day, `false` in the others, `null`
outside a month. A line of your own reads it the same way:

```tsx
const inCursorDay = useContext(BigCalendarDayContext)
<MyLine tabIndex={inCursorDay === false ? -1 : 0} />
```

**Twenty pixels drawn, twenty-four to hit.** `target-min` grows the target to the
floor, and the gap between two lines is four - so the targets meet and do not
overlap.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `color` | `string` | | Any CSS colour; neutral without one |
| `tentative` | `boolean` | `false` | A plan: an outline, no fill |
| `done` | `boolean` | `false` | Has happened: quieter, still pressable |
| `start` | `ReactNode` | | Before the words - a cover, a dot |
| `end` | `ReactNode` | | After the words - the glyphs that mark it |
| `render` | `RenderProp` | | The element to draw: a link, a trigger |
| `onClick` | `() => void` | | Makes it a `<button>` |
| `className` | `string` | | Merged so the caller wins a conflict |
