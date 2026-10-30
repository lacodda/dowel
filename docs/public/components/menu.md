# Menu

Source: https://lacodda.github.io/dowel/components/menu

FENCE0 

The component lands in `components/ui/menu.tsx` and is yours to edit.

See it live on the stand: https://lacodda.github.io/dowel/stand/#menu

Items, a destructive item, a checkbox item, a group with its label, a separator and a submenu - in either theme, and in the accent of any product of the line.

## When this and not a Select, a Combobox or a Dialog

Reach for **Menu** when the entries are *actions*: the row menu, the overflow
menu, the one behind the three dots. Choosing one does something and the menu
closes.

Reach for **[Select](/dowel/components/select/)** when the entries are
*values* and one of them stays chosen afterwards. A menu forgets; a select
remembers, and shows what it remembers on the trigger.

Reach for **[Combobox](/dowel/components/combobox/)** when there are enough
values that finding one by typing is faster than reading the list.

Reach for **[Dialog](/dowel/components/dialog/)** when the action needs more
from the reader than picking it — a name to type, a choice to confirm.

## Usage

```tsx
<Menu>
  <MenuTrigger render={<Button variant="icon" aria-label={t('actions')}><MoreHorizontal /></Button>} />
  <MenuPopup>
    <MenuItem onClick={rename}>{t('rename')}</MenuItem>
    <MenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>
      <MenuCheckboxIndicator><Check /></MenuCheckboxIndicator>
      {t('keepThisDate')}
    </MenuCheckboxItem>
    <MenuSeparator />
    <MenuItem tone="danger" onClick={remove}>{t('delete')}</MenuItem>
  </MenuPopup>
</Menu>
```

## Notes

**What makes a menu hard is the keyboard**, and that is the part worth not
writing again: arrows that wrap, Home and End, type-ahead that finds an item
by its first letters, a submenu that opens on the right key and closes when
the pointer leaves diagonally. Base UI has all of it. The click-outside
listener and the Escape handler every product wrote by hand come with it.

**The items are exposed rather than taken as an array.** A list of
`{ label, onSelect }` is enough until the first separator, the first checkbox
item and the first submenu — and each of those arrives as another field on the
object rather than as the JSX it obviously is.

**A trigger that is only an icon needs a name.** `MenuTrigger` renders your
own button; if that button has no text, give it an `aria-label`, or the menu
is announced as an unlabelled control.

**`tone="danger"` is for the item that destroys something**, not for emphasis.
One per menu at most: a list where several entries are red says nothing about
which of them is the dangerous one.

**A disabled item stays reachable.** It is reached by the arrows and announced as unavailable, but does nothing - a reader learns the action exists. `size` sets the minimum width of the panel; the room it is given is the window's.

## Props

### `Menu`

The root. Uncontrolled by default; `open` and `onOpenChange` make it controlled.

Base UI's `Menu.Root`, unchanged under dowel's name.

### `MenuTrigger`

What opens it. Give it `render` to use your own button.

Base UI's `Menu.Trigger`, unchanged under dowel's name.

### `MenuGroup`

A labelled group of items, for a menu long enough to need headings.

Base UI's `Menu.Group`, unchanged under dowel's name.

### `MenuSub`

A submenu, opened from a `MenuSubTrigger` inside the parent.

Base UI's `Menu.SubmenuRoot`, unchanged under dowel's name.

### `MenuPopup`

The panel. Portalled and positioned against the trigger.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md \| lg` | `'md'` |  |
| `side` | `bottom \| top \| left \| right \| inline-end \| inline-start` |  | Preferred side of the trigger. Base UI flips it when it does not fit. |
| `align` | `center \| start \| end` |  | Alignment along that side. |
| `sideOffset` | `number \| OffsetFunction` | `4` | Distance from the trigger, in pixels. |
| `container` | `HTMLElement \| ShadowRoot \| RefObject<HTMLElement \| ShadowRoot \| null> \| null` |  | Where to portal to. Defaults to the raised host of the overlay this is opened inside (`layer.tsx`), and to the document body when there is none - either way not the element it was opened from, whose `overflow` would clip it. Pass an element to put it somewhere else, such as a container being screenshotted. |

And every prop of Base UI's `Menu.Popup`, passed on.

### `MenuItem`

An action. Closing the menu afterwards is Base UI's default, which is almost always right - `closeOnClick={false}` is for the one that is not.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `tone` | `default \| danger` | `'default'` |  |

And every prop of Base UI's `Menu.Item`, passed on.

### `MenuSubTrigger`

An item that opens a submenu. Drawn like any other, because it is one.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `tone` | `default \| danger` | `'default'` |  |

And every prop of Base UI's `Menu.Item`, passed on.

### `MenuCheckboxItem`

An item that carries a tick. The state is the caller's - a menu does not remember anything.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `tone` | `default \| danger` | `'default'` |  |

And every prop of Base UI's `Menu.CheckboxItem`, passed on.

### `MenuCheckboxIndicator`

The tick itself, drawn only when the item is checked.

Base UI's `Menu.CheckboxItemIndicator`, unchanged under dowel's name.

### `MenuSeparator`

A line between groups of items. Decorative, and marked as such: a screen reader announcing "separator" between every pair of actions is noise.

Every prop of Base UI's `Menu.Separator`, passed on.

### `MenuGroupLabel`

The caption above a group.

Every prop of Base UI's `Menu.GroupLabel`, passed on.
