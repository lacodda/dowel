# ActivityLegend

Source: https://lacodda.github.io/dowel/components/activity-legend

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#activity-legend

The five steps, the relative ceiling named, and the meanings that are not numbers.

## Notes

**Its own component because the scale is relative.** The darkest square of an
[ActivityHeatmap](/components/activity-heatmap/) is the busiest day in *that*
grid, not a standard. A legend that does not say so lets five shades read as an
absolute measure of a full day — something the grid has no opinion about.

```tsx
<ActivityLegend
  less="Less"
  more="More"
  busiest={`busiest ${duration(year.busiest)}`}
  none="Nothing recorded"
  partial="Still open"
/>
```

**The swatches come from the grid's own variants**, so they cannot drift from
the squares they explain. That is the whole reason this imports from
ActivityHeatmap rather than repeating the five fills.

**The meanings that are not numbers are named only when the caller has them.**
A grid whose data can never be under way should not carry a legend entry
promising it can. Pass `none` and `partial` when the grid produces them, leave
them out when it does not.

**All the words are the caller's.** *Less* and *more* are English here only
because this page is; the component has no strings of its own.

**One legend, several grids.** A screen showing a quarter beside a year needs
one explanation, not two — which is also why it is not drawn inside the grid.

## Props

| Prop | Type | |
| --- | --- | --- |
| `less` `more` | `ReactNode` | The words at each end of the ramp |
| `busiest` | `ReactNode` | What the darkest square stands for — the relative scale, named |
| `none` | `ReactNode` | The empty square: no entry for that date |
| `partial` | `ReactNode` | The outlined square: under way, no total yet |
| `className` | `string` | Merged so the caller wins a conflict |
