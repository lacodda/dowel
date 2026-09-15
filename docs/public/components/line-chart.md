# LineChart

Source: https://lacodda.github.io/dowel/components/line-chart

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#line-chart

A balance across a quarter, one week not measured, and the same series forced to a zero floor.

## Notes

**A line, a column or a sparkline is a question about the data, not the
drawing.** A column says each period is its own sum — hours worked in a week,
and there is no Wednesday-afternoon figure between two weeks. A line says the
value existed the whole time and was sampled: a balance, a price, a
temperature. Drawing a sum as a line claims readings nobody took; drawing a
level as columns throws away the thing being watched.
[Sparkline](/components/sparkline/) is this shape with the axes taken away, for
beside a figure.

```tsx
<LineChart
  points={snapshots.map((s) => ({ at: Date.parse(s.date), value: s.balance }))}
  label={`Balance, ${money(first)} to ${money(last)}`}
  formatTick={money}
  footer={<><span>1 Jun</span><span>30 Sep</span></>}
/>
```

**A hole breaks the line.** Three drawings are possible and two of them lie:
interpolating across invents a reading nobody took, and closing the gap up
moves every later point — a chart that says the value was 40 in March when it
was 40 in April. Breaking the line leaves the gap visible, keeps every other
point where it belongs, and invents nothing. A lone reading between two holes
keeps its place too: it has no line, but it is a measurement.

**The floor is not zero unless you say so**, and that is a deliberate departure
from [BarChart](/components/bar-chart/). A bar's *length* is the quantity, so
its baseline has to be zero or the length lies. A line's subject is change, and
a balance between 4,900 and 5,100 on a zero-based axis is a flat rule — the
very thing the reader opened the chart to see. The ticks are what keep this
honest: they say where the bottom is. For a count rather than a level —
requests, errors — pass `bounds={{ min: 0 }}`.

**Ticks land on round numbers**, not on the range cut into equal parts. 4,900
to 5,100 in four gives 4,950 and 5,050, which nobody reads as a landmark; the
step is the nearest 1, 2, 5 or 10 above what the range needs. A range too
narrow to hold a round number gets no ticks rather than invented ones.

**Straight segments, never a curve.** A spline through measured points
overshoots between them, inventing highs and lows that were never recorded —
the same lie as interpolating across a gap, drawn more prettily.

**The plot owns its height in pixels**, for the reason BarChart does: a
percentage against a parent with no height of its own resolves to zero, and the
chart disappears without failing. The line is drawn with a non-scaling stroke,
so the box can be any shape without the stroke going thick one way and thin the
other.

**The axis under the plot is the caller's.** `footer` takes two or three
labels — usually the first and last reading — because an axis is not a place
for a list, and only the caller knows what its readings are called.

**Nothing measured draws a bare plot**, not a chart of zeroes and not an empty
box: the axis stays, and the words beside it say why there is no line.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `points` | `{ at, value }[]` | | `value: null` is a measurement not taken |
| `label` | `string` | | Required — what the chart says, in words |
| `bounds` | `Partial<Bounds>` | read from the points | `{ min: 0 }` for a count |
| `ticks` | `number` | `4` | A wish: they land on round numbers. `0` draws none |
| `formatTick` | `(value) => string` | | Right for money or a duration |
| `footer` | `ReactNode` | | Two or three labels under the plot |
| `tone` | `accent` `series` `good` `bad` `muted` | `accent` | |
| `size` | `sm` `md` | `md` | 96px and 160px of plot |

### `line-scale`

The arithmetic, importable without React: `boundsOf(points, stated)`,
`runs(points, bounds)` for the drawable stretches, `pathOf(run)`,
`ticksFor(bounds, wanted)` and `yOf(value, bounds)`.
