# Table

Source: https://lacodda.github.io/dowel/components/table

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#table

Sortable, the same table in a compact region, with a sticky heading, and empty.

## Notes

**Parts rather than a `columns` prop.** A `<DataTable columns={…} rows={…} />`
is quicker to write for the first table and then owns every cell in the product
forever. The moment one column needs a [Badge](/dowel/components/badge/),
another a link, and a third the row's own [Menu](/dowel/components/menu/), the
prop grows a `render` for each — at which point it is JSX with extra steps,
spelt in a shape only this component understands.

So the parts are the ones HTML already has, dressed. What is bought by having
them here rather than in the product is that every table of the line has the
same row height, the same heading, the same hairline, and the same behaviour
when a column is sorted.

```tsx
const [sort, setSort] = useState<Sort>({ column: 'title', direction: 'asc' })

<TableScroll>
  <Table>
    <TableHead sticky>
      <TableRow>
        <TableSortHeader column="title" sort={sort} onSortChange={(c) => setSort(toggleSort(sort, c))}>
          Title
        </TableSortHeader>
        <TableHeader numeric>Words</TableHeader>
      </TableRow>
    </TableHead>
    <TableBody>
      {sortRows(rows, sort, read, { locale }).map((row) => (
        <TableRow key={row.id} selected={row.id === picked}>
          <TableCell>{row.title}</TableCell>
          <TableCell numeric><NumberFormat value={row.words} /></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableScroll>
```

**The sorting arithmetic is next door.** It lives in
[table-sort](/dowel/components/table-sort/) with no React in it, which is what
lets a product sort on the server and still get the same order — including the
rule that absence sorts last in both directions.

**`TableSortHeader` puts a real `<button>` in the cell.** Not an `onClick` on
the `<th>`: the cell is not focusable, gets no keyboard, and announces nothing.
This is the part a hand-rolled table almost always gets wrong, and it is
invisible to everyone who reorders with a mouse.

**`TableScroll` is not decoration.** `overflow` on a `<table>` does nothing, so
the wrapper is the only place a scrollbar can live — and the only thing a
sticky heading can stick inside. The scrollbar it gets is the theme's overlay
one, which takes no room in the layout.

**`sticky` is off by default.** A sticky heading needs a container with a
height; switched on by default it would silently do nothing in the common case
— a table that scrolls with the page — and look broken in the other. When it is
on, the heading takes its own background: transparent, it would have the rows
sliding visibly beneath its text.

**`numeric` on a cell** right-aligns it and sets tabular figures. It is a prop
rather than a class the caller adds because a column of numbers that is not
aligned is the commonest defect in a table, and the one nobody files a bug
about. For the number itself, [NumberFormat](/dowel/components/number-format/).

**`TableEmpty` spans the whole width.** A row rather than a block below the
table, so the heading stays where it is and the table does not change shape
between having rows and not; `colSpan` is required, because without it the
message sits under the first column.

**`Table` follows the region's density**, so row height changes with it.

## Props

### `Table`

Every prop of `HTMLAttributes<HTMLTableElement>`, passed on.

### `TableScroll`

The scroll container a table needs, and the one a sticky heading sticks in.

Every prop of `HTMLAttributes<HTMLDivElement>`, passed on.

### `TableHead`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `sticky` | `boolean` | `false` | Keep the heading in view while the body scrolls under it. |

And every prop of `HTMLAttributes<HTMLTableSectionElement>`, passed on.

### `TableBody`

Every prop of `HTMLAttributes<HTMLTableSectionElement>`, passed on.

### `TableRow`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `selected` | `boolean` | `false` | The row the reader has picked out - the one open in the panel beside the table, the one a keyboard cursor is on. Not a hover state. |

And every prop of `HTMLAttributes<HTMLTableRowElement>`, passed on.

### `TableCell`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `numeric` | `boolean` | `false` | Right-align and use the lining figures. For a column of numbers, and the reason it is a prop rather than a class the caller adds: a column of numbers that is not aligned is the most common defect in a table, and the one nobody files a bug about. |

And every prop of `TdHTMLAttributes<HTMLTableCellElement>`, passed on.

### `TableHeader`

A plain heading, for a column that does not sort.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `numeric` | `boolean` | `false` | Right-align the heading, to sit over a `numeric` column of cells. |

And every prop of `ThHTMLAttributes<HTMLTableCellElement>`, passed on.

### `TableSortHeader`

A heading that reorders the table when clicked.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `numeric` | `boolean` | `false` | Right-align the heading, to sit over a `numeric` column of cells. |
| `column` (required) | `string` |  | This column's id - the key the accessor sorts by. |
| `sort` (required) | `Sort<string>` |  | What is sorted now, across the whole table. |
| `onSortChange` (required) | `(column: string) => void` |  | Called with this column's id when the heading is clicked. The product decides what comes next - the table does not sort or flip the direction. |

And every prop of `ThHTMLAttributes<HTMLTableCellElement>` except `onClick`, passed on.

### `TableEmpty`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `colSpan` (required) | `number` |  | How many columns the message spans: the table's column count. |

And every prop of `TdHTMLAttributes<HTMLTableCellElement>`, passed on.
