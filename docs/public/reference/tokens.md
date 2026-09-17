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

## Charts

Series identity. Assigned 1..8 in order and never cycled: a ninth series folds into an *other*, or the chart becomes small multiples.

- `--series-1`
- `--series-2`
- `--series-3`
- `--series-4`
- `--series-5`
- `--series-6`
- `--series-7`
- `--series-8`

These are the second thing in the vocabulary that does not follow the product
accent, and for a reason worth stating: a series belongs to the *data*, not to
the product showing it. A palette derived from `--accent-base` would paint the
same series differently in kilna and in kasl-server, and colour would stop
being a way to recognise it.

Deriving them was measured before it was rejected. Rotating the hue off the
accent by fixed angles put the best candidate ΔE 12.1 from the product's own
accent, with adjacent pairs at 9.8 and 46 of 152 colours outside sRGB; the
fixed palette does better on both counts.

The cost is the other side of the same coin, and it is not hidden: 13 of the
line's 19 accents sit within ΔE 8 of some slot. A chart shows one accent, so
this survives — but it is exactly why **identity is carried by the legend and by
direct labels, never by hue on its own.** Two or more series always have a
legend; four or fewer are also labelled where they sit.

The order is not a display order. It is what holds adjacent slots apart under
protanopia and deuteranopia — the worst adjacent pair is ΔE 8.4 — so re-sorting
these for looks breaks a gate that exists for readers who cannot tell red from
green.

Slot 8 is the line's own value rather than the one the doctrine's reference
palette states. That red sat ΔE 1.9 from `--bad`: a series close enough to a
verdict to be read as one. It cost nothing to move — the worst adjacent pair is
unchanged — and `series.test.ts` now keeps every slot clear of every status.

Magnitude rather than identity: one hue, running away from the ground as the value grows. A heatmap cell reads this.

- `--scale-100`
- `--scale-200`
- `--scale-300`
- `--scale-400`
- `--scale-500`
- `--scale-600`
- `--scale-700`

The lightest step is allowed to recede toward the surface, because *near zero*
should. For an ordered-but-discrete scale — tiers, funnel stages — start at
`scale-300` instead, where the contrast still holds.

Heat: five discrete steps for a grid of cells where colour is the only thing carrying the value.

- `--heat-1`
- `--heat-2`
- `--heat-3`
- `--heat-4`
- `--heat-5`

Five rather than the scale's seven, and a separate ramp rather than a slice of
it, because the two answer different questions. `scale-*` is **sequential** — a
continuous magnitude, read as *more* and *less*. Heat is **ordinal**: five
shades a reader tells apart at a glance and counts against a legend, which
needs wider gaps between them. No five of `scale-*` clear the 0.06 lightness
step; they sit 0.047 apart, which is fine for a smooth ramp and too close to
count.

`heat-1` clears an empty cell by 2.1:1, and that is the number the ramp was
built around. A heatmap cell means more than a number — nothing recorded, still
under way, outside the range — and if the faintest value looks like the empty
square, the grid says somebody did nothing on a day nobody reported. Derived
from the product accent, as the first consumer built it, that distance was
1.3:1 for half the line.

The chart's own furniture, quieter than `line`: a gridline that competes with the data is drawn wrong.

- `--chart-grid`
- `--chart-axis`

Some series sit below 3:1 against the surface. That is allowed only because the
relief ships with them — visible values, or the table view — never as a fill
left to speak for itself.

Syntax: the eight kinds of thing in a piece of code that are worth telling apart in every language.

- `--syntax-keyword`
- `--syntax-string`
- `--syntax-number`
- `--syntax-comment`
- `--syntax-name`
- `--syntax-type`
- `--syntax-punctuation`
- `--syntax-meta`

Fixed like the series, and for the same reason: code is not a property of the
product showing it, and `if` should not be magenta in one product and cobalt in
another. A highlighter's own theme names fifty kinds; these eight are the ones
that survive across languages, and anything finer is one grammar's vocabulary.

**They are measured as *text*, which is why they are not the series palette.**
Every slot clears 4.5:1 against the *hardest* surface code sits on — `soft`
over `raise` — in both themes. The hardest rather than the typical one because
`soft` is translucent and so has no single surface: the first version of the
gate wrote one down, passed, and a live run found `syntax-comment` at 4.0:1 on
a block inside a panel. Reusing `series-*` here was the first plan and failed the same
measurement: five of its eight light values sat under 3:1 and one at 1.90:1. A
series colour is a filled mark, chosen against a 3:1 threshold; a 12px glyph is
text. `comment` is the quietest on purpose, being the one kind a reader is
meant to be able to skip, and still clears the bar.

**These are the one palette here not held to the colour-blind floor**, and that
is a decision rather than an oversight — `syntax.test.ts` says so in place. A
series colour *is* the identity of its mark: lose the hue and the data is gone.
Syntax colour restates what the text already carries in full — a keyword is a
keyword by its spelling, a string by the quotes around it — and
[CodeBlock](/dowel/components/code-block/) renders none of it unless you pass
tokens. Holding eight hues to ΔE 6 under simulation *and* 4.5:1 as text in both
themes leaves a set of muddy near-greys, which would cost the readers colour
helps in order to protect readers who lose nothing when it is absent.

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
