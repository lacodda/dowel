<p align="center">
  <img src="https://raw.githubusercontent.com/lacodda/dowel/main/assets/banner.svg" width="720" alt="dowel">
</p>

# dowel

The design system of the lacodda product line: one theme, one vocabulary of tokens, and a set of React primitives that every web product in the line is built from. A dowel is the hidden peg that joins two boards so the seam does not show - this is what the system does for the products: they look made by one hand, and nobody sees the joint.

**Status:** founded 2026-08-28; v0.1.0 (theme and tokens) is the first release. Until then this repository is a scaffold.

## What it will be

- **Theme** - `dowel/theme.css`: the token vocabulary of the line (`bg`, `raise`, `line`, `text`, `dim`, `accent`, `good`, `warn`, `bad`, `info` and their soft variants) in dark and light, with the accent taken from the brand color of the product. Also exposed as a Tailwind 4 `@theme` block.
- **Primitives** - React components in the shadcn pattern (Radix behaviour, `cva` variants, `cn`), written on the tokens of the line rather than the stock palette.
- **Registry** - a shadcn-compatible registry: a component is copied into your project with `npx shadcn add <url>` and becomes your code; the theme is imported and updated.

## Roadmap to 1.0

| Version | Delivers |
| --- | --- |
| 0.1 | Theme and tokens, docs site, CI, npm |
| 0.2 | Button, Input, Panel, Badge; the registry; first consumer |
| 0.3 | Dialog, Popover, Tooltip, PopoverSelect |
| 0.4 | Registry as a product: `init`, `llms.txt`, migration guide from stock shadcn |
| 0.5 - 0.9 | Forms and data, charts, states, layout, accessibility |
| 1.0 | All four web products of the line run on dowel; tokens and registry format frozen |

## License

MIT
