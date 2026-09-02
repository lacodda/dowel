# Working on the UI of this project

This project's interface is built on [dowel](https://lacodda.github.io/dowel),
the lacodda line design system. What follows is what an agent — or a person new
to the codebase — has to know before touching a component.

## Where the components come from

They were **copied in**, not installed. `npx shadcn add <url>` writes a file
into `components/ui/` and from that moment it belongs to this project.

- Editing one is normal. It is this project's file.
- Re-running `add` for a component **overwrites it, edits included**. There is
  no merge. Before re-adding, check whether the local copy was changed.
- Adding a new one: `npx shadcn@latest add https://lacodda.github.io/dowel/r/<name>.json`

The catalogue of what exists is at
[`/r/registry.json`](https://lacodda.github.io/dowel/r/registry.json), and also
offline at `node_modules/dowel-ui/registry.json` — the version this project
actually has. Check there before writing a component from scratch.

## The rules that are not negotiable here

**No colour is ever written down.** Not a hex, not `rgb()`, not a stock Tailwind
colour like `zinc-800`, not `bg-white`. Every colour goes through a token:
`bg-bg`, `bg-raise`, `text-text`, `text-dim`, `border-line`, `bg-accent`,
`text-on-accent`. The full vocabulary:
<https://lacodda.github.io/dowel/reference/tokens/>

**No `dark:` utility.** A component does not know which theme it is in — the
theme swaps the token underneath. A `dark:` in a component means a token is
missing; that is the thing to fix.

*(A translucent black or white is not a colour but a veil: `bg-black/50` over an
image is fine.)*

**No native `<select>`.** Use the `Select` or `Combobox` component. The browser
draws a native select's popup in the operating system's own chrome, where no
stylesheet reaches.

Both rules are enforced by ESLint (`dowel-ui/eslint`), so a violation fails the
lint, not a review.

## The theme

One import, plus this product's own colour:

```css
@import 'tailwindcss';
@import 'dowel-ui/theme.css';
@import 'dowel-ui/accents/<product>.css';
```

Everything else is derived from that one accent — the hover shade, the soft
fill, the focus ring, and what colour text has to be on an accent fill. **Do not
override a derived token** (`--on-accent` especially): it is calculated for
contrast, and setting it by hand is how unreadable buttons ship.

## Where to look things up

- Components, one page each: <https://lacodda.github.io/dowel/components/button/>
- Every component live, in both themes: <https://lacodda.github.io/dowel/stand/>
- The words this system uses: <https://lacodda.github.io/dowel/concepts/vocabulary/>
- Mistakes that are actually made against it: <https://lacodda.github.io/dowel/concepts/anti-patterns/>
- For a machine reader: <https://lacodda.github.io/dowel/llms.txt>, and any page
  as Markdown by appending `.md` to its URL.

## What to do when a component does not fit

In order:

1. **Check its parts.** dowel exposes them (`DialogPopup`, `DialogTitle`,
   `DialogActions`) rather than hiding them behind props. Most "it does not fit"
   is a part that was not reached for.
2. **Wrap it.** A local wrapper that fixes this product's conventions around a
   dowel component keeps the component upgradable.
3. **Edit the copy.** It is this project's file. Note that the next `add` will
   overwrite it.

Writing a second component that does the same thing is the option that costs
later, and it is the one that happens by default.
