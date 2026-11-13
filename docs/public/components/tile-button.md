# TileButton

Source: https://lacodda.github.io/dowel/components/tile-button

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#tile-button

A strip of frames with one chosen, a folder's file tiles where the well is the control, and cards picked from a row.

## Notes

Some controls are pictures. A strip of video frames, the files in a folder, a
row of styles to choose from: the thing on screen is what the reader presses,
and there is no label beside it to turn into a button.

**It is not a Button with its size taken away.** A [Button](/components/button/)
is a control row: it stands on the field height, pads its sides, keeps its
words on one line and centres them. That is right for a row of actions and
flattens a picture into a strip. TileButton draws none of it - it takes the
size of what it holds, lays its content out as a column (so a picture inside it
is a block, flush at the foot), and starts its text at the start.

**The chosen one is drawn on the edge.** A picture covers the inside of the
tile, so a chosen state painted as a fill would be underneath it, and a ring
drawn outside the tile is cut off by whatever scrolls a strip of them. The
chosen tile takes the accent on its border and a second line just inside it,
drawn over the picture - a change of weight as well as hue, so it reads without
colour.

```tsx
<div className="flex gap-2">
  {frames.map((frame) => (
    <TileButton
      key={frame.id}
      aria-label={t('openFrame', { name: frame.name })}
      selected={frame.id === chosen}
      onClick={() => open(frame)}
    >
      <img src={frame.src} alt="" className="size-20 object-contain" />
    </TileButton>
  ))}
</div>
```

**It names the chosen one, once.** `selected` sets `aria-current`, the way
[RowButton](/components/list-row/) does: a tile that opens what it shows is
where the reader is, not a value being submitted. A tile that toggles passes
`aria-pressed`, and a tile in a listbox passes `aria-selected` with
`role="option"`; either replaces `aria-current` rather than joining it, and the
look still follows `selected`.

**A picture has no words, so give the tile a name.** An `<img alt="">` inside
it names nothing; `aria-label` on the tile, in the product's language, does.

**In a card that clips, pull the focus ring inside.** The ring stands outside
the tile, as every focus ring of the set does. A tile that is only the well of
a larger card - a file tile with its name under it - sits inside an
`overflow-hidden` frame that would cut the ring off; give that tile
`focus-visible:-outline-offset-2`, and `rounded-none border-0` so the card's own
edge is the only one.

```tsx
<li className="overflow-hidden rounded-md border border-line bg-raise">
  <TileButton
    aria-label={t('open', { name })}
    onClick={open}
    className="h-26 w-full items-center justify-center rounded-none border-0 bg-bg focus-visible:-outline-offset-2"
  >
    <img src={src} alt="" className="max-h-full max-w-full object-contain" />
  </TileButton>
  <p className="truncate px-2 py-1.5 text-xs">{name}</p>
</li>
```

`render` draws it as something else - a router's link, most often - with the
same clothes and no button attributes on it.

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `selected` | `boolean` | `false` | The chosen tile: the accent on its edge, and `aria-current` unless the caller names the state itself with `aria-pressed` or `aria-selected`. |
| `render` | `RenderProp<Record<string, unknown>>` |  | The element to draw the tile as - a router's link, most often: `render={<Link to={…} />}`. Without it the tile is a `<button>`. |
| `disabled` | `boolean` |  | Disables the tile. Applied only when it is the default `<button>`: a rendered element such as a link has no `disabled` of its own. |

And every prop of `HTMLAttributes<HTMLElement>`, passed on.
