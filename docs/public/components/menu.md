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

## Props

`MenuPopup`:

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm` \| `md` | `md` | The minimum width of the panel |
| `side` | `top` \| `right` \| `bottom` \| `left` | | Preferred side; Base UI flips it when it does not fit |
| `align` | `start` \| `center` \| `end` | | Alignment along that side |
| `sideOffset` | `number` | `4` | Distance from the trigger, in pixels |
| `container` | `Element` | `document.body` | Where to portal to |
| `className` | `string` | | Merged so the caller wins a conflict |

`MenuItem`, `MenuSubTrigger` and `MenuCheckboxItem`:

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `tone` | `default` \| `danger` | `default` | |
| `className` | `string` | | Merged so the caller wins a conflict |

`Menu`, `MenuTrigger`, `MenuGroup`, `MenuGroupLabel`, `MenuSeparator`,
`MenuSub` and `MenuCheckboxIndicator` take the props their Base UI parts take;
`render` composes each with your own element.
