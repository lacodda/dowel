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

The `cva` variants (`selectTriggerVariants`, `selectPopupVariants`, `selectItemVariants`) are exported for a product that needs the same clothes somewhere else.

## Props

### `Select`

The root. `multiple` turns `value` into an array; otherwise controlled with `value` and `onValueChange`, or left to manage itself.

Base UI's `Select.Root`, unchanged under dowel's name.

### `SelectValue`

What the trigger shows: the selected item's label, and the `placeholder` the product gives it until there is one.

Every prop of Base UI's `Select.Value`, passed on.

### `SelectIcon`

The chevron, or whatever the product puts there. Marked decorative by Base UI, since the button is already named by its value.

Base UI's `Select.Icon`, unchanged under dowel's name.

### `SelectGroup`

A labelled group of options.

Base UI's `Select.Group`, unchanged under dowel's name.

### `SelectItemText`

The text of an option, which is what the trigger echoes when it is chosen.

Base UI's `Select.ItemText`, unchanged under dowel's name.

### `SelectItemIndicator`

The tick, drawn only on the chosen option.

Base UI's `Select.ItemIndicator`, unchanged under dowel's name.

### `SelectTrigger`

The control. A `<button role="combobox">` - never a `<select>`.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md \| lg` | `'md'` |  |

And every prop of Base UI's `Select.Trigger`, passed on.

### `SelectPopup`

The list. Portalled and positioned against the trigger.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md \| lg` | `'md'` |  |
| `side` | `bottom \| top \| left \| right \| inline-end \| inline-start` |  | Preferred side of the trigger. Base UI flips it when it does not fit. |
| `align` | `center \| start \| end` |  | Alignment along that side. |
| `sideOffset` | `number \| OffsetFunction` | `4` | Distance from the trigger, in pixels. |
| `container` | `HTMLElement \| ShadowRoot \| RefObject<HTMLElement \| ShadowRoot \| null> \| null` |  | Where to portal to. Defaults to the raised host of the overlay this is opened inside (`layer.tsx`), and to the document body when there is none - either way not the element it was opened from, whose `overflow` would clip it. Pass an element to put it somewhere else, such as a container being screenshotted. |

And every prop of Base UI's `Select.Popup`, passed on.

### `SelectItem`

An option, with the tick that says it is the chosen one.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `indicator` | `boolean` | `true` | Draw the tick on the chosen item. Pass `false` for a list where the choice is obvious some other way. |

And every prop of Base UI's `Select.Item`, passed on.

### `SelectGroupLabel`

The caption above a group.

Every prop of Base UI's `Select.GroupLabel`, passed on.

### `SelectSeparator`

A line between groups of options.

Every prop of Base UI's `Select.Separator`, passed on.
