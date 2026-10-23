# ADR 0010: Contrast is a promise per pair, in two modes, and paper is the light theme

- Status: accepted
- Date: 2026-10-23

## Context

ADR 0003 made contrast a test, and the test held what it measured: the accent and its glyphs, and `text` and `dim` against the two opaque grounds. Everything else was outside it, and the browser axe run over the stand (v0.37) found what was outside: 36 items with text below AA in one theme or both.

Most of it was one token. `faint` was held to 3:1 "for marks you find when you look for them", and the set used it as text 53 times - captions, counts, units, dates - at 10 to 12px, where WCAG asks 4.5:1. The rest was pairs nobody had measured: a status word on its own soft fill in the light theme (3.4 to 3.7:1), a dark accent as a link (cobalt 3.7:1 on a raised surface) or as the word on its soft fill (3.1:1). The stand's axe run could not have found the accent cases: it only ever sees dowel's own amber.

Two adjacent orders were open: a `prefers-contrast` mode (#86) and print styles for kasl-server's reports (#87). Both change the same tokens.

## Decision

**Contrast is stated as a list of pairs, and every pair is measured.** `contrastPromises(mode)` in the package names each ink, each ground it may stand on (a translucent ground laid over `bg` or `raise`), and the WCAG level it is held to. The palette gate resolves the theme in a browser for every product of the line, in both themes and both modes, and measures every pair. The floor of a pair is WCAG's rule for its kind at a type step, asked at every step of the scale; the scale stops at 21px and 600, so every text floor comes out at the small-text figure.

**Three inks, all text.** `faint` clears AA on the neutral grounds (`bg`, `raise`, `soft`, `softer`) for every accent; `dim` sits half again above it. `faint` is not promised on tinted fills (`accent-soft`, a status's soft fill): there the quiet ink is `dim`. A class-list gate holds the set to the list: an ink and a fill named on one element must be a promised pair.

**The accent is lifted where it is too dark to read.** The dark theme draws the accent at `max(l, 0.72)` in OKLCH, so it is the registry's colour when that is light enough and the same hue and chroma at the floor when it is not. The light theme's pin moves from 0.5 to 0.48.

**More contrast is a mode with numbers.** Under `prefers-contrast: more`, or the `contrast-more` class, `text` and `dim` clear AAA on every ground, `faint` clears AA on the tinted fills too, and the hairlines clear 3:1 as boundaries (WCAG 1.4.11). It is written once for both themes, as mixes of the theme's own `--text` and `--bg`. `contrast-normal` pins it off, the way `.dark` pins the theme against the system.

**Paper is the light theme.** Under `@media print` every root - pinned dark or not - takes the light theme's values, with the paper's white for `bg` and no shadows, and `print-color-adjust: exact`, because a chart's bars are fills a browser drops to save ink. The frame lets go of its height, the chrome is left off, and a panel or a chart keeps to one sheet.

## Consequences

- Every product's screens change: quieter text is less quiet, the light theme's statuses are darker, and sixteen of nineteen accents are lighter in the dark theme. The registry's colours are unchanged; the theme draws them legibly.
- An ink on two translucent layers is a pair no promise covers. The set does not stack them (a soft button on a tinted banner, a soft row on a soft surface), and the docs say so.
- The light theme is declared three times - for the system, for the class, for print - and the tests hold the copies to each other value for value. Rewriting the theme on `light-dark()` would remove the copies; it was rejected while relative colour over a `light-dark()` origin and `contrast-color()` are not dependable, and while three tools read the blocks by selector.
- `forced-colors` (Windows contrast themes) is a different mode - the system replaces the palette - and is not covered here.
