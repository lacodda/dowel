# Slider

Source: https://lacodda.github.io/dowel/components/slider

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#slider

A single value, a range, one with its value shown, and a vertical one.

## Notes

**Reach for it when the number does not matter much** — a volume, an opacity,
a weight in a search filter. Where the exact figure does matter, a
[NumberField](/dowel/components/number-field/) is the better control: a slider
cannot be typed into, cannot be pasted into, and has no state for empty.

**A range is the same component with an array.** Not a second component: a
range slider is one track with two thumbs, and splitting them would double the
styling and let the two drift apart.

```tsx
<Slider value={volume} onValueChange={setVolume} />        {/* one */}
<Slider value={[min, max]} onValueChange={setRange} />     {/* two */}
```

**Name every thumb.** The thumb is the control — a hidden `<input type="range">`
— and `aria-label` on the root names the *group* around it, leaving each thumb
unnamed. Without a name a reader lands on the control and is told a number and
nothing else. The group's label is used as a fallback, which is right for one
thumb and merely adequate for two:

```tsx
<Slider
  value={[min, max]}
  aria-label="Price"
  getThumbLabel={(i) => (i === 0 ? 'Lowest price' : 'Highest price')}
/>
```

**`onValueCommitted` fires once, when the drag ends.** For the expensive thing
a product does not want to run on every pixel of movement — a query, a save, a
re-render of something large.

**The hit area is bigger than the track.** The `Control` is what a pointer aims
at and it is much taller than the 6px the reader sees; making the drawn track
the hit area is the commonest way a slider ends up hard to grab.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value` | `number \| number[]` | | An array makes it a range |
| `defaultValue` | `number \| number[]` | | Uncontrolled |
| `onValueChange` | `(value) => void` | | Fires as it moves |
| `onValueCommitted` | `(value) => void` | | Fires once, at the end |
| `min`, `max`, `step` | `number` | `0`, `100`, `1` | |
| `minStepsBetweenValues` | `number` | | How close a range's thumbs may come |
| `getThumbLabel` | `(index) => string` | group's label | Name each thumb |
| `showValue` | `boolean` | `false` | Print the value beside the track |
| `orientation` | `horizontal \| vertical` | `horizontal` | |
| `format` | `Intl.NumberFormatOptions` | | How the shown value reads |
