# Frame

Source: https://lacodda.github.io/dowel/components/frame

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#frame

A column with a standing head and foot, a list beside its detail at two widths, and the rail's width for settings.

## Notes

**The column never scrolls; a part of its body does.** The obvious way to
build a screen - a column that scrolls - is wrong three ways at once: the head
goes up with the content, a table's sticky header has nothing to stick to, and
a field at the foot drifts off the bottom of the window with everything above
it. kilna found eleven screens drawn that way after a release had said none
were, and this is the frame it settled on.

```tsx
<Screen scroll="held">
  <Frame head={<PageHeader title="Works" />} foot={<SaveState status={status} />}>
    <Pane label="Works" bodyClassName="p-1">
      {works.map((work) => <RowButton key={work.id}>{work.title}</RowButton>)}
    </Pane>
  </Frame>
</Screen>
```

`Screen scroll="held"` hands the window's height down and scrolls nowhere;
`Frame` keeps it; `Pane` is the one box that scrolls, between bars that stand.

**`Pane` scrolls down, never across.** Its body is a
[ScrollArea](/dowel/components/scroll-area/) held to the vertical axis, so a
row truncates to its column instead of widening it - a queue's rows once ran a
hundred pixels past a 264px column before the axis was held. `label` names the
body, which becomes a tab stop when it overflows.

**`ListDetail` has two widths and one gap.** `list` (`--spacing-list`, 264px)
for rows with a title and a line under it; `rail` (`--spacing-rail`, 216px)
for a column of destinations, such as the sections of a settings screen. Six
screens of kilna drew this with five widths and three gaps before it was one
component.

**Where there is no room for both, there is one.** Below 672px of its own
width - a container query, so a rail beside it is counted - the list takes
the whole width until something is open, then the open thing takes it alone.
That is why `open` is required: a screen that forgot it would show a phone the
list forever. Put `ListDetailBack` in the detail's head; it is drawn only at
that width, where the list is not on screen.

```tsx
<ListDetail
  open={selected !== null}
  list={<Pane label="Works">{rows}</Pane>}
  detail={
    <Pane
      label={work.title}
      head={<ListDetailBack label="All works" onClick={() => setSelected(null)} />}
    >
      {body}
    </Pane>
  }
/>
```

The [ListDetailScreen](/dowel/blocks/list-detail-screen/) block is this,
with the search, the keyboard and the empty states a list needs.

## Props

### `Frame`

A screen's column. Hands its height to the body and scrolls nowhere.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `head` | `ReactNode` |  | What stands above the body: a title, the filters, the screen's actions. |
| `foot` | `ReactNode` |  | What stands under it: a composer, a status line. |
| `children` (required) | `ReactNode` |  |  |

And every prop of `HTMLAttributes<HTMLDivElement>` except `children`, passed on.

### `Pane`

A panel whose bars stand and whose body scrolls between them.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` (required) | `string` |  | What the body holds: the scroll region's name, which it needs because it becomes a tab stop when it overflows - "Works", "Version 3". |
| `head` | `ReactNode` |  | The bar across the top: a title and what acts on the open thing. |
| `foot` | `ReactNode` |  | The bar across the foot: a status, tags, a button that adds a row. |
| `children` (required) | `ReactNode` |  |  |
| `bodyClassName` | `string` |  | The body's padding. A list's rows pad themselves; prose needs room. |
| `viewportRef` | `Ref<HTMLDivElement>` |  | The scrolling element, for a caller that reads or sets the position. |

And every prop of `HTMLAttributes<HTMLElement>` except `children`, passed on.

### `ListDetail`

A list beside what is open in it, each scrolling on its own - and one at a time where there is no room for both.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `list` (required) | `ReactNode` |  | The list, usually a `Pane` of `RowButton`s. |
| `detail` (required) | `ReactNode` |  | What is open in it, or what says nothing is. |
| `open` (required) | `boolean` |  | Whether something in the list is open. Where there is room for both it changes nothing; where there is not, it decides which of the two is shown. Required, because a screen that forgot it would show a phone the list forever and the detail never. |
| `width` | `list \| rail` | `'list'` | `list` for rows that carry a title and a line under it - versions, works, notes, a queue. `rail` for a column of destinations, the width of the app's own rail - the sections of the settings. |
| `side` | `start \| end` | `'start'` | Which side the list stands on. A queue read against a month stands after it. |

And every prop of `HTMLAttributes<HTMLDivElement>` except `children`, passed on.

### `ListDetailBack`

The way back to the list, for the width at which the list is not on screen. Drawn only there: beside the list it would be a button that returns to where the reader already is.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `label` (required) | `ReactNode` |  | What it says: "All works", "Settings". The product's word, shown beside the arrow. |
| `onClick` (required) | `MouseEventHandler<HTMLButtonElement>` |  | Called when the button is pressed. The screen uses it to close the open thing and show the list again. |
| `className` | `string` |  |  |
