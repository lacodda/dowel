# CommandPalette

Source: https://lacodda.github.io/dowel/components/command-palette

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#command-palette

Open and listing everything, narrowed by a query, and with nothing matching.

## What is yours and what is ours

This is the part worth reading before the props.

**dowel supplies the box, the filtering and the keyboard.** The dim over the
page, the box in the upper third of it, the field, the narrowing as you type,
the highlight, the arrows, the type-ahead, Enter, Escape, and the
announcement of all of it to a screen reader.

**The product supplies what makes it that product's palette:**

- **the items** — what is in the box at all, and what each row shows;
- **the grouping** — whether commands, recent files and settings are three
  labelled groups or one flat list;
- **what running one does** — every word, and every consequence.

That division is why `items` is `unknown[]` rather than a list of strings. A
palette lists commands, works, settings and recent files in the same box; a
type admitting only strings would push every product into the same
stringly-typed workaround, mapping identifiers back to objects on the way out.

It is also why nothing here has a word of its own. The empty state has no
default text, the field has no default placeholder, and the popup has no
default name — those are the product's, in the product's language, and a
default here would ship English to every reader who does not read English with
no way for the product to reach it.

## Notes

### It is a Combobox, not a Dialog with a field in it

The obvious build is a Dialog containing a search input. That is the wrong
arrangement, and it fails quietly: a screen reader is told about a dialog that
happens to contain a text box, with no stated relationship between what is
typed and the list that changes underneath.

Base UI's own arrangement is the other way round — put the input **inside** the
popup and the popup becomes `role="dialog"` on its own, while the input is
still announced as the `role="combobox"` that owns the list. Both are true at
once, which is the whole reason this component exists rather than being
assembled per product.

Everything that follows from that is Base UI's and is not reimplemented here:
the filtering with `Intl.Collator` (so accents and case behave the way a reader
in that language expects, rather than the way `toLowerCase` does), the
highlight, the arrow keys, and the type-ahead.

### Give the popup a name

The one thing the arrangement costs. A Dialog takes its name from a visible
title; a palette has no title — it opens straight onto a field — so there is
nothing for the popup to point `aria-labelledby` at, and an unnamed dialog is
one a screen reader announces as nothing.

So `aria-label` on `CommandPalettePopup` is **required by the type**, not
merely recommended: the component cannot supply it for the reason above, and a
palette that forgets it fails to compile rather than shipping a dialog that
announces itself as nothing.

### It is opened from somewhere else

`CommandPalette` is controlled by `open` / `onOpenChange`, because what opens a
palette is a keystroke bound elsewhere in the application — which is what
[`useShortcut`](/dowel/components/shortcut/) is for. The popup is anchored to
the viewport rather than to a trigger, since it has no trigger to point at.

### The arrows walk through the field

Pressing Down past the last row does not jump straight back to the first: the
highlight comes off the list and back onto the query, and the next Down enters
at the top again. That is right for a palette — the field is where the reader
edits what they typed, so walking off the end should reach it rather than skip
it — but it is one stop more than the list has, which is worth knowing before
it looks like a bug.

Nothing in the list ever takes focus. The highlight is `aria-activedescendant`
on the input throughout, which is what lets typing carry on between arrow
presses.

```tsx
import { useShortcut } from '@/components/ui/shortcut'
import {
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  CommandPalettePopup,
  CommandPaletteRow,
} from '@/components/ui/command-palette'

const [open, setOpen] = useState(false)
useShortcut(['Mod', 'K'], () => setOpen(true))

<CommandPalette
  items={commands}
  open={open}
  onOpenChange={setOpen}
  onValueChange={(command) => command && run(command)}
>
  <CommandPalettePopup aria-label={t('commands')}>
    <CommandPaletteInput
      aria-label={t('command')}
      placeholder={t('typeACommand')}
      hint={['Escape']}
    />
    <CommandPaletteEmpty>{t('nothingMatched')}</CommandPaletteEmpty>
    <CommandPaletteList>
      {(command) => (
        <CommandPaletteItem key={command.id} value={command}>
          <CommandPaletteRow icon={command.icon} hint={t(command.where)}>
            {t(command.label)}
          </CommandPaletteRow>
        </CommandPaletteItem>
      )}
    </CommandPaletteList>
  </CommandPalettePopup>
</CommandPalette>
```

