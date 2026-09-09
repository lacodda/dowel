# VirtualList

Source: https://lacodda.github.io/dowel/components/virtual-list

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#virtual-list

A hundred thousand rows, taller rows, and none at all.

## Notes

**Why it exists.** The browser is fine with long lists until it is not: a
hundred thousand `<div>`s is a layout the machine recomputes on every change,
and the page stops responding while it does. What is drawn instead is the
window the reader can see, held in place by a tall spacer so the scrollbar
still says how much there is.

```tsx
<VirtualList
  rows={rows}
  rowHeight={32}
  rowKey={(row) => row.id}
  label="Works"
  className="h-64"
>
  {(row, index) => <Line row={row} index={index} />}
</VirtualList>
```

**No virtualisation library.** `react-window`, `react-virtuoso` and
`@tanstack/react-virtual` all solve the general problem — variable heights
measured at runtime, horizontal windows, grids — and the general problem is not
the one a design system has: every long list in a product is a column of rows
of one height. That case is `windowFor`, and it is small enough to read.

**`rowHeight` is given, never measured**, and variable heights are deliberately
not supported. Measuring means rendering to find out, which means a second
pass, a cache, and a scrollbar that changes length as the reader travels. A
product that needs that needs a library rather than a bigger version of this.

**The arithmetic is exported**, and that is not tidiness. A window computed
inside an effect can only be tested by a browser, and jsdom gives every element
a height of zero — a test would assert against a list that believes it is
invisible and pass whatever the code did. As a plain function the rules are
checkable: given a scroll offset and a height, these rows are drawn.

```ts
windowFor({ count: 100_000, rowHeight: 32, viewportHeight: 400, scrollTop: 0 })
// → { start: 0, end: 17, totalHeight: 3_200_000, offsetTop: 0 }
```

**`overscan` is not decoration.** The scroll event arrives after the pixels, so
without extra rows beyond each edge a fast scroll paints blank where nothing
has been drawn yet.

**`rowKey` is required.** Without it React keys by index, and a list that is
sorted or filtered reuses the wrong DOM node — the row moves but the input
inside it keeps the text that was typed into a different row.

**It announces its real size.** `aria-setsize` and `aria-posinset` on each row,
because the rows in the DOM are a screenful: counted from those, a reader would
say "3 of 20" in a list of a hundred thousand. Not `aria-rowcount` /
`aria-rowindex`, which look like the right names and belong to `grid`, `table`
and `treegrid` — on a list they are unsupported.

**The viewport is watched, not measured once.** A list inside a panel that
opens, a window the reader resizes, a font that loads late — all change the
height after mount, and a list that measured once draws the wrong number of
rows until something scrolls it.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `rows` | `readonly Row[]` | | |
| `rowHeight` | `number` | | Fixed. Every row is this tall |
| `children` | `(row, index) => ReactNode` | | |
| `rowKey` | `(row, index) => string \| number` | | Required. Stable identity |
| `overscan` | `number` | `3` | Extra rows drawn beyond each edge |
| `label` | `string` | | Required. What a reader calls the list |

`windowFor({ count, rowHeight, viewportHeight, scrollTop, overscan? })` returns
`{ start, end, totalHeight, offsetTop }` — for a product windowing its own rows.
