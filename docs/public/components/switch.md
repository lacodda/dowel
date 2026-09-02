# Switch

Source: https://lacodda.github.io/dowel/components/switch

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#switch

Off, on, and disabled, with and without words.

## Notes

**The difference from [Checkbox](/dowel/components/checkbox/) is not how it
looks**, and getting it wrong is the commonest mistake in the pair. A checkbox
is an answer collected now and submitted later, with the rest of the form. A
switch is a setting that applies the moment it moves.

> If there is a Save button, it is a Checkbox. If the change *is* the action, it
> is a Switch.

Put a switch in a form behind a Save button and the reader cannot tell whether
anything happened: they flipped it, and nothing said so.

```tsx
<Switch defaultChecked>Notify me</Switch>
```

**It reports its state, not only its position.** The role is `switch` and
`aria-checked` follows it — which matters more than it looks, because under
reduced motion the theme drops the slide and the position is all that changes
on screen.

**The track carries the accent when on**, and it is the only colour in the
control, so a column of settings reads as a list of on-and-off rather than a
field of decoration.

A switch with no words is a light with no caption. Leave them out only where
the meaning is genuinely in the context, and then name it:

```tsx
<Switch aria-label="Notify me" />
```

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `children` | `ReactNode` | | The words. Without them, give `aria-label` |
| `checked` | `boolean` | | Controlled |
| `defaultChecked` | `boolean` | | Uncontrolled |
| `onCheckedChange` | `(checked) => void` | | |
| `disabled`, `readOnly`, `required` | `boolean` | `false` | |
| `name` | `string` | | For a form |
