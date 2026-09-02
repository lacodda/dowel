# NumberField

Source: https://lacodda.github.io/dowel/components/number-field

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#number-field

With a stepper and without, with a unit, and formatted as a currency.

## Notes

**Not `<input type="number">`.** The native one draws its own spinner where no
stylesheet reaches, rejects a pasted `1 234,50`, and on some browsers silently
blanks itself on anything it dislikes. This is a text box that tells the
keyboard it is numeric and names itself as a number field, which is what a
screen reader announces.

**Empty is `null`, not zero.** "No number" and "the number zero" are different
answers — no price yet and free — and a field that returns 0 for an empty box
makes them the same the moment it saves.

```tsx
<NumberField value={price} onValueChange={setPrice} min={0} />
```

**The unit is a caption, not part of the value.** Inside the input it is
something to parse and something to delete by accident; beside it, it cannot
be typed into and the value stays a number.

```tsx
<NumberField value={width} onValueChange={setWidth} unit="px" />
```

**How it reads is `Intl`, not a hand-rolled separator.** A field showing
`1234.5` to someone who writes `1 234,5` is one they translate in their head.

```tsx
<NumberField value={total} format={{ style: 'currency', currency: 'EUR' }} />
```

`locale` is left alone by default, which means the reader's own — state one
only when the figure belongs to a place rather than to a person.

**The stepper's buttons are `aria-hidden`.** The field already announces its
value and its range; two more unlabelled controls tell a reader nothing it did
not have. Use `hideStepper` where the range is wide enough that the buttons are
an invitation to click sixty times.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value` | `number \| null` | | `null` is an empty box |
| `defaultValue` | `number` | | Uncontrolled |
| `onValueChange` | `(value) => void` | | Receives `null` when emptied |
| `min`, `max` | `number` | | |
| `step` | `number` | `1` | What the arrows change it by |
| `largeStep` | `number` | | What PageUp and PageDown change it by |
| `format` | `Intl.NumberFormatOptions` | | Currency, percent, precision |
| `locale` | `Intl.LocalesArgument` | reader's own | |
| `unit` | `ReactNode` | | A caption beside the field |
| `hideStepper` | `boolean` | `false` | |
