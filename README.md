<p align="center">
  <img src="https://raw.githubusercontent.com/lacodda/dowel/main/assets/banner.svg" width="720" alt="dowel">
</p>

# dowel

The lacodda line design system: theme tokens and React primitives, distributed as a shadcn-compatible registry.

A dowel is the hidden peg that joins two boards so the seam does not show. That is what this does for the products of the line: they look made by one hand, and nobody sees the joint.

**Status:** v0.3.0 - the theme, the scales and an accent per product. Primitives follow; see the [roadmap](#roadmap).

## The theme

One import, and a product has the vocabulary of the line:

```bash
npm install dowel-ui
```

> The package is `dowel-ui`: npm declines the bare name as too close to `del` and `bower`. The system is dowel everywhere else.

```css
@import 'dowel-ui/theme.css';

:root {
  /* The product's own colour. Everything else follows from it. */
  --accent-base: #d9569e;
}
```

That single line moves the accent and both of its partners, the accent's soft fill, the focus ring, and the tint in the greys. Set nothing at all and you get dowel's own amber.

Dark is the default; light arrives with the reader's system preference, or pinned with a class:

```html
<html>                <!-- follows the operating system -->
<html class="light">  <!-- pinned light -->
<html class="dark">   <!-- pinned dark -->
```

With Tailwind 4 the tokens are utilities, because the theme declares them in a `@theme` block:

```html
<div class="bg-raise text-text border border-line">
  <button class="bg-accent text-on-accent">Save</button>
</div>
```

The stock palette is dropped deliberately, so a stray `bg-zinc-800` does not compile. If a colour is worth using, it is worth a name in the vocabulary.

### What makes it different

- **The accent is derived, not configured.** A product states one hue and the theme works out the rest, including what colour text has to be to sit on top of it. A light accent takes dark glyphs, a dark one white - checked against every colour in the line rather than left to each product to get right.
- **The greys belong to the product.** They carry a trace of its hue, so the chrome of one product is not the chrome of another with a different button colour.
- **Contrast is a test, not an intention.** Every accent of the line is measured against WCAG AA in CI, in both themes, as a fill and as text.
- **The scales were read, not invented.** Radius, type, elevation and stacking order come from what the line's products already draw, so existing code fits them - and the places where those products disagreed with themselves are settled rather than preserved.

The same vocabulary also ships as [DTCG](https://www.designtokens.org/tr/2025.10/format/) JSON at `dowel-ui/tokens.json`, generated from the stylesheet so the two cannot drift.

A product of the line states one thing about its appearance - which product it is:

```css
@import 'dowel-ui/theme.css';
@import 'dowel-ui/accents/kilna.css';
```

Or copy the files in instead of depending on the package:

```bash
npx shadcn@latest add https://lacodda.github.io/dowel/r/theme.json
```

Full vocabulary, shown rather than tabulated: **[colours](https://lacodda.github.io/dowel/reference/tokens/)** in both themes, **[the scales](https://lacodda.github.io/dowel/reference/scales/)** - radius, type, motion, elevation and stacking order - and **[the accents](https://lacodda.github.io/dowel/reference/accents/)**, where the same screen is drawn in every colour of the line.

## Roadmap

Development goes in versions; each one is a single coherent theme, and ends in a release.

| | Delivers |
| --- | --- |
| **0.1 - 0.3** | The vocabulary: colours and modes, scales and motion, the accents of the line |
| **0.4 - 0.7** | The primitive pipeline, the base components, the first consumer, the quality gates |
| **0.8 - 0.11** | Overlays, menus and selection, the command palette, feedback |
| **0.12 - 0.15** | The registry as a product, AI-readiness, migration tooling, the second consumer |
| **0.16 - 0.24** | Forms, data and charts |
| **0.25 - 0.33** | Frame and navigation, blocks, resilience and docs |
| **1.0** | Four web products of the line on dowel; the token vocabulary and the registry format frozen |

## Documentation

- [Getting started](https://lacodda.github.io/dowel/getting-started/)
- [Token reference](https://lacodda.github.io/dowel/reference/tokens/)

## License

MIT
