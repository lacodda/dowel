/*
 * The accessibility report, read for the documentation.
 *
 * One file per item of the stand, written by a browser walking it
 * (`tests/visual/a11y.spec.ts`); gathered here so the reference page and the
 * foot of each component page read the same thing.
 */
import { KNOWN, PAGE_RULES, STANDARD, type ItemReport } from '../../../tools/accessibility-report'

const files = import.meta.glob<ItemReport>('../data/accessibility/*.json', { eager: true, import: 'default' })

/** Every item's report, by the item's name. */
export const reports: ReadonlyMap<string, ItemReport> = new Map(
  Object.entries(files)
    .map(([path, report]) => [path.replace(/^.*\/([^/]+)\.json$/, '$1'), report] as const)
    .sort(([a], [b]) => a.localeCompare(b)),
)

export { KNOWN, PAGE_RULES, STANDARD }

/** The rules that applied to an item in either theme, and passed in both. */
export function passedIn(report: ItemReport): string[] {
  const failed = new Set([...report.dark.violations, ...report.light.violations].map((violation) => violation.rule))
  return [...new Set([...report.dark.passes, ...report.light.passes])].filter((rule) => !failed.has(rule)).sort()
}

/** What axe could not decide for an item, in either theme. */
export function undecidedIn(report: ItemReport): string[] {
  return [...new Set([...report.dark.incomplete, ...report.light.incomplete])].sort()
}

/** What is still owed for an item, by rule, with the reason. */
export function owedBy(name: string) {
  return KNOWN.filter((debt) => debt.items.includes(name))
}

/** Every rule that applied anywhere, with what it asks and the criteria it
 * checks. */
export function allRules(): Map<string, { help: string; criteria: string[] }> {
  const rules = new Map<string, { help: string; criteria: string[] }>()
  for (const report of reports.values()) for (const [id, rule] of Object.entries(report.rules)) rules.set(id, rule)
  return new Map([...rules].sort(([a], [b]) => a.localeCompare(b)))
}

/** The version of axe the report was written by. */
export function axeVersion(): string {
  return reports.values().next().value?.axe ?? ''
}

/** A reason as the page draws it: the parts in backticks are code, as they
 * would be in the Markdown the same sentence is written for. */
export function partsOf(text: string): { code: boolean; text: string }[] {
  return text.split('`').map((part, at) => ({ code: at % 2 === 1, text: part }))
}
