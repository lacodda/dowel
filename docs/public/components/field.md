# Field

Source: https://lacodda.github.io/dowel/components/field

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#field

A field with a hint, a field with an error, and a field whose label is only for screen readers.

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

**The label is always rendered.** A field named only by its placeholder loses
that name the moment someone types, and a placeholder was never a label to
anything reading the page aloud. `labelHidden` takes it off the screen with
`sr-only` and leaves it in the accessibility tree.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` | `ReactNode` | | Required. Always rendered |
| `children` | `ReactElement` | | The control. One element |
| `help` | `ReactNode` | | A hint, hidden while an error shows |
| `error` | `ReactNode` | | Its presence marks the control invalid |
| `labelHidden` | `boolean` | `false` | Keep the label for readers, not the screen |
| `required` | `boolean` | `false` | Adds the mark a reader looks for |
| `name` | `string` | | So a `Form` can attach a server error by name |
| `disabled` | `boolean` | `false` | |
