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

`locale` is left alone by default, which means the application's language —
the nearest `LocaleProvider` or the page's `<html lang>` (see
[`no-implicit-locale`](/dowel/guides/linting/#no-implicit-locale)). State one
only when the figure belongs to a place rather than to a person.

**The stepper's buttons are `aria-hidden`.** The field already announces its
value and its range; two more unlabelled controls tell a reader nothing it did
not have. Use `hideStepper` where the range is wide enough that the buttons are
an invitation to click sixty times.

**A typed number out of range is moved to the bound on blur** - Base UI's
default, and a correction made without a word: a 9 typed for an age of at
least 13 leaves the box as 13. A form that says what is wrong passes
`allowOutOfRange`, keeps the 9 and says it; the arrows still stop at the bounds.
[SchemaFields](/dowel/components/schema-fields/) always does.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value` | `number \| null` |  | The controlled number. `null` is an empty box. |
| `defaultValue` | `number` |  | The starting number of an uncontrolled field. |
| `onValueChange` | `(value: number \| null) => void` |  | Called with the new number as it changes, or `null` when the box is emptied. |
| `min` | `number` |  | The lowest the number may be. The arrows stop here, and a typed number below it moves to it on blur unless `allowOutOfRange` is set. |
| `max` | `number` |  | The highest the number may be. See `min`. |
| `allowOutOfRange` | `boolean` |  | Keep a typed number outside `min`/`max` as typed, rather than moving it to the bound on blur - for a form that says what is wrong instead. A 9 typed for an age of at least 13 became 13 without a word; the arrows still stop at the bounds. |
| `step` | `number` |  | What the arrows change it by. |
| `largeStep` | `number` |  | What PageUp and PageDown change it by, when a single step is too slow. |
| `format` | `NumberFormatOptions` |  | How the number reads: `Intl.NumberFormat` options, so a currency or a percentage is a prop rather than a wrapper. |
| `locale` | `string` |  | Which conventions `format` follows. Left alone it is the application's language (see `useLocale`); a product states one only when the figure belongs to a place rather than to a person - a price in a fixed market. |
| `unit` | `ReactNode` |  | What the number is in - `px`, `kg`, `%`. A caption beside the field, not part of the value. |
| `hideStepper` | `boolean` | `false` | Hide the stepper. For a field with a wide range, where the buttons are an invitation to click sixty times. |
| `disabled` | `boolean` |  | Turns the field off: it cannot be focused or changed. |
| `readOnly` | `boolean` |  | The number can be read and selected but not changed. |
| `required` | `boolean` |  | Marks the field as required, for a form to check. |
| `name` | `string` |  | The name the number is submitted under in a form. |
| `placeholder` | `string` |  | Shown in the box while it is empty. |
| `aria-label` | `string` |  | Names the field for a screen reader, when there is no visible label. |
| `className` | `string` |  |  |
