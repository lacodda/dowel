# Drawer

Source: https://lacodda.github.io/dowel/components/drawer

FENCE0 

The component lands in `components/ui/drawer.tsx` and is yours to edit.

See it live on the stand: https://lacodda.github.io/dowel/stand/#drawer

The three sides - right, left and a bottom sheet - in either theme, and in the accent of any product of the line.

## When this and not a Dialog

Both are modal, and both hold the screen while they are open. The difference is
shape, and shape follows content.

Reach for **Dialog** when the content is short and self-contained: a question,
a small form, a confirmation with two buttons. Centred, and gone in a moment.

Reach for **Drawer** when the content is tall or long-lived — a filter sheet
with a dozen controls, a detail pane you read alongside the list, a form that
would need scrolling in a centred box. It pins itself to an edge and keeps its
full height, so scrolling happens inside it rather than moving the whole panel.

On a small screen a bottom-sheet drawer is usually the right answer where a
desktop layout would use a dialog: it is reachable by thumb and it can be
swiped away.

## Usage

```tsx
<Drawer swipeDirection="right">
  <DrawerTrigger render={<Button />}>Filters</DrawerTrigger>
  <DrawerPopup side="right">
    <DrawerHeader>
      <DrawerTitle>Filters</DrawerTitle>
      <DrawerDescription>Narrow the list down.</DrawerDescription>
    </DrawerHeader>
    <DrawerBody>{/* the controls */}</DrawerBody>
    <DrawerActions>
      <Button render={<DrawerClose />}>Cancel</Button>
      <Button variant="primary">Apply</Button>
    </DrawerActions>
  </DrawerPopup>
</Drawer>
```

`DrawerPopup` renders its own portal, backdrop and viewport, so there is
nothing to arrange around it.

The anatomy is [Dialog's](/dowel/components/dialog/#anatomy), taken from it
rather than copied: `DrawerHeader` stays at the top, `DrawerBody` scrolls,
and `DrawerActions` is pinned to the bottom edge with a `start` slot for the
action that is not the answer. The panel used to scroll as a whole and took
its buttons with it. A menu, a select or a tooltip opened inside the drawer
opens above it: the content sits in a [layer](/dowel/components/layer/) — the
menu on a row of kilna's assistant chat opened underneath the drawer until it
did.

### Match the swipe to the side

`side` lives on the popup and `swipeDirection` on the root, so the two are set
together by hand — there is no way for the component to infer one from the
other:

| `side` | `swipeDirection` |
| --- | --- |
| `right` | `"right"` |
| `left` | `"left"` |
| `bottom` | `"down"` (Base UI's default) |

Left unmatched, the drawer slides in from one edge and is flicked away towards
another.

## Notes

**Base UI positions none of it.** Unlike Popover there is no positioner and no
anchor to measure against — the edge is entirely CSS, which is what the `side`
variant is. It drives three things that have to agree: where the viewport
pushes the panel, which border it grows against, and which way it is translated
while opening and closing.

**The transitions key off `data-starting-style` and `data-ending-style`**
rather than `data-closed`, which is Base UI's own convention for the drawer.
The reason is that a drawer is dragged as well as animated: the popup carries a
live `--drawer-swipe-movement-*` while a finger is on it, and the transform has
to compose with that rather than replace it.

**The page behind it is genuinely out of reach.** This is the half that gets
forgotten, because a drawer covers only one edge and the rest of the page looks
usable. It is not — Base UI marks it inert, so Tab cannot walk off into a page
the user cannot see they are editing.

**`DrawerActions` sits at the bottom.** `mt-auto` and `shrink-0`, so the
buttons stay at the foot of a tall panel whether there is little in it or more
than fits.

**No colour of its own.** Every class is written in tokens, so the same list is
correct in both themes and in every product's accent — no `dark:` utilities
anywhere in it.

**`size` is measured across the edge the drawer comes from.** For a side panel it is the width (20, 24, 32, 48rem, or the window less a margin); for a bottom sheet it is the height cap (40, 80, 90vh, or the window), and `full` sets the sheet's height.

## Props

### `Drawer`

The root. Controlled with `open` and `onOpenChange`, or left to manage itself around a `DrawerTrigger`.

Base UI's `Drawer.Root`, unchanged under dowel's name.

### `DrawerTrigger`

What opens it. Give it `render` to use your own button.

Base UI's `Drawer.Trigger`, unchanged under dowel's name.

### `DrawerClose`

What closes it - the same, for a cancel button or an X.

Base UI's `Drawer.Close`, unchanged under dowel's name.

### `DrawerBackdrop`

The scrim. Dark because a drawer is modal: what is behind it is out of reach, and saying so with contrast is the only thing that reads at a glance.

Every prop of Base UI's `Drawer.Backdrop`, passed on.

### `DrawerPopup`

The panel. Portalled, and wrapped in its own viewport so the edge it is pinned to holds still while the body scrolls. Put a `DrawerHeader`, a `DrawerBody` and `DrawerActions` inside it.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `side` | `right \| left \| bottom` | `'right'` |  |
| `size` | `sm \| md \| lg \| xl \| full` | `'md'` |  |
| `container` | `HTMLElement \| ShadowRoot \| RefObject<HTMLElement \| ShadowRoot \| null> \| null` |  | Where to portal to. Defaults to the document body, which is what keeps the popup from being clipped by an ancestor. Pass an element to put it somewhere else - inside an overlay that is already open, or into a container being screenshotted. |
| `backdrop` | `boolean` | `true` | Whether to draw the scrim. On by default, and it should stay on for anything a person actually uses: the dim is what says the page behind is out of reach. Turn it off where the popup is shown alongside other things on purpose - a component gallery, a screenshot - because a scrim is `position: fixed` and covers everything, not only its own container. |

And every prop of Base UI's `Drawer.Popup`, passed on.

### `DrawerTitle`

The heading. Base UI points the popup's `aria-labelledby` at it, so a drawer with one is named for a screen reader without anyone arranging it.

Every prop of Base UI's `Drawer.Title`, passed on.

### `DrawerDescription`

The line under the heading, and the popup's `aria-describedby`.

Every prop of Base UI's `Drawer.Description`, passed on.

### `DrawerHeader`

The top of the panel: the title, the line under it, and an action beside them. The dialog's part, under the drawer's name.

`DialogHeader`, unchanged under dowel's name.

### `DrawerBody`

The part that scrolls. The dialog's part, under the drawer's name.

`DialogBody`, unchanged under dowel's name.

### `DrawerActions`

Where the actions go, pinned to the bottom edge of the panel however little is in it - a drawer is tall, and its buttons should not wander up the page. The dialog's part, under the drawer's name.

`DialogActions`, unchanged under dowel's name.
