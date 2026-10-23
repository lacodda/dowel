/*
 * The theme's contrast promises as rows a page draws: one row per ink and
 * level, with every ground it is held on.
 *
 * Here rather than beside the component, for the reason the accessibility
 * report gives: the Astro page and the Markdown twin both draw it, and one
 * grouping for both means the two cannot list different pairs.
 */
import { contrastFloor, contrastPromises, type ContrastMode } from '../packages/dowel/src/contrast.ts'

export interface PromiseRow {
  ink: string
  grounds: string[]
  floor: number
  /** `AA`, `AAA`, or `a boundary`. */
  held: string
  role: string
}

export function promiseRows(mode: ContrastMode): PromiseRow[] {
  const rows = new Map<string, PromiseRow>()
  for (const promise of contrastPromises(mode)) {
    const key = `${promise.ink}/${promise.level}/${promise.kind}`
    const ground = promise.over ? `${promise.ground} over ${promise.over}` : promise.ground
    const row = rows.get(key)
    if (row) row.grounds.push(ground)
    else
      rows.set(key, {
        ink: promise.ink,
        grounds: [ground],
        floor: contrastFloor(promise),
        held: promise.kind === 'boundary' ? 'a boundary' : promise.level,
        role: promise.role,
      })
  }
  return [...rows.values()]
}

/** The same rows as a Markdown table. */
export function promiseTable(mode: ContrastMode): string {
  return [
    '| Ink | On | Held to | For |',
    '| --- | --- | --- | --- |',
    ...promiseRows(mode).map(
      (row) => `| \`${row.ink}\` | ${row.grounds.map((g) => `\`${g}\``).join(', ')} | ${row.floor}:1 (${row.held}) | ${row.role} |`,
    ),
  ].join('\n')
}
