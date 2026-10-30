# Progress

Source: https://lacodda.github.io/dowel/components/progress

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#progress

A known fraction, an unknown one, and the tones.

## Notes

**Two states, and collapsing them is the defect this exists to prevent:**

- **determinate** — the fraction is known, the bar fills to it, and the reader
  can tell how long is left.
- **indeterminate** — something is happening and nobody knows how much is left.
  The bar says exactly that, by pulsing rather than filling.

Collapsing them means picking a number that is not true. A bar that creeps to
90% and waits there is the commonest version, and it is a lie the reader learns
to distrust — after which no progress bar in the product means anything.
`value={undefined}` is the honest answer, and it is the default.

```tsx
<Progress value={done / total * 100} label="Uploading">Uploading</Progress>
<Progress label="Working">Working</Progress>   {/* no number claimed */}
```

**No percentage is shown when there is no percentage.** "0%" for an unknown
amount is the same lie as the bar that creeps.

**The indeterminate bar is striped, not filled.** A full-width fill was the
first drawing of it and was wrong in the way that matters: measured on the
stand it painted 384px of a 384px track, and a reader glancing at that sees
"done" — the opposite of the state. Pulsing did not rescue it, and under
`prefers-reduced-motion` the pulse stops and a complete-looking bar is all that
is left.

Stripes cannot be read as a fraction at all: there is no edge to mistake for a
boundary. They are a gradient rather than an animation of their own, because a
`@keyframes` name in the theme is a contract the line carries forever — and
this needs no movement to say what it says.

**`label` is required.** A bar with no name is announced as a percentage of
nothing, and the word belongs to the product.

**Not a [Spinner](/dowel/components/spinner/).** A spinner says "working" in a
corner; this says "working, and here is the shape of it" across a width. Where
the shape of what is coming is known,
[Skeleton](/dowel/components/skeleton/) says more than either.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md` | `'md'` |  |
| `tone` | `accent \| good \| warn \| bad` | `'accent'` |  |
| `value` | `number \| null` |  | The fraction done, 0 to `max`. Leave it out when it is not known - that is not a missing value but a different, honest state. |
| `max` | `number` | `100` | The maximum value. |
| `label` (required) | `string` |  | What is progressing, for a screen reader. Required: a bar with no name is announced as a percentage of nothing, and the word belongs to the product. |
| `className` | `string` |  |  |
| `children` | `ReactNode` |  | A visible label beside the bar, when there is room. |

And every prop of Base UI's `Progress.Root` except `className`, `value`, passed on.
