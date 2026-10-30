# PreviewCard

Source: https://lacodda.github.io/dowel/components/preview-card

FENCE0 

The component lands in `components/ui/preview-card.tsx` and is yours to edit.

See it live on the stand: https://lacodda.github.io/dowel/stand/#preview-card

A link, its card, and the three sizes - in either theme, and in the accent of any product of the line.

## When this and not a Tooltip

A **tooltip** holds a phrase and nothing can be reached inside it. A
**preview card** holds rich content — an avatar, a couple of lines, a figure —
and it *is* hoverable: the pointer travels from the link into the card without
it disappearing, so a link inside it can actually be clicked.

That is the trick the component exists for. A card that vanished when the
pointer left the link could not be read, let alone clicked into.

## When this and not a Popover

A **popover** is opened deliberately, from a button, and is reachable by
everyone. A **preview card** opens on hover over a link, and is not.

## It is an enhancement, not a delivery mechanism

Base UI treats this the way it treats Tooltip: a visual aid for sighted mouse
and keyboard users. It is not reachable on a touch screen and not announced by
a screen reader.

**So nothing in the card may be the only place it appears.** Everything shown
has to also be on the page the link points at. The card saves a click for
people who can see it; it is never how the information gets delivered.

The other half of that promise is the trigger. Render it as the anchor itself,
so it stays a real link — it navigates, it opens in a new tab, and a screen
reader announces it as one.

If the content has to be reachable by everyone, use a Popover opened from a
real button instead.

## Usage

```tsx
<PreviewCard>
  <PreviewCardTrigger render={<a href="/people/ada" />} delay={300}>
    Ada Lovelace
  </PreviewCardTrigger>
  <PreviewCardPopup>
    <Avatar src={ada.avatar} />
    <p>Wrote the first algorithm intended for a machine.</p>
    <a href="/people/ada/notes">Read the notes</a>
  </PreviewCardPopup>
</PreviewCard>
```

`PreviewCardPopup` renders its own portal, positioner and arrow.

Note that `delay` sits on the **trigger** here, not on the root — unlike
Tooltip, where it is a root prop.

## Notes

**It opens on focus as well as on hover**, so someone tabbing through a
paragraph of links gets the same previews.

**`Escape` closes it** without leaving the link.

**It is portalled.** A card rendered in place is clipped by the paragraph the
link sits in.

**No colour of its own.** Every class is written in tokens, so the same list is
correct in both themes and in every product's accent — no `dark:` utilities
anywhere in it.

## Props

### `PreviewCard`

The root. Controlled with `open` and `onOpenChange`, or left to manage itself around a `PreviewCardTrigger`.

Base UI's `PreviewCard.Root`, unchanged under dowel's name.

### `PreviewCardTrigger`

The link the card previews. Usually rendered as the anchor itself, so it stays a real link: it navigates, it opens in a new tab, and a screen reader announces it as one - which is what the card cannot do. Takes `delay`.

Base UI's `PreviewCard.Trigger`, unchanged under dowel's name.

### `PreviewCardPopup`

The card. Portalled and positioned, so it is not clipped by the paragraph the link sits in.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md \| lg` | `'md'` |  |
| `side` | `bottom \| top \| left \| right \| inline-end \| inline-start` |  | Preferred side of the link. Base UI flips it when it does not fit, and defaults it to the bottom. |
| `align` | `center \| start \| end` |  | Alignment along that side. Base UI centres it by default. |
| `sideOffset` | `number \| OffsetFunction` | `8` | Distance from the link, in pixels. |
| `arrow` | `boolean` | `true` | Whether to draw the arrow pointing back at the link. |
| `container` | `HTMLElement \| ShadowRoot \| RefObject<HTMLElement \| ShadowRoot \| null> \| null` |  | Where to portal to. Defaults to the raised host of the overlay this is opened inside (`layer.tsx`), and to the document body when there is none - either way not the element it was opened from, whose `overflow` would clip it. Pass an element to put it somewhere else, such as a container being screenshotted. |

And every prop of Base UI's `PreviewCard.Popup`, passed on.

### `PreviewCardArrow`

The notch pointing back at the link. Base UI rotates it to whatever side the card landed on, which is why the placement is keyed off `data-side` rather than off the `side` that was asked for.

Every prop of Base UI's `PreviewCard.Arrow`, passed on.
