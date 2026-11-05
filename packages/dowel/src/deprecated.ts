/*
 * Names on their way out.
 *
 * From 1.0 a name in the vocabulary is a promise, and this table is the one way
 * to change one inside a major: the old name keeps working, `dowel check` says
 * it has moved, `dowel codemod` moves it, and the next major takes it away. A
 * rename that skips the table fails `tests/vocabulary.test.ts`.
 *
 * Everything reads this one list, so what the report calls renamed is what the
 * rewriter can rewrite and what the theme still answers to:
 *
 *   `tools/build-aliases.mjs`   the old name in the theme and the registry
 *   `cli/scan.ts`               the warning
 *   `cli/codemod.ts`            the rewrite
 *
 * What it cannot carry: a step of a scale or a fixed colour, which `tokens.json`
 * and the Rust modules name in their own shape. Renaming one of those is a major,
 * and the generator refuses the row rather than half-keep the promise.
 */

export interface Deprecation {
  /**
   * What is being renamed:
   *
   * - `token`, a custom property and, if it is a colour, its utilities: `--line-2`
   *   and `bg-line-2`. Written without the dashes.
   * - `utility`, one class word exactly as a product writes it: `h-control`.
   * - `item`, an entry of the registry: `tier`.
   */
  readonly kind: 'token' | 'utility' | 'item'
  /** The old name. */
  readonly from: string
  /** The name it now goes by, which has to exist. */
  readonly to: string
  /** The release that made the rename. */
  readonly since: string
  /** The major that takes the old name away. */
  readonly removeIn: string
}

/** Every name on its way out. None yet: a review of the vocabulary before 1.0
 * found nothing worth the churn, across eleven products. */
export const deprecations: readonly Deprecation[] = []

/** What a person reads about one row, wherever they meet it. */
export function deprecationNote({ kind, from, to, since, removeIn }: Deprecation): string {
  const [old, current] = kind === 'token' ? [`--${from}`, `--${to}`] : [from, to]
  return `\`${old}\` was renamed \`${current}\` in ${since}; the old name goes in ${removeIn}.`
}
