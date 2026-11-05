/*
 * What the token generators export for the gates to use - a declaration for
 * the reason `build-llms.d.ts` gives.
 */
declare module '*/tokens/palettes.mjs' {
  import type { Deprecation } from '../packages/dowel/src/deprecated'
  import type { LineProduct } from '../packages/dowel/src/line'

  export interface Palette {
    color: Record<string, Record<string, { $value: string; $deprecated?: string }>>
  }

  export function palettes(
    css: string,
    products: readonly LineProduct[],
    version: string,
    rows?: readonly Deprecation[],
  ): Promise<Record<string, Palette>>
}

declare module '*/tokens/scales.mjs' {
  export function scales(css: string): Record<string, Record<string, unknown>>
}

declare module '*/tokens/rust.mjs' {
  import type { LineProduct } from '../packages/dowel/src/line'

  export function rustModule(options: {
    product: LineProduct | undefined
    palette: { color: Record<string, Record<string, { $value: string; $deprecated?: string }>> }
    tokens: Record<string, Record<string, unknown>>
    version: string
  }): string
}
