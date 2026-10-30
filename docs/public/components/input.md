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

**Under a finger the text is 16px.** iOS Safari zooms the page into any field
whose text is smaller when it takes the focus, and does not zoom back out - a
sign-in form opens at 130% with the password off the side of the screen. The
set's fields are 12px with a mouse and `pointer-coarse:text-lg` with a finger,
which is a question about the pointer rather than the width: a phone on its
side is wider than `sm` and zooms all the same. Every field in the set carries
it - Input, Textarea, PasswordField, NumberField, SearchField, TagInput,
Combobox, the palette - so a product has nothing to override on its own
sign-in screen.

**`ref` reaches the `<input>`**, for focusing it or reading its selection.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `ref` | `Ref<HTMLInputElement>` |  | React 19 passes `ref` as a plain prop; it is declared so callers can reach the element to focus it or read its selection. |

And every prop of `InputHTMLAttributes<HTMLInputElement>`, passed on.
