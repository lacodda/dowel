# TagInput

Source: https://lacodda.github.io/dowel/components/tag-input

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#tag-input

Typed, capped, and in three sizes.

## Notes

**The difference from `Combobox multiple` is where the values come from.** A
combobox chooses from a collection that exists; this makes values that do not
exist until someone types them — labels, keywords, recipients. If the set is
known in advance, reach for the combobox: it can filter, and this cannot.

```tsx
<TagInput
  value={tags}
  onValueChange={setTags}
  aria-label={t('tags')}
  removeLabel={(tag) => t('remove', { tag })}
/>
```

**Blur commits what was typed.** A word left in the box when the reader presses
Save is a word they believe they entered, and losing it silently is the single
commonest complaint about fields of this shape. Enter commits too, but nobody
reliably presses it before reaching for the mouse.

**Backspace on an empty box removes the last tag.** A list built by typing
should be unbuildable by typing; without this the only way back is the mouse.
While there is text in the box, Backspace belongs to the text.

**Enter is only intercepted when there is something to commit.** Otherwise it
belongs to the form around the field — swallowing it unconditionally breaks
submitting by keyboard, which is how a form is finished without a mouse.

**It does not validate.** What makes a tag acceptable — its length, its
charset, whether it must already exist — is your rule, and a component that
guessed would be wrong in both directions. Refuse a value by not putting it in
`value`; the field is controlled, so nothing appears that you did not accept.

**Duplicates are refused and whitespace is trimmed**, because a tag list is a
set and `"  docs  "` is the same tag as `"docs"`. Enter on a blank box does
nothing rather than adding a tag nobody can see.

**`removeLabel` is yours, and required** — the same rule as [Chip](/dowel/components/chip/),
for the same reason: a primitive with a string of its own ships in English to
every reader who does not read English.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md \| lg` | `'md'` |  |
| `value` (required) | `string[]` |  | The tags. Controlled: the product owns the list. |
| `onValueChange` (required) | `(value: string[]) => void` |  | Called with the next list. |
| `placeholder` | `string` |  | Placeholder for the text box, shown when there is room for it. |
| `aria-label` | `string` |  | Names the field. Required - a box of chips with no label names nothing. |
| `aria-labelledby` | `string` |  | Or points at a label element, when there is a visible one. |
| `removeLabel` (required) | `(tag: string) => string` |  | How a tag's remove button is named, for a screen reader. Takes the tag, so the product can say "Remove documentation" in its own language. |
| `max` | `number` |  | Cap on how many tags may be added. |
| `disabled` | `boolean` |  | Dims the field and stops it taking input or removing tags. |
| `children` | `ReactNode` |  | Drawn after the input, inside the box - a counter, a hint. |
| `className` | `string` |  |  |
| `id` | `string` |  | Put on the text box, so a `Field` label can point at it. |
