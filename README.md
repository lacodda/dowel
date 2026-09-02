<p align="center">
  <img src="https://raw.githubusercontent.com/lacodda/dowel/main/assets/banner.svg" width="720" alt="dowel">
</p>

# dowel

The lacodda line design system: theme tokens and React primitives, distributed as a shadcn-compatible registry.

A dowel is the hidden peg that joins two boards so the seam does not show. That is what this does for the products of the line: they look made by one hand, and nobody sees the joint.

**[Documentation](https://lacodda.github.io/dowel/)** — what everything is and why it is that way.
**[The stand](https://lacodda.github.io/dowel/stand/)** — every component, live, in either theme and in the accent of any product of the line.

**Status:** v0.11.1 - the theme, the scales, an accent per product, twenty-six components - overlays, menus, the command palette and the three ways of saying something happened - and the gates each one passes: axe, the keyboard, a dependency budget and a picture in both themes. The first product of the line lives on it. See the [roadmap](#roadmap).

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

## Primitives

Components are copied into your project rather than imported, so they become
your code:

```bash
npx shadcn@latest add https://lacodda.github.io/dowel/r/button.json
```

Or the set a product usually starts from, in one command - `app`, `forms` and
`feedback` are three sets read off what the line's products converged on:

```bash
npx shadcn@latest add https://lacodda.github.io/dowel/r/app.json
```

A set carries no files of its own: it resolves into the same per-component
installs you could have typed, so nothing of it survives in your project and
there is no membership to leave. Each minor of the registry is also served
frozen at `r/v0.12/…`, for an install that has to be repeatable - inside a
snapshot the cross-references point into the same snapshot, so a component and
the sibling it reuses are the pair that shipped together. See
[installing from the registry](https://lacodda.github.io/dowel/guides/registry/).

Twenty-six of them so far. The everyday ones - Button, Input, Textarea, Panel,
Badge, Chip, Kbd, Spinner, Truncate and Copyable; the six that float above the
page - Dialog, ConfirmDialog, Drawer, Popover, PreviewCard and Tooltip; four
for choosing something - Menu, ContextMenu, Select and Combobox; three for
finding it - SearchField, CommandPalette and the `useShortcut` behind them; and
three for saying that something happened: Toast, Alert and Banner.

Those last three are the ones products keep confusing, so each page names all
four options: a **toast** goes away, an **alert** is still true after a reload,
a **banner** is true on every screen, and anything that needs an answer is a
**dialog**.

The palette is a Combobox rather than a Dialog with a field in it, which is
Base UI's own arrangement: put the input inside the popup and the popup becomes
a dialog on its own, with the input still the combobox that owns the list. So
the filtering, the highlight and the arrow keys are the ones Combobox already
has - there is no second implementation of any of it.

`Select` is the one the line's oldest rule is about. It renders
`<button role="combobox">` and no native `<select>` at all - the browser draws
that popup in the operating system's own chrome, where no stylesheet reaches
it, and on a screen of the product's own controls it reads as a foreign object.
`multiple` is a prop on Select and on Combobox rather than a component of its
own.

The overlays are built on [Base UI](https://base-ui.com), which supplies the
part that is genuinely hard and invisible when it works: the focus trap, the
return of focus to whatever opened the thing, `Escape`, the scroll lock, and
the `aria-labelledby` that names a popup by its own title. Choosing between
them is the harder question, and [a guide](https://lacodda.github.io/dowel/guides/overlays/) covers it.

Each is written in the vocabulary - no raw colours, no `dark:` utilities - so
the same component is correct in both themes and in every product's accent.
Every one of them is on [the stand](https://lacodda.github.io/dowel/stand/), live - change the theme and the accent and watch what follows.

That convention is a lint rule, and it ships with the package:

```js
// eslint.config.js
import dowel from 'dowel-ui/eslint'

export default [...dowel.configs.recommended]
```

Two rules come with it. One reports a hex, an `rgb()`, a stock Tailwind colour,
`bg-white` and any `dark:` utility, in the file that wrote one. The other
forbids the native `<select>`, whose popup the browser draws in the operating
system's own chrome where no CSS reaches it - see [the guide](https://lacodda.github.io/dowel/guides/linting/).

Every primitive also runs a gate of its own before it ships: axe over the
rendered DOM in every variant, the keyboard over every interactive one, a
declared budget for what it may import, a picture of it in both themes compared
against a baseline, and a check that it carries no word of its own to translate
- [what a component has to pass](https://lacodda.github.io/dowel/guides/gates/).

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

- [The stand](https://lacodda.github.io/dowel/stand/) - every component, live
- [Getting started](https://lacodda.github.io/dowel/getting-started/), [the lint rules](https://lacodda.github.io/dowel/guides/linting/) and [what a component has to pass](https://lacodda.github.io/dowel/guides/gates/)
- [Components](https://lacodda.github.io/dowel/components/button/)
- [Tokens](https://lacodda.github.io/dowel/reference/tokens/), [scales](https://lacodda.github.io/dowel/reference/scales/) and [accents](https://lacodda.github.io/dowel/reference/accents/)

## License

MIT
