import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import { SECTIONS } from './sections'
import { KNOWN, PAGE_RULES, REPORT_DIR, STANDARD, criteriaOf, type ItemReport, type Result } from '../../tools/accessibility-report'

/*
 * Every section of the stand, through axe, in both themes - in a browser.
 *
 * The unit tests run axe over every primitive too, in jsdom, which lays
 * nothing out and resolves no colour: contrast is off there by necessity. Here
 * it is on, against the colours the theme actually resolves to, with the
 * stand's own examples in every variant it draws.
 *
 * What comes out is the accessibility report the documentation draws - for
 * each item, which rules applied and passed, which needed a person, and the
 * violations, which have to be none. It is recorded, like the pictures, on
 * purpose (`pnpm visual:update`), one file per item so the sections can run
 * side by side; every run after compares itself with what was recorded. A
 * page claiming a result the set no longer has is the one thing this report
 * must not be.
 */

const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')
const axeVersion: string = JSON.parse(readFileSync(require.resolve('axe-core/package.json'), 'utf8')).version
const root = resolve(import.meta.dirname, '../..')

test.describe.configure({ mode: 'parallel' })

async function check(page: Page, id: string, theme: 'dark' | 'light') {
  await page.addInitScript((value) => window.localStorage.setItem('dowel.stand.theme', value), theme)
  await page.goto(`./${id}`)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('html')).toHaveClass(new RegExp(theme))
  await page.addScriptTag({ content: axeSource })
  return page.evaluate(async ({ standard, off }) => {
    const axe = (window as unknown as { axe: typeof import('axe-core') }).axe
    const run = await axe.run(document.querySelector('main [data-stand-section]')!, {
      runOnly: { type: 'tag', values: standard },
      rules: Object.fromEntries(off.map((rule) => [rule, { enabled: false }])),
      resultTypes: ['violations', 'incomplete'],
    })
    const shape = (list: typeof run.passes) =>
      list.map((rule) => ({ id: rule.id, help: rule.help, tags: rule.tags, nodes: rule.nodes.map((node) => node.target.join(' ')) }))
    return { passes: shape(run.passes), incomplete: shape(run.incomplete), violations: shape(run.violations) }
  }, { standard: [...STANDARD], off: Object.keys(PAGE_RULES) })
}

for (const id of SECTIONS) {
  test(`${id} passes axe in both themes, as its report says`, async ({ page }, info) => {
    test.setTimeout(90_000)
    // One moment for every page, as for the pictures: dates are drawn from it.
    await page.clock.setFixedTime(new Date('2026-09-09T12:00:00Z'))
    const report: ItemReport = { axe: axeVersion, rules: {}, dark: undefined!, light: undefined! }
    for (const theme of ['dark', 'light'] as const) {
      // The theme is chosen before the page loads, the way a product's own
      // choice is; the second script runs after the first and wins.
      const found = await check(page, id, theme)
      for (const rule of [...found.passes, ...found.incomplete, ...found.violations]) {
        report.rules[rule.id] = { help: rule.help, criteria: criteriaOf(rule.tags) }
      }
      const result: Result = {
        passes: found.passes.map((rule) => rule.id).sort(),
        incomplete: found.incomplete.map((rule) => rule.id).sort(),
        violations: found.violations.map((rule) => ({ rule: rule.id, nodes: rule.nodes })).sort((a, b) => a.rule.localeCompare(b.rule)),
      }
      report[theme] = result
    }
    report.rules = Object.fromEntries(Object.entries(report.rules).sort(([a], [b]) => a.localeCompare(b)))

    const path = resolve(root, REPORT_DIR, `${id}.json`)
    if (info.config.updateSnapshots !== 'none') {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`)
    }

    // A violation is either named as a debt, with its reason, or it fails.
    const owed = new Set(KNOWN.filter((debt) => debt.items.includes(id)).map((debt) => debt.rule))
    const violations = (['dark', 'light'] as const).flatMap((theme) =>
      report[theme].violations
        .filter((violation) => !owed.has(violation.rule))
        .map((violation) => `${theme}: ${violation.rule} at ${violation.nodes.join(', ')}`),
    )
    expect(violations, `axe found violations in ${id}`).toEqual([])
    // The recorded report is what the documentation shows; this run is what
    // is true. Re-record with `pnpm visual:update` when they part.
    expect(existsSync(path), `${id} has no report yet - record it with \`pnpm visual:update\``).toBe(true)
    expect(report, `the report for ${id} is out of date`).toEqual(JSON.parse(readFileSync(path, 'utf8')))
  })
}
