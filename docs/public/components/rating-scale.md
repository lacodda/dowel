# RatingScale

Source: https://lacodda.github.io/dowel/components/rating-scale

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#rating-scale

Scored, not judged yet, a longer scale, and disabled.

## Notes

**Marks rather than stars.** Stars carry a meaning of their own — a review, a
public verdict — and this is as often "how hard was this" or "how finished is
it" as it is "how good".

**Not judged yet is a state, not a zero.** This is the whole reason the
component exists and the reason it is not a
[Slider](/dowel/components/slider/) with a small range or a
[RadioGroup](/dowel/components/radio-group/) with five options. "I have not
scored this" and "I scored it nothing" are different facts, and a control that
collapses them makes the difference unrecoverable the moment it saves.

```tsx
<RatingScale
  scale={5}
  value={score}            // number | undefined
  onValueChange={setScore} // receives undefined when cleared
  label="Difficulty"
  emptyLabel="Not judged"
/>
```

There are two ways back to it, and both exist because losing either one loses
the state:

- **the pointer** — click the mark already chosen;
- **the keyboard** — Backspace or Delete.

**`emptyLabel` is required.** It is what a screen reader hears in place of a
number, and a default here would be English shipped inside a primitive. Same
for `label`: a bare row of marks names nothing.

**One control, not five.** The container is the slider — one tab stop, arrows
within it — and the marks are plain elements. A `<button>` per mark would be a
nested interactive control inside a `slider`, which assistive technology is not
promised to announce or reach; the donor this came from had them as
`aria-hidden` buttons, which hides them from a reader without making them stop
being controls.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `scale` (required) | `number` |  | How many marks. |
| `value` (required) | `number` |  | The score, or `undefined` for not judged yet. |
| `onValueChange` (required) | `(value: number \| undefined) => void` |  | Called with the new score by a click or a key, and with `undefined` when the score is taken back to not judged. |
| `label` (required) | `string` |  | What is being judged. Required: a bare row of marks names nothing, and this is the only thing a screen reader has to go on. |
| `emptyLabel` (required) | `string` |  | What a screen reader hears in place of a number when nothing is chosen. Required rather than defaulted, because a default here would be English shipped inside a primitive. |
| `disabled` | `boolean` | `false` | Stops the scale taking a click or a key. |
| `className` | `string` |  |  |
