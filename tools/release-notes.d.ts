/*
 * What the release-notes generator exports for its gate - a declaration for
 * the reason `build-llms.d.ts` gives.
 */
declare module '*/release-notes.mjs' {
  import type { History } from '*/build-history.mjs'

  export const REPOSITORY: string
  export const STAND: string
  export const LIMIT: number

  export interface ReleaseInputs {
    history: History
    titles: Map<string, string>
    baselines: Set<string>
  }

  export function screensSection(options: ReleaseInputs & { tag: string; limit?: number }): string
  export function readInputs(root?: string): ReleaseInputs
}
