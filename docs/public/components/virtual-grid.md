# VirtualGrid

Source: https://lacodda.github.io/dowel/components/virtual-grid

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#virtual-grid

Fifty thousand commits in four columns, one chosen, with the graph drawn as a layer over the rows in view.

## Notes

[VirtualList](/dowel/components/virtual-list/) is a list to read: a column of
rows, only the ones in view drawn. This is a list a person works through - a
commit graph, the entries of a disk, a log - and it adds what that needs.

**A grid with a cursor.** One tab stop. The arrows, `PageUp`, `PageDown`, `Home`
and `End` move the chosen row, and `Enter` opens it (`onActivate`, which a double
click calls too). The grid names the chosen row with `aria-activedescendant`, and
every move scrolls that row into view first - the least distance if it is near,
a third of the way down if it is far - because the row a reader is told about has
to be in the document. Each row says where it stands in the whole grid
(`aria-rowindex`, after the heading), since a reader cannot count rows that are
not drawn.

| Key | |
| --- | --- |
| `↑` `↓` | the row above or below |
| `PageUp` `PageDown` | a screenful less one row, so the row at the edge stays in sight |
| `Home` `End` | the first row, the last |
| `Enter` | open the chosen row |

**Rows by index, not an array.** `count` says how many rows there are, and
`renderRow(index)` draws one - or answers `null` for a row not read yet, which is
drawn empty at its height (`aria-busy`) until it is. `onRangeChange(start, end)`
says which rows are drawn whenever that changes, so a product that reads a page
at a time knows which pages to read:

```tsx
<VirtualGrid
  label={t('commits')}
  count={total}
  rowHeight={26}
  columns="grid-cols-[2rem_1fr_9rem_5rem]"
  header={
    <>
      <VirtualGridColumn><span className="sr-only">{t('graph')}</span></VirtualGridColumn>
      <VirtualGridColumn>{t('message')}</VirtualGridColumn>
      <VirtualGridColumn>{t('author')}</VirtualGridColumn>
      <VirtualGridColumn>{t('hash')}</VirtualGridColumn>
    </>
  }
  renderRow={(index) => {
    const commit = pages.at(index)
    return commit === undefined ? null : (
      <>
        <VirtualGridCell />
        <VirtualGridCell>{commit.subject}</VirtualGridCell>
        <VirtualGridCell>{commit.author}</VirtualGridCell>
        <VirtualGridCell className="font-mono">{commit.short}</VirtualGridCell>
      </>
    )
  }}
  onRangeChange={(start, end) => pages.read(start, end)}
  selected={chosen}
  onSelectedChange={setChosen}
  onActivate={open}
  className="h-full"
/>
```

**One template for the heading and the rows.** `columns` is a grid template
class, and the standing heading and every row take it, so a column cannot be
wider in one than in the other.

**A layer over the rows in view.** `layer` is drawn over the window, in a box
exactly the size of the rows drawn and in the same render as them, hidden from
readers and from the pointer. A canvas the product redraws for the
`{ start, end, rowHeight }` it is given stays on the rows it belongs to as the
grid scrolls - the graph column of a commit list is drawn this way.

**Give it a height.** It scrolls in its own box; without a height the box is as
tall as every row and nothing is windowed.

## Props

### `VirtualGrid`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` (required) | `string` |  | What a screen reader calls the grid: "Commits", "Entries". |
| `count` (required) | `number` |  | How many rows there are, read or not. |
| `rowHeight` (required) | `number` |  | How tall one row is, in pixels. Fixed, and rows are held to it. |
| `columns` (required) | `string` |  | The grid template the heading and every row share - a class such as `grid-cols-[1fr_8rem_6rem]`. |
| `header` | `ReactNode` |  | The heading: `VirtualGridColumn`s, one per column. |
| `renderRow` (required) | `(index: number) => ReactNode` |  | The cells of a row - `VirtualGridCell`s - or `null` for a row not read yet, which is drawn empty until it is. |
| `rowKey` | `(index: number) => string \| number` |  | A stable key per row. Without it rows are keyed by index, which is right only when a row's place never changes. |
| `selected` | `number \| null` |  | The chosen row, or `null` for none. Left out, the grid keeps its own. |
| `onSelectedChange` | `(index: number) => void` |  | Told the row a click or the keyboard chose. |
| `onActivate` | `(index: number) => void` |  | Enter on the chosen row, or a double click on a row: open what it stands for. |
| `onRangeChange` | `(start: number, end: number) => void` |  | Told which rows are drawn whenever that changes: `start` to `end`, the end not included. |
| `layer` | `(view: VirtualGridView) => ReactNode` |  | Drawn over the rows in view, in a box exactly their size and hidden from readers: a canvas the product redraws for the window it is given. |
| `overscan` | `number` | `6` | How many rows to draw beyond each edge of the view. |

And every prop of `HTMLAttributes<HTMLDivElement>` except `children`, `onKeyDown`, passed on.

### `VirtualGridCell`

A cell of a row. Its words truncate, so a row keeps its height.

Every prop of `HTMLAttributes<HTMLDivElement>`, passed on.

### `VirtualGridColumn`

A heading of a column, in the grid's standing row.

Every prop of `HTMLAttributes<HTMLDivElement>`, passed on.
