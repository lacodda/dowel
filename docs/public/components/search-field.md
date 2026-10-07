# SearchField

Source: https://lacodda.github.io/dowel/components/search-field

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#search-field

Empty with its shortcut showing, and with a query and the clear button in its place.

## Notes

An Input with three small things the products kept not doing, so they are done
once here rather than four times badly.

**A magnifier**, so the field is recognisable before it is read.

**A way to clear it that is not "select all and delete"** — and one a keyboard
can reach. This is the half that goes wrong: the cross is usually a decorative
`<span>` with an `onClick`, which Tab skips and a screen reader does not
announce, so the only way to empty the field is the one the mouse knows. Here
it is a real `<button>` with a name, and clearing puts the cursor back in the
field, because clearing and then having to click the field again is half a
feature.

**The shortcut that focuses it**, shown in the field rather than learned. It
is declared as a [command](/dowel/components/commands/), so it is listed in the
sheet of shortcuts and the palette like every other key, and the hint shows the
keys it answers to now - a rebinding moves the key and the hint together.

### `type="search"` is deliberate

It is what tells a browser to offer previous queries, and what makes Escape
clear the field on the platforms where that is the convention. The browser's
own clear button is hidden, because it is drawn in the operating system's
chrome and cannot be made to match — the same reason the line does not use a
native `<select>`.

### The two props that are switches

`clearLabel` is the clear button. Leave it out and no button is drawn, which
is the right shape for a field that filters as you type and is emptied by
other means. There is no separate `showClear` flag, because a flag can
disagree with the label, and a button announced as nothing is worse than no
button at all.

`shortcut` is the same idea: give it one and it is shown, bound and listed;
leave it out and none of that happens.

The hint and the clear button share the right edge, so the hint gives way as
soon as there is something to clear.

### The shortcut does not fire while someone is typing

It is a [command](/dowel/components/commands/) underneath, with the default
intact: `Mod+K` typed into another field belongs to that field. It focuses
*and selects*, so the shortcut replaces a stale query rather than appending to
it.

```tsx
import { SearchField } from '@/components/ui/search-field'

<SearchField
  value={query}
  onValueChange={setQuery}
  aria-label={t('search')}
  placeholder={t('searchPlaceholder')}
  clearLabel={t('clear')}
  shortcut={{ id: 'search', label: t('search'), keys: 'Mod+K' }}
/>
```

### SearchField or Combobox

**SearchField** when what is typed filters something the reader is already
looking at — a table, a list of files, a page of results. There is nothing to
choose from a popup; the query is the whole interaction.

**[Combobox](/dowel/components/combobox/)** when the typing ends in a choice:
the reader is picking one of a set, and the query is only how they find it.

**[CommandPalette](/dowel/components/command-palette/)** when it is the same
box for the whole application, opened by a shortcut from anywhere.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `value` | `string` | | Required and controlled — a search box that owns its own text cannot be cleared by the thing that owns the results |
| `onValueChange` | `(value: string) => void` | | Told the new query on every keystroke |
| `clearLabel` | `string` | | What the clear button is called. No default; without it no button is drawn |
| `shortcut` | `{ id, label, keys, group?, whileTyping? }` | | The command that focuses the field. Shown at the right of it, bound, and listed with every other key |
| `ref` | `Ref<HTMLInputElement>` | | Reaches the input, not the wrapper |
| `className` | `string` | | Merged onto the wrapper so the caller wins a conflict |

Everything else is passed to the `<input>`, so `placeholder`, `aria-label`,
`disabled`, `name` and the rest work as usual. `type` is not among them: it is
always `search`.
