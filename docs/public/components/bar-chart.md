# BarChart

Source: https://lacodda.github.io/dowel/components/bar-chart

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#bar-chart

Twelve weeks with a median, a gap in the middle, and one column picked out of the field.

## Notes

**Columns rather than a line, and that is the data's distinction, not the
drawing's.** A line says the value exists between the points; a column says
each period is its own sum. Hours worked in a week is a sum — there is no
Wednesday-afternoon reading between two weeks — so it is a column. Use
[Sparkline](/components/sparkline/) where the shape matters more than the
figures, and a line chart where the quantity genuinely continues between
measurements.

**The chart owns its height in pixels, and that is the whole reason this
exists.** The first consumer drew its bars as a percentage of the parent,
inside a flex row sized from its own content. The child had no base to be a
percentage of, every bar computed to zero, and the chart shipped as a row of
bare axis labels. No test and no API check could see it — the owner found it by
looking, and it cost a patch release.

```tsx
<BarChart
  bars={weeks.map((week) => ({
    key: week.start,
    value: week.daysRecorded === 0 ? null : week.seconds,
    label: weekLabel(week.start),
    title: week.daysRecorded === 0
      ? `${weekLabel(week.start)}: nothing recorded`
      : `${weekLabel(week.start)}: ${duration(week.seconds)}`,
  }))}
  label="Twelve weeks of work"
/>
```

**An absent period is not a short one.** `value: null` keeps its place in the
row and is drawn as a mark of its own — a bar of no height is indistinguishable
from a bar that failed to render, and dropping the period altogether would
close the gap up and turn an absence into continuity. A recorded zero is a
different fact again, and gets a real bar at the floor.

**A very short bar is drawn at a floor of 3%.** A twenty-minute week against a
forty-hour one is half a percent, which rounds to nothing: the period was
recorded, and would simply not be there.

**`max` is what makes two charts comparable.** Left out, every chart has a
full-height bar — which is exactly what stops two of them being read together.
State it to hold the scale still while the data moves, too.

**The baseline is a solid hairline.** `Baseline` draws the number every bar is
read against — a median, a target, a norm — because a chart without one invites
the reader to invent it, and the one they invent is usually the tallest bar. It
is solid rather than dashed: a dashed rule reads as *projected* or *threshold*
when it is neither. Give it the same `max` the chart has, and put both inside a
`ChartFrame`.

```tsx
<ChartFrame>
  <BarChart bars={bars} max={ceiling} label="Twelve weeks of work" />
  <Baseline value={median} max={ceiling}>median {duration(median)}</Baseline>
</ChartFrame>
```

**`ChartFrame` is not a wrapper for tidiness.** It does two things the caller
should not have to remember. It establishes the positioning context the
baseline needs — written by hand that is a `relative` which, forgotten, puts
the rule at the bottom of the page. And it keeps a gutter on the right for the
baseline's label, which otherwise sits on top of the last columns: the label is
drawn outside the plot, so the plot has to end before it starts. Pass
`gutter={false}` for a chart with no baseline.

A baseline outside the plot draws nothing rather than being clamped to the
edge — pinned to the top it would claim the median is the tallest week.

**Bars cap at 24px** and never fill their slot: the leftover is air, and the
doctrine's mark spec puts a 4px round on the data end with a square corner at
the baseline.

**Every column says what it is.** `title` is required per bar, because a
rectangle announces nothing, and a gap needs saying most of all. There is no
tooltip layer here: this is a small chart inside a panel, and the figures it
holds belong in the list beside it — a reader should not have to hover to find
them.

## Props

### BarChart

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `bars` | `BarDatum[]` | | `key`, `value`, `label`, `title`, optional `tone` |
| `label` | `string` | | Required — what the chart as a whole is |
| `max` | `number` | tallest bar | The top of the scale |
| `size` | `sm` `md` | `md` | 72px and 112px of plot |
| `className` | `string` | | Merged so the caller wins a conflict |

### BarDatum

| Field | Type | |
| --- | --- | --- |
| `value` | `number \| null` | `null` is nothing recorded — not zero |
| `title` | `string` | Required — what this column says, in words |
| `tone` | `accent` `series` `good` `warn` `bad` `muted` | `muted` is for the field when one bar is the story |

### Baseline

| Prop | Type | |
| --- | --- | --- |
| `value` | `number` | Where it sits, on the chart's scale |
| `max` | `number` | The same ceiling the chart was given |
| `children` | `ReactNode` | What the line is, beside it |

### ChartFrame

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `gutter` | `boolean` | `true` | Room on the right for the baseline's label |
