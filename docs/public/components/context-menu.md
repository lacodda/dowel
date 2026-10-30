# ContextMenu

Source: https://lacodda.github.io/dowel/components/context-menu

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#context-menu

Right click inside the panel to open it.

## Notes

A list of actions opened by a right click, or by a long press on a touch
screen, over an *area* rather than from a button. The trigger is not a control
- it is the region the menu belongs to: a row, a canvas, a file tile - so it
renders a `<div>` and is announced as nothing at all.

That is the only difference from [Menu](/dowel/components/menu/). Everything
below the root is Menu's own - Base UI re-exports the portal, the positioner,
the popup and the items from the menu package - so the popup that opens here
is the same popup, with the same keyboard, the same type-ahead and the same
submenus. The clothes are imported from Menu rather than copied, which is
declared in the component's dependency budget: two class lists that started
identical do not stay that way.

**Use it when** the actions belong to a thing on the screen and there is no
room for a button beside it - a row in a long table, an item on a canvas.
**Use Menu instead** when there is a button, because a right click is
undiscoverable: nobody finds a context menu they were not expecting. A context
menu should repeat actions that are reachable some other way, not hide them.

**The keyboard opens it from inside the area.** `Shift+F10` and the Menu key
fire the same `contextmenu` event a right click does, on whatever has focus -
so the menu opens for a focused row, a focused tile, a focused button inside
the area, and `Escape` puts the focus back there. An area with nothing in it
that can take focus is a menu only a pointer can open: wrap things a reader can
tab to.

It positions against the point that was clicked, so there is no `side` or
`align` to give it, and no anchor to attach it to from elsewhere. Base UI also
withholds `openOnHover`, `modal` and `handle` here for the same reason.

 FENCE1

## Props

### `ContextMenu`

The root. It positions against the pointer, so there is nothing to anchor and nothing to control but `onOpenChange`.

Base UI's `ContextMenu.Root`, unchanged under dowel's name.

### `ContextMenuTrigger`

The area that opens it. A `<div>`, not a button: give it `render` to make it the row or the canvas it belongs to rather than a wrapper.

Base UI's `ContextMenu.Trigger`, unchanged under dowel's name.

### `ContextMenuGroup`

A labelled group of items, for a menu long enough to need headings.

Base UI's `ContextMenu.Group`, unchanged under dowel's name.

### `ContextMenuSub`

A submenu, opened from a `ContextMenuSubTrigger` inside the parent.

Base UI's `ContextMenu.SubmenuRoot`, unchanged under dowel's name.

### `ContextMenuPopup`

The panel. Portalled, and positioned against the point that was clicked rather than against an element.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md \| lg` |  | How wide the popup starts. The same three as Menu's. |
| `container` | `HTMLElement \| ShadowRoot \| RefObject<HTMLElement \| ShadowRoot \| null> \| null` |  | Where to portal to. Defaults to the raised host of the overlay this is opened inside (`layer.tsx`), and to the document body when there is none - either way not the element it was opened from, whose `overflow` would clip it. Pass an element to put it somewhere else, such as a container being screenshotted. |

And every prop of Base UI's `ContextMenu.Popup`, passed on.

### `ContextMenuItem`

An action.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `tone` | `default \| danger` |  | `danger` draws the destructive one apart, in the colour of something that cannot be undone. |

And every prop of Base UI's `ContextMenu.Item`, passed on.

### `ContextMenuSubTrigger`

An item that opens a submenu. Drawn like any other, because it is one.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `tone` | `default \| danger` |  | `danger` draws the destructive one apart, in the colour of something that cannot be undone. |

And every prop of Base UI's `ContextMenu.Item`, passed on.

### `ContextMenuCheckboxItem`

An item that carries a tick. The state is the caller's.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `tone` | `default \| danger` |  | `danger` draws the destructive one apart. |

And every prop of Base UI's `ContextMenu.CheckboxItem`, passed on.

### `ContextMenuCheckboxIndicator`

The tick itself, drawn only when the item is checked.

Base UI's `ContextMenu.CheckboxItemIndicator`, unchanged under dowel's name.

### `ContextMenuSeparator`

A line between groups of items. Decorative, and marked as such.

Every prop of Base UI's `ContextMenu.Separator`, passed on.

### `ContextMenuGroupLabel`

The caption above a group.

Every prop of Base UI's `ContextMenu.GroupLabel`, passed on.
