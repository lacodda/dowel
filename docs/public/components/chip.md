# Chip

Source: https://lacodda.github.io/dowel/components/chip

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#chip

Plain, with a count, removable, in every tone, and switching alone and in a group.

## Notes

**The difference from a Badge is whether something happens when you click it.**
If something does, that part is a real `<button>` with a real name — not a
decorative cross, and not a `<span>` with a click handler. A chip is acted on in
two ways, taken away or switched, and each has its own shape.

**Removable.** Every product wrote the removable tag and every one made the
cross a `<span>`, which the keyboard cannot reach and a screen reader does not
announce.

```tsx
<Chip onRemove={() => drop(tag)} removeLabel={t('remove')}>
  {tag}
</Chip>
```

`removeLabel` is yours, and required: the two props travel together in the
type, so a chip that can be removed but not named will not compile. The remove
click does not reach what the chip sits in — removing a tag should not also open
the row it was on.

**Switchable.** kilna drew twenty-three switchable chips by hand, in three sizes
and five recipes, and not one of them told a screen reader whether it was on.
Give a chip `pressed`, `defaultPressed` or `onPressedChange` and it is Base UI's
Toggle: a `<button>` with `aria-pressed`. "On" is the accent fill in semibold,
drawn from the same attribute that announces it, so the look and the
announcement cannot disagree.

```tsx
<Chip pressed={onlyScored} onPressedChange={setOnlyScored}>
  Scored
</Chip>
```

**Never both.** A chip that switches and also holds a cross is a button inside a
button: the cross is a nested control no reader can reach on its own, and a
press on it would switch the chip as well. The type refuses the combination.

**A row of switches is a ChipGroup.** Base UI's ToggleGroup underneath: the row
is one stop on the Tab key and the arrows walk the chips — a filter bar of eight
kinds is not eight Tab presses long. `multiple` decides whether pressing one lets
go of the others. The value is an array in both modes, which is Base UI's shape;
a single group holds at most one.

```tsx
<ChipGroup aria-label={t('kind')} value={kinds} onValueChange={setKinds} multiple>
  <Chip value="song" count={42}>Song</Chip>
  <Chip value="clip" count={12}>Clip</Chip>
  <Chip value="short">Short</Chip>
</ChipGroup>
```

**`required` keeps one on.** A press on the last chip that is on does nothing,
and `onValueChange` is not called - the change is refused before it is made, so
a group that keeps its own state keeps the chip too. kilna guarded "always one"
in five callbacks, each putting the value back after the group had let it go.
With `multiple`, it is the last of several that stays. Give the group a value to
start from: `required` keeps a chip on, it does not pick one.

```tsx
<ChipGroup aria-label={t('kind')} value={kind} onValueChange={setKind} required>
  <Chip value="song">Song</Chip>
  <Chip value="clip">Clip</Chip>
</ChipGroup>
```

For one of a few that is less a filter than a setting — a theme, a view — reach
for [SegmentedControl](/dowel/components/segmented-control/): a radio group,
whose choice is always one.

**Tones are the Badge's.** `accent`, `good`, `warn`, `bad` and `info` are the
same fill-and-ink pairs Badge uses, so a chip and a badge in one row agree about
what a tone looks like. `dashed` is the outline with a broken border, for a chip
that stands for something not there yet — "+ Tag", "Any kind".

**A switch grows its hit area, not itself.** A chip is 21 pixels tall by design;
as a switch it carries `target-min`, so the pointer target reaches the 24px
floor while the chip stays the size it is.

## Props

### `Chip`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `variant` | `outline \| dashed \| soft \| accent \| good \| warn \| bad \| info` | `'outline'` |  |
| `count` | `number` |  | Shown after the label, for a count. |
| `className` | `string` |  |  |
| `children` | `ReactNode` |  |  |
| `onRemove` (with `removeLabel`) | `() => void` |  | Called when the cross is pressed. Giving it is what makes the chip removable; the press does not reach a clickable parent. |
| `removeLabel` (with `onRemove`) | `string` |  | The accessible name of the cross, for example "Remove tag". Required with `onRemove`, and there is no default word, so the product can translate it. |
| `pressed` | `boolean` |  | Whether it is on. Controlled; pair it with `onPressedChange`. |
| `defaultPressed` | `boolean` |  | Whether it starts on, for a chip nobody else needs to know about. |
| `onPressedChange` | `(pressed: boolean) => void` |  | Called with the new state when the chip is switched. Giving it makes the chip a switch. |
| `value` | `string` |  | Which member of a ChipGroup this is. Inside a group the group owns the state, and `pressed` is not read. |
| `disabled` | `boolean` |  | Stops the chip being switched, and dims it. Only a switch can be disabled. |

And every prop of `HTMLAttributes<HTMLElement>` except `onSelect`, `defaultValue`, `color`, passed on.

### `ChipGroup`

A row of chips that switch together.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `aria-label` | `string` |  | What the row of chips is: "Kind", "Status". A group without a name is a row of buttons a reader meets one at a time with no idea what they choose between. |
| `aria-labelledby` | `string` |  | Identifies the element (or elements) that labels the current element. |
| `value` | `readonly string[]` |  | The values of the chips that are on. An array in both modes, because that is Base UI's shape and a single mode is a group that holds at most one. |
| `defaultValue` | `readonly string[]` |  | The values that start on, when the group keeps its own state. |
| `onValueChange` | `(value: string[]) => void` |  | Called with the values that are on after a chip is pressed. Always an array, in both modes. |
| `multiple` | `boolean` | `false` | Several on at once - filters - rather than one at a time - a kind. |
| `required` | `boolean` | `false` | At least one stays on: a press on the last chip that is on does nothing. For a choice that always has an answer - a kind, a view - where letting go of the last chip leaves a screen with no answer to draw. Give it a `value` or `defaultValue` to start from; it keeps a chip on, it does not pick one. |
| `disabled` | `boolean` |  | Disables every chip in the group. |
| `children` (required) | `ReactNode` |  |  |

And every prop of `HTMLAttributes<HTMLDivElement>` except `defaultValue`, `onChange`, passed on.
