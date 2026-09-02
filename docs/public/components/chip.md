# Chip

Source: https://lacodda.github.io/dowel/components/chip

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#chip

Plain, with a count, and removable.

## Notes

**The difference from a Badge is whether something happens when you click it.**
If something does, that part is a real `<button>` with a real label — not a
decorative cross. Every product wrote the removable tag and every one made the
cross a `<span>`, which the keyboard cannot reach and a screen reader does not
announce.

```tsx
<Chip onRemove={() => drop(tag)} removeLabel={t('remove')}>
  {tag}
</Chip>
```

**`removeLabel` is yours, and required.** The two props travel together in the
type: a remove button exists only where there is a word for it, so a chip that
can be removed but not named will not compile. A primitive with a string of its own cannot be
translated, so the word for "remove" comes from the product.

**The remove click does not reach what the chip sits in.** Chips usually live
inside something else that is also clickable, and removing a tag should not
also open the row it was on.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `variant` | `outline \| accent \| soft` | `outline` | |
| `count` | `number` | | Shown after the label |
| `onRemove` | `() => void` | | Makes the chip removable — requires `removeLabel` |
| `removeLabel` | `string` | **required with `onRemove`** | What the remove button is called |
