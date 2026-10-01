import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * One moment for the stand.
 *
 * The stand passes a fixed `standNow` to whatever takes a "now", and the
 * visual snapshots pin the browser's clock for whatever asks the browser
 * instead - the Calendar, the month view, `calendar-math`'s `today()`. If the
 * two moments drift apart the stand is photographed at two different times
 * at once: a relative phrase says "yesterday" about a day the month view draws
 * as tomorrow.
 *
 * Read as text because the snapshots run in Playwright and the stand in Vite,
 * and neither can import the other.
 */

const root = resolve(import.meta.dirname, '..')
const moment = (path: string, pattern: RegExp) => readFileSync(resolve(root, path), 'utf8').match(pattern)?.[1]

describe('the stand keeps one clock', () => {
  it('photographs at the moment it draws', () => {
    const drawn = moment('stand/src/App.tsx', /const standNow = new Date\('([^']+)'\)/)
    const photographed = moment('tests/visual/stand.spec.ts', /page\.clock\.setFixedTime\(new Date\('([^']+)'\)\)/)
    expect(drawn, 'the stand no longer declares `standNow`').toBeDefined()
    expect(photographed, 'the snapshots no longer pin the clock').toBeDefined()
    expect(photographed).toBe(drawn)
  })
})
