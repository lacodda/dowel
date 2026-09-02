# Tokens

Source: https://lacodda.github.io/dowel/reference/tokens

The theme is a vocabulary, and this is the whole of it. Every colour in a
product goes through one of these names; a component never writes a colour of
its own and never uses a `dark:` utility, because the theme swaps the token
underneath instead.

Each swatch below is painted by the token itself, in both themes. The chequered
ground shows through the translucent ones — `soft`, `line` and every `-soft`
variant are meant to sit *over* a surface rather than replace it.

## The two parameters

A product does not restate the vocabulary. It sets its own hue, and the rest
follows:

```css
@import 'dowel-ui/theme.css';

:root {
  /* The product's colour from the brand-line registry. */
  --accent-base: #d9569e;
}
```

That one line moves the accent, both of its partners, the accent's soft fill,
the focus ring, and the tint in the greys. `--neutral-base` follows
`--accent-base` unless a product sets it separately — a product that wants
plain grey chrome points it at a grey.

| Parameter | What it does |
| --- | --- |
| `--accent-base` | The product's hue. Everything accent-shaped is mixed from it. |
| `--neutral-base` | The hue tinted into the greys. Follows the accent by default. |
| `--neutral-tint` | How much of that hue reaches the grounds and the text. |
| `--neutral-tint-strong` | The same, for the dimmer inks where the tint needs to carry further. |
| `--ground` | The untinted base of the page. |
| `--ink` | The untinted base of the text. |

## Grounds and surfaces

What a screen is built on: the page, the raised card, and the two translucent lifts that work over either.

- `--bg`
- `--raise`
- `--soft`
- `--softer`

## Hairlines

Borders and separators. `line-2` is the one that has to be seen — a scrollbar thumb, a focused edge.

- `--line`
- `--line-2`

## Ink

Three weights of text: what you read, what you glance at, and what is only there when you look for it.

- `--text`
- `--dim`
- `--faint`

## Accent

The product's own colour. `accent-2` is the hover and active partner; `on-accent` is whatever stays legible on top of an accent fill.

- `--accent`
- `--accent-2`
- `--accent-soft`
- `--on-accent`

`on-accent` is worked out rather than chosen. A light accent — gold, lime,
amber — takes dark glyphs; a dark one takes white. This is the same rule the
brand-line S tile follows, and it means a product cannot pick its accent and
then forget to fix the text on top of it.

## Status

Meaning, not decoration. These do not follow the product accent: a green that shifted per product would stop meaning good.

- `--good`
- `--good-soft`
- `--warn`
- `--warn-soft`
- `--bad`
- `--bad-soft`
- `--info`
- `--info-soft`

Status never rests on colour alone. A badge carries an icon and a word as well,
so that it survives a monochrome screen and a reader who does not separate red
from green.

What stays legible on a status fill, worked out the same way `on-accent` is.

- `--on-good`
- `--on-warn`
- `--on-bad`
- `--on-info`

Each status fill has its own partner, and the distinction matters: `on-accent`
is derived from the *accent*, so using it on a `warn` fill is right only by
coincidence. The first product to move onto dowel had a count on a yellow badge
drawn in `on-accent` — white, at 1.95:1 — and it looked correct for as long as
that product happened to pin white.

```html
<span class="bg-warn text-on-warn">3</span>
```

## Themes

Dark is the default: the bare root element is the dark theme. Light arrives two
ways, and they are kept identical on purpose.

```html
<html>          <!-- follows the operating system -->
<html class="dark">   <!-- pinned dark -->
<html class="light">  <!-- pinned light -->
```

A product that offers a theme switch writes the class; a product that does not
gets the reader's system preference for free.

## Using them

With Tailwind 4 the tokens are utilities, because the theme declares them in an
`@theme` block:

```html
<div class="bg-raise text-text border border-line">
  <button class="bg-accent text-on-accent">Save</button>
</div>
```

The stock palette is dropped deliberately — `--color-*: initial` — so a stray
`bg-zinc-800` does not compile. If a colour is worth using, it is worth having
a name in the vocabulary.

Outside Tailwind they are ordinary custom properties:

 FENCE4
