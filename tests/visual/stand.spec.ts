import { expect, test } from '@playwright/test'

/*
 * One picture per component, per theme.
 *
 * The stand is already the place where every variant of every primitive is
 * drawn side by side, so it is what gets photographed: sections rather than
 * whole pages, because a single tall image would change whenever anything
 * above it moved, and a diff that always fires is a diff nobody reads.
 *
 * The accent is left at dowel's own amber. Colour is checked numerically
 * against all fourteen accents in `contrast.test.ts`, and photographing every
 * one of them here would multiply the baselines by fourteen to catch nothing
 * the arithmetic does not already catch. What a picture catches is shape.
 */

/** The sections of the stand, in the order it draws them. Kept as a list so a
 * component added to the stand without a baseline fails the count check below
 * rather than being quietly unphotographed. */
const SECTIONS = [
  'button',
  'input',
  'textarea',
  'panel',
  'badge',
  'chip',
  'kbd',
  'spinner',
  'truncate',
  'copyable',
  'dialog',
  'confirm-dialog',
  'drawer',
  'popover',
  'preview-card',
  'tooltip',
] as const

for (const theme of ['dark', 'light'] as const) {
  test.describe(`the stand, ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      // The stand keeps the choice under this key and the hook puts the class
      // on the root element - the same path a product takes - so setting it
      // before the page loads photographs the real mechanism, not a
      // test-only switch.
      await page.addInitScript((value) => {
        window.localStorage.setItem('dowel.stand.theme', value)
      }, theme)
      await page.goto('./')
      await expect(page.locator('html')).toHaveClass(new RegExp(theme))
      await page.waitForLoadState('networkidle')
    })

    for (const id of SECTIONS) {
      test(`${id} looks the way it looked`, async ({ page }) => {
        const section = page.locator(`#${id}`)
        await expect(section).toBeVisible()
        await expect(section).toHaveScreenshot(`${id}-${theme}.png`)
      })
    }
  })
}

test('every section on the stand is photographed', async ({ page }) => {
  // A component can be added to the stand and forgotten here, and the gate
  // would go on passing while covering nine of ten. This is the check that
  // makes the list above honest.
  await page.goto('./')
  const ids = await page.locator('section[id]').evaluateAll((nodes) => nodes.map((n) => n.id))
  expect(ids.sort()).toEqual([...SECTIONS].sort())
})
