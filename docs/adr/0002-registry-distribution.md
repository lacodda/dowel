# ADR 0002: Primitives ship through a shadcn-compatible registry; the theme through npm

- Status: accepted
- Date: 2026-08-28

## Context

A component library can be consumed as a dependency (import from a package) or as source (copy into the project). The products of the line already use the shadcn CLI, which copies components into `components/ui/` from a registry described by `registry.json`; the same format is read by AI tooling to generate new components against an existing schema.

The theme is different: it must change centrally - a token adjustment has to reach every product with one version bump.

## Decision

- Primitives are published as a shadcn-compatible registry hosted on the docs site. `npx shadcn add <registry-url>/<component>` copies the component into the consumer, where it becomes the code of the consumer.
- The theme, the `cn` helper and anything that must update centrally ship in the npm package `dowel`.
- The registry and the package are built from the same sources in this repository and released together under one version.

## Consequences

- A consumer can edit a primitive locally without forking the system; upgrades to a primitive are opt-in per component.
- The registry format and the token vocabulary are the public contract; both freeze at 1.0.
- The docs site is part of the release path: if it is down, `shadcn add` fails. The release gate checks that the registry answers at its URL.
