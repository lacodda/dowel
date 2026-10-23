# Printing

Source: https://lacodda.github.io/dowel/guides/printing

A report is printed - a month of hours, a dashboard for a meeting - and a
screen built for a window prints badly by default: the dark theme comes out as
near-white ink on white paper, because a browser drops backgrounds to save
ink; a chart loses its bars, which are backgrounds; the app's frame clips
everything below the fold to one page.

The theme and the set handle all three. A product marks its own chrome.

## What the theme does

```css
@import 'dowel-ui/theme.css';
```

Under `@media print`:

- **The light theme, whatever is on screen.** Every root takes the light
  theme's values, a product pinned to `dark` included, on the paper's own
  white. Shadows are none: a sheet has no light to cast them.
- **Fills print.** `print-color-adjust: exact` is set on the root and
  inherited, so a bar, a heatmap cell or a status on its badge is printed as
  drawn. On the light theme's grounds that costs little ink.
- **Rows, figures and headings keep whole.** A table row, an image, an SVG, a
  block of code is not cut across two sheets, and a heading is not left alone
  at the foot of one. These are in the base layer, so a product can let a very
  long row break.

[More contrast](/dowel/concepts/contrast/) applies on paper too, when the
reader has asked for it.

## What the set does

- **The frame lets go.** `AppShell` stops filling the window and becomes a
  block; a `Screen`, a `Pane` and a `ScrollArea` stop scrolling and run on
  over as many pages as the content takes.
- **Chrome is left off.** The bar across the top, the `NavRail`, the window's
  own buttons and edges, and the toasts are hidden on paper.
- **Wholes stay whole.** A `Panel`, a `StatTile`, an `Alert` and the charts
  (`BarChart`, `LineChart`, `ActivityHeatmap`) keep to one sheet.

A browser test prints every frame primitive and block and fails if any box
still cuts off what it holds.

## What a product does

Hide what is for getting somewhere rather than for reading - a header of your
own, the tabs at the bottom of a phone layout, a filter bar, an export button:

```tsx
<header className="print:hidden">…</header>
```

To see it, print to PDF, or in Chrome's DevTools open the Rendering panel and
set *Emulate CSS media type* to `print`.
