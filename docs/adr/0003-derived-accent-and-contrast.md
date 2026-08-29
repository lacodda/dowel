# ADR 0003: The accent family is derived from one hue, and contrast is a test

- Status: accepted
- Date: 2026-08-29

## Context

Every product of the line has one colour, fixed for its lifetime, taken from the registry of marks. The theme has to turn that colour into everything accent-shaped: the accent itself, its hover partner, its soft fill, the focus ring, the tint the greys carry, and the colour of text placed on an accent fill.

The two live products did this by hand. Both wrote `--on-accent` as a literal: kilna `#fff` on magenta, kasl-server `#1a1509` on gold, each found by looking. Both darkened the accent for the light theme by a hand-picked amount.

Measuring those hand-picked values against all fourteen accents of the line showed the approach does not survive contact with the whole registry:

- White glyphs on the accent measure 2.7:1 to 3.6:1 for twelve of the fourteen. kilna ships 3.64:1 today.
- Darkening the light-theme accent by a fixed 22% suits magenta and leaves lime at 3.53:1 and gold at 3.83:1.

The failure is structural, not careless. Each product author checked one colour, in one theme, and each was individually plausible.

## Decision

The accent family is derived, and the derivation is verified against the whole registry rather than against one colour.

- A product declares `--accent-base` and nothing else. `--accent`, `--accent-2`, `--accent-soft` and the neutral tint are mixed from it.
- `--on-accent` is computed, never declared. Where `contrast-color()` exists it is used directly. Elsewhere, relative colour syntax reads the accent's own lightness and `clamp()` turns it into a switch between black and white at **0.58**.
- The light theme darkens the accent **to** a lightness (0.5, keeping hue and chroma) rather than **by** an amount.
- `contrast.test.ts` computes WCAG contrast for all fourteen accents of the line, in both themes, as a fill and as text, and reads the thresholds out of the stylesheet rather than repeating them.

The 0.58 threshold is deliberately far below the midpoint intuition suggests. Contrast is not symmetric about lightness: a mid-lightness colour is much closer to white than to black in luminance, so black wins well before the colour looks light. The consequence is that **every accent in the line takes dark glyphs**, magenta and cobalt included.

## Consequences

- A product cannot pick an accent and forget the text on top of it: the theme answers that question, and CI proves the answer for every colour the line will ever use.
- The theme depends on relative colour syntax (`oklch(from …)`). Browsers without it get no `--on-accent`; `contrast-color()` is preferred where available. Both are 2024-2025 features, and the line's products are desktop-class or evergreen-browser.
- kilna and kasl-server will change appearance when they migrate: their accent fills gain dark text. This is the fix, not a regression, and belongs to the migration versions (v0.6, v0.15).
- Adding a product to the line means adding its accent to the contrast test. A colour that cannot pass is a colour the registry should not have issued.
