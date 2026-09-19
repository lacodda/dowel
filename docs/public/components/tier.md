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

**A band's colour is `accent` by default**, because a band is a position on
the product's own scale and not a judgement in the
[status vocabulary](/dowel/components/status-dot/). A product that means "this
one is bad" says so.

## Props

### `TierBadge`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` | `ReactNode` | | Required — the band's name |
| `value` | `ReactNode` | | The score behind the verdict, drawn quieter |
| `status` | `accent \| good \| warn \| bad \| info \| neutral` | `accent` | |

### `TierRuler`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `tiers` | `Tier[]` | | Required — `{ key, label, min, status? }` |
| `value` | `number` | | Required |
| `label` | `string` | | Required — names the meter |
| `min` / `max` | `number` | `0` / `100` | The ends of the road |
| `valueText` | `string` | | Spoken instead of the bare number |
| `showLabels` | `boolean` | `true` | |

### `AxisBar`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` | `string` | | Required |
| `scale` | `number` | | Required — one segment per whole point |
| `value` | `number \| undefined` | | `undefined` is unjudged, not zero |
| `onChange` | `(value) => void` | | Given, the row becomes a slider |
| `threshold` | `{ mark, label }` | | The mark that crosses into the next band |
| `valueText` | `string` | | |

### Helpers

| | |
| --- | --- |
| `orderedTiers(tiers, min?, max?)` | Sorted, with unplaceable bands dropped |
| `tierAt(tiers, value)` | The band a value stands in, or `undefined` |
