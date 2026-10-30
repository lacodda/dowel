# Field

Source: https://lacodda.github.io/dowel/components/field

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#field

A field with a hint, a field with an error, a field whose label is only for screen readers, and a group of chips named by one caption.

## Notes

**The wiring is the whole component.** Every form is the same four parts
repeated — a name, the control, sometimes a hint, sometimes an error — and
written by hand each time they drift apart: the label loses its `htmlFor`, the
hint becomes a `<div>` nothing announces, the error turns red and is read out
by nothing at all. None of that shows in a screenshot.

```tsx
<Field label="Email" help="We only use it to sign you in.">
  <Input type="email" />
</Field>
```

**The control is handed over, not just nested.** `Field` passes its id and
`aria-*` attributes to the element you give it, which is why `children` is a
single element rather than arbitrary nodes. A plain child would render a label
whose `for` points at an id nothing carries — it looks wired and names nothing.

**`error` is a string, not a rule.** dowel has no opinion about where it came
from, because a design system that picked a form library would be choosing for
products that already chose. Its presence is what marks the control invalid, so
there is no separate `invalid` prop to keep in step.

```tsx
// Base UI's own validation
<Field.Root validate={...}>

// a schema, react-hook-form, or a server that just said no
<Field label="Email" error={errors.email?.message}>
  <Input />
</Field>
```

**The error takes the hint's place rather than joining it.** Two lines of small
print under one control is one too many, and the error is the one that matters.

**A Switch or a Checkbox sits `beside` its name**, inside the label, as on
every settings screen: a press on the words flips it, and the hint and the
error go under the row.

```tsx
<Field label="Weekly letter" help="Sundays, at nine." beside>
  <Switch checked={letter} onCheckedChange={setLetter} />
</Field>
```

Every other control of the set goes under the caption, wired the same way: an
Input, a Textarea, a PasswordField, a TagInput, a DatePicker - and a
NumberField or a Select, which are Base UI's and find the field they sit in by
themselves. Each is held by a test that asks for it by its name.

**The label is always rendered.** A field named only by its placeholder loses
that name the moment someone types, and a placeholder was never a label to
anything reading the page aloud. `labelHidden` takes it off the screen with
`sr-only` and leaves it in the accessibility tree.

**The label is a `caption`** — the theme's one utility for the small uppercase
label, at 600. A panel's SectionLabel, a rail's group and a menu's group are the
same utility, so the names in one form are one kind of thing.

## FieldGroup — one name for several controls

`Field` labels exactly one control, and it has to: its label points at an id the
control carries. A row of chips, a segmented control or a grid of pictures has
no single control to point at — and the obvious workaround, a `<label>` wrapped
around the row, is a trap. A label with no `for` labels the first labelable
element inside it, and a click on any plain part of the label is forwarded
there. kilna measured what that does in its style dialog: a click on the
caption "Type" silently set the first type, and a click on "References" pressed
the hidden remove cross of the first picture — which deleted it for good.

`FieldGroup` is a `<fieldset>` with a legend (through Base UI's Fieldset). The
group is announced by its name as a reader enters it, the hint or error is its
description, and a caption has nothing a click could be forwarded to.

```tsx
<FieldGroup label="Type" help="What the style describes." error={errors.type}>
  <ChipGroup aria-label="Type" value={type} onValueChange={setType}>
    <Chip value="image">Image</Chip>
    <Chip value="pose">Pose</Chip>
  </ChipGroup>
</FieldGroup>
```

`disabled` disables every native control inside it, which is what a fieldset
does on its own.

## Props

### `Field`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` (required) | `ReactNode` |  | What the control is called. Always rendered; `labelHidden` only takes it off the screen. |
| `children` (required) | `ReactElement<unknown, string \| JSXElementConstructor<any>>` |  | The control itself - Input, Textarea, Select, Checkbox, anything. |
| `help` | `ReactNode` |  | A hint under the control. Hidden while an error is showing: two lines of small print under one field is one line too many, and the error is the one that matters. |
| `error` | `ReactNode` |  | What is wrong, if anything. Its presence is what marks the control invalid - there is no separate `invalid` prop to keep in step. |
| `labelHidden` | `boolean` | `false` | Keep the label for screen readers but take it off the screen. For a field whose meaning is obvious in context - a search box in a toolbar. |
| `className` | `string` |  |  |
| `required` | `boolean` | `false` | Marks the field required, which is a statement about the form rather than about validation: the label gets the mark a reader looks for. |
| `name` | `string` |  | The control's `name`, forwarded so a `Form` can attach a server error to this field by name. |
| `disabled` | `boolean` | `false` | Disables the control, and dims a `beside` control's label with it. |
| `beside` | `boolean` | `false` | The control beside its name, inside the label, rather than under a caption: for a Switch or a Checkbox. |

### `FieldGroup`

FieldGroup - one name for several controls.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` (required) | `ReactNode` |  | What the group is called - "Type", "References". Always rendered; `labelHidden` only takes it off the screen. |
| `children` (required) | `ReactNode` |  | The controls: a row of chips, a segment, a grid of pictures, several checkboxes. Anything - a group names its contents rather than handing them an id. |
| `help` | `ReactNode` |  | A hint under the group, read as the group's description. Hidden while an error is showing, as in Field. |
| `error` | `ReactNode` |  | What is wrong with the group as a whole - "choose at least one". |
| `labelHidden` | `boolean` | `false` | Keep the legend for screen readers but take it off the screen. |
| `required` | `boolean` | `false` | Adds the mark a reader looks for to the legend. A statement about the form; the group does not validate anything itself. |
| `disabled` | `boolean` | `false` | Disables every native control inside, which is what a `<fieldset>` does on its own. |
| `className` | `string` |  |  |
