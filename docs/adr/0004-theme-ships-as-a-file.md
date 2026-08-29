# ADR 0004: The theme ships through the registry as a file, not as `cssVars`

- Status: accepted
- Date: 2026-08-29

## Context

A shadcn-compatible registry item can carry a theme two ways. `cssVars` is the one that looks intended for it: three groups (`theme`, `light`, `dark`), and the CLI merges them into whatever the project already has. `files` is the general escape hatch - the item carries a file, the CLI writes it.

The schema is specific about `cssVars`: every value is a plain string, one level deep, no nesting. That fits a palette of hex values. It does not fit this theme, which is:

- `color-mix()` and `oklch(from …)` expressions over a value the *product* supplies, not values known at publish time;
- a Tailwind `@theme` block, including `--color-*: initial` to drop the stock palette;
- two `prefers-color-scheme` blocks that must stay identical to each other;
- a `prefers-reduced-motion` block, and the scrollbar rules.

`cssVars.theme` maps onto `@theme`, but the media queries and the base layer have no home there at all - they would have to move into `css`, which is a separate structure with separate semantics. The theme would arrive as three fragments reassembled by someone else's merge logic.

There is also a documentation gap worth recording: `@media (prefers-reduced-motion)` appears nowhere in shadcn's registry examples. The schema permits it structurally, but "the schema allows it" and "the CLI writes it out correctly" are different claims.

## Decision

The theme ships as a single file, carried in `files[].content` and written to `~/dowel/theme.css`.

The style item sets `extends: "none"`. dowel is not shadcn/ui with different colours: it drops the stock palette deliberately, and inheriting the defaults would restore exactly what the theme removes.

Accents are separate items, one per product, and they declare **no** `registryDependencies`. Naming the theme there was the first thing written and wrong twice: it made installing an accent re-install a theme the project may already have edited - the point of a registry is that the copied file becomes yours - and it pinned an absolute production URL, which does not resolve while the site is being served anywhere else.

## Consequences

- What a consumer installs is byte-identical to what this repository tests. Verified by running `shadcn add` against the served registry into a clean project and comparing.
- The theme does not merge with a project's existing variables. For a design system that defines the whole vocabulary this is the point, but a project already on shadcn's defaults must choose between the two rather than layering them.
- The registry is served from the docs site, so the documentation and the thing it documents ship together and cannot disagree about a URL.
- `registry:base` may be the better carrier later. It is what shadcn's current documentation calls "entire design systems", it is what `init` is being built around, and `registry:style` now gets one line in the field reference with `extends` undocumented. Revisit when primitives land and the registry has components to configure - that is the point at which a base's `config` earns its place.
