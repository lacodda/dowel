# Checkbox

Source: https://lacodda.github.io/dowel/components/checkbox

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#checkbox

Unchecked, checked, indeterminate and disabled, and a group with a parent box.

## Notes

**The words are part of the component.** A checkbox on its own is a nine-pixel
target that says nothing; tied to its label it is the whole row, which is what
a finger and a pointer both aim at. The commonest bug in a hand-rolled checkbox
is a `<label>` sitting *next to* the input rather than tied to it — identical
on screen, and it does nothing.

```tsx
<Checkbox>Remember me</Checkbox>
```

Leave the words out only where the row already names it — a table cell — and
then say so:

```tsx
<Checkbox aria-label="Select row" />
```

**The box is drawn rather than native.** `appearance: none` on a real
`<input type="checkbox">` is the alternative, and it takes the indeterminate
state with it: the dash is not something the input can be told to draw.

**`indeterminate` is a state, not a third value.** It means "some of the things
below are checked"; clicking still means check-all. A tri-state value would
make every caller handle a case that does not exist. It is announced as
`aria-checked="mixed"`, because a dash on its own is nothing to a screen
reader.

**`CheckboxGroup` exists for the parent box.** Given `allValues`, it works out
whether the parent is checked, unchecked or somewhere between, and clicking it
sets all of them — the part that goes wrong when it is written by hand.

```tsx
<CheckboxGroup allValues={['a', 'b']} defaultValue={['a']}>
  <Checkbox parent aria-label="All" />
  <Checkbox name="a" value="a">Apple</Checkbox>
  <Checkbox name="b" value="b">Pear</Checkbox>
</CheckboxGroup>
```

**Checkbox or [Switch](/dowel/components/switch/)?** If there is a Save button,
it is a checkbox: an answer collected now and submitted later. If the change is
the action, it is a switch.

## Props

### `Checkbox`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `children` | `ReactNode` |  | The words next to the box. Omit only for a checkbox in a table cell, and then give `aria-label` instead. |
| `checked` | `boolean` |  | Controlled state. Pair it with `onCheckedChange`. |
| `defaultChecked` | `boolean` |  | Initial state when the checkbox is uncontrolled. |
| `onCheckedChange` | `(checked: boolean) => void` |  | Called with the new state when the box is toggled. |
| `indeterminate` | `boolean` | `false` | Some but not all of what this stands for is checked. Draws a dash; clicking still checks everything. |
| `parent` | `boolean` |  | This is the box that stands for the whole group. Inside a `CheckboxGroup` with `allValues`, its state follows the children - checked, unchecked, or the dash in between - and clicking it sets all of them. Working that out by hand is where the indeterminate state usually goes wrong, so the group does it. |
| `disabled` | `boolean` |  | Stops the box taking input; the label dims with it. |
| `required` | `boolean` |  | Marks the box as required for form validation. |
| `name` | `string` |  | The field name submitted with a form. |
| `value` | `string` |  | What this box contributes to the group's `value` array when checked, and what a form submits for it. |
| `aria-label` | `string` |  | The accessible name, for a checkbox with no `children`. |
| `className` | `string` |  |  |

### `CheckboxGroup`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `children` (required) | `ReactNode` |  |  |
| `value` | `string[]` |  | The values of the checked boxes. Controlled; pair it with `onValueChange`. |
| `defaultValue` | `string[]` |  | The values checked at first, when the group is uncontrolled. |
| `onValueChange` | `(value: string[]) => void` |  | Called with the new list of checked values. |
| `allValues` | `string[]` |  | Every value in the group, which is what makes a parent checkbox work. |
| `disabled` | `boolean` |  | Disables every box in the group. |
| `className` | `string` |  |  |
