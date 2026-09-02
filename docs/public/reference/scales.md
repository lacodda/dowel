# Scales

Source: https://lacodda.github.io/dowel/reference/scales

Colour is one half of a vocabulary; this is the other. Every corner, size,
shadow, speed and layer a product draws has a name here, so that a screen can
be described in words rather than in pixels.

These values are not derived from a ratio. They were read off the products the
line already ships — the radius that appears twenty times, the two type sizes
that carry nine tenths of every screen — and then tidied. A scale invented from
a formula is a scale nobody's existing code fits.

## Radius

`md` is the control radius: inputs, buttons, list rows. Anything bigger is a surface; anything smaller sits inside something else.

- `--radius-xs`
- `--radius-sm`
- `--radius-md`
- `--radius-lg`
- `--radius-xl`
- `--radius-2xl`

A shape nested inside another needs a smaller corner than its parent, or the
inner curve reads as wrong against the outer one. `--radius-inner` is that
correction, expressed rather than guessed:

```css
.card { border-radius: var(--radius-lg); }
.card > header { border-radius: var(--radius-inner) var(--radius-inner) 0 0; }
```

## Type

Seven steps from 10px to 21px, each with the line height it is set on.

- `--text-2xs`
- `--text-xs`
- `--text-sm`
- `--text-base`
- `--text-lg`
- `--text-xl`
- `--text-2xl`

`base` is body text. The two steps below it are for metadata — a timestamp, a
count, a label — and the ones above are headings. There is deliberately nothing
between them: the products this scale came from had nine sizes inside four
pixels, and no reader could tell any of them apart.

Three weights. `bold` is absent because nothing in the line uses it - `semibold` is what emphasis looks like here.

- `--font-weight-normal`
- `--font-weight-medium`
- `--font-weight-semibold`

Letter spacing, for the two cases that need it: the uppercase caption, and a large heading that would otherwise read as loose.

- `--tracking-caption`
- `--tracking-tight`

## Motion

`quick` for a colour or an opacity that should feel immediate, `base` for something that moves, `slow` for something arriving from off-screen.

- `--duration-quick`
- `--duration-base`
- `--duration-slow`

`out` for anything the user asked for - it arrives fast and settles. `in-out` for something moving on its own.

- `--ease-out`
- `--ease-in-out`

There is no `ease-in`. It starts slowly, which on a control the user just
clicked reads as lag.

Durations are custom properties rather than utilities, because Tailwind's
`duration-*` takes a literal number:

```css
.thing {
  transition: opacity var(--duration-quick) var(--ease-out);
}
```

All of it is cut to nothing under `prefers-reduced-motion` — that is handled by
the theme, and a product does not have to remember it.

## Elevation

Three steps, shown in both themes: a shadow tuned for a dark ground disappears on a light one, so each theme has its own.

- `--shadow-lift`
- `--shadow-raise`
- `--shadow-float`

Use `lift` for something that has left the page by a millimetre — a hovered
row, a sticky header. `raise` is the working elevation of menus, popovers and
toasts. `float` is for the thing that takes over the screen: a modal, a command
palette.

The products this came from had one shadow and used it for all three, which is
why a modal never felt further away than the menu it covered.

## Stacking order

What covers what. The values only mean anything relative to each other.

- `--z-popup`
- `--z-sticky`
- `--z-menu`
- `--z-floating`
- `--z-overlay`
- `--z-modal`
- `--z-palette`
- `--z-toast`

```css
.modal { z-index: var(--z-modal); }
```

Named layers exist because the alternative is arithmetic in the dark. A command
palette has to sit above a modal; with bare numbers that means writing `70`
somewhere and hoping nobody later writes `80` for a tooltip. With names, the
order is a sentence you can read.

A toast is last on purpose: a message about what just happened has to be
visible over whatever caused it.
