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

## Props

### `Drawer` — the root

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `open` | `boolean` | | Controlled, with `onOpenChange` |
| `defaultOpen` | `boolean` | `false` | Uncontrolled |
| `onOpenChange` | `(open, details) => void` | | |
| `swipeDirection` | `up \| down \| left \| right` | `down` | Which way a finger dismisses it — match it to `side` |
| `modal` | `boolean \| 'trap-focus'` | `true` | |
| `snapPoints` | `DrawerSnapPoint[]` | | Partial heights for a bottom sheet |

### `DrawerPopup`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `side` | `right \| left \| bottom` | `right` | The edge it comes from, and the axis it slides along |
| `size` | `sm \| md \| lg \| xl \| full` | `md` | Across the edge it comes from: the width of a side panel (20, 24, 32, 48rem, the window less a margin), the height cap of a sheet (40, 80, 90vh, the window) - `full` sets the sheet's height |
| `className` | `string` | | Merged so the caller wins a conflict |

### The rest

| Part | | |
| --- | --- | --- |
| `DrawerTrigger` | | What opens it. `render` to use your own button |
| `DrawerHeader` | `action` | The title and the line under it, with an action beside them; stays put |
| `DrawerTitle` | | The popup's `aria-labelledby` points at it |
| `DrawerDescription` | | The popup's `aria-describedby` |
| `DrawerBody` | | The part that scrolls |
| `DrawerActions` | `start` | Pinned to the bottom of the panel, right-aligned; `start` at the other end |
| `DrawerClose` | | Closes it. `render` to use your own button |

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
