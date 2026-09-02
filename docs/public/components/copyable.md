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
| `children` | `string` | | The visible text |
| `value` | `string` | the text | What lands on the clipboard, if different |
| `label` | `string` | **required** | What the button is called |
| `copiedLabel` | `string` | **required** | What is announced after a copy |
| `onCopy` | `(ok: boolean) => void` | | Told what happened |
