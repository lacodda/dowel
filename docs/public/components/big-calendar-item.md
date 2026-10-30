# BigCalendarItem

Source: https://lacodda.github.io/dowel/components/big-calendar-item

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#big-calendar-item

Neutral and in four series colours, a plan, something already out, and a title too long for its line.

## Notes

**One line, always.** [BigCalendar](/dowel/components/big-calendar/) folds a
day by arithmetic - lines of twenty-four pixels, edge to edge - so a line that wrapped
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
still opens - a weaker fill and an ink halfway from the text to `dim`, never
opacity. A line faded to 60% measured 2.7:1 in the light theme, and 1.7:1 on a
day of the next month; this one clears 4.5:1 in every series colour of every
product of the line, and a test over the resolved palettes holds it there.

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

**Twenty pixels drawn, twenty-four to hit.** The line is twenty-four pixels -
the floor of a pointer target - and the chip inside it twenty, so chips come
out four apart and targets meet without overlapping. The size is the box's
own, not an invisible extension: a day of the month is a target too, and a
measurement of the box is the only one anything takes. The element is the
line; its colour, outline and ring are the chip's, so `className` and `style`
land on the line.

## Props

### `BigCalendarDayContext`

Whether a line stands in the day the month's keyboard is on: `true` there, `false` in every other day, `null` outside a month.

### `BigCalendarItem`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `color` | `string` |  | The item's own colour - any CSS colour, `var(--series-3)` for a category. Neutral without one. |
| `tentative` | `boolean` | `false` | A plan rather than a booking: a dashed outline. |
| `done` | `boolean` | `false` | It has happened: drawn quieter, still pressable. |
| `start` | `ReactNode` |  | Before the words - a cover, a dot. |
| `end` | `ReactNode` |  | After the words - the glyphs that mark it: a kind, a lock, a status. They do not shrink; the words truncate. |
| `render` | `RenderProp<Record<string, unknown>>` |  | The element to draw: the product's link, a hover card's trigger. Without it the item is a `<button>` when it has `onClick`, and a `<div>` when it has nothing to do. |

And every prop of `HTMLAttributes<HTMLElement>` except `color`, passed on.
