/*
 * What the shard dealer exports, for its gate - a declaration for the reason
 * `build-llms.d.ts` gives.
 */
declare module '*/mutation-shard.mjs' {
  export function mutable(): string[]
  export function shard(files: readonly string[], index: number, count: number): string[]
}
