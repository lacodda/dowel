# CopyButton

Source: https://lacodda.github.io/dowel/components/copy-button

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#copy-button

A button that appears on hover of the panel around it, and one whose clipboard refuses - which says so rather than drawing a tick.

## Notes

Whatever a product shows in a panel — code, a payload, a log, one side of a
comparison — somebody eventually wants to take it away. This is that button,
with the three things a hand-written one misses.

**It confirms only after the clipboard does.** `navigator.clipboard.writeText`
can be refused: it needs a secure context and, in some browsers, a permission.
A tick drawn on click is a lie in exactly the case the reader most needs the
truth, and `onCopy(false)` is how your product finds out.

**It announces the copy as well as drawing it.** A tick that appears silently
tells a sighted reader it worked and tells nobody else. The live region beside
the button is the part that actually reports.

**It stays reachable without a pointer.** It is invisible until the block is
hovered — a permanent button in the corner of every panel is clutter — and on
its own that makes a control the keyboard cannot see. It is visible whenever it
has focus too, and that pairing is the whole trick.

```tsx
<div className="group relative rounded-md border border-line">
  <pre>{payload}</pre>
  <CopyButton
    value={payload}
    label={t('copy')}
    copiedLabel={t('copied')}
    className="absolute right-2 top-2"
  />
</div>
```

**The container carries `group`.** The button reveals on `group-hover`, so it
appears when the pointer is anywhere over the block rather than only once it
has found a button it cannot see.

**Both labels are required and neither has a default.** A string this component
invents is a string your product cannot translate, and it would ship in English
to every reader who does not read English.

## Against Copyable

[Copyable](/components/copyable/) answers the same wish in the opposite shape,
and they are not interchangeable.

| | `Copyable` | `CopyButton` |
| --- | --- | --- |
| Where | In a sentence, in a table cell | In the corner of a block |
| Shows | The text it copies | An icon |
| Visible | Always | On hover, and on focus |
| For | An id, a path, a hash | Code, a payload, a column |

Reach for `Copyable` when the value itself is the thing on screen, and this
when the content is already there and the button is furniture.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value` | `string` | | What lands on the clipboard |
| `label` | `string` | | Required — no default, so it can be translated |
| `copiedLabel` | `string` | | Required, and announced |
| `onCopy` | `(ok) => void` | | `false` means the clipboard refused |
