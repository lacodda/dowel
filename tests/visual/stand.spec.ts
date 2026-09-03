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
  'field',
  'checkbox',
  'radio-group',
  'switch',
  'number-field',
  'slider',
  'rating-scale',
  'duration-field',
  'password-field',
  'calendar-math',
  'calendar',
  'date-picker',
  'date-range-picker',
  'time-field',
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
  'menu',
  'context-menu',
  'select',
  'combobox',
  'search-field',
  'command-palette',
  'shortcut',
  'toast',
  'alert',
  'banner',
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

      /* Nothing is hidden here any more.
       *
       * These shots used to be taken on one long page under a sticky header,
       * which landed across the top of any section tall enough to still be in
       * frame. It was hidden with an injected stylesheet that demonstrably
       * worked locally and demonstrably did not work in CI, and five
       * hypotheses failed to explain the difference.
       *
       * The stand now gives each component its own page and the header is a
       * plain block beside the content rather than over it, so the cause is
       * gone instead of suppressed - which is why there is no workaround left
       * to explain. */
    })

    for (const id of SECTIONS) {
      test(`${id} looks the way it looked`, async ({ page }) => {
        await page.goto(`./${id}`)
        await page.waitForLoadState('networkidle')
        const section = page.locator('main section')
        await expect(section).toBeVisible()
        await expect(section).toHaveScreenshot(`${id}-${theme}.png`)
      })
    }
  })
}

test('every component on the stand is photographed', async ({ page }) => {
  // A component can be added to the stand and forgotten here, and the gate
  // would go on passing while covering nine of ten. This is the check that
  // makes the list above honest.
  //
  // The navigation is the stand's own list of components, so it is what gets
  // compared - counting sections on one page stopped being possible when each
  // component got a page of its own.
  await page.goto('./')
  const ids = await page
    .locator('nav[aria-label="Components"] a')
    .evaluateAll((nodes) => nodes.map((n) => new URL((n as HTMLAnchorElement).href).pathname.replace(/.*\//, '')))
  expect(ids.sort()).toEqual([...SECTIONS].sort())
})
