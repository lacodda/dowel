# Tier

Source: https://lacodda.github.io/dowel/components/tier

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#tier

Verdicts as badges, four scores on the same road, and three axes - two you can set with the pointer or the arrow keys, one read-only.

## Notes

A work is scored on several axes and the total lands in a named band: draft,
publishable, a clip. Three products of the line grade something this way,
which is what makes it a primitive rather than a screen.

The three pieces answer three different questions, and are separate for that
reason:

| | |
| --- | --- |
| `TierBadge` | *Which band is this in?* A verdict, in one word |
| `TierRuler` | *How far into it, and how far to the next?* |
| `AxisBar` | *What did one axis contribute?* |

```tsx
<TierBadge label={tier.label} value={score.toFixed(1)} />
<TierRuler tiers={TIERS} value={score} label={t('score.ruler')} valueText={t('score.spoken', { score, tier: tier.label })} />
```

**The ruler is drawn to scale, and so are its labels.** That is the whole
promise: a band starting at 78 sits nearly four fifths along, and the gap you
are looking at is the gap you have to close. The donor drew the bands to scale
and then laid the labels out evenly — with bands at 0, 50, 78 and 90 the label
"78" stood a fifth of the bar from the boundary it named. Here both come from
the same arithmetic.

**Three states per band, not two** — passed, standing in, still ahead. A flat
wash of "reached" over half the bar says only that the value is not at zero;
picking out the band being stood in is what carries the eye.

**It is a `meter`.** A measurement inside a known range is exactly what that
role is for, so a screen reader says the value without the product building a
sentence out of `aria-label`. Give `valueText` and it says the phrase instead
of the bare number.

**An axis is a slider when it can be set, and a meter when it cannot.** Not a
disabled slider: nothing is disabled, the number is simply a fact. Scoring is
a judgement, and a row you click answers "is this a seven or an eight" in one
movement where a spin box asks you to read, aim and type.

**Unjudged is not zero.** Zero is a verdict of its own, so the arrow keys step
onto the first or last mark from blank rather than through it; `Backspace` and
`Delete` go back to unjudged, as does clicking the mark already set — the only
way back with a pointer.

**The row owns the keyboard.** The marks are pointer targets and nothing else,
or tabbing past one axis would take ten presses. They are spans rather than
buttons: a focusable control inside a `role="slider"` is a nested interactive
element, and `tabindex="-1"` does not undo that.

**A mark can be weighed before it is given.** `onPreview` reports the mark under
the pointer, and `undefined` when the pointer leaves, so a product can say what
a seven means while someone is deciding between a seven and an eight. The
question while scoring is about the mark being considered, not the one already
set.

**The threshold is said, not only drawn.** The ring and its `title` reach a
pointer and nobody else — the segments are hidden from assistive technology,
and a title on a span is never shown to the keyboard — so the row carries the
threshold's words as its description, and a reader hears "a clip from 8" with
the value.

**A band's colour is `accent` by default**, because a band is a position on
the product's own scale and not a judgement in the
[status vocabulary](/dowel/components/status-dot/). A product that means "this
one is bad" says so.

**The helpers are exported**: `orderedTiers(tiers, min?, max?)` sorts the bands and drops the ones that cannot be placed, and `tierAt(tiers, value)` returns the band a value stands in, or `undefined` below the first.

## Props

### `TierBadge`

The band, as a verdict.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `status` | `accent \| good \| warn \| bad \| info \| neutral` | `'accent'` |  |
| `label` (required) | `ReactNode` |  | The band's name. |
| `value` | `ReactNode` |  | The number behind the verdict, if the product shows it. Drawn quieter than the name: the band is the answer and the score is the evidence. |

And every prop of `HTMLAttributes<HTMLSpanElement>` except `children`, passed on.

### `TierRuler`

The bands as a road, with the value standing somewhere along it.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `tiers` (required) | `Tier[]` |  | The bands, in any order. Bands outside `min` to `max` are dropped. |
| `value` (required) | `number` |  | Where the thing stands now. |
| `min` | `number` | `0` | The ends of the road. |
| `max` | `number` | `100` | The top end of the road; see `min`. |
| `label` (required) | `string` |  | What the ruler as a whole is called, for a screen reader, and what to say the value is. The product's words - the ruler has none. |
| `valueText` | `string` |  | The value spoken instead of the bare number: "7.8 out of 10, publishable" is what a reader needs, and only the product can phrase it. |
| `showLabels` | `boolean` | `true` | Print the band names under the road. |

And every prop of `HTMLAttributes<HTMLDivElement>` except `children`, passed on.

### `AxisBar`

One axis of a score, as a row of segments.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` (required) | `string` |  | What this axis is called. |
| `scale` (required) | `number` |  | The highest mark; one segment is drawn per whole point. |
| `value` | `number` |  | The mark, or `undefined` while the axis is unjudged. Not the same as zero: zero is a verdict, and a blank axis is the absence of one. |
| `onChange` | `(value: number \| undefined) => void` |  | Given, the row becomes a control. Omitted, it is a read-only reading of a score someone else set. |
| `threshold` | `{ mark: number; label: string; }` |  | The mark from which the total crosses into the next band, and what to call it. Absent when no mark on this axis gets there - and then nothing is drawn, because a line promising a band the axis cannot deliver is worse than no line. |
| `valueText` | `string` |  | What to say instead of the bare number - "unjudged", in the product's word, when there is no mark. |
| `onPreview` | `(mark: number \| undefined) => void` |  | The mark under the pointer, and `undefined` when the pointer leaves - so a product can say what a mark means while it is being weighed, before anyone commits to it. The question while scoring is about the mark being considered, not the one already given. |

And every prop of `HTMLAttributes<HTMLDivElement>` except `onChange`, passed on.
