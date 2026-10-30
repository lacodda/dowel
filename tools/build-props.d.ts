/*
 * What the props reader exports, for its gate - a declaration for the reason
 * `build-llms.d.ts` gives.
 */
declare module '*/build-props.mjs' {
  export interface PropEntry {
    name: string
    type: string
    required?: boolean
    requiredWith?: string[]
    default?: string
    variant?: boolean
    inherited?: boolean
    description?: string
  }
  export interface ComponentEntry {
    name: string
    description?: string
    is?: Record<string, string>
    props?: PropEntry[]
    inherits?: Record<string, unknown>[]
  }
  export function sources(): { dir: 'ui' | 'blocks'; name: string; path: string }[]
  export function buildProps(): Record<string, { dir: 'ui' | 'blocks'; components: ComponentEntry[] }>
}
