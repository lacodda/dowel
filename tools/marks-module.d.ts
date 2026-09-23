/*
 * What the marks generator exports for the gate to use - a declaration for
 * the reason `build-llms.d.ts` gives.
 */
declare module '*/marks-module.mjs' {
  /** The inner markup of every master in a directory: name -> level -> markup. */
  export function readMarks(dir: string): Record<string, Record<'L' | 'M' | 'S', string>>
  /** `packages/dowel/src/marks.ts`, as the masters in `dir` produce it. */
  export function renderMarksModule(dir: string): string
}
