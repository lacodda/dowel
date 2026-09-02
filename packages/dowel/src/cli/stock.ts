/*
 * The stock shadcn vocabulary, and what it means here.
 *
 * A product arriving at dowel almost never arrives from nothing. It arrives
 * from stock shadcn/ui, whose theme names colours by their role in a page -
 * `--background`, `--muted-foreground`, `--card` - and whose components are
 * written against those names. dowel names them by what they are on a screen
 * instead: a ground, a raised surface, dimmed ink. The two vocabularies
 * overlap almost entirely in meaning and not at all in spelling.
 *
 * So the first thing a migration needs is this table, and it has to live in
 * one place: `check` reports what it finds, `codemod` rewrites it, and the two
 * disagreeing would be worse than either alone - a report that names a
 * replacement the rewriter does not make.
 *
 * The mapping is deliberately incomplete in two directions.
 *
 * Every stock name is listed, because the point is to find all of them; but a
 * few have no honest equivalent and say so, because guessing one would put a
 * wrong colour on a screen and call the migration done. `--chart-1` is the
 * clearest case: dowel has no chart palette until the charts version, and
 * mapping it to the accent would make five series the same colour.
 *
 * And two names exist in *both* vocabularies meaning different things, which a
 * table keyed by name cannot resolve. `--accent` is stock shadcn's hover fill
 * and it is also dowel's flagship token - the product's own hue. A scanner
 * reading names alone sees no difference between a project that has not
 * migrated and one that has, so these are reported for a human to judge and
 * never rewritten.
 *
 * That distinction is not theoretical: the first live run of `check` reported
 * twenty-four violations in dowel's own stand, every one of them a correct use
 * of `--accent`, and `codemod --write` would have rewritten them to `--soft`
 * and broken a project that was already right.
 */

/** What to do with a stock name that has been found. */
export type Replacement =
  /** A straight rename: this stock name means that dowel token. */
  | { readonly kind: 'token'; readonly token: string; readonly note?: string }
  /** Stock-only, and dowel has nothing that means it yet. */
  | { readonly kind: 'unmapped'; readonly note: string }
  /** The name exists in both vocabularies. Reported with its ambiguity spelled
   * out; never rewritten, because the tool cannot tell which one it is
   * looking at and a wrong guess breaks a correct project. */
  | { readonly kind: 'ambiguous'; readonly stockMeaning: string; readonly note: string }

/*
 * The table, in the order the tokens read on a screen: grounds, then surfaces,
 * then ink, then the accent, then status, then the odd ones out.
 *
 * `--foreground` and `--background` are the pair everything else is defined
 * against in stock shadcn, and they are the pair that most often survives a
 * half-finished migration: a product swaps its components over and leaves the
 * page itself on the old names, so the screen has two grounds that agree only
 * by accident of both being near-black.
 */
export const stockTokens: Readonly<Record<string, Replacement>> = {
  background: { kind: 'token', token: 'bg' },
  foreground: { kind: 'token', token: 'text' },

  card: { kind: 'token', token: 'raise' },
  'card-foreground': { kind: 'token', token: 'text' },
  popover: { kind: 'token', token: 'raise' },
  'popover-foreground': { kind: 'token', token: 'text' },

  muted: { kind: 'token', token: 'soft' },
  'muted-foreground': { kind: 'token', token: 'dim' },

  border: { kind: 'token', token: 'line' },
  input: { kind: 'token', token: 'line' },
  ring: {
    kind: 'token',
    token: 'accent',
    note: 'dowel draws focus from the accent; there is no separate ring colour.',
  },

  primary: { kind: 'token', token: 'accent' },
  'primary-foreground': { kind: 'token', token: 'on-accent' },
  secondary: { kind: 'token', token: 'soft' },
  'secondary-foreground': { kind: 'token', token: 'text' },
  /* The collision. Both vocabularies have this name and they mean opposite
   * things: stock `--accent` is the quiet fill a row takes on hover, dowel's
   * `--accent` is the product's own colour - the loudest thing on the screen.
   * Rewriting it blindly turns every accent in a migrated project into a grey,
   * so it is reported and left alone. */
  accent: {
    kind: 'ambiguous',
    stockMeaning: 'soft',
    note: "stock `--accent` is a hover fill; dowel's `--accent` is the product's own hue. If this project has not migrated yet, it means `--soft`; if it has, it is already right.",
  },
  'accent-foreground': {
    kind: 'ambiguous',
    stockMeaning: 'text',
    note: "stock `--accent-foreground` is ink on a hover fill; dowel has `--on-accent` for ink on the accent itself. Which one this is depends on whether the project has migrated.",
  },

  destructive: { kind: 'token', token: 'bad' },
  'destructive-foreground': { kind: 'token', token: 'on-bad' },

  radius: { kind: 'token', token: 'radius-md', note: 'the control radius.' },

  'chart-1': { kind: 'unmapped', note: 'dowel has no chart palette yet; leave it until the charts version.' },
  'chart-2': { kind: 'unmapped', note: 'dowel has no chart palette yet; leave it until the charts version.' },
  'chart-3': { kind: 'unmapped', note: 'dowel has no chart palette yet; leave it until the charts version.' },
  'chart-4': { kind: 'unmapped', note: 'dowel has no chart palette yet; leave it until the charts version.' },
  'chart-5': { kind: 'unmapped', note: 'dowel has no chart palette yet; leave it until the charts version.' },

  sidebar: { kind: 'token', token: 'raise' },
  'sidebar-foreground': { kind: 'token', token: 'text' },
  'sidebar-primary': { kind: 'token', token: 'accent' },
  'sidebar-primary-foreground': { kind: 'token', token: 'on-accent' },
  'sidebar-accent': { kind: 'token', token: 'soft' },
  'sidebar-accent-foreground': { kind: 'token', token: 'text' },
  'sidebar-border': { kind: 'token', token: 'line' },
  'sidebar-ring': { kind: 'token', token: 'accent' },
}

/** The stock names, longest first.
 *
 * Order matters wherever these are matched one after another: `--sidebar` is a
 * prefix of `--sidebar-border`, and trying the short one first would rewrite
 * half of the long one and leave `-border` dangling. */
export const stockNames: readonly string[] = Object.keys(stockTokens).sort(
  (a, b) => b.length - a.length || a.localeCompare(b),
)
