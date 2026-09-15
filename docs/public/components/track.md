# Track

Source: https://lacodda.github.io/dowel/components/track

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#track

A working day as spans, and a set of tiers with a score standing among them.

## Notes

**Two products had written this independently** and arrived at the same
construction — a rounded track, segments positioned absolutely by percent, a
floor under the segment width so a short one does not vanish — differing only
in what a segment meant. One drew the tiers of a rubric with the score standing
among them; the other drew a working day as alternating work and breaks.

Each knew something the other did not. The tiers had the marker and the
three-state reading of a band — passed, standing in, still ahead. The day had
the minimum width, and the difference between an empty track and an unknown
one. So it is one component with two shapes:

**spans** — stretches of a whole, each meaning something in its own right. Work
and breaks, phases, occupancy. Gaps are the track showing through, and a gap in
the data has to look different from a boundary between two stretches, which is
why `divided` is off here.

```tsx
<Track
  segments={bands.map((band, i) => ({
    key: String(i),
    start: band.from,
    end: band.to,
    tone: band.paused ? 'idle' : 'accent',
    label: band.label,
  }))}
  from={dayStart}
  to={dayEnd}
  label="Worked 7h 15m, one break of 45m"
/>
```

**thresholds** — a scale cut into bands, with a position on it. The point is
not the bands but where you stand among them: *nearly a clip* is what the
reader wants, and a badge naming the band cannot say it. Here the bands touch,
so `divided` draws a hairline of the ground between them.

```tsx
<Track
  segments={tiers.map((tier, i) => ({
    key: tier.key,
    start: tier.min,
    end: tiers[i + 1]?.min ?? 100,
    tone: score >= tier.min ? (standingIn(tier) ? 'accent' : 'past') : 'idle',
    label: `${tier.label} · ${tier.min}+`,
  }))}
  from={0}
  to={100}
  marker={score}
  label={`Score ${score}, in ${current.label}`}
  divided
/>
<TrackScale>
  {tiers.map((tier) => <span key={tier.key}>{tier.label}</span>)}
</TrackScale>
```

**A sliver is widened to something visible, and the rest of the bar gives way
for it.** A twelve-second break in an eight-hour day is 0.04% of the track —
real, measured, and rounding to no pixels at all. The floor draws it at 0.6%
and pushes what follows along; the debt that creates is paid back by the
segments wide enough to afford it, so the bar still ends exactly at its own
edge. A widened segment says so in `widened`, so a caller can label it *under a
minute* rather than a duration the bar is no longer drawing to scale.

The obvious way to do this is wrong, and it was the first thing tried here:
capping each sliver at *where the next segment starts* protects against
overlap, and also means a segment touching its neighbour can never grow at all.
Both shapes this component exists for are contiguous — work, break, work; one
tier after another — so the floor did nothing for either of them, and only a
look at the stand showed it.

**The scale is stated, not inferred.** `from` and `to` are what the two donors
disagreed about, and both were right: a working day is read against itself — an
eight-hour day drawn across a third of the width wastes the space where the
breaks are — while tiers are read against the whole 0–100 scale, where the
distance to the next one is the distance you have to close. The marker rides
the same bounds, so a tier at 78 and a score of 78 land in the same place.

**A marker outside the track is absent, not pinned to the edge.** Clamped, it
would say *here, at the very end*, which is a different statement from *not on
this track at all*.

**The track owns its geometry in its own box**, never a percentage of a
parent's. That is the failure that cost a consumer a patch release: a
percentage-height chart inside a flex row resolved every bar to zero, the graph
came out empty, and neither the tests nor the API check could see it — the
owner found it by looking.

**The height is a variant, not a fixed value.** It is `sm` in one donor and
`md` in the other because the bar carries different weight on the two screens.

**`label` is required**, because the segments announce nothing: their `title`
is a hover affordance, and a screen reader is given the bar as one image. Say
what the whole bar says.

## Props

### Track

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `segments` | `TrackSegment[]` | | `key`, `start`, `end`, and optionally `tone` and `label` |
| `label` | `string` | | Required — what the whole bar says |
| `from` | `number` | earliest segment | What the left edge stands for |
| `to` | `number` | latest segment | What the right edge stands for |
| `marker` | `number` | | Where the position stands, on the same scale |
| `divided` | `boolean` | `false` | A hairline between touching segments |
| `minWidth` | `number` | `0.6` | The floor under a segment; `0` draws everything to scale |
| `size` | `sm` `md` | `md` | |
| `className` | `string` | | Merged so the caller wins a conflict |

### Segment tones

| Tone | |
| --- | --- |
| `accent` | The subject: work done, the band you are standing in |
| `past` | Behind you — dimmed, so the current band carries the eye |
| `idle` | Ahead, or not the subject: a break, a band not yet reached |
| `good` `warn` `bad` | A stretch that is itself a state rather than a quantity |

### `track-segments`

The arithmetic, importable without React: `place(segments, { from, to, minWidth })`
returns `{ left, width, widened }` per segment, and `markerAt(value, from, to)`
returns a percentage or `null`.
