# ActivityHeatmap

Source: https://lacodda.github.io/dowel/components/activity-heatmap

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#activity-heatmap

A quarter and a year, with the four kinds of square and the legend that names them.

## Notes

**A cell has four meanings and only one of them is a number.** Nothing
recorded, a value, something still under way, and a date outside the range
asked for are four different facts. A grid that paints the first as the palest
shade of the second tells the reader somebody did nothing on a day nobody
reported — a claim invented by the drawing, not present in the data.

| Kind | Drawn as | |
| --- | --- | --- |
| `value` | a fill from `--heat-1` … `--heat-5` | the only one that is a number |
| `none` | the bare empty square | no entry for this date; **not** zero |
| `partial` | outlined, dashed | under way, no total yet — any fill would be a figure nobody gave |
| `outside` | faintest of all | padding that makes a column seven tall; the caller never asked about it |

```tsx
<ActivityHeatmap
  entries={days.map((day) => ({ date: day.date, value: day.seconds }))}
  from={year.from}
  to={year.to}
  busiest={year.busiest}
  label={`A year of work, busiest day ${duration(year.busiest)}`}
  describe={(cell) =>
    cell.kind === 'value'
      ? `${cell.date}: ${duration(cell.value!)}`
      : `${cell.date}: nothing recorded`
  }
/>
```

**The legend is not decoration.** The scale is relative — the darkest square is
the busiest day in *this* grid, not a standard — so the grid has to say what
its own ceiling is. Without that, five shades read as an absolute measure of a
full day, which this component has no opinion about.

**`busiest` is what makes two grids comparable.** Left out, each grid scales to
itself, and a quiet month and a heavy one both get a darkest square. State it
and the shades mean the same thing across both.

**A measured zero is not an absent day.** Zero measured is an answer, and it
takes the faintest step; a date with no entry takes none. Only the caller knows
which is which, and they say so by sending an entry or not.

**`weekStartsOn` is stated, not guessed.** It decides which row a date lands
on, and a component cannot see the locale that would answer it. Monday by
default, Sunday-first numbering like `Date#getUTCDay`.

**Dates are labels, never moments.** Everything here is walked in UTC: parsed
at local midnight, a date in a zone ahead of UTC lands on the previous day, and
every square would carry a date it is not.

**There are no weekday names in here.** A weekday label is a word in a language
this cannot pick, so `weekdayLabel` is the caller's, and without it the column
is not drawn at all rather than drawn in English.

**Colour is never the only channel.** `describe` turns each cell into a
sentence that becomes its hover title, because a grid of five shades says
nothing to a screen reader and little to anyone who does not separate five
blues.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md` | `'md'` |  |
| `entries` (required) | `ActivityEntry[]` |  | What is known about each date. Dates with no entry are drawn as nothing recorded, which is a different fact from a value of zero. |
| `from` (required) | `string` |  | First date of the range, `YYYY-MM-DD`. |
| `to` (required) | `string` |  | Last date. |
| `weekStartsOn` | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` | `1` | The day a week starts on, Sunday-first like `Date#getUTCDay`. Monday by default. It decides which row a date lands on, so it is stated rather than guessed from a locale this cannot see. |
| `busiest` | `number` |  | The ceiling the shades are measured against. Defaults to the largest value present; state it to compare two grids by eye. |
| `label` (required) | `string` |  | What the grid as a whole is, for a reader who cannot see it. |
| `describe` (required) | `(cell: Cell) => string` |  | What one square says. Given the cell, returns the sentence that becomes its hover title and its accessible name - the caller owns it because only the caller knows whether a value is hours, words or commits. |
| `weekdayLabel` | `(weekday: Weekday) => ReactNode` |  | Row labels, one per weekday in drawing order. Omitted entirely rather than defaulted: a weekday name is a word in a language this cannot pick. |

And every prop of `HTMLAttributes<HTMLDivElement>` except `children`, passed on.
