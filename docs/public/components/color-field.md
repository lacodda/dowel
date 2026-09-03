# ColorField

Source: https://lacodda.github.io/dowel/components/color-field

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#color-field

The line's palette, and a colour of the reader's own.

## Notes

**This is for the product's data, not for its appearance.** A tag's colour, a
project's colour, a calendar's colour — things stored beside a name. It is not
how a reader repaints the interface: the theme decides that, from one accent,
and a field that let anyone override it would undo the argument the whole
system rests on.

```tsx
<ColorField
  value={tag.color}
  onValueChange={(color) => save({ ...tag, color })}
  aria-label={t('colour')}
  swatchLabel={(name) => t(`colour.${name}`)}
/>
```

**The palette comes first, and it reports a name.** The swatches are the
line's fourteen accents plus the four semantic tokens, so a chosen value is
`kilna` or `good` — a word from the vocabulary the product already speaks. A
name keeps meaning the right thing when the theme changes underneath it; a hex
captured at the moment of choosing would not.

**Free hex is opt-in, through `allowCustom`.** It does not contradict the rule
against raw colours: that rule is about a component hardcoding its own
appearance, while a colour a reader picked for their own tag is data — the
same kind of thing as the tag's name.

**A typed colour commits only once it is one.** Half of `#3fa9` is not a
colour, and pushing every keystroke up would either reject the reader
mid-word or repaint the product with something they were passing through. The
box holds a draft; `value` moves when the draft is a colour.

**The swatches are real radios in a `radiogroup`.** That is what makes the
arrow keys walk the palette, what makes the choice announce itself, and what
keeps the whole palette one tab stop — eighteen buttons would put eighteen
stops between it and the next field.

**`swatchLabel` is yours.** Without it the swatches are named by their token,
which is right for a developer and wrong for a reader: `lime` is not a word
your product necessarily uses.
