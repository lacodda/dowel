# RadioGroup

Source: https://lacodda.github.io/dowel/components/radio-group

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#radio-group

A column of options, a row of them, and a disabled group.

## Notes

**Reach for this when the options are worth the space.** A handful of short
choices read faster laid out than hidden behind a trigger, and each one becomes
a target rather than a step. Past about five, or when the labels are long, a
[Select](/dowel/components/select/) is the honest choice — this is not a Select
with more pixels.

```tsx
<RadioGroup aria-label="Ripeness" defaultValue="ripe">
  <Radio value="green">Green</Radio>
  <Radio value="ripe">Ripe</Radio>
  <Radio value="soft">Soft</Radio>
</RadioGroup>
```

**The group is the control.** That is what the arrow keys move within, what a
screen reader announces as one thing with a position in it, and why the group
takes the value rather than each button. `Radio` outside a group is a checkbox
that cannot be unchecked, which is why it is only useful inside one.

**One tab stop, not three.** Tab reaches the group and the arrows move the
choice — the behaviour a native radio group has and a row of styled buttons
does not.

**`orientation="horizontal"` for two or three short options.** A column is the
default because it stays readable as labels grow.

Name the group. It is the question the options answer, and without it a reader
hears three values and no subject:

 FENCE2

## Props

### `RadioGroup`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `children` (required) | `ReactNode` |  |  |
| `value` | `string` |  | The `value` of the selected radio. Controlled; pair it with `onValueChange`. |
| `defaultValue` | `string` |  | The `value` selected at first, when the group is uncontrolled. |
| `onValueChange` | `(value: string) => void` |  | Called with the `value` of the radio the reader chose. |
| `disabled` | `boolean` |  | Disables every radio in the group. |
| `readOnly` | `boolean` |  | Shows the selection but does not let it change. |
| `required` | `boolean` |  | Marks the group as requiring a choice for form validation. |
| `name` | `string` |  | The field name submitted with a form. |
| `orientation` | `horizontal \| vertical \| null` |  | Lay the options out in a row. For two or three short ones; a column is the default because it stays readable as labels grow. |
| `aria-label` | `string` |  | The accessible name of the group, when no visible label names it. |
| `className` | `string` |  |  |

### `Radio`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value` (required) | `string` |  | What the group's `value` becomes when this radio is chosen. |
| `children` | `ReactNode` |  | The words next to the dot. |
| `disabled` | `boolean` |  | Disables this radio alone; the label dims with it. |
| `className` | `string` |  |  |
