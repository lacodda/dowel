# Combobox

Source: https://lacodda.github.io/dowel/components/combobox

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#combobox

Filtering as it is typed, the empty state, and the multiple case with chips.

## Notes

A Select you can type in. The list narrows as the query is typed, which is the
only difference that matters and the reason to reach for this one.

Everything the [Select](/dowel/components/select/) page says about the native
element applies here too - there is no `<select>` underneath - but the input is
a real `<input role="combobox">`, so autofill, spellcheck and the phone
keyboard still work.

Filtering is Base UI's. Give the root an `items` array and it matches the query
against them with `Intl.Collator`, so accents and case behave the way a reader
in that language expects rather than the way `toLowerCase` does, and the match
is anywhere in the word rather than only at the start. `filter` replaces the
comparison; `filter={null}` turns it off entirely for a list that is filtered
on a server.

### Chips are Base UI's, not hand-made

Inventing chips is the obvious move and it goes wrong in one specific way:
hand-made chips end up as `<div>`s with an X that only a pointer can reach, and
the multi-select becomes keyboard-inaccessible at exactly the point where it
holds the most state. `ComboboxChips`, `ComboboxChip` and `ComboboxChipRemove`
are focusable, walk with the arrows, and delete with Backspace or Delete - and
Backspace on an empty input removes the last one.

`ComboboxChips` takes plain children, not a render function. It is
`ComboboxValue` inside it that maps the chosen values, because it is the part
that knows what they are.

### Two behaviours worth knowing

`ComboboxEmpty` renders only when nothing matched, and announces itself
politely. Its element stays mounted for that announcement to work, so it must
not be hidden with `display: none` or removed conditionally - which is why it
is a component rather than a `{items.length === 0 && …}` in the product.

`ComboboxClear` is not a "clear what I typed" button. In single-selection mode
Base UI shows it only once a value has been *selected*; the query clears itself
when the popup closes.

### Combobox or Select

**Combobox** when the options are too many to scan - a country, a tag, a
person - or when the reader already knows the answer and typing it is faster
than finding it. Also when a multi-select has to *show* what is chosen, since
this is the one with chips.

**Select** when the list is short enough to read: a status, a currency, a
priority. A search box over five options is noise, and it asks the reader to
type where they could have pointed.

```tsx
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from '@/components/ui/combobox'

<Combobox items={countries}>
  <ComboboxInput aria-label={t('country')} placeholder={t('searchCountries')} />
  <ComboboxPopup>
    <ComboboxEmpty>{t('noCountries')}</ComboboxEmpty>
    <ComboboxList>
      {(item) => (
        <ComboboxItem key={item} value={item}>
          {item}
        </ComboboxItem>
      )}
    </ComboboxList>
  </ComboboxPopup>
</Combobox>
```

With chips, for the `multiple` case:

```tsx
<Combobox items={tags} multiple>
  <ComboboxChips>
    <ComboboxValue>
      {(value) =>
        value.map((tag) => (
          <ComboboxChip key={tag}>
            {tag}
            <ComboboxChipRemove aria-label={t('remove')} />
          </ComboboxChip>
        ))
      }
    </ComboboxValue>
    <ComboboxInput aria-label={t('tags')} />
  </ComboboxChips>
  {/* popup as above */}
</Combobox>
```

## Props

### `Combobox` (root)

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `items` | `Array` | | What gets filtered |
| `multiple` | `boolean` | `false` | Turns `value` into an array, and makes chips meaningful |
| `filter` | `function \| null` | `Intl.Collator` | `null` to filter elsewhere |
| `value` / `onValueChange` | | | Controlled; `defaultValue` for uncontrolled |
| `filteredItems` | `Array` | | When the product filters it itself |

### `ComboboxInput`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md \| lg` | `md` | Matches Input's heights |
| `className` | `string` | | Merged so the caller wins a conflict |

### `ComboboxPopup`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md \| lg` | `md` | A floor; it matches the input's width |
| `side` | `top \| right \| bottom \| left` | `bottom` | A preference - Base UI flips it when it does not fit |
| `align` | `start \| center \| end` | | Alignment along that side |
| `sideOffset` | `number` | `4` | Distance from the input |
| `container` | `Element \| Ref` | document body | Where to portal to |
| `className` | `string` | | Merged so the caller wins a conflict |

### The rest

`ComboboxList`, `ComboboxItem`, `ComboboxItemIndicator`, `ComboboxEmpty`,
`ComboboxStatus`, `ComboboxTrigger`, `ComboboxIcon`, `ComboboxClear`,
`ComboboxInputGroup`, `ComboboxChips`, `ComboboxChip`, `ComboboxChipRemove`,
`ComboboxValue`, `ComboboxGroup` and `ComboboxGroupLabel` pass their props to
Base UI unchanged. `comboboxPopupVariants` and `comboboxItemVariants` are
Select's, re-exported: the two dropdowns are the same object seen twice, and
two `cva` calls that started identical do not stay that way.
