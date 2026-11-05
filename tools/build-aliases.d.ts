/*
 * What the alias generator exports for the gates to use - a declaration for the
 * reason `build-llms.d.ts` gives.
 */
declare module '*/build-aliases.mjs' {
  import type { Deprecation } from '../packages/dowel/src/deprecated'

  export function withoutAliases(theme: string): string
  export function namesInTokensJson(theme: string): Set<string>
  export function aliasBlock(rows: readonly Deprecation[], theme: string): string
  export function withAliases(rows: readonly Deprecation[], theme: string): string
  export function aliasItem(row: Deprecation, base: string): Record<string, unknown>
  export function itemRows(rows: readonly Deprecation[]): Deprecation[]
}
