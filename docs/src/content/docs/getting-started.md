---
title: Getting Started
description: Install the dowel theme and add primitives from the registry.
---

dowel ships in two parts: the **theme** as an npm package, and **primitives** as a shadcn-compatible registry.

## Theme

```console
$ pnpm add dowel
```

```css
/* src/styles.css */
@import "tailwindcss";
@import "dowel/theme.css";
```

## Primitives

Coming with v0.2.0:

```console
$ npx shadcn add https://lacodda.github.io/dowel/r/button.json
```

The component lands in `components/ui/` and is yours to edit.
