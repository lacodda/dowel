# NumberFormat

Source: https://lacodda.github.io/dowel/components/number-format

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#number-format

The same number in four languages, money and percentages, and a column with and without tabular figures.

## Notes

**The separators are the reader's.** A thousand is `1,000` here, `1 000` there
and `1.000` somewhere else — and the last one is the same string another reader
would read as one. `Intl` knows this and a product does not have to.

**The figures line up.** `tabular-nums` gives every digit the same width, so a
column of numbers has its digits above each other and the eye can compare
lengths without reading. Without it a proportional font gives `1` less room
than `8`, the column ripples, and the only way to tell 9,999 from 10,000 is to
count.

This is the part that gets left out, because it looks fine on the one number a
developer tries it on and only fails in a column — which is exactly where
numbers live. Having it in a component is how it stops being remembered.

```tsx
<NumberFormat value={1234567} />
<NumberFormat value={1299.5} style="currency" currency="USD" />
<NumberFormat value={0.427} style="percent" maximumFractionDigits={1} />
<NumberFormat value={1200000} notation="compact" />   {/* 1.2M */}
```

**No locale is defaulted.** `undefined` means the reader's own, which is what a
product almost always wants. Passing `'en-US'` to be safe is how a German
reader is shown American separators for the life of the product.

**`Intl`'s options, not a second vocabulary.** Currency, percentages and units
take the same options object, so those are not three more components. What
`Intl` does not decide is compactness: `1.2M` is a choice about how much
precision the reader is owed, and it is the caller's, in `notation`.

**`style` means `Intl`'s style here**, not a CSS object — the two collide on
the name, and the formatting one wins. Inline styles are given up in exchange,
which costs nothing: appearance is the theme's business and `className` is
still there.

**`value` is a `number`, not `number | null`.** A row with no value shows
whatever the product says absence looks like — a dash, a word, an empty cell —
and that is a decision about the data, not about formatting. See
[table-sort](/dowel/components/table-sort/) for the same distinction in the
ordering.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value` | `number` | | Required |
| `locale` | `string \| string[]` | the reader's | |
| …`Intl.NumberFormatOptions` | | | `style`, `currency`, `notation`, `maximumFractionDigits`, … |
| `className` | `string` | | Merged; `tabular-nums` stays |

`formatNumber(value, locale?, options?)` gives the string alone, for a `title`,
an `aria-label` or a CSV.
