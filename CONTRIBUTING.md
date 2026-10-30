# Contributing to dowel

What it takes to work on the set itself: the tools, the gate, and what a
component is made of. Using dowel in a product is the
[documentation](https://lacodda.github.io/dowel/)'s subject, not this file's.

## Setting up

- **Node 22**, at least 22.23.4 - the documentation site's Astro asks for it, and raises the floor by patch releases.
- **pnpm 10**, through corepack: `corepack enable`. The version is pinned in
  `package.json`; pnpm 11 does not install on Windows.

```console
$ pnpm install
$ pnpm --dir docs install    # the site is outside the workspace
```

## The gate

```console
$ pnpm lint && pnpm typecheck && pnpm test && pnpm build
$ pnpm --dir docs build
```

Red stops a commit. Two more checks need a browser and run in CI on every push:

```console
$ pnpm stand:build
$ pnpm visual                                         # pictures, measures, the keyboard
$ pnpm exec playwright test tests/visual/a11y.spec.ts # the accessibility report
```

And one runs weekly, because it is long: mutation testing, which changes the
code one small way at a time and checks that some test notices. Each file has
a floor under its score in `tests/mutation-floor.json`.

```console
$ pnpm mutate --mutate registry/ui/<name>.tsx   # one file, a few minutes
$ node tools/mutation-floor.mjs                 # every file at its floor?
```

The pictures are compared on Linux only - the theme uses the system's own
typeface, so a picture from Windows never equals one from Linux. New or changed
baselines, and the accessibility report of a new item, are recorded in CI: run
the `ci` workflow with `update_snapshots` and commit what it hands back.

What every gate is there to catch is on
[What a component has to pass](https://lacodda.github.io/dowel/guides/gates/).

## Adding a component

A primitive is four things, in one commit: the component, written on the
tokens; a test; a page in the documentation; and a section on the stand. The
registry entry is the fifth, and nobody writes it - it is generated from the
source.

1. **`pnpm new-component <name>`** writes `registry/ui/<name>.tsx`, its test and
   its page, already passing the gates.
2. **Say what it is for** in the block comment at the top. The registry reads
   that paragraph as the component's description.
3. **Hold the rules the gates hold.** Every colour through a token, and no
   `dark:`. No words of its own: anything a reader sees or hears arrives
   through a prop, and a prop that names something for a screen reader has no
   default. Sizes from the scale, durations from the three motion steps, a
   pointer target of at least 24px, a heading at the `level` the page gives
   it. Every class has to compile to something.
4. **Make the test say what would be wrong** if the component broke - then cut
   the line it is about and watch it go red. A green test that stays green
   with the code removed is not a test. `pnpm mutate --mutate
   registry/ui/<name>.tsx` does the cutting for every line; read what
   survived, kill it with a test or say in the code why it may live, and
   write the component's floor with `node tools/mutation-floor.mjs --raise`.
   If it opens over the page, give it a block in
   `tests/visual/keyboard.spec.ts`.
5. **Give it a section on the stand** - `stand/src/App.tsx`, or a file in
   `stand/src/sections/` - and add its id to `tests/visual/sections.ts`, the
   list the pictures and the accessibility report both walk.
6. **Mind the budget.** A component has a size ceiling and a declared list of
   what it imports (`tests/budget.test.ts`). A new dependency is a cost every
   product pays; raise either one with a reason, or split the component.
7. **`pnpm build`** regenerates the registry, its snapshot, the history and the
   machine-readable docs. Commit them with the component.

A component is not done when the gate is green. It is done when a product of
the line has installed it from the published registry and put it on a screen.

## Changing one

A change that breaks a product is a `!` commit with a `BREAKING CHANGE:`
paragraph that says the way through - the old call and the new one. That
paragraph is what the [upgrading guide](https://lacodda.github.io/dowel/guides/upgrading/)
shows, so write it for the person upgrading. Renaming a token is decided before
it is done; before 1.0 it ships with that paragraph, after 1.0 it is a major
release.

Nothing private goes in: the stand, the demo, fixtures and examples are drawn
from the invented world in `fixtures/world.ts`, and `tests/redakt.test.ts`
reads every tracked file for addresses, home paths and machine names.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), in English. The
changelog is written from them by git-cliff, and each component's page lists
the commits that touched its file - so the subject line is read by people
choosing whether to upgrade.
