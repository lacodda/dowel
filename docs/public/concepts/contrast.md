# Contrast

Source: https://lacodda.github.io/dowel/concepts/contrast

Contrast in dowel is not a property of a colour. It is a property of a pair -
an ink on a ground - and the theme states, pair by pair, which ones it
promises. Every promise is measured in CI for every product of the line, in
both themes and both contrast modes, from the colours a browser actually
resolved. A pair that is not on the list is a pair the set does not draw.

## What is promised

| Ink | On | Held to | For |
| --- | --- | --- | --- |
| `text` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `accent-soft over bg`, `accent-soft over raise`, `good-soft over bg`, `good-soft over raise`, `warn-soft over bg`, `warn-soft over raise`, `bad-soft over bg`, `bad-soft over raise`, `info-soft over bg`, `info-soft over raise` | 7:1 (AAA) | body text |
| `dim` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `accent-soft over bg`, `accent-soft over raise`, `good-soft over bg`, `good-soft over raise`, `warn-soft over bg`, `warn-soft over raise`, `bad-soft over bg`, `bad-soft over raise`, `info-soft over bg`, `info-soft over raise` | 4.5:1 (AA) | secondary text |
| `faint` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise` | 4.5:1 (AA) | quiet text |
| `accent` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `accent-soft over bg`, `accent-soft over raise` | 4.5:1 (AA) | a link, the word on its fill |
| `accent-2` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise` | 4.5:1 (AA) | a link under the pointer |
| `good` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `good-soft over bg`, `good-soft over raise` | 4.5:1 (AA) | a status, the word on its fill |
| `warn` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `warn-soft over bg`, `warn-soft over raise` | 4.5:1 (AA) | a status, the word on its fill |
| `bad` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `bad-soft over bg`, `bad-soft over raise` | 4.5:1 (AA) | a status, the word on its fill |
| `info` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `info-soft over bg`, `info-soft over raise` | 4.5:1 (AA) | a status, the word on its fill |
| `on-accent` | `accent`, `accent-2` | 4.5:1 (AA) | text on a fill |
| `bg` | `faint` | 4.5:1 (AA) | a glyph on a neutral mark |
| `on-good` | `good` | 4.5:1 (AA) | text on a fill |
| `on-warn` | `warn` | 4.5:1 (AA) | text on a fill |
| `on-bad` | `bad` | 4.5:1 (AA) | text on a fill |
| `on-info` | `info` | 4.5:1 (AA) | text on a fill |

A translucent ground is measured the way the screen draws it: `soft over raise`
is the raised surface with the soft veil composited on top. The floor is WCAG's
rule for the kind of thing drawn, asked at every step of the type scale. The
scale stops at 21px and a weight of 600, which is never large text in WCAG's
sense, so every text floor here is the small-text one - there is no size in
the line at which a quieter ink would be enough.

## Three inks, and all of them are text

`text`, `dim` and `faint` are what you read, what you glance at, and what you
find when you look. All three clear AA on every neutral ground for every
accent; on a raised surface they sit at about 12.5, 7.9 and 5.3 to 1 in the
dark theme and 15, 9 and 5.9 in the light one - far enough apart to read as
three.

**`faint` is not for a tinted fill.** A selected row, a status, the accent's
soft fill: the quiet ink there is `dim`. Holding `faint` to AA on tints as well
would have pushed it above `dim` and left two inks where there were three.

**Fills do not stack.** An ink on two translucent layers - a soft button on a
tinted banner, a soft row on a soft surface - is a pair nobody promised, and
both layers darken or lighten the same way. Put the state somewhere else: a
solid button on the banner, a mark at the row's edge.

## The accent

The light theme darkens every accent to one lightness. The dark theme leaves
an accent as the registry states it unless it is too dark to read as text, and
then lifts it to a floor - same hue, same chroma. Cobalt, crimson and iris were
3.7:1 as a link on a raised surface before it; every accent of the line now
clears AA as a link, and as the word on its own soft fill.

## More contrast

A reader who asks their system for more contrast gets it, with nothing for a
product to do:

