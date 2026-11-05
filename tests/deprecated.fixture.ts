import type { Deprecation } from '../packages/dowel/src/deprecated'

/*
 * A rename of every shape the mechanism carries, against real names of the theme.
 *
 * The table is empty until something is renamed, and a mechanism that first runs
 * on the day it is needed has not been tested. So the whole path - the alias in
 * the theme, the compiler, the browser, the palettes, the Rust module, the report
 * and the rewrite - runs on these, every time.
 */

const dates = { since: '1.1.0', removeIn: '2.0.0' } as const

export const RENAMED: readonly Deprecation[] = [
  // A colour: its custom property and its utilities.
  { kind: 'token', from: 'was-raise', to: 'raise', ...dates },
  // A custom property outside every namespace of the compiler.
  { kind: 'token', from: 'was-row', to: 'row-control', ...dates },
  // A token in a namespace, whose utility follows it.
  { kind: 'token', from: 'spacing-was-rail', to: 'spacing-rail', ...dates },
  { kind: 'utility', from: 'w-was-rail', to: 'w-rail', ...dates },
  // A utility the theme writes by hand.
  { kind: 'utility', from: 'h-was-control', to: 'h-control', ...dates },
  // An entry of the registry.
  { kind: 'item', from: 'was-button', to: 'button', ...dates },
]
