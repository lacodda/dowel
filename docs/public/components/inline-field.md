# InlineField

Source: https://lacodda.github.io/dowel/components/inline-field

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#inline-field

A work's fields - a number, a key, a timecode, an empty one - and cells named only by their column.

## Notes

**For a board read far more often than it is edited.** The numbers on a work's
overview, the cells of a storyboard: every value sits as text until it is
touched. A modal to change one BPM is a lost context and a click too many, and
a column of always-on boxes is a form nobody asked to fill in. kilna had nine of
these editors, each with its own idea of what Enter and Escape mean; this is one
idea, and its rules are [FieldDraft](/dowel/components/field-draft/)'s:

- **Enter or leaving keeps a change** — and only a change: tabbing through
  twelve untouched fields writes nothing.
- **Escape takes it back** and writes nothing.
- **While nobody is typing, the field follows the stored value**; while someone
  is, their words win until they leave.
- **Enter on something unreadable keeps the words and marks them** — "1:75" is a
  typo one key from right. Leaving with them puts the stored value back, because
  a box showing a value that was not saved is a second truth.

```tsx
<InlineField label={t('bpm')} codec={numberCodec} value={work.bpm} placeholder="—" onCommit={(bpm) => save({ bpm })} />
<InlineField label={t('key')} value={work.key} onCommit={(key) => save({ key })} />
<InlineField label={t('length')} codec={timecodeCodec} value={work.seconds} onCommit={(seconds) => save({ seconds })} />
```

**It is always an `<input>`.** Not text that swaps to an input on click: a swap
loses the caret position, costs a render, and leaves the value unreachable by
Tab. The box is undressed until it is hovered or focused — a border under the
pointer, the accent when you are in it — and pulled left by its own padding, so
the text lines up with the caption above it.

**What a value is, is a codec.** `parse` reads what was typed and `format`
spells the stored value, so the field can never show one thing and store
another. `parse` answers `null` for an empty box — a value cleared, not a value
of zero — and `undefined` for text it cannot read, which the field refuses
rather than guesses at. Text needs no codec; a number without one does not
compile.

| Codec | Reads | Writes |
| --- | --- | --- |
| `textCodec` | the text as typed | the same |
| `numberCodec` | `120`, `3,5`, `-2`; empty is `null` | `120`, `3.5` |
| `timecodeCodec` | `83`, `1:23`, `0:04.5`, `1:00:00` — seconds; `1:75` is refused | `m:ss`, a tenth only when there is one |

A product's own — a key signature, a tempo range — is two functions:
`{ parse, format }`, with `mono: true` for figures that should line up and an
`inputMode` for the keyboard a phone offers.

**`onCommit` can refuse.** Return `false` — a server that said no — and the
field goes back to the stored value.

**A cell under a column header** takes `labelHidden`: the caption stays the
input's name for a reader and leaves the screen, because the header already
says it.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` | `ReactNode` | | Required — the caption above, and the input's name |
| `value` | `T \| null` | | The stored value |
| `onCommit` | `(value: T \| null) => boolean \| void` | | Called once per kept change; `false` refuses it |
| `codec` | `Codec<T>` | `textCodec` | Required for anything but text |
| `placeholder` | `string` | | What an empty value shows — a dash reads as "nothing yet" |
| `labelHidden` | `boolean` | `false` | For a cell under a column header |
| `disabled` | `boolean` | | |
| `className` | `string` | | On the wrapper |
