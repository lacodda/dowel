# Button

Source: https://lacodda.github.io/dowel/components/button

FENCE0 

The component lands in `components/ui/button.tsx` and is yours to edit.

See it live on the stand: https://lacodda.github.io/dowel/stand/#button

Every variant, size and state - in either theme, and in the accent of any product of the line.

## Variants

`primary` is the one action a screen is about — one per screen, or it is not
primary. `ghost` is the default and the quiet one. `soft` is for something
already chosen. `danger` is destructive, and stays quiet until hovered, because
a red button is not a warning if everything is red.

## Sizes

Three text sizes and three icon sizes. An icon button is square by
construction rather than by a padding that happens to match.

| Size | Height | Icon | For |
| --- | --- | --- | --- |
| `md` | `h-control` — 36px, 32 compact, 40 comfortable | 16px | the default: a toolbar, a form, a dialog's actions |
| `sm` | `h-control-sm` — 32px, 28 compact, 36 comfortable | 14px | beside a field at `sm`, a dense toolbar |
| `xs` | 24px | 12px | inside something — a chat line, a chip, a table cell |
| `icon-md` | 32px square | 16px | |
| `icon-sm` | 28px square | 14px | a title bar, a panel header |
| `icon-xs` | 20px square | 12px | inside a row; the hit area stays 24px |

**`md` and `sm` stand on the control rows**, the same rows every field of the
set stands on, so a button beside a field of the same size is the same height
— and `data-density` on a container reaches the button along with the field.
They used to be `h-9` and `h-7` literally, and a compact form came out with
32px fields beside 36px buttons. See
[control height and density](/dowel/reference/scales/#control-height-and-density).

**`xs` and `icon-xs` are below the pointer floor on purpose** and grow their
hit area to 24px with `target-min`, so the glyph stays small and the target
does not.

## An icon in a text button

Put the icon in and give it no size: **every size sizes the icon inside it** —
16px at `md`, 14 at `sm`, 12 at `xs`.

```tsx
<Button variant="primary">
  <Plus />
  New style
</Button>
```

A lucide icon draws at its own 24px unless something sizes it, and a text
button used to size nothing — so every icon in a text button across the line
was taller than the text beside it, fixed at each call site by a `size-4` that
the next call site forgot.

**An icon with a size of its own keeps it.** The button sizes only an svg with
no `size-*` class: `[&_svg:not([class*=size-])]:size-4`. Without the guard the
rule is a descendant selector — one class and one element — and it outranks
the single class on the icon, so `<Plus className="size-2.5" />` in an icon
button drew at 14px and nothing said why. The same guard is on every primitive
of the set that sizes its icons, and a gate holds it.

## States

Disabled keeps the button's own colour and loses contact instead, so it reads
the same whatever the product's accent is.

A link rendered with `render` is still a link: it navigates, it opens in a new
tab, and a screen reader announces it as one. A `<button>` painted to look like
a link does none of that.

```tsx
<Button render={<a href="/somewhere" />} variant="primary">
  Go
</Button>
```

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `variant` | `primary \| ghost \| soft \| danger \| icon` | `ghost` | What the button is for |
| `size` | `xs \| sm \| md \| icon-xs \| icon-sm \| icon-md` | `md` | See [Sizes](#sizes) |
| `render` | `ReactElement \| (props) => ReactElement` | | Render something else with the button's clothes on |
| `className` | `string` | | Merged so the caller wins a conflict |

Everything else goes to the `<button>`: `onClick`, `disabled`, `type`,
`aria-*`, and the rest.

## Notes

**It is a real button.** Enter and Space activate it, Tab reaches it, and a
disabled one is skipped by the keyboard and ignores the pointer. None of that
is written into the component — it comes free with the element, and is exactly
what a `<div onClick>` throws away.

**`type` defaults to `button`.** A bare `<button>` inside a form submits it,
which surprises everyone once. Pass `type="submit"` when that is what you want.

**The caller wins a conflict.** `className` is merged by utility group, so
`<Button className="rounded-full">` gets round corners rather than two radii
fighting over source order.

**No colour of its own.** Every variant is written in tokens, so the same class
list is correct in both themes and in every product's accent — there are no
`dark:` utilities anywhere in it.
