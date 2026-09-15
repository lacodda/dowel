# track-segments

Source: https://lacodda.github.io/dowel/components/track-segments

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#track-segments

The numbers, printed rather than drawn: a sliver widened to the floor, and two slivers that must not overlap.

## Notes

Split out of [Track](/components/track/) for the reason
[table-sort](/components/table-sort/) and [tree-rows](/components/tree-rows/)
were split out of theirs: these are the sums, and the component is the thing
that draws them. A product labelling its own segments, or testing its own
domain arithmetic, should not import a component to get at the numbers.

What lives here is only the geometry. Turning a day of work into segments, or a
set of tiers into them, is the product's own arithmetic and stays with the
product — this knows about spans and percentages and nothing else.

```ts
import { place, markerAt } from '@/components/ui/track-segments'

place(
  [{ start: 0, end: 180 }, { start: 180, end: 225 }],
  { from: 0, to: 480 },
)
// [{ left: 0, width: 37.5, widened: false }, { left: 37.5, width: 9.375, widened: false }]
```

**The floor is the point.** A ten-second pause in an eight-hour day is 0.03% of
the track: real, measured, and rounding to no pixels at all. `place` widens it
to `MIN_SEGMENT_WIDTH` and says so in `widened`, so a caller can label it
*under a minute* rather than a duration the bar is no longer drawing to scale.

**Widening is a layout pass, not a per-segment decision.** A widened segment
pushes what follows along, and the room it borrows is paid back at the end by
the segments wide enough to afford it — never by another sliver, which would
undo the widening. The bar ends where it began: exactly at 100%.

```ts
place([{ start: 0, end: 239 }, { start: 239, end: 239.2 }, { start: 239.2, end: 480 }], { from: 0, to: 480 })
// the sliver is drawn at 0.6%, its neighbours give up 0.28% each, the bar ends at 100
```

The first version capped each sliver at *where the next segment starts*
instead. That cannot overlap, and it also means a segment touching its
neighbour never grows — which is every segment in both of the shapes this
exists for. A sliver with empty track after it is a different case and costs
nobody anything: it grows into room nobody was using.

When nothing can pay — every segment already at or under the floor — the floor
loses rather than the track. A bar running off its own end is worse than
slivers too thin to see.

**`markerAt` returns `null` rather than clamping.** A marker pinned to the edge
says *here, at the very end*, which is a different statement from *not on this
track at all*.

**Bounds are stated rather than inferred**, because the two readings differ and
both are wanted: a working day is read against itself, while a set of tiers is
read against the whole 0–100 scale. Omit them and the segments supply their
own extremes.

## API

| Export | |
| --- | --- |
| `place(segments, options?)` | `SegmentInput[]` → `Placed[]` — `{ left, width, widened }` in percent |
| `markerAt(value, from, to)` | A percentage, or `null` when it falls outside |
| `MIN_SEGMENT_WIDTH` | `0.6` — the floor, in percent |

| Option | Type | Default | |
| --- | --- | --- | --- |
| `from` | `number` | earliest start | What the left edge stands for |
| `to` | `number` | latest end | What the right edge stands for |
| `minWidth` | `number` | `MIN_SEGMENT_WIDTH` | `0` draws everything exactly to scale |
