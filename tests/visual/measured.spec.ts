import { expect, test, type Locator, type Page } from '@playwright/test'

/*
 * What the stand measures, rather than what it looks like.
 *
 * The screenshots next door catch a change of shape; they cannot say whether
 * the shape is right. These ask the browser for numbers the unit tests can
 * only infer from class lists - where a button's icon ends up, whether a
 * dialog's actions are inside the window, what z-index a popup opened inside
 * an overlay resolves to, and whether a reader can still reach it. jsdom
 * computes none of that: it resolves no custom property and lays nothing out.
 *
 * Unlike the pictures, nothing here depends on the platform's typeface, so it
 * runs wherever the stand is served.
 */

const box = async (locator: Locator) => {
  const found = await locator.boundingBox()
  expect(found, 'not on screen').not.toBeNull()
  return found!
}

/** The nearest z-index that is not `auto`, walking up from the element. */
const zIndexOf = (locator: Locator) =>
  locator.evaluate((element) => {
    for (let node: Element | null = element; node; node = node.parentElement) {
      const value = getComputedStyle(node).zIndex
      if (value !== 'auto') return Number(value)
    }
    return 0
  })

/** Whether assistive technology can reach it at all. */
const hiddenFromReaders = (locator: Locator) =>
  locator.evaluate((element) => element.closest('[aria-hidden="true"]') !== null)

/** Whether a press at the centre of the element lands on it. */
const onTop = (locator: Locator) =>
  locator.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + Math.min(rect.height / 2, 16))
    return hit !== null && element.contains(hit)
  })

const probe = (page: Page, name: string) => page.locator(`[data-probe="${name}"]`)

test.describe('Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./button')
    await page.waitForLoadState('networkidle')
  })

  test('sizes a 24px icon by the size of the button it is in', async ({ page }) => {
    // lucide draws at its own 24px unless something sizes it, and a text
    // button used to size nothing.
    for (const [name, pixels] of [
      ['icon-xs-text', 12],
      ['icon-sm-text', 14],
      ['icon-md-text', 16],
    ] as const) {
      const icon = await box(probe(page, name).locator('svg'))
      expect([icon.width, icon.height], name).toEqual([pixels, pixels])
    }
  })

  test("leaves an icon's own size alone", async ({ page }) => {
    const icon = await box(probe(page, 'icon-own-size').locator('svg'))
    expect([icon.width, icon.height]).toEqual([10, 10])
  })

  test('stands on the control rows, so density moves it with the field', async ({ page }) => {
    for (const [density, field, sm] of [
      ['compact', 32, 28],
      ['default', 36, 32],
      ['comfortable', 40, 36],
    ] as const) {
      const region = probe(page, `density-${density}`)
      const input = await box(region.locator('input'))
      const [md, small] = await Promise.all([box(region.getByRole('button').nth(0)), box(region.getByRole('button').nth(1))])
      expect(input.height, density).toBe(field)
      expect(md.height, `${density}: md beside a field of its size`).toBe(field)
      expect(small.height, density).toBe(sm)
    }
  })

  test('draws lucide lines at the weight of the line', async ({ page }) => {
    const stroke = await probe(page, 'icon-md-text')
      .locator('svg')
      .evaluate((svg) => getComputedStyle(svg).strokeWidth)
    expect(stroke).toBe('1.75px')
  })

  test('sets the page in the base step', async ({ page }) => {
    const [size, line] = await page.evaluate(() => [
      getComputedStyle(document.body).fontSize,
      getComputedStyle(document.body).lineHeight,
    ])
    expect([size, line]).toEqual(['14px', '20px'])
  })
})

