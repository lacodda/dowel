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

**A product that filters the list itself** passes `filteredItems` alongside
`items`, and Base UI shows exactly that list. `comboboxPopupVariants` and
`comboboxItemVariants` are Select's, re-exported: the two dropdowns are the same
object seen twice, and two `cva` calls that started identical do not stay that
way.

## Props

### `Combobox`

The root. `items` is what gets filtered; `multiple` turns the value into an array and makes the chips meaningful.

Base UI's `Combobox.Root`, unchanged under dowel's name.

### `ComboboxInputGroup`

The wrapper for an input with something beside it - a clear button, an icon, the chips.

Base UI's `Combobox.InputGroup`, unchanged under dowel's name.

### `ComboboxTrigger`

The button that opens the list without typing, for a reader who wants to see everything there is.

Base UI's `Combobox.Trigger`, unchanged under dowel's name.

### `ComboboxIcon`

The chevron. Decorative.

Base UI's `Combobox.Icon`, unchanged under dowel's name.

### `ComboboxGroup`

A labelled group of rows.

Base UI's `Combobox.Group`, unchanged under dowel's name.

### `ComboboxCollection`

The rows of one group, as a render function over that group's items.

Base UI's `Combobox.Collection`, unchanged under dowel's name.

### `ComboboxItemIndicator`

The tick, drawn only on a chosen row.

Base UI's `Combobox.ItemIndicator`, unchanged under dowel's name.

### `ComboboxStatus`

A polite live region for the state of an asynchronous list. Stays mounted, like `Empty`, so the announcement actually fires.

Base UI's `Combobox.Status`, unchanged under dowel's name.

### `ComboboxChips`

The container the chips sit in. Its children are plain nodes, not a render function - the chosen values are mapped by `ComboboxValue` inside it.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `ref` | `Ref<HTMLDivElement>` |  | Allows getting a ref to the component instance. Once the component unmounts, React will set `ref.current` to `null` (or call the ref with `null` if you passed a callback ref). |

And every prop of Base UI's `Combobox.Chips`, passed on.

### `ComboboxValue`

The current value, as a render function of it. This is what turns a `multiple` value into one chip per entry.

Base UI's `Combobox.Value`, unchanged under dowel's name.

### `ComboboxInput`

Where the query is typed. A real `<input role="combobox">`.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md \| lg` | `'md'` |  |
| `bare` | `boolean` | `false` |  |

And every prop of Base UI's `Combobox.Input` except `size`, passed on.

### `ComboboxClear`

Empties the value. Base UI hides it while there is nothing to clear.

Every prop of Base UI's `Combobox.Clear`, passed on.

### `ComboboxPopup`

The list. Portalled and positioned against the input, or the given anchor.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `side` | `bottom \| top \| left \| right \| inline-end \| inline-start` |  | Preferred side of the input. Base UI flips it when it does not fit. |
| `align` | `center \| start \| end` |  | Alignment along that side. |
| `sideOffset` | `number \| OffsetFunction` | `4` | Distance from the input, in pixels. |
| `anchor` | `Element \| VirtualElement \| RefObject<Element \| null> \| (() => Element \| VirtualElement \| null) \| null` |  | What to line the list up with. Defaults to the input that owns it. |
| `container` | `HTMLElement \| ShadowRoot \| RefObject<HTMLElement \| ShadowRoot \| null> \| null` |  | Where to portal to. Defaults to the raised host of the overlay this is opened inside (`layer.tsx`), and to the document body when there is none - either way not the element it was opened from, whose `overflow` would clip it. Pass an element to put it somewhere else, such as a container being screenshotted. |

And every prop of Base UI's `Combobox.Popup`, passed on.

### `ComboboxList`

The rows, as a list. Undressed: it is a wrapper, and the popup around it already carries the border and the padding.

Base UI's `Combobox.List`, unchanged under dowel's name.

### `ComboboxItem`

A row.

Every prop of Base UI's `Combobox.Item`, passed on.

### `ComboboxEmpty`

What is shown when nothing matched. The words are the product's.

Every prop of Base UI's `Combobox.Empty`, passed on.

### `ComboboxChip`

One chosen value, in a multiple combobox. Focusable, so it can be reached and removed without a pointer.

Every prop of Base UI's `Combobox.Chip`, passed on.

### `ComboboxChipRemove`

The X on a chip. A real button, which is what makes Backspace and Enter both work on it.

Every prop of Base UI's `Combobox.ChipRemove`, passed on.

### `ComboboxGroupLabel`

The caption above a group.

Every prop of Base UI's `Combobox.GroupLabel`, passed on.
