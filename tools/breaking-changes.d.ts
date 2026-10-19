/*
 * What the breaking-changes reader exports, for the gate and the docs page -
 * a declaration for the reason `build-llms.d.ts` gives.
 */
declare module '*/breaking-changes.mjs' {
  export interface Block {
    kind: 'text' | 'code'
    text: string
  }

  export interface BreakingChange {
    title: string
    blocks: Block[]
  }

  export interface BreakingRelease {
    version: string
    date: string
    changes: BreakingChange[]
  }

  export function breakingChanges(changelog: string): BreakingRelease[]

  export function breakingChangesMarkdown(releases: BreakingRelease[]): string
}
