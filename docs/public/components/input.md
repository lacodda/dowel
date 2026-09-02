# Input

Source: https://lacodda.github.io/dowel/components/input

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#input

A field in every state, in either theme.

## Notes

**It is a plain `<input>`.** Autofill, spellcheck, `type="email"` validation
and the right keyboard on a phone all still work, because none of them were
replaced with something that looks similar.

**Invalid is driven by `aria-invalid`**, not by a prop of its own. The
attribute is what a screen reader reads, so making it the source of the colour
keeps the two from disagreeing:

```tsx
<Input aria-invalid={!valid} aria-describedby="email-error" />
```

**The focus ring is drawn outside the border**, not instead of it. A field that
only changes colour on focus is invisible to a reader who does not separate
those two colours.

## Props

Everything an `<input>` takes, plus `className`. `ref` reaches the element,
for focusing it or reading its selection.
