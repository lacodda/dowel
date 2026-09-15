# Sparkline

Source: https://lacodda.github.io/dowel/components/sparkline

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#sparkline

Beside a total and beside a row, against a stated ceiling and against its own range.

## Notes

**No axes, no gridlines, no ticks** — the shape of a history rather than a
chart of it. `61 → 74 → 82` reads perfectly at three points and stops working
at ten; a line holds both, and the exact figures stay in the table underneath.

**The box is drawn at the size it is shown at**, which is why `size` is a
variant and not a `className`. A `viewBox` wider than the element scales x and
y by different factors: the line bends away from the data and the end dot
stretches into a wedge. The donor took a size object *and* a class, so every
call site repeated itself — `size={{ width: 52, height: 16 }} className="h-4
w-[52px]"` — and the two could drift apart.

```tsx
<Sparkline values={trend} max={100} label="Score, 61 to 82" />
<Sparkline values={axisTrend} max={axis.scale} size="sm" label={`${axis.label}, 3 to 4`} />
```

**`max` is the ceiling of the scale, not the top of the data.** Without it the
line is scaled against its own range, and a work that moved 61 → 63 climbs the
whole box — a small change drawn as a transformation. Give the axis maximum and
two lines can be compared by eye. A value that overshoots the stated ceiling
still stays inside the frame: it is the caller's problem to notice, not a
reason to draw a line leaving the box.

**The line does not judge.** It is drawn in the de-emphasis tone with the
newest point in the accent, so the eye finds *where it is now* without the
line claiming what that means. The donor coloured it green when it ended higher
and red when it ended lower, which the component cannot support: for
time-to-answer or error rate, down is the good direction. Where the caller
genuinely knows, `tone` says so — and the meaning usually belongs next to the
line anyway, in a [StatTile](/components/stat-tile/)'s delta.

**`label` is required.** The line is an `img` to a screen reader, and an
unlabelled image carrying information is information withheld. Say what the
line says: `"Score, 61 to 82 over three versions"`.

**Fewer than two points draws nothing.** One point has no direction, and a line
through it would be a statement about a history there is none of.

**It is not interactive**, and that is the form rather than an omission: a
sparkline has no room for a hover target that is not the whole of it. A reader
who needs the figures gets them from the table beside it.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `values` | `number[]` | | Oldest first; fewer than two draws nothing |
| `label` | `string` | | Required — what the line says, in words |
| `max` | `number` | highest value present | The ceiling of the scale |
| `size` | `sm` `md` | `md` | `sm` beside a row, `md` beside a total |
| `tone` | `muted` `accent` `good` `bad` | `muted` | Only the caller knows what a direction means |
| `className` | `string` | | Merged so the caller wins a conflict |