`onValueChange` reports `null` as well as a value — a palette that is cleared
says so — which is why the example checks before running anything.

### More than one kind of thing

A palette that lists works, versions and notes together is a `List` over the
*groups*, with a `Collection` inside each — not a `List` inside a `List`, since
the list is the listbox and there is one per palette:

```tsx
<CommandPaletteList>
  {(group: Group) => (
    <CommandPaletteGroup key={group.kind} items={group.items}>
      <CommandPaletteGroupLabel>{t(`kind.${group.kind}`)}</CommandPaletteGroupLabel>
      <CommandPaletteCollection>
        {(hit: Hit) => (
          <CommandPaletteItem key={hit.id} value={hit}>
            <CommandPaletteRow hint={t(`kind.${group.kind}`)}>{hit.title}</CommandPaletteRow>
          </CommandPaletteItem>
        )}
      </CommandPaletteCollection>
    </CommandPaletteGroup>
  )}
</CommandPaletteList>
```

The arrow keys walk the flattened rows, so reaching the end of one group steps
into the next rather than stopping at a caption.

Mapping a group's rows by hand works too, but then the palette has to be told
how to match an item back to a value — and for rows fetched fresh from a
server, identity comparison never does, so it needs an `isItemEqualToValue`
that `Collection` makes unnecessary.

### Searching somewhere else

The filtering is client-side over `items`. A palette whose search happens on a
server should pass `filter={null}`: without it the already-filtered hits are
filtered a second time against the same query, by title alone, which throws
away every hit that matched on something the client cannot see.

### Palette or SearchField

**CommandPalette** when it is the same box for the whole application, reached
by a shortcut from anywhere, and choosing a row *does* something.

**[SearchField](/dowel/components/search-field/)** when the query filters
something already on screen, in place, and there is nothing to choose.

**[Combobox](/dowel/components/combobox/)** when the typing ends in a value
going into a form field.

## Props

### `CommandPalette` (root)

Base UI's Combobox root, unchanged.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `items` | `unknown[]` | | What gets filtered. Anything, not only strings |
| `open` / `onOpenChange` | | | Controlled — the shortcut lives elsewhere |
| `onValueChange` | `(value, details) => void` | | Run what was chosen. Reports `null` on a clear |
| `filter` | `function \| null` | | Replaces the comparison; `null` for a list filtered on a server |

### `CommandPalettePopup`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `md \| lg` | `md` | How tall the list may grow before it scrolls |
| `container` | `Element \| Ref` | document body | Where to portal to |
| `aria-label` | `string` | **required** | What the palette is called — see above |
| `className` | `string` | | Merged so the caller wins a conflict |

### `CommandPaletteInput`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `hint` | `string[]` | | Drawn at the right of the field, as `['Escape']`. Decorative and `aria-hidden` |
| `className` | `string` | | Merged so the caller wins a conflict |

Everything else reaches the `<input>`, so `placeholder` and `aria-label` work
as usual.

### `CommandPaletteRow`

The row's own layout, for use inside a `CommandPaletteItem`.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `icon` | `ReactNode` | | Drawn first, at its natural size |
| `hint` | `ReactNode` | | Drawn last and quiet — where the command lives, or its shortcut |
| `className` | `string` | | Merged so the caller wins a conflict |

### The rest

`CommandPaletteItem`, `CommandPaletteList`, `CommandPaletteEmpty` and
`CommandPaletteGroup` pass their props to Base UI unchanged. `Empty` stays
mounted so its announcement fires, so it must not be hidden or rendered
conditionally.

`commandPalettePopupVariants` is exported for the same clothes elsewhere, and
`commandPaletteItemVariants` is Combobox's row — a palette is a list of
choices, and two lists of choices in one product should not differ.