test.describe('Dialog', () => {
  test('keeps the actions in the window when the body is taller than it', async ({ page }) => {
    // The shape kilna's style editor has: at a laptop's 720px its "Save"
    // stood 137px below the bottom edge, because the popup scrolled as a
    // whole. Here the window is shorter still, so the body has to give way.
    await page.setViewportSize({ width: 1280, height: 480 })
    await page.goto('./dialog')
    await page.getByRole('button', { name: 'Edit the style' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit the style' })
    await expect(dialog).toBeVisible()

    const frame = await box(dialog)
    expect(frame.y + frame.height).toBeLessThanOrEqual(480)

    const body = probe(page, 'dialog-body')
    const overflows = await body.evaluate((element) => element.scrollHeight > element.clientHeight)
    expect(overflows, 'the fixture no longer overflows - make it taller').toBe(true)

    const heading = page.getByRole('heading', { name: 'Edit the style' })
    const headingBefore = await box(heading)
    await body.evaluate((element) => {
      element.scrollTop = element.scrollHeight
    })
    const save = page.getByRole('button', { name: 'Save' })
    const saved = await box(save)
    expect(saved.y + saved.height, 'Save is below the window').toBeLessThanOrEqual(480)
    expect(await onTop(save)).toBe(true)
    // The header did not move with the body, and the popup itself did not scroll.
    expect((await box(heading)).y).toBe(headingBefore.y)
    expect(await dialog.evaluate((element) => element.scrollTop)).toBe(0)
  })

  test('keeps Delete apart from the answer', async ({ page }) => {
    await page.goto('./dialog')
    await page.getByRole('button', { name: 'Edit the style' }).click()
    const actions = probe(page, 'dialog-actions')
    const [remove, cancel, save] = await Promise.all(
      ['Delete', 'Cancel', 'Save'].map((name) => box(actions.getByRole('button', { name, exact: true }))),
    )
    expect(remove.x + remove.width).toBeLessThan(cancel.x - 100)
    expect(cancel.x).toBeLessThan(save.x)
  })
})

test.describe('Layer', () => {
  test('a select in a dialog opens above the dialog, and a reader reaches it', async ({ page }) => {
    await page.goto('./dialog')
    await page.getByRole('button', { name: 'Edit the style' }).click()
    await probe(page, 'dialog-select').click()
    const list = page.getByRole('listbox')
    await expect(list).toBeVisible()
    expect(await zIndexOf(list)).toBe(61)
    expect(await onTop(list)).toBe(true)
    expect(await hiddenFromReaders(list)).toBe(false)
  })

  test('a menu in a drawer opens above the drawer, and a reader reaches it', async ({ page }) => {
    await page.goto('./drawer')
    await page.getByRole('button', { name: 'The assistant' }).click()
    await expect(page.getByRole('dialog', { name: 'The assistant' })).toBeVisible()
    await probe(page, 'drawer-menu').click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    expect(await zIndexOf(menu)).toBe(61)
    expect(await onTop(menu)).toBe(true)
    expect(await hiddenFromReaders(menu)).toBe(false)
  })

  test('a select in a popover rides one rung above the popover', async ({ page }) => {
    await page.goto('./layer')
    await page.getByRole('button', { name: 'Filter' }).click()
    await probe(page, 'layer-popover-select').click()
    const list = page.getByRole('listbox')
    await expect(list).toBeVisible()
    expect(await zIndexOf(page.getByRole('dialog', { name: 'Filter by status' }))).toBe(40)
    expect(await zIndexOf(list)).toBe(41)
    expect(await onTop(list)).toBe(true)
  })

  test('a layer inside a layer keeps climbing', async ({ page }) => {
    // A cycle in the custom properties would make them invalid and send the
    // z-index back to auto - which is why the floor is worked out on one node
    // and published on another. The numbers here are what proves it.
    await page.goto('./layer')
    await page.getByRole('button', { name: 'Schedule the release' }).click()
    await probe(page, 'layer-nested-popover').click()
    const popover = page.getByRole('dialog', { name: 'Options' })
    await expect(popover).toBeVisible()
    await probe(page, 'layer-nested-select').click()
    const list = page.getByRole('listbox')
    await expect(list).toBeVisible()
    expect(await zIndexOf(page.getByRole('dialog', { name: 'Schedule the release' }))).toBe(60)
    expect(await zIndexOf(popover)).toBe(61)
    expect(await zIndexOf(list)).toBe(62)
    expect(await onTop(list)).toBe(true)
    expect(await hiddenFromReaders(list)).toBe(false)
    expect(await hiddenFromReaders(popover)).toBe(false)
  })
})
