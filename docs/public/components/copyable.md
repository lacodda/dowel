# Copyable

Source: https://lacodda.github.io/dowel/components/copyable

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#copyable

An id, a hash, a path - copied with one click.

## Notes

**The rule comes from nitid:** if a value is worth showing, it is worth being
able to copy. Selecting a monospaced id by hand is a small daily tax.

**It is a `<button>`,** so the keyboard reaches it and a screen reader says
what it does.

**It is named by its label and then by the value it shows** — "Copy a1b2c3".
The label alone would be a name without the words drawn on the button, and
someone telling voice control what they see says those words (WCAG 2.5.3).

**The confirmation is announced, not only drawn.** A tick that appears silently
tells a sighted user it worked and tells nobody else.

**A refusal is reported.** The clipboard needs a secure context and sometimes a
permission; a button that looks like it worked and did not is worse than one
that admits it failed.

```tsx
<Copyable
  value={commit.sha}
  label={t('copy')}
  copiedLabel={t('copied')}
  onCopy={(ok) => ok || toast(t('copy.failed'))}
>
  {commit.short}
</Copyable>
```

**Both labels are required, on purpose.** They are what a screen reader
announces, and a default would be an English word this component invented —
one the product's translations never reach. Requiring them means a product
that forgets fails to compile rather than shipping English to a reader who
does not read it.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value` | `string` |  | What lands on the clipboard. Defaults to the visible text. |
| `children` (required) | `string` |  | The visible text. |
| `label` (required) | `string` |  | What the button is called, for a screen reader. Required, and deliberately without a default: a string the component invents is a string the product cannot translate, and it would ship in English to every reader who does not read English. |
| `copiedLabel` (required) | `string` |  | What is announced after a successful copy. Required for the same reason. |
| `onCopy` | `(ok: boolean) => void` |  | Told what happened, for a product that wants its own toast. |

And every prop of `HTMLAttributes<HTMLButtonElement>` except `onCopy`, passed on.
