/*
 * What the vocabulary record exports for the gates to use - a declaration for
 * the reason `build-llms.d.ts` gives.
 */
declare module '*/vocabulary.mjs' {
  export type Vocabulary = Record<string, string[]>

  export function surface(): Vocabulary
  export function merged(recorded: Vocabulary, live: Vocabulary): Vocabulary
  export function compare(
    recorded: Vocabulary,
    live: Vocabulary,
    deprecatedNames?: ReadonlySet<string>,
  ): { gone: string[]; unrecorded: string[] }
}
