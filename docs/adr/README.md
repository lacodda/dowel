# Architecture Decision Records

Technical decisions that shape dowel, in the order they were made. Format: Context / Decision / Consequences. A superseded ADR is never deleted - its status changes and it points to the successor.

| # | Title | Status |
| --- | --- | --- |
| [0001](0001-react-first-line-design-system.md) | A React-first design system for the line, not a cross-framework core | accepted |
| [0002](0002-registry-distribution.md) | Primitives ship through a shadcn-compatible registry; the theme through npm | accepted |
| [0003](0003-derived-accent-and-contrast.md) | The accent family is derived from one hue, and contrast is a test | accepted |
| [0004](0004-theme-ships-as-a-file.md) | The theme ships through the registry as a file, not as `cssVars` | accepted |
| [0005](0005-the-lint-rule-ships-with-the-package.md) | The lint rule ships with the package, not through the registry | accepted |
| [0006](0006-sets-and-a-pinned-registry.md) | Sets install in one command, and each minor is served frozen | accepted |
