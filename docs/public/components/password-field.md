# PasswordField

Source: https://lacodda.github.io/dowel/components/password-field

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#password-field

Masked, revealed, and inside a Field with an error.

## Notes

**The reveal is the component, and it is not a convenience.** A masked field is
the only one in a form where a typo cannot be seen, so people either paste or
type slowly and get it wrong anyway. The toggle is what turns an unverifiable
field into a checkable one, and it is why long passphrases became usable.

What it costs is a moment where the password is on the screen, so the component
states its two rules rather than leaving them to each product:

- **it always starts masked**, and there is no prop to start it revealed;
- **revealing is the reader's own action** — never a default, and never
  something a form can turn on for them.

```tsx
<PasswordField
  value={password}
  onValueChange={setPassword}
  showLabel="Show password"
  hideLabel="Hide password"
  autoComplete="current-password"
/>
```

**The two labels are required.** The button's name is what a screen reader
announces, and it changes with the state — it describes the action, not the
condition. A default here would be English shipped inside a primitive.

**`autoComplete` is not defaulted either.** `current-password` on a login,
`new-password` on a sign-up; getting it wrong is how a password manager fills
the wrong box, and only the product knows which form this is.

**The button is `type="button"`.** One that defaults to submit sends the form
on the first click, with the password half typed.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value` | `string` |  | The controlled password. |
| `defaultValue` | `string` |  | The starting password of an uncontrolled field. |
| `onValueChange` | `(value: string) => void` |  | Called with the new text on every change. |
| `showLabel` (required) | `string` |  | What the reveal button is called while the password is hidden. |
| `hideLabel` (required) | `string` |  | ...and while it is showing. |
| `autoComplete` | `string` |  | `current-password` for a login, `new-password` for a sign-up. |
| `placeholder` | `string` |  | Shown in the box while it is empty. |
| `disabled` | `boolean` |  | Turns the field and its reveal button off. |
| `readOnly` | `boolean` |  | The password can be read and selected but not changed. |
| `required` | `boolean` |  | Marks the field as required, for a form to check. |
| `name` | `string` |  | The name the password is submitted under in a form. |
| `id` | `string` |  | The `id` of the input, which the reveal button controls. A generated one if omitted. |
| `ref` | `Ref<HTMLInputElement>` |  | A ref to the `<input>`, to focus it after a failed sign-in. |
| `aria-label` | `string` |  | Names the field for a screen reader, when there is no visible label. |
| `aria-describedby` | `string` |  | The `id` of the element that describes the field - the rules a new password must meet. |
| `className` | `string` |  |  |
