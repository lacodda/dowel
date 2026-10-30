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
| `value` | `number \| readonly number[]` |  | A number for one thumb, an array for a range. |
| `defaultValue` | `number \| readonly number[]` |  | The starting value for an uncontrolled slider: a number, or an array for a range. |
| `onValueChange` | `(value: number \| readonly number[]) => void` |  | Called on every change while the thumb moves, with a number or an array to match `value`. |
| `onValueCommitted` | `(value: number \| readonly number[]) => void` |  | Fires once when the drag ends, for the expensive thing a product does not want to run on every pixel of movement. |
| `min` | `number` |  | The lowest value; Base UI's default is `0`. |
| `max` | `number` |  | The highest value; Base UI's default is `100`. |
| `step` | `number` |  | The increment a thumb moves by; Base UI's default is `1`. |
| `minStepsBetweenValues` | `number` |  | How close the thumbs of a range may come, in steps. |
| `format` | `NumberFormatOptions` |  | How the value reads when it is shown: `Intl.NumberFormat` options. |
| `orientation` | `horizontal \| vertical` |  | The direction the track runs. A vertical slider is a fixed `h-40` tall. |
| `showValue` | `boolean` | `false` | Show the current value beside the track. Off by default: on a row of settings the numbers are noise, and where the figure matters a NumberField is the better control. |
| `getThumbLabel` | `(index: number) => string` |  | What each thumb is called, by index. |
| `disabled` | `boolean` |  | Stops the slider taking input. |
| `name` | `string` |  | The field name, for a form that posts the value. |
| `aria-label` | `string` |  | Names the slider as a group, and is the fallback label of every thumb. |
| `className` | `string` |  |  |
