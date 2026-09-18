# ColumnResizeHandle

Source: https://lacodda.github.io/dowel/components/column-resize-handle

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#column-resize-handle

A table whose headings end in a handle - drag one, double-click it to give the column its natural width back.

## Notes

Every heading ends in a thin handle; drag it to make the column wider or
narrower, and double-click it to give the column its natural width back. Three
pieces: the handle, `useColumnWidths` that keeps what was dragged, and
`measureColumns` that reads a header row off the screen. Shown here against
[Table](/dowel/components/table/), which is where it goes.

```tsx
const widths = useColumnWidths<'title' | 'owner' | 'words'>({
  initial: loadWidths,
  onChange: saveWidths,
  fallback: (id) => NATURAL[id],
})
const header = useRef<HTMLTableRowElement>(null)

<Table className={widths.sized ? 'table-fixed' : undefined}>
  <colgroup>
    {columns.map((id) => (
      <col key={id} style={widths.sized && id !== 'title' ? { width: widths.widthOf(id) } : undefined} />
    ))}
  </colgroup>
  <TableHead>
    <TableRow ref={header}>
      {columns.map((id) => (
        <TableHeader key={id} data-column={id} className="relative">
          {LABEL[id]}
          <ColumnResizeHandle
            label={t('table.resize', { column: LABEL[id] })}
            hint={t('table.resizeHint')}
            onStart={() => header.current && widths.measure(measureColumns(header.current))}
            onResize={(px, done) => widths.resize(id, px, done)}
            onReset={() => widths.reset(id)}
          />
        </TableHeader>
      ))}
    </TableRow>
  </TableHead>
  …
</Table>
```

**The cell is `relative`; the handle is `absolute` on its right edge.** It
measures its parent's box on the press and reports that width plus the
distance travelled, so it has no `width` prop to be handed and cannot
disagree with what is on screen.

**The widths live on `<col>`s, and only once something was sized by hand.**
Until then the browser lays the table out from its contents as it always did.
The first drag switches the table to `table-layout: fixed`, and under fixed
layout every column needs a width or the browser shares the free space equally
between those without one — which is how a date column ends up as wide as the
title. So `onStart` measures the header row before the layout goes fixed, the
hook keeps those natural widths beside the dragged ones, and `widthOf` answers
from one or the other. Leave the one column meant to take the remaining space
without a `<col>` width.

**`onResize` reports while dragging and once more with `done`.** The last
call is the moment to persist; `useColumnWidths` does that for you through
`onChange`. Widths belong per machine, not to a profile: the pixels that fit
a title on a laptop are not the pixels that fit it on a monitor.

**Pointer events, not HTML5 drag-and-drop.** A desktop shell that takes file
drops for itself never lets a `dragstart` reach the page. Pointer capture
keeps the drag alive when the pointer runs ahead of the cell.

**It is a separator, not a button.** A button per column would be one more
tab stop for something a keyboard cannot usefully drive. The click after a
drag is stopped so a sortable heading does not flip its sort every time a
width is set.

## Props

### `ColumnResizeHandle`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` | `string` | | Required — names the column for a screen reader |
| `hint` | `string` | | The tooltip: how to drag, how to reset |
| `onResize` | `(width, done) => void` | | Required; `done` on release |
| `onReset` | `() => void` | | Required; on double-click |
| `onStart` | `() => void` | | On the press, before the first width |
| `minWidth` | `number` | `56` | |
| `className` | `string` | | Merged so the caller wins a conflict |

### `useColumnWidths({ initial, onChange?, fallback?, minWidth? })`

Returns `{ sized, hand, isHandSized(id), widthOf(id), resize(id, width, done?), reset(id), measure(cells) }`.

### `measureColumns(row, attribute = 'data-column')`

The `[id, width]` pairs of a header row's cells that carry the attribute.
