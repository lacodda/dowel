# Popover

Source: https://lacodda.github.io/dowel/components/popover

FENCE0 

The component lands in `components/ui/popover.tsx` and is yours to edit.

See it live on the stand: https://lacodda.github.io/dowel/stand/#popover

The sizes and the four sides, with and without the arrow - in either theme, and in the accent of any product of the line.

## When this and not a Dialog

Both hold interactive content, so the choice is about where the content
belongs and what it interrupts.

Reach for **Popover** when the content is *about* the control: a filter panel
on a filter button, a colour picker on a swatch, a short form on an edit
button. It appears beside its trigger, the page underneath stays live, and
focus is not trapped.

Reach for **Dialog** when the content is the screen's whole business for the
moment, or when it is long enough that anchoring it beside a button is absurd.

Reach for **Tooltip** if the content is a *label* — a few words, nothing to
click. A popover holds things you interact with; a tooltip holds a phrase.

## Usage

```tsx
<Popover>
  <PopoverTrigger render={<Button />}>Filters</PopoverTrigger>
  <PopoverPopup side="bottom" align="start" sideOffset={8}>
    <PopoverTitle>Filters</PopoverTitle>
    <PopoverDescription>Narrow the list down.</PopoverDescription>
    <Button render={<PopoverClose />}>Done</Button>
  </PopoverPopup>
</Popover>
```

`PopoverPopup` renders its own portal, positioner and arrow, so there is
nothing to arrange around it.

## Positioning

`side` and `align` are a preference, not an instruction. Base UI measures the
trigger and the panel and flips or shifts the popup when the preferred side
does not fit, so a popover near the bottom of the window comes out above its
trigger. That is the behaviour worth having — a popover that stays where it was
told is a popover half off the screen.

The arrow follows: it is rotated to whichever side the popup actually landed
on, not the side that was asked for.

## Notes

**It is not modal.** What is under the panel stays in the accessibility tree
and stays clickable. That is right for something beside a control and wrong for
something the page has to wait on — for that, use Dialog or ConfirmDialog.

**The trigger says whether it is open.** `aria-expanded` is the only way a
screen reader learns that this button revealed something rather than did
something, and Base UI puts it there.

**It is portalled.** An anchored popup rendered in place is clipped by the
first ancestor with `overflow: hidden`, which is where most of them go to die.

**Give it a title.** The popup's accessible name comes from `PopoverTitle`;
without one a screen reader announces "dialog" and nothing else.

**No colour of its own.** Every class is written in tokens, so the same list is
correct in both themes and in every product's accent — no `dark:` utilities
anywhere in it.

## Props

### `Popover`

The root. Controlled with `open` and `onOpenChange`, or left to manage itself around a `PopoverTrigger`.

Base UI's `Popover.Root`, unchanged under dowel's name.

### `PopoverTrigger`

What opens it, and what the popup is measured against.

Base UI's `Popover.Trigger`, unchanged under dowel's name.

### `PopoverClose`

What closes it, for a button inside the panel.

Base UI's `Popover.Close`, unchanged under dowel's name.

### `PopoverPopup`

The panel. Portalled and positioned, so it is not clipped by an ancestor with `overflow: hidden` - which is where most anchored popups go to die.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md \| lg` | `'md'` |  |
| `side` | `bottom \| top \| left \| right \| inline-end \| inline-start` |  | Preferred side of the trigger. Base UI flips it when it does not fit, and defaults it to the bottom. |
| `align` | `center \| start \| end` |  | Alignment along that side. Base UI centres it by default. |
| `sideOffset` | `number \| OffsetFunction` | `8` | Distance from the trigger, in pixels. |
| `arrow` | `boolean` | `true` | Whether to draw the arrow pointing back at the trigger. |
| `container` | `HTMLElement \| ShadowRoot \| RefObject<HTMLElement \| ShadowRoot \| null> \| null` |  | Where to portal to. Defaults to the raised host of the overlay this is opened inside (`layer.tsx`), and to the document body when there is none - either way not the element it was opened from, whose `overflow` would clip it. Pass an element to put it somewhere else, such as a container being screenshotted. |

And every prop of Base UI's `Popover.Popup`, passed on.

### `PopoverArrow`

The notch pointing back at the trigger. Base UI rotates it to whatever side the popup landed on, which is why the rotation is keyed off `data-side` rather than off the `side` that was asked for.

Every prop of Base UI's `Popover.Arrow`, passed on.

### `PopoverTitle`

The heading. Base UI points the popup's `aria-labelledby` at it, so a popover with one is named for a screen reader without anyone arranging it.

Every prop of Base UI's `Popover.Title`, passed on.

### `PopoverDescription`

The line under the heading, and the popup's `aria-describedby`.

Every prop of Base UI's `Popover.Description`, passed on.
