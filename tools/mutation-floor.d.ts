/*
 * What the mutation floor exports, for its gate - a declaration for the
 * reason `build-llms.d.ts` gives.
 */
declare module '*/mutation-floor.mjs' {
  export function scoreOf(mutants: readonly { status: string }[]): number
  export function scores(report: { files: Record<string, { mutants: readonly { status: string }[] }> }): Record<string, number>
  export function compare(
    measured: Record<string, number>,
    floors: Record<string, number>,
  ): { under: string[]; raised: Record<string, number> }
}