| Ink | As drawn | Under more contrast |
| --- | --- | --- |
| `text` | AAA, 7:1 | AAA, 7:1 |
| `dim` | AA, 4.5:1 | AAA, 7:1, on every ground |
| `faint` | AA on the neutral grounds | AA on every ground, tints included |
| `line`, `line-2` | a hairline | a boundary, 3:1 |

| Ink | On | Held to | For |
| --- | --- | --- | --- |
| `text` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `accent-soft over bg`, `accent-soft over raise`, `good-soft over bg`, `good-soft over raise`, `warn-soft over bg`, `warn-soft over raise`, `bad-soft over bg`, `bad-soft over raise`, `info-soft over bg`, `info-soft over raise` | 7:1 (AAA) | body text |
| `dim` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `accent-soft over bg`, `accent-soft over raise`, `good-soft over bg`, `good-soft over raise`, `warn-soft over bg`, `warn-soft over raise`, `bad-soft over bg`, `bad-soft over raise`, `info-soft over bg`, `info-soft over raise` | 7:1 (AAA) | secondary text |
| `faint` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `accent-soft over bg`, `accent-soft over raise`, `good-soft over bg`, `good-soft over raise`, `warn-soft over bg`, `warn-soft over raise`, `bad-soft over bg`, `bad-soft over raise`, `info-soft over bg`, `info-soft over raise` | 4.5:1 (AA) | quiet text |
| `accent` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `accent-soft over bg`, `accent-soft over raise` | 4.5:1 (AA) | a link, the word on its fill |
| `accent-2` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise` | 4.5:1 (AA) | a link under the pointer |
| `good` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `good-soft over bg`, `good-soft over raise` | 4.5:1 (AA) | a status, the word on its fill |
| `warn` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `warn-soft over bg`, `warn-soft over raise` | 4.5:1 (AA) | a status, the word on its fill |
| `bad` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `bad-soft over bg`, `bad-soft over raise` | 4.5:1 (AA) | a status, the word on its fill |
| `info` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `info-soft over bg`, `info-soft over raise` | 4.5:1 (AA) | a status, the word on its fill |
| `on-accent` | `accent`, `accent-2` | 4.5:1 (AA) | text on a fill |
| `bg` | `faint` | 4.5:1 (AA) | a glyph on a neutral mark |
| `on-good` | `good` | 4.5:1 (AA) | text on a fill |
| `on-warn` | `warn` | 4.5:1 (AA) | text on a fill |
| `on-bad` | `bad` | 4.5:1 (AA) | text on a fill |
| `on-info` | `info` | 4.5:1 (AA) | text on a fill |
| `line` | `bg`, `raise` | 3:1 (a boundary) | a divider |
| `line-2` | `bg`, `raise`, `soft over bg`, `soft over raise`, `softer over bg`, `softer over raise`, `accent-soft over bg`, `accent-soft over raise`, `good-soft over bg`, `good-soft over raise`, `warn-soft over bg`, `warn-soft over raise`, `bad-soft over bg`, `bad-soft over raise`, `info-soft over bg`, `info-soft over raise` | 3:1 (a boundary) | the edge of a control |

The mode follows `prefers-contrast: more`. A product that offers it as a
setting pins it with a class on the root, the same way it pins a theme:

```html
<html class="contrast-more">   <!-- on, whatever the system says -->
<html class="contrast-normal"> <!-- off, whatever the system says -->
```

It is written once for both themes, as mixes of the theme's own `text` with
its own ground, so it works in the light theme, the dark one and on paper
alike. The accent, the statuses and the fills already clear AA and stay as
they are.

## Where it is checked

- **The palette gate** resolves the theme in a browser for each of the line's
  products, in both themes and both modes, and measures every pair above.
- **The ink gate** reads the set's source: where one class list names an ink
  and a fill, the two have to be a promised pair.
- **axe**, in a browser, over every item of the stand in both themes - see the
  [accessibility report](/dowel/reference/accessibility/). It sees one accent;
  the palette gate sees all of them.

The [stand](/dowel/stand/) measures the same list live, in the accent, theme
and contrast mode on screen.

## What is not covered

Windows' contrast themes (`forced-colors: active`) replace the palette with the
system's own; the tokens do not reach that far, and the set has not yet been
walked in that mode.
