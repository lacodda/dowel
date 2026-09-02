# Select

Source: https://lacodda.github.io/dowel/components/select

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#select

Closed, open, grouped, and with more than one chosen.

## Notes

The component the oldest rule in the line is about. A native `<select>` cannot
be dressed: the browser draws its popup itself, in the operating system's
chrome, with the operating system's fonts and spacing, and no CSS reaches
inside it. On a screen where every other control is the product's own, the one
native dropdown reads as a foreign object - and on Windows it reads as a
foreign object from 1998.

So this renders `<button role="combobox">` and a portalled list of
`role="option"`, with zero native elements. The test asserts exactly that,
because it is the whole reason the component exists, and the ESLint rule
`dowel/no-native-select` stops the native one coming back by hand.

What that costs is everything the browser was doing for free: the keyboard,
type-ahead, the announcement of the selected value, the scroll into view, and
on a phone the whole native picker. Base UI reimplements all of it, which is
the only reason the trade is worth making - a hand-rolled dropdown is how a
product ships a control a screen reader cannot see.

The trigger wears Input's field classes, imported rather than copied, because
a select and a text field sit next to each other in every form there has ever
been.

### Two traps worth knowing

`SelectValue`'s `children` is a **function of the value**, not a node. Passing
a node pins the trigger to that node forever and the selection never appears;
the placeholder goes in `placeholder`.

And what it shows is the **raw value** - `plum`, not `Plum` - unless the root
is given an `items` map to look the label up in. A product that skips `items`
gets its own identifiers on screen, and it is not obvious why.

### Select or Combobox

**Select** when the options are few enough to read: a status, a currency, a
priority. The reader scans a list and picks.

**[Combobox](/dowel/components/combobox/)** when they are not. A Select stops
being usable somewhere around thirty options, and a country picker, a tag
field or a person picker is well past that - the reader knows what they want
and needs to type it rather than hunt for it. Combobox is also the one with
chips, so it is the answer for multi-select that has to *show* what is chosen.

Both support `multiple`, and both refuse to be a native `<select>`.

```tsx
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

<Select items={labels} value={value} onValueChange={setValue}>
  <SelectTrigger aria-label={t('priority')}>
    <SelectValue placeholder={t('choosePriority')} />
  </SelectTrigger>
  <SelectPopup>
    <SelectItem value="low">{t('low')}</SelectItem>
    <SelectItem value="high">{t('high')}</SelectItem>
  </SelectPopup>
</Select>
```

## Props

### `Select` (root)

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `multiple` | `boolean` | `false` | Turns `value` into an array |
| `items` | `Record \| Array` | | What the trigger looks labels up in |
| `value` / `onValueChange` | | | Controlled; `defaultValue` for uncontrolled |
| `disabled` | `boolean` | `false` | |

### `SelectTrigger`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md \| lg` | `md` | Matches Input's heights |
| `className` | `string` | | Merged so the caller wins a conflict |

### `SelectPopup`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md \| lg` | `md` | A floor; it matches the trigger's width |
| `side` | `top \| right \| bottom \| left` | `bottom` | A preference - Base UI flips it when it does not fit |
| `align` | `start \| center \| end` | | Alignment along that side |
| `sideOffset` | `number` | `4` | Distance from the trigger |
| `container` | `Element \| Ref` | document body | Where to portal to |
| `className` | `string` | | Merged so the caller wins a conflict |

### The rest

`SelectValue`, `SelectIcon`, `SelectItem`, `SelectItemText`,
`SelectItemIndicator`, `SelectGroup`, `SelectGroupLabel` and `SelectSeparator`
pass their props to Base UI unchanged. The `cva` variants
(`selectTriggerVariants`, `selectPopupVariants`, `selectItemVariants`) are
exported for a product that needs the same clothes somewhere else.
