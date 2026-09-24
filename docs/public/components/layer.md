# Layer

Source: https://lacodda.github.io/dowel/components/layer

FENCE0 

It lands in `components/ui/layer.tsx`. Every overlay and every popup of the set
imports it, so it arrives with the first of them you install - there is
nothing to wire by hand.

See it live on the stand: https://lacodda.github.io/dowel/stand/#layer

A select in a dialog, a select in a popover, and a popover in a dialog with a select and a tooltip in it - each opening above what opened it.

## What it solves

The [stacking scale](/dowel/reference/scales/#stacking-order) is a flat
ladder, and every popup portals to the document body, so the ladder alone
decides who covers whom. It has nothing to say about a popup opened *inside*
an overlay: a date picker in a dialog is a 40 beside a 60, and the month draws
under the dialog that asked for it.

Two fixes look right and are not. Portalling the popup *into* the overlay puts
it inside a box that scrolls, and a scroll box clips it - a month with one row
of days showing. Raising the popup's own number works exactly once: it is then
above every overlay, including the ones it is not in.

So the popup stays where nothing clips it and the **layer** travels. An
overlay opens a host inside its own portal and raises the popup rungs there; a
popup opened anywhere within the overlay portals into that host and reads the
raised value through ordinary CSS inheritance.

## Usage

The set's overlays - Dialog, Drawer, ConfirmDialog, Popover, CommandPalette -
open a layer for their content, and its popups - Select, Combobox, Menu,
ContextMenu, Popover, PreviewCard, Tooltip - portal into the layer they were
opened in. A product writes nothing for them.

A product's own overlay does the same, with the rung it stands on:

```tsx
function Stage({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 bg-bg [z-index:var(--z-overlay)]">
      <LayerProvider above="overlay">{children}</LayerProvider>
    </div>
  )
}
```

A product's own popup takes the host the same way the set's do:

```tsx
const host = usePopupContainer()
return <Base.Portal container={container ?? host}>…</Base.Portal>
```

## Notes

**The floor is worked out by the stylesheet.** A layer's floor is
`calc(max(var(--z-modal), var(--z-layer, 0)) + 1)` - read from the theme where
the ladder is declared. Renumbering the ladder moves every floor with it, and
there is no second copy of the numbers to drift.

**A layer inside a layer keeps climbing.** A popover opened in a dialog is a
layer of its own, so a select inside it clears the popover and not only the
dialog: 60 for the dialog, 61 for the popover, 62 for the select.

**The layer lives inside the overlay's portal**, and that is for a reader, not
for the stacking. A modal marks everything outside its portal `aria-hidden`,
and a layer beside the portal was hidden with the page: the menu in a drawer
worked for a pointer and did not exist for a screen reader. Inside the portal,
the popups count as the overlay's own. An overlay passes its portal as
`mount`; without it the layer goes into the layer it was opened in, or onto
the body.

**Two nodes, not one.** The floor is computed from the rung the host inherits,
and the host then redefines that rung - on one element that is a cycle, which
CSS answers by making both values invalid. An outer frame works the floor out
and an inner host publishes it. Neither draws anything or makes a stacking
context.

## API

### `LayerProvider`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `above` | `popup \| menu \| floating \| overlay \| modal \| palette` | | The rung the overlay stands on |
| `mount` | `RefObject<HTMLElement \| null>` | | The overlay's own portal node. Without it, the layer it was opened in, or the body |

### `usePopupContainer()`

Where a popup opened here should portal to: the host of the layer it is in, or
`undefined` outside every overlay - which a portal reads as the body.

### `layerFloor(rung)`

The CSS expression a layer's floor is declared with, for a product that needs
to place something of its own on it.
