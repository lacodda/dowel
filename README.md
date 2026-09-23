<p align="center">
  <img src="https://raw.githubusercontent.com/lacodda/dowel/main/assets/banner.svg" width="720" alt="dowel">
</p>

> The lacodda line design system: theme tokens and React primitives, distributed as a shadcn-compatible registry.

<p align="center">
  <a href="https://www.npmjs.com/package/dowel-ui"><img src="https://img.shields.io/npm/v/dowel-ui?style=flat-square" alt="npm"></a>
  <a href="https://github.com/lacodda/dowel/actions"><img src="https://img.shields.io/github/actions/workflow/status/lacodda/dowel/ci.yml?style=flat-square" alt="CI"></a>
  <a href="https://github.com/lacodda/dowel/blob/main/LICENSE"><img src="https://img.shields.io/github/license/lacodda/dowel?style=flat-square" alt="License"></a>
</p>

A dowel is the hidden peg that joins two boards so the seam does not show. That is what this does for the products of the line: they look made by one hand, and nobody sees the joint.

**[Documentation](https://lacodda.github.io/dowel/)** — what everything is and why it is that way.
**[The stand](https://lacodda.github.io/dowel/stand/)** — every component, live, in either theme and in the accent of any product of the line.

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

That single line moves the accent and both of its partners, the accent's soft
fill, the focus ring, the scrollbars and the tint in the greys. **The accent is
derived, not configured**: a product states one hue and the theme works out the
rest, including what colour text has to be to sit on top of it - checked
against WCAG AA in CI, in both themes. Dark is the default; light arrives with
the reader's system preference.

With Tailwind 4 the tokens are utilities, and the stock palette is dropped
deliberately, so a stray `bg-zinc-800` does not compile. If a colour is worth
using, it is worth a name in the vocabulary - a convention the package also
ships as a lint rule.

Full vocabulary, shown rather than tabulated:
**[colours](https://lacodda.github.io/dowel/reference/tokens/)** and
**[the scales](https://lacodda.github.io/dowel/reference/scales/)**.

## Primitives

Components are copied into your project rather than imported, so they become
your code:

```bash
npx shadcn@latest add https://lacodda.github.io/dowel/r/button.json
npx shadcn@latest add https://lacodda.github.io/dowel/r/app.json   # or a whole set
```

A hundred and five primitives so far - controls and forms, overlays on
[Base UI](https://base-ui.com), menus, the command palette, tables and long
lists, charts, loading and empty screens, markdown, code and diffs, a screen's
frame and how it divides, a desktop window's own chrome, and the line's marks.
Each is written in the vocabulary - no raw colours, no `dark:` utilities, no
date in the browser's language - and runs its own gate: axe, the keyboard, a
dependency budget and a picture in both themes.

The full catalogue, live: **[the stand](https://lacodda.github.io/dowel/stand/)**.
One page per component: **[components](https://lacodda.github.io/dowel/components/button/)**.
Installing, sets and frozen versions: **[the registry guide](https://lacodda.github.io/dowel/guides/registry/)**.

## Moving an existing project over

A product arriving at dowel almost never arrives from nothing - it arrives from
stock shadcn/ui, whose theme names colours by their role in a page where dowel
names them by what they are on a screen. Four commands read a project, rewrite
the names that can be rewritten, and say what is left for a person to decide:
[the migration guide](https://lacodda.github.io/dowel/guides/migration/).

## A day in the life

The shortest complete path: a new project, the theme, a component, a screen.

**Install the theme and say which product this is.** A product of the line
imports its accent; anything else sets `--accent-base` directly.

```console
$ pnpm add dowel-ui
```

```css
/* src/styles.css */
@import 'tailwindcss';
@import 'dowel-ui/theme.css';
@import 'dowel-ui/accents/kasl-server.css';
```

**Tell shadcn where components go.** One file, and the `ui` alias is the one
every dowel component targets:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "", "css": "src/styles.css", "baseColor": "neutral", "cssVariables": true },
  "aliases": { "components": "@/components", "ui": "@/components/ui", "lib": "@/lib", "utils": "@/lib/utils" }
}
```

> Copy in what the screen needs.
```console
$ npx shadcn@latest add https://lacodda.github.io/dowel/r/app.json
```

**Write the screen in the vocabulary.** No colour is written down, so this is
correct in both themes and in whatever accent the product turns out to have:

```tsx
import { Panel } from '@/components/ui/panel'
import { Button } from '@/components/ui/button'

export function SignIn() {
  return (
    <Panel className="w-80 p-5">
      <h1 className="text-lg font-semibold text-text">Sign in</h1>
      <p className="text-xs text-dim">Your team's server</p>
      <Button variant="primary" className="mt-4 w-full">Sign in</Button>
    </Panel>
  )
}
```

**Check the wiring before debugging the screen.**

```console
$ npx dowel doctor
The installation is coherent.
```

That is the whole loop, and it is the one the line's second product actually
went through. kasl-server had written its own theme first, in the same words -
`bg`, `raise`, `line`, `dim`, `accent` - so moving over deleted about a hundred
and thirty lines and changed nothing on screen except one thing it silently
fixed: the hand-written theme pinned dark ink on the accent for both themes,
which was right on gold and wrong on the darkened gold the light theme uses,
where it measured 3.49:1. Derived, it is white there, at 6.01:1.

## Status

The theme, the scales, an accent per product, and a hundred and five primitives are
in daily use across two products of the line. Every component installs from a
versioned registry and passes its own gate - axe, the keyboard, a dependency
budget, a scale that refuses a length nobody argued for, a floor under every
pointer target, and a picture in both themes - before it ships.

Released versions and what landed in each: [CHANGELOG](https://github.com/lacodda/dowel/blob/main/CHANGELOG.md).

## Documentation

- [The stand](https://lacodda.github.io/dowel/stand/) - every component, live
- [Getting started](https://lacodda.github.io/dowel/getting-started/), [the lint rules](https://lacodda.github.io/dowel/guides/linting/) and [what a component has to pass](https://lacodda.github.io/dowel/guides/gates/)
- [Moving from stock shadcn](https://lacodda.github.io/dowel/guides/migration/) - the four commands and what they refuse to do
- [Components](https://lacodda.github.io/dowel/components/button/)
- [Tokens](https://lacodda.github.io/dowel/reference/tokens/), [scales](https://lacodda.github.io/dowel/reference/scales/) and [accents](https://lacodda.github.io/dowel/reference/accents/)
- [The vocabulary](https://lacodda.github.io/dowel/concepts/vocabulary/) this system uses for its own parts, and [the mistakes](https://lacodda.github.io/dowel/concepts/anti-patterns/) that actually get made against it

## For a machine

The documentation is also served in the form an agent reads, generated from the
same sources the site is built from:

- [llms.txt](https://lacodda.github.io/dowel/llms.txt) - the index, and
  [llms-full.txt](https://lacodda.github.io/dowel/llms-full.txt) for all of it
  in one request
- any page as plain Markdown, by appending `.md` to its URL
- [a JSON Schema](https://lacodda.github.io/dowel/r/schema.json) of a registry
  item, validated against every item the registry serves
- an [`AGENTS.md`](https://lacodda.github.io/dowel/r/agents.json) a consumer
  installs like any other item, so a product on dowel can tell its own agents
  what its code cannot

## License

MIT (c) [Kirill Lakhtachev](https://lacodda.com)
