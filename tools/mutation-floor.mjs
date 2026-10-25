#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

/*
 * The floor under each file's mutation score.
 *
 * Stryker's own threshold is one number for the whole set, and one number
 * hides the thing it should catch: a primitive whose tests stopped holding it,
 * paid for by another whose tests got better the same week. So each file has
 * a floor of its own, kept in `tests/mutation-floor.json`, and a run that
 * leaves any file under its floor fails here - naming the file, the floor and
 * the score.
 *
 * The floor only rises. `--raise` writes each file's score as its new floor
 * wherever the score is higher, and adds files that have none; it never
 * lowers one. Lowering a floor is an edit to the JSON, in a commit that says
 * why - the same deliberate act as raising a size budget.
 *
 *   node tools/mutation-floor.mjs            # check the last report
 *   node tools/mutation-floor.mjs --raise    # and lift the floors to it
 */

const root = resolve(import.meta.dirname, '..')
const reportPath = resolve(root, 'reports/mutation/mutation.json')
const floorPath = resolve(root, 'tests/mutation-floor.json')

/** A file's score as Stryker counts it: what was caught out of what could be.
 * A file with nothing to mutate - only class lists and re-exports - scores
 * 100, since nothing in it escaped; it keeps that floor when it gains logic,
 * which then needs a test. */
export function scoreOf(mutants) {
  let caught = 0
  let valid = 0
  for (const { status } of mutants) {
    if (status === 'Killed' || status === 'Timeout') caught += 1
    if (status === 'Killed' || status === 'Timeout' || status === 'Survived' || status === 'NoCoverage') valid += 1
  }
  return valid === 0 ? 100 : Math.floor((caught / valid) * 1000) / 10
}

/** Every file's score in a Stryker JSON report, by path with forward slashes. */
export function scores(report) {
  return Object.fromEntries(
    Object.entries(report.files)
      .map(([file, entry]) => [file.replaceAll('\\', '/'), scoreOf(entry.mutants)])
      .sort(([a], [b]) => a.localeCompare(b)),
  )
}

/** The files under their floor, and the floors a raise would write.
 *
 * A file measured with no floor is under it: a new primitive's floor is
 * decided, with `--raise`, not assumed. A floor with no measure is left alone
 * - a run narrowed with `--mutate` measures only some files, and the weekly
 * run measures all of them. */
export function compare(measured, floors) {
  const under = []
  const raised = { ...floors }
  for (const [file, score] of Object.entries(measured)) {
    const floor = floors[file]
    if (floor === undefined) under.push(`${file}: ${score}, and no floor yet`)
    else if (score < floor) under.push(`${file}: ${score} under its floor of ${floor}`)
  }
  for (const [file, score] of Object.entries(measured)) {
    if (raised[file] === undefined || score > raised[file]) raised[file] = score
  }
  return { under, raised: Object.fromEntries(Object.entries(raised).sort(([a], [b]) => a.localeCompare(b))) }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  if (!existsSync(reportPath)) {
    console.error(`mutation-floor: no report at ${reportPath} - run \`pnpm mutate\` first`)
    process.exit(1)
  }
  const measured = scores(JSON.parse(readFileSync(reportPath, 'utf8')))
  const floors = existsSync(floorPath) ? JSON.parse(readFileSync(floorPath, 'utf8')) : {}
  const { under, raised } = compare(measured, floors)
  if (process.argv.includes('--raise')) {
    writeFileSync(floorPath, `${JSON.stringify(raised, null, 2)}\n`)
    console.log(`mutation-floor: ${Object.keys(raised).length} floors written`)
  }
  if (under.length > 0) {
    console.error(`mutation-floor: ${under.length} file(s) under the floor\n  ${under.join('\n  ')}`)
    process.exit(1)
  }
  console.log(`mutation-floor: ${Object.keys(measured).length} files at or above their floor`)
}
