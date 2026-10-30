# Scroll area

Source: https://lacodda.github.io/dowel/components/scroll-area

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#scroll-area

A list taller than its box, the same list with edge fades, and a log that scrolls on both axes.

## Notes

```tsx
<ScrollArea label={t('activity')} fade className="h-64">
  <ActivityList />
</ScrollArea>
```

**Only an overlay bar.** The line's rule is a thin bar laid over the content
and never a gutter. A gutter is a column of the layout that comes and goes
with the length of the content, so a list growing past the fold pushes
everything beside it sideways. The theme's global rules make the native bar
thin, but thin is still a gutter wherever the platform draws one; the only
bar that can promise to take no room is one the browser does not draw. The
viewport hides its native bars and the thumb is drawn by Base UI's
ScrollArea from the scroll position.

**Hidden at rest, grabbable on hover.** The bar appears while the pointer is
over the area or while it scrolls, and fades out after. The track is wider
than the thumb, and the thumb thickens under the pointer: four pixels read as
a hint and are hopeless as a grip. A bar is mounted only for an axis that
actually overflows, so a list that fits draws nothing.

**The keyboard still scrolls, and that is why `label` is required.** A box
that scrolls has to be reachable, or a reader without a pointer never sees
what is below the fold (axe's `scrollable-region-focusable`). The viewport
becomes a tab stop exactly when its content overflows, and a tab stop has to
be called something. Whether the content will overflow is not known when the
product is written, so the name cannot be left for the long case - it is a
required prop with no default, like every word in the set.

**Fades follow the distance left.** `fade` masks the content at the edges
where there is more to see, reading Base UI's overflow distances, so an edge
already at its end stays sharp and a fade grows in as scrolling starts
rather than switching on. A mask rather than a painted gradient, because a
gradient would have to be the colour of whatever sits behind the area.

**The height goes on the root.** `className` sizes the area; the viewport
fills it. A product that needs the scrolling element - to set its position,
or to feed a virtual list - takes it through `viewportRef`.

**A list scrolls one way.** Base UI sizes the content to `fit-content`, which is
right for a table that is meant to be wider than its box and wrong for a list:
a row that should truncate to its column widens the content instead, and the
list scrolls sideways by the length of its longest title. `orientation="vertical"`
holds the content to the viewport's width, so rows truncate, and draws no
sideways bar; `horizontal` does the same the other way, for a strip of chips.

 FENCE2

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` (required) | `string` |  | Names the viewport, which becomes a tab stop when its content overflows: "Recent activity", "Diff of main.rs". No default - it is the product's word. |
| `fade` | `boolean` | `false` | Fade the edges that have more content past them. |
| `orientation` | `horizontal \| vertical \| both` | `'both'` | Which way the content may move. `vertical` for a list whose rows truncate to the column; `both` for a table or a picture. |
| `viewportRef` | `Ref<HTMLDivElement>` |  | The scrolling element itself, for a product that sets or reads its position - a virtual list, a scroll-to-latest. |
| `className` | `string` |  | On the root: its size is the area's size, so the height goes here. |
| `viewportClassName` | `string` |  | On the scrolling element, for padding that should scroll with the content. |
| `children` (required) | `ReactNode` |  |  |
