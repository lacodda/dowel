---
title: Getting Started
description: Install the dowel theme and give a product its own accent.
---

dowel ships in two parts: the **theme** as an npm package, and **primitives** as
a shadcn-compatible registry. The theme is here now; the registry follows.

## Install the theme

```console
$ pnpm add dowel
```

```css
/* src/styles.css */
@import 'tailwindcss';
@import 'dowel/theme.css';
```

That is a working theme: the vocabulary of the line, in dark and light, with
dowel's own amber as the accent.

## Make it the product's

A product states one colour — its own, from the line's registry of marks — and
the theme derives the rest:

```css
@import 'dowel/theme.css';

:root {
  --accent-base: #d9569e;
}
```

This moves the accent and its hover partner, the accent's soft fill, the focus
ring, and the tint the greys carry. It also settles what colour text has to be
on top of an accent fill, which is the part products usually get wrong: a light
accent takes dark glyphs, a dark one takes white, and `--on-accent` works that
out rather than asking.

If the chrome should stay neutral instead of leaning towards the product's hue,
point the neutrals somewhere else:

```css
:root {
  --accent-base: #d9569e;
  --neutral-base: #8e8e93;
}
```

## Themes

Dark is the default. Without a class on the root element the reader's operating
system decides; a class pins it.

```html
<html>                <!-- follows the operating system -->
<html class="light">  <!-- pinned light -->
<html class="dark">   <!-- pinned dark -->
```

A component never uses a `dark:` utility. Every colour goes through a token, and
the theme swaps the token underneath — which is what lets a product be checked
against a mockup in the mockup's own words.

## Use the tokens

With Tailwind 4 they are utilities, because the theme declares them in a
`@theme` block:

```html
<div class="bg-raise text-text border border-line">
  <button class="bg-accent text-on-accent">Save</button>
</div>
```

Outside Tailwind they are ordinary custom properties:

```css
.thing {
  background: var(--raise);
  border: 1px solid var(--line);
  color: var(--text);
}
```

The stock Tailwind palette is dropped on purpose, so `bg-zinc-800` does not
compile. See the [token reference](/dowel/reference/tokens/) for the whole
vocabulary, shown in both themes.

## Primitives

Primitives arrive with v0.4.0, copied into your project rather than imported:

```console
$ npx shadcn add https://lacodda.github.io/dowel/r/button.json
```

The component lands in `components/ui/` and is yours to edit.
