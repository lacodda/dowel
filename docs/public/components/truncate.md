# Truncate

Source: https://lacodda.github.io/dowel/components/truncate

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#truncate

One line and several, with the full text on hover.

## Notes

**The cut text is still available.** The element carries its own text as a
`title`, so hovering shows what was lost. Every product wrote the one-line
version of this and none of them remembered that part — cutting text without a
way to read it is losing it.

**`lines` needs a different mechanism, not a different value.** One line is
`truncate`; more than one is `line-clamp`, which is why it is a prop rather
than something you write yourself.

```tsx
<Truncate lines={2}>{description}</Truncate>
```

Pass `title=""` where the full text is already on screen and the tooltip would
be noise.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `children` | `string` | | Must be a string, so it can go in the `title` |
| `lines` | `number` | `1` | Cut after this many |
| `title` | `string` | the text | Pass `""` to silence the tooltip |
