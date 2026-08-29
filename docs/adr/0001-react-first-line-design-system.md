# ADR 0001: A React-first design system for the line, not a cross-framework core

- Status: accepted
- Date: 2026-08-28

## Context

dowel is the third attempt at a shared component base for the products of the line. The two previous ones (2024 and 2025) were built around a framework-agnostic core - TypeScript classes computing class-name strings - with thin adapters for Vue, Svelte and React. Both stopped at 5-14 components.

The shared core shared only the cheap part of a component: the class string. Focus management, keyboard handling, ARIA, portals and positioning lived in the adapters and were written three times. Meanwhile every web product in the line runs React 19, Vite 8 and Tailwind 4 with the shadcn pattern (Radix + cva + tailwind-merge), two of them already share an identical token vocabulary by copy-paste, and there are no Vue or Svelte consumers.

## Decision

dowel is a design system for the line, React-first:

- the theme (tokens as CSS custom properties, plus a Tailwind `@theme` block) is framework-free by construction;
- primitives are React components in the shadcn pattern - behaviour from Radix, variants through `cva`, every colour through a token, no `dark:` utilities;
- the token vocabulary is the one two products already speak (`bg / raise / line / text / dim / accent / good / warn / bad / info`), not the stock shadcn palette; the accent is the brand colour of the product;
- ports to other frameworks (Vue via Reka UI, Svelte via Bits UI) stay possible because tokens and behaviour contracts are framework-neutral, and are built only when a consumer exists.

## Consequences

- One implementation per component instead of three; the effort goes into behaviour and accessibility rather than adapters.
- A product on Vue or Svelte would get the theme immediately and the primitives only after a port - an explicit, priced decision rather than an implied promise.
- Renaming a token is a breaking change once 1.0 freezes the vocabulary.
