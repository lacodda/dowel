# ADR 0005: The lint rule ships with the package, not through the registry

- Status: accepted
- Date: 2026-08-31

## Context

The whole system rests on one convention: a component names a colour from the vocabulary and never writes one down. A component that writes `#d9569e` cannot follow a product's accent; a component that writes `dark:bg-neutral-900` has decided which theme it is in, which is the theme's job.

Stated in prose, that convention survives exactly as long as everyone remembers it. As a lint rule it survives on its own - so the question was not whether to write it, but where it lives, and dowel already distributes code two ways.

The registry hands a product a **copy**: `shadcn add` writes the file into the project and it becomes the project's own code, to edit and to diverge. That is the right shape for a component, because a Button in one product legitimately grows a variant another one does not want.

The package is the opposite: one artefact, installed and upgraded, identical in every product.

## Decision

The rule ships from the package, as the subpath `dowel-ui/eslint`.

A rule is not a component. Nobody edits their copy of it, and it is not supposed to diverge - a product whose definition of "a raw colour" differs from the line's has a defect, not a preference. It should also improve for every product at once: the copy-per-product shape would have scattered on the first refinement, and the first refinement arrived the same day (translucent `bg-black/50` is a scrim, not a colour that failed to get a name).

ESLint is an **optional** peer dependency. A product that installs the theme is not made to install a linter.

The repository lints itself with the **built** plugin rather than the source, so what checks these components is the same file a consumer installs. `pnpm lint` therefore builds the package first; the config depends on a build artefact, and CI lints before it builds.

## Consequences

- A product turns the convention on with two lines in its ESLint config, and gets later refinements by upgrading the package.
- Exemptions are the consumer's to declare, and they are real: colour that is *data* (a brand registry, cover gradients, a chart palette) and tests that must write a colour to have something to check. The rule cannot tell those from styling, and guessing would be worse than saying so.
- The rule is textual - it reads string literals and template pieces, because what matters is what ends up in a `className`, and that string is assembled from literals in `cva` maps and ternaries. It never reads CSS: the theme is the one place raw colour belongs.
- A component needing a colour that has no name yet needs a **token**, not an exemption. That pressure is deliberate.
