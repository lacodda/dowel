# activity-weeks

Source: https://lacodda.github.io/dowel/components/activity-weeks

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#activity-weeks

The numbers, printed rather than drawn: four kinds of cell, and where a value lands on the scale.

## Notes

Split out of [ActivityHeatmap](/components/activity-heatmap/) for the reason
[track-segments](/components/track-segments/) is split out of Track: a product
drawing this somewhere other than the DOM needs the arithmetic, not a
component. One consumer of the line draws it in a terminal.

**The rule everything rests on: a cell has four meanings and only one of them
is a number.** `none` is a date with no entry — not zero. `value` has a figure
and a step. `partial` is under way, with no total yet. `outside` is padding
that makes a column seven tall, for dates the caller never asked about.

```ts
import { weeks, stepFor } from '@/components/ui/activity-weeks'

weeks(
  [{ date: '2026-09-07', value: 8 }, { date: '2026-09-09', value: null }],
  { from: '2026-09-07', to: '2026-09-13', busiest: 10 },
)
// one column of seven: a value, a gap, an entry under way, four more gaps
```

**Dates are labels, never moments.** Every walk is in UTC. Parsed at local
midnight instead, a date in a zone *ahead* of UTC lands on the previous day
once it is read back — in Berlin the run from `2026-09-07` starts at
`2026-09-06`, and every cell carries a date it is not. On a machine *behind*
UTC the offset cancels and the bug is invisible, which is why the check for it
reads the source rather than running a date through it.

**A step has a floor of 1.** Any value at all is a value: a twenty-minute day
rounded to nothing would join the empty squares, and the grid would be denying
a day that was reported.

**A ceiling of zero means two different things**, so it is read two ways. A
grid whose only values are zero has a zero ceiling by arithmetic — every day
measured, every day empty — and those days take the faintest step. A real
figure against a *stated* ceiling of zero means the ceiling is wrong, and the
figure is drawn at full strength rather than hidden.

**`busiest` is shared, not per column.** Scaled to itself, a quiet stretch and
a heavy one each get their own darkest square, which is the one thing a heatmap
is for.

**`weekStartsOn` decides which row a date lands on**, so it is stated. There is
no locale here to guess it from.

## API

| Export | |
| --- | --- |
| `weeks(entries, options)` | Columns of seven `Cell`s, time running left to right |
| `stepFor(value, busiest)` | Which of the five steps a figure lands on, 1-5 |
| `datesBetween(from, to)` | Every date inclusive, as `YYYY-MM-DD` |
| `isWeekend(date)` | Saturday or Sunday — never "a day off" |
| `weekdayRows(weekStartsOn)` | The weekday of each row, in drawing order |
| `STEPS` | `5` — the number of shades a legend can be counted against |

| Option | Type | Default | |
| --- | --- | --- | --- |
| `from` `to` | `string` | | The range, `YYYY-MM-DD` |
| `weekStartsOn` | `0`–`6` | `1` | Sunday-first numbering |
| `busiest` | `number` | largest value present | The shared ceiling |
