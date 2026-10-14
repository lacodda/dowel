import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SECTIONS } from './visual/sections'
import { KNOWN, PAGE_RULES, REPORT_DIR, criteriaOf, type ItemReport } from '../docs/src/lib/accessibility-report'

/*
 * The accessibility report the documentation draws, held between runs.
 *
 * The report is written by a browser walking the stand (`tests/visual/a11y.spec.ts`),
 * which needs a built stand and runs in CI. What can be held without one is
 * held here, on every `pnpm test`: that every item of the stand has a report,
 * that it was written by the axe this repository has, and that the debt list
 * and the reports agree - so an item added without a report, an axe upgrade
 * without a new run, and a fixed violation still listed as owed all fail
 * before anything is published.
 */

const root = resolve(import.meta.dirname, '..')
const dir = resolve(root, REPORT_DIR)
const require = createRequire(import.meta.url)
const axeVersion: string = JSON.parse(readFileSync(require.resolve('axe-core/package.json'), 'utf8')).version

const reports = new Map<string, ItemReport>(
  existsSync(dir)
    ? readdirSync(dir)
        .filter((file) => file.endsWith('.json'))
        .map((file) => [file.replace(/\.json$/, ''), JSON.parse(readFileSync(resolve(dir, file), 'utf8')) as ItemReport])
    : [],
)

const both = (report: ItemReport) => [report.dark, report.light]

describe('the accessibility report', () => {
  it('has an item for every section of the stand, and none for anything else', () => {
    expect([...reports.keys()].sort()).toEqual([...SECTIONS].sort())
  })

  it('was written by the axe this repository has', () => {
    const stale = [...reports].filter(([, report]) => report.axe !== axeVersion).map(([id]) => id)
    expect(stale, `written by another axe - record again with \`pnpm visual:update\``).toEqual([])
  })

  it('says which rules applied, for every item in both themes', () => {
    // A report of nothing would pass everything below.
    for (const [id, report] of reports) {
      for (const result of both(report)) expect(result.passes.length, id).toBeGreaterThan(0)
    }
  })

  it('names every rule it lists, with the criteria it checks', () => {
    for (const [id, report] of reports) {
      for (const result of both(report)) {
        for (const rule of [...result.passes, ...result.incomplete, ...result.violations.map((v) => v.rule)]) {
          expect(report.rules[rule], `${id}: ${rule}`).toBeDefined()
        }
      }
    }
  })

  it('has no violation that is not named as a debt', () => {
    const unowed = [...reports].flatMap(([id, report]) =>
      both(report).flatMap((result) =>
        result.violations
          .filter((violation) => !KNOWN.some((debt) => debt.rule === violation.rule && debt.items.includes(id)))
          .map((violation) => `${id}: ${violation.rule}`),
      ),
    )
    expect(unowed).toEqual([])
  })

  it('names no debt that has been paid', () => {
    // The list only shrinks: an entry the reports no longer show is taken off.
    const paid = KNOWN.flatMap((debt) =>
      debt.items
        .filter((id) => !both(reports.get(id)!).some((result) => result.violations.some((v) => v.rule === debt.rule)))
        .map((id) => `${id}: ${debt.rule}`),
    )
    expect(paid, 'fixed - take it off the list').toEqual([])
  })

  it('names a reason for every debt, and only items of the stand', () => {
    for (const debt of KNOWN) {
      expect(debt.reason.length, debt.rule).toBeGreaterThan(40)
      for (const id of debt.items) expect(SECTIONS, `${debt.rule}: ${id}`).toContain(id)
    }
  })

  it('leaves the rules about a page out, as it says', () => {
    const found = [...reports].flatMap(([id, report]) =>
      Object.keys(PAGE_RULES)
        .filter((rule) => rule in report.rules)
        .map((rule) => `${id}: ${rule}`),
    )
    expect(found).toEqual([])
  })

  it('checks contrast in a browser - the one rule the unit tests cannot run', () => {
    expect([...reports.values()].filter((report) => 'color-contrast' in report.rules).length).toBeGreaterThan(100)
  })
})

describe('criteriaOf', () => {
  it('reads a criterion of any length out of a tag, and no level', () => {
    expect(criteriaOf(['wcag2aa', 'wcag143', 'wcag1410', 'wcag2411', 'best-practice'])).toEqual(['1.4.3', '1.4.10', '2.4.11'])
  })
})

describe('the page', () => {
  it('draws the report', () => {
    const page = readFileSync(resolve(root, 'docs/src/content/docs/reference/accessibility.mdx'), 'utf8')
    expect(page).toContain('<AccessibilityReport')
  })

  it('draws an item’s own results at the foot of its page', () => {
    const content = readFileSync(resolve(root, 'docs/src/components/MarkdownContent.astro'), 'utf8')
    expect(content).toContain('<Accessibility ')
  })
})
