# Splitter

Source: https://lacodda.github.io/dowel/components/splitter

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#splitter

A collapsible file list beside an editor, two stacked panes, and three panes with a handle between each two.

## Notes

```tsx
<Splitter defaultSizes={saved ?? [25, 75]} onSizesChange={save}>
  <SplitterPane min={15} max={45} collapsible>
    <FileList />
  </SplitterPane>
  <SplitterHandle label={t('resize.files')} />
  <SplitterPane min={30}>
    <Editor />
  </SplitterPane>
</Splitter>
```

**Three parts, not a two-pane component.** A `first` and `second` prop shape
is the one every product outgrows on the day it wants a third pane, and the
rewrite is every call site. Here a third pane is two more lines. Each handle
moves only the boundary it sits on: the panes on either side of it trade
size and the rest stay put.

Panes and handles must be direct children of the `Splitter` - not wrapped in
a fragment or a component of the product's own - because that is how each
learns its place and how the splitter reads the panes' limits.

**Percent, not pixels.** Sizes are shares of the splitter, so a window
resized to half its width keeps the sidebar at the same share instead of
eating the editor. A pane's share is its flex grow over a zero basis, which is
what lets the one-pixel handles sit between the panes without the shares
adding up to more than the box.

**The product keeps the sizes; the component never stores them.**
`onSizesChange` fires once when a change settles - a drag let go, a key
pressed - not on every pointer move, so persisting there is one write per
gesture. What was saved comes back as `defaultSizes`. Adding or removing a
pane starts again from equal shares, since the old ones no longer describe
the row.

**The handle is the ARIA window splitter.** A focusable `separator` with
`aria-orientation` across the layout, `aria-controls` pointing at the pane
before it, and that pane's size as `aria-valuenow` between the bounds both
neighbours allow. Arrows along the axis move it by `step` percent, Shift by
five steps, Home and End to the bounds. Its name is a required prop: there is
no English default.

**Collapse is a state, not a small size.** A pane marked `collapsible` below
its minimum is either collapsed or at its minimum, never between: a drag goes
to the nearer of the two, an arrow past the minimum collapses it, and an
arrow back opens it at the minimum. Enter collapses the pane before the
handle if it can, else the one after it - a right-hand sidebar is the second
pane of its handle - and Enter again restores the size it had. A pane
collapsed to nothing is `inert`, so Tab does not walk into controls nobody can
see; `collapsedSize` keeps a rail of icons instead.

**A pixel to see, the floor to hit.** The visible line is one pixel and the
hit area is `target-min`, the theme's way of growing a target to 24px without
growing what is drawn - the same reason `ColumnResizeHandle` is wider to hit
than to see. Pointer events with capture, not HTML5 drag-and-drop, which a
desktop shell that takes file drops never delivers to the page.

The arithmetic is exported as `moveBoundary` and `boundsOf`, plain functions
a product can test or reuse without rendering anything.

## Props

### `Splitter`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `orientation` | `horizontal \| vertical` | `horizontal` | `horizontal` is side by side |
| `defaultSizes` | `number[]` | equal shares | One percentage per pane, summing to 100 |
| `onSizesChange` | `(sizes: number[]) => void` | | Once per settled change: persist here |
| `step` | `number` | `2` | Percent per arrow press; Shift moves five |
| `className` | `string` | | Merged so the caller wins a conflict |

### `SplitterPane`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `min` | `number` | `0` | Smallest share, in percent |
| `max` | `number` | `100` | Largest share, in percent |
| `collapsible` | `boolean` | `false` | May shrink past `min` to `collapsedSize` |
| `collapsedSize` | `number` | `0` | Its share when collapsed |
| `className` | `string` | | Merged so the caller wins a conflict |

### `SplitterHandle`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` | `string` | | Required. What it resizes: "Resize the sidebar" |
| `className` | `string` | | Merged so the caller wins a conflict |
