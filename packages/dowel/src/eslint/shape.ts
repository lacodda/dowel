/*
 * What flat config reads from a plugin, written down here.
 *
 * `dowel-ui` does not depend on ESLint, not even as an optional peer. A peer is
 * resolved from the product's own tree, so a product with ESLint in its dev
 * dependencies gets an edge from `dowel-ui` to it - and `pnpm audit --prod`
 * follows that edge. A linter's whole dependency tree was reported against
 * every product of the line, for a package whose production half is a
 * stylesheet and a class joiner.
 *
 * Nothing here needs the dependency at run time: a rule is an object ESLint
 * calls, and whoever loads `dowel-ui/eslint` is already running ESLint. The
 * rules are checked against ESLint's own types as they are written
 * (`satisfies`), and what the build emits names only these shapes, so the
 * declarations resolve in a project whatever its package manager hoists.
 */

/** A rule, as a consumer's config sees it. */
export interface LintRule {
  readonly meta?: object
  // ESLint's context and listener types are the ones the rules are checked
  // against, and they cannot be named here without importing ESLint's.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(context: any): any
}

/** The rules under the name a config refers to them by. */
export interface LintPlugin {
  readonly meta: { readonly name: string }
  readonly rules: Readonly<Record<string, LintRule>>
}

/** One entry of a flat config. */
export interface LintConfig {
  files?: string[]
  ignores?: string[]
  plugins?: Record<string, LintPlugin>
  rules?: Record<string, 'error' | 'warn' | 'off'>
}
