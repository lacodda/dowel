/*
 * The one thing the generator exports for the gate to use.
 *
 * A declaration rather than `allowJs`, which would pull every tool in this
 * directory into the typecheck as inferred `any` - and rather than a `// @ts-
 * ignore` at the import, which would let the signature change underneath the
 * test without anyone noticing.
 */
declare module '*/build-llms.mjs' {
  /** Component tags left outside code in a generated Markdown page: the signal
   * that a new Astro component has no expansion rule yet. */
  export function remainingComponents(body: string): string[]
}
