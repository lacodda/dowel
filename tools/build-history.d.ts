/*
 * What the history generator exports for the gates to use - a declaration
 * for the reason `build-llms.d.ts` gives.
 */
declare module '*/build-history.mjs' {
  export interface Change {
    type: string
    scope: string | null
    breaking: boolean
    summary: string
    date: string
    commit: string
  }

  export interface Release {
    version: string
    changes: Change[]
  }

  export type History = Record<string, Release[]>

  export function itemOf(path: string): string | null
  export function parseSubject(subject: string): Pick<Change, 'type' | 'scope' | 'breaking' | 'summary'>
  export function buildHistory(root?: string): History
  export function serialize(history: History): string
}
