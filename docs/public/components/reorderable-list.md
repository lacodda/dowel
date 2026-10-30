# ReorderableList

Source: https://lacodda.github.io/dowel/components/reorderable-list

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#reorderable-list

A column picker whose rows drag by their grip, with the drop line - or focus a row and press Alt with an arrow.

## Notes

The columns in a column picker, the stops of a dial, the roles of a profile.
A hook and a grip rather than a list component: the rows are already
something else's — a menu's items, a form's fields — and a component wrapping
them would have to reproduce whatever that something else does.

```tsx
const reorder = useReorder<ColumnId>({ order: columns, onMove })

<div {...reorder.listProps} className="relative">
  {columns.map((id) => (
    <MenuCheckboxItem
      key={id}
      checked
      closeOnClick={false}
      className={cn(reorder.dragging === id && 'opacity-50')}
      {...reorder.rowProps(id)}
    >
      <span className="flex-1">{LABEL[id]}</span>
      <ReorderGrip {...reorder.gripProps(id)} title={t('columns.moveHint')} />
    </MenuCheckboxItem>
  ))}
  <ReorderIndicator offset={reorder.slotOffset} />
</div>
```

**Nothing moves until the pointer is let go.** Live reordering looks better
for a second and costs a write per crossed row — to a profile, that is a
request per row — and the row being dragged has already been picked up, so
the reader is watching the line that says where it lands. `onMove(id, to)` is
called once per drop, with `to` the index in the list as it will be.

**The line is yours to draw.** The hook reports `slot` and `slotOffset`, the
insertion point's distance from the top of the element `listProps` is on;
`ReorderIndicator` draws it there, which is why that element is `relative`.
No line is drawn for a drop that would change nothing.

**Alt with an arrow moves the focused row.** Plain arrows are how a list is
walked, and taking them for moving would leave no way to walk it; the
modifier is the one screen readers and editors already use for "move this
line". The listener is native, on the row itself, so a menu popup that stops
arrow keys on the way up cannot swallow it.

**The grip is decorative.** The keyboard path is on the row, so the grip
carries no role and no label. The click a drop leaves behind is stopped: in a
menu it would toggle the item that was only meant to be moved.

**Pointer events, not HTML5 drag-and-drop**, for the reason given at
[ColumnResizeHandle](/dowel/components/column-resize-handle/); the grip takes
pointer capture so the rows underneath never see the drag.

**`useReorder({ order, onMove, disabled? })` returns** `listProps` for the element holding the rows, `rowProps(id)` for each row (the id and the keyboard path), `gripProps(id)` for the grip, and `dragging`, `slot` and `slotOffset` for drawing the drag: the row being dragged, the insertion point in the order as it is, and its distance from the top of the list in pixels. `ReorderGrip` takes any `<span>` attribute, `title` for the hover hint.

## Props

### `ReorderGrip`

The handle a row is picked up by. Decorative to a screen reader - the keyboard path is on the row itself - so it carries no role and no label.

Every prop of `HTMLAttributes<HTMLElement>`, passed on.

### `ReorderIndicator`

The line where a dragged row would land. Positioned by the caller from `slotOffset`, inside the element `listProps` is on - which has to be positioned itself.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `offset` (required) | `number \| null` |  | The line's distance from the top of the list, in pixels - `slotOffset` from `useReorder`. Nothing is drawn at `null`. |
| `className` | `string` |  |  |
