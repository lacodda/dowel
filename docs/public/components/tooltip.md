# Tooltip

Source: https://lacodda.github.io/dowel/components/tooltip

FENCE0 

The component lands in `components/ui/tooltip.tsx` and is yours to edit.

See it live on the stand: https://lacodda.github.io/dowel/stand/#tooltip

Both widths and the four sides - in either theme, and in the accent of any product of the line.

## When this and not a Popover

Not size. The line is whether anything inside can be reached.

A **tooltip** holds a phrase: no links, no buttons, no fields. There is no way
to get into it — it is tied to a trigger that is hovered or focused, and it
disappears the moment attention moves.

A **Popover** holds things you interact with, whatever its length. If the
content has a button in it, it is a popover even if it is four words long.

And there is a second question, which matters more:

## It is a visual aid, and only that

Base UI puts no `role="tooltip"` on the popup and no `aria-describedby` on the
trigger, deliberately. A tooltip cannot be reached on a touch screen and is not
reliably announced by a screen reader, so the library does not pretend
otherwise.

**So the trigger must carry its own `aria-label`**, saying roughly what the
tooltip says. The tooltip serves a sighted mouse or keyboard user; the
`aria-label` is what everyone else gets.

```tsx
<TooltipTrigger render={<Button variant="icon" aria-label="Archive" />}>
  <ArchiveIcon />
</TooltipTrigger>
```

If the words are load-bearing — if not reading them means not understanding the
control — this is the wrong component. Put them inline, or use a Popover with
`openOnHover` on the trigger, which touch and screen reader users can reach.

## Usage

```tsx
<TooltipProvider delay={600}>
  <Tooltip>
    <TooltipTrigger render={<Button variant="icon" aria-label="Archive" />}>
      <ArchiveIcon />
    </TooltipTrigger>
    <TooltipPopup>Move to the archive</TooltipPopup>
  </Tooltip>
</TooltipProvider>
```

`TooltipPopup` renders its own portal, positioner and arrow.

`TooltipProvider` is optional and shared: once one tooltip in a group has
opened, the next opens instantly instead of waiting out its delay again. A
toolbar of icon buttons without it feels broken in a way nobody can name.

## Notes

**It opens on focus, not only on hover.** This is the half that gets forgotten,
and forgetting it is invisible: someone tabbing through a row of unlabelled
icon buttons never hovers anything.

**`Escape` closes it** while the trigger still has focus — the way out for
someone who can see it covering what they were reading.

**`delay` is not a root prop.** It belongs to the trigger, the same as on
PreviewCard. Passing it to `Tooltip` is silently ignored at runtime.

**Small text, on purpose.** `text-xs`. It sits over the thing it explains and
has to be readable without taking the page over.

**`--z-popup`, above everything else.** A tooltip labels whatever is on top of
it, including the contents of a popover or a dialog, so it has to be able to
sit above them.

**No colour of its own.** Every class is written in tokens, so the same list is
correct in both themes and in every product's accent — no `dark:` utilities
anywhere in it.

## Props

### `TooltipProvider`

A shared delay for a group of tooltips. Wrap a toolbar in it and the second icon button explains itself instantly rather than making the reader wait again. Optional - a lone tooltip works without one.

Base UI's `Tooltip.Provider`, unchanged under dowel's name.

### `Tooltip`

The root. Takes `disabled`, and the controlled `open`/`onOpenChange`.

Base UI's `Tooltip.Root`, unchanged under dowel's name.

### `TooltipTrigger`

What it labels. Give it `render` to use your own button - and give that button an `aria-label` saying what the tooltip says, because the tooltip itself reaches nobody using a screen reader.

Base UI's `Tooltip.Trigger`, unchanged under dowel's name.

### `TooltipPopup`

The label itself. Portalled and positioned, so it is not clipped by an ancestor with `overflow: hidden`.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| wide` | `'sm'` |  |
| `side` | `bottom \| top \| left \| right \| inline-end \| inline-start` |  | Preferred side of the trigger. Base UI flips it when it does not fit, and defaults it to the top. |
| `align` | `center \| start \| end` |  | Alignment along that side. Base UI centres it by default. |
| `sideOffset` | `number \| OffsetFunction` | `6` | Distance from the trigger, in pixels. |
| `arrow` | `boolean` | `true` | Whether to draw the arrow pointing back at the trigger. |
| `container` | `HTMLElement \| ShadowRoot \| RefObject<HTMLElement \| ShadowRoot \| null> \| null` |  | Where to portal to. Defaults to the raised host of the overlay this is opened inside (`layer.tsx`), and to the document body when there is none - either way not the element it was opened from, whose `overflow` would clip it. Pass an element to put it somewhere else, such as a container being screenshotted. |

And every prop of Base UI's `Tooltip.Popup`, passed on.

### `TooltipArrow`

The notch pointing back at the trigger. Base UI rotates it to whatever side the tooltip landed on, which is why the placement is keyed off `data-side` rather than off the `side` that was asked for.

Every prop of Base UI's `Tooltip.Arrow`, passed on.
