import { expect, test, type Locator, type Page } from '@playwright/test'

/*
 * The keyboard, in a real browser, for everything that opens over the page.
 *
 * Every overlay and menu in the set is driven here without a pointer: opened
 * from its trigger, walked, chosen from, closed - and the focus followed the
 * whole way, because a popup that closes and leaves the focus on the body has
 * lost its reader as surely as one that never opened.
 *
 * The unit tests drive the same components in jsdom, and jsdom is the reason
 * this file exists: it lays nothing out, so a menu's wrap from the last item
 * to the first never fires there (Base UI skips what measures zero), a
 * `contextmenu` from Shift+F10 is never synthesised, and a positioner never
 * resolves. What is promised to a reader is checked where the reader is.
 *
 * Each block is named for the stand section it drives, which is also the
 * registry item - `tests/keyboard.test.ts` holds that every overlay and every
 * component that opens one has a block here.
 */

const probe = (page: Page, name: string) => page.locator(`[data-probe="${name}"]`)

/** The examples under one of the stand's captions. */
const row = (page: Page, label: string) => page.getByText(label, { exact: true }).locator('xpath=following-sibling::div[1]')

/** Whether the focus is inside the element - on it, or on anything in it.
 * False, rather than a wait, once the element has gone. */
const holdsFocus = async (locator: Locator) =>
  (await locator.count()) > 0 && (await locator.evaluate((element) => element.contains(document.activeElement)))

const expectFocusIn = async (locator: Locator) => expect.poll(() => holdsFocus(locator)).toBe(true)

/** Presses a key a number of times, checking after each that the focus has
 * not left the element: a trap holds on every press, not only on the last.
 *
 * Polled, not read at once. Tab off either end of a modal lands for a frame
 * on one of Base UI's focus guards - a hidden span just outside the popup -
 * which hands the focus back round on the next animation frame. A guard that
 * never handed it back would fail the poll. */
async function staysInside(page: Page, inside: Locator, key: string, times: number) {
  for (let pressed = 0; pressed < times; pressed++) {
    await page.keyboard.press(key)
    await expect.poll(() => holdsFocus(inside), `${key} #${pressed + 1} took the focus out`).toBe(true)
  }
}

async function open(page: Page, section: string) {
  await page.goto(`./${section}`)
  await page.waitForLoadState('networkidle')
}

/*
 * A modal: the page behind it is out of reach until it is answered, so the
 * focus goes in when it opens, cannot leave by Tab in either direction, and
 * comes back to what opened it when Escape closes it.
 */
async function modalContract(page: Page, trigger: Locator, popup: Locator) {
  for (const key of ['Enter', ' ']) {
    await trigger.focus()
    await page.keyboard.press(key === ' ' ? 'Space' : key)
    await expect(popup).toBeVisible()
    await expectFocusIn(popup)
    const tabbable = await popup.evaluate(
      (element) => element.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])').length,
    )
    // Round the whole ring twice over, both ways.
    await staysInside(page, popup, 'Tab', tabbable * 2 + 1)
    await staysInside(page, popup, 'Shift+Tab', tabbable * 2 + 1)
    await page.keyboard.press('Escape')
    await expect(popup).toBeHidden()
    await expect(trigger).toBeFocused()
  }
}

/*
 * A popup beside its trigger that leaves the page live: the focus goes in,
 * Escape brings it back, and walking out of it with Tab closes it rather than
 * leaving it open over whatever the reader went on to.
 */
async function anchoredContract(page: Page, trigger: Locator, popup: Locator) {
  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect(popup).toBeVisible()
  await expectFocusIn(popup)
  await page.keyboard.press('Escape')
  await expect(popup).toBeHidden()
  await expect(trigger).toBeFocused()

  await page.keyboard.press('Space')
  await expect(popup).toBeVisible()
  await expectFocusIn(popup)
  for (let pressed = 0; pressed < 40 && (await holdsFocus(popup)); pressed++) await page.keyboard.press('Tab')
  expect(await holdsFocus(popup), 'Tab never left the popup').toBe(false)
  await expect(popup).toBeHidden()
}

/** The text of whatever has the focus. */
const focusedText = (page: Page) => page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')

/*
 * A menu: opened by the keyboard with an item ready, walked by the arrows -
 * round from the last to the first and back - by Home and End and by the
 * first letters of an item, and left by Escape or Tab with the focus back on
 * the trigger.
 */
async function menuContract(page: Page, trigger: Locator, items: string[]) {
  const menu = page.getByRole('menu')
  const first = items[0]!
  const last = items.at(-1)!

  for (const key of ['Enter', 'Space', 'ArrowDown']) {
    await trigger.focus()
    await page.keyboard.press(key)
    await expect(menu).toBeVisible()
    await expect.poll(() => focusedText(page), `${key} opens on the first item`).toBe(first)
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(trigger).toBeFocused()
  }

  await trigger.focus()
  await page.keyboard.press('Enter')
  await expect.poll(() => focusedText(page)).toBe(first)
  for (const item of items.slice(1)) {
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => focusedText(page)).toBe(item)
  }
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => focusedText(page), 'Down from the last item goes round to the first').toBe(first)
  await page.keyboard.press('ArrowUp')
  await expect.poll(() => focusedText(page), 'Up from the first item goes round to the last').toBe(last)
  await page.keyboard.press('Home')
  await expect.poll(() => focusedText(page)).toBe(first)
  await page.keyboard.press('End')
  await expect.poll(() => focusedText(page)).toBe(last)

  // Type-ahead: the first letter of an item that is not the current one.
  const target = items.find((item, at) => at > 0 && !items.slice(0, at).some((other) => other[0] === item[0]))!
  await page.keyboard.press('Home')
  await page.keyboard.type(target.slice(0, 2).toLowerCase())
  await expect.poll(() => focusedText(page), `typing "${target.slice(0, 2)}"`).toBe(target)

  await page.keyboard.press('Tab')
  await expect(menu).toBeHidden()
}

test.describe('dialog', () => {
  test('holds the focus, and gives it back', async ({ page }) => {
    await open(page, 'dialog')
    await modalContract(page, page.getByRole('button', { name: 'Edit the style' }), page.getByRole('dialog', { name: 'Edit the style' }))
  })
})

test.describe('confirm-dialog', () => {
  test('holds the focus, and gives it back', async ({ page }) => {
    await open(page, 'confirm-dialog')
    await modalContract(page, page.getByRole('button', { name: 'Revoke the key' }), page.getByRole('alertdialog', { name: 'Revoke the key?' }))
  })

  test('does not open on the answer that cannot be taken back', async ({ page }) => {
    // Enter pressed twice by habit must not revoke the key: the focus goes to
    // the safe answer, not the destructive one.
    await open(page, 'confirm-dialog')
    await page.getByRole('button', { name: 'Revoke the key' }).focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('alertdialog', { name: 'Revoke the key?' })
    await expectFocusIn(dialog)
    expect(await focusedText(page)).not.toMatch(/^Revoke$/)
  })
})

test.describe('drawer', () => {
  test('holds the focus, and gives it back', async ({ page }) => {
    await open(page, 'drawer')
    await modalContract(page, page.getByRole('button', { name: 'The assistant' }), page.getByRole('dialog', { name: 'The assistant' }))
  })
})

test.describe('shortcuts-dialog', () => {
  test('opens on ?, holds the focus, and gives it back', async ({ page }) => {
    await open(page, 'shortcuts-dialog')
    const button = page.getByRole('button', { name: 'Show the shortcuts' })
    await button.focus()
    await page.keyboard.press('?')
    const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' })
    await expect(dialog).toBeVisible()
    await expectFocusIn(dialog)
    await staysInside(page, dialog, 'Tab', 5)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(button).toBeFocused()
  })
})

test.describe('command-palette', () => {
  test('opens on its shortcut, runs a row from the keyboard, and gives the focus back', async ({ page }) => {
    await open(page, 'command-palette')
    const button = page.getByRole('button', { name: 'Open the palette' })
    await button.focus()
    await page.keyboard.press('Control+K')
    const input = page.getByRole('combobox', { name: 'Command' })
    await expect(input).toBeFocused()
    await page.keyboard.type('calendar')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(input).toBeHidden()
    await expect(page.getByRole('main').getByText('Calendar', { exact: true })).toBeVisible()
    await expect(button).toBeFocused()

    await page.keyboard.press('Control+K')
    await expect(input).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(input).toBeHidden()
    await expect(button).toBeFocused()
  })
})

test.describe('popover', () => {
  test('takes the focus in, gives it back, and closes when Tab walks out', async ({ page }) => {
    await open(page, 'popover')
    await anchoredContract(page, page.getByRole('button', { name: 'Filters' }), page.getByRole('dialog', { name: 'Filters' }))
  })
})

test.describe('filter-popover', () => {
  test('takes the focus in, gives it back, and closes when Tab walks out', async ({ page }) => {
    await open(page, 'filter-popover')
    await anchoredContract(page, page.getByRole('button', { name: 'Filter by owner' }), page.getByRole('dialog', { name: 'Owner' }))
  })

  test('ticks a choice with Space', async ({ page }) => {
    await open(page, 'filter-popover')
    await page.getByRole('button', { name: 'Filter by owner' }).focus()
    await page.keyboard.press('Enter')
    const popup = page.getByRole('dialog', { name: 'Owner' })
    await expectFocusIn(popup)
    const box = popup.getByRole('checkbox').first()
    await box.focus()
    const before = await box.getAttribute('aria-checked')
    await page.keyboard.press('Space')
    await expect(box).not.toHaveAttribute('aria-checked', before ?? '')
  })
})

test.describe('notification-bell', () => {
  test('takes the focus in, gives it back, and closes when Tab walks out', async ({ page }) => {
    await open(page, 'notification-bell')
    const bell = page.getByRole('button', { name: /^Notifications/ }).first()
    await anchoredContract(page, bell, page.getByRole('dialog', { name: 'Recent' }))
  })
})

test.describe('date-picker', () => {
  test('walks the month with the arrows and picks a day with Enter', async ({ page }) => {
    await open(page, 'date-picker')
    const trigger = page.getByRole('button', { name: /^Release date/ })
    await trigger.focus()
    await page.keyboard.press('Enter')
    // A dialog, so it carries a name - the field's.
    await expect(page.getByRole('dialog', { name: 'Release date' })).toBeVisible()
    const grid = page.getByRole('grid')
    await expect(grid).toBeVisible()
    // The chosen day has the focus, so the arrows start from it - not the
    // month-paging button two Tabs away from the days.
    await expect.poll(() => focusedText(page)).toBe('14')
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => focusedText(page)).toBe('15')
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => focusedText(page)).toBe('22')
    await page.keyboard.press('Enter')
    await expect(grid).toBeHidden()
    await expect(trigger).toBeFocused()
    await expect(trigger).toContainText('22')
  })

  test('closes on Escape without choosing', async ({ page }) => {
    await open(page, 'date-picker')
    const trigger = page.getByRole('button', { name: /^Release date/ })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => focusedText(page)).toBe('14')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('grid')).toBeHidden()
    await expect(trigger).toBeFocused()
    await expect(trigger).toContainText('14')
  })
})

test.describe('date-range-picker', () => {
  test('picks both ends with the keyboard', async ({ page }) => {
    await open(page, 'date-range-picker')
    const trigger = page.getByRole('button', { name: /^Period/ })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('dialog', { name: 'Period' })).toBeVisible()
    const grid = page.getByRole('grid').first()
    await expect(grid).toBeVisible()
    await expect.poll(() => focusedText(page)).toBe('8')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('grid')).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await expect(trigger).toContainText('9')
    await expect(trigger).toContainText('16')
  })
})

test.describe('preview-card', () => {
  test('opens for the focused link and closes on Escape, leaving the focus on it', async ({ page }) => {
    await open(page, 'preview-card')
    const link = page.getByRole('link', { name: 'the seven axes' })
    await link.focus()
    const card = page.getByText('Hook, lyric, arrangement')
    await expect(card).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(card).toBeHidden()
    await expect(link).toBeFocused()
  })
})

test.describe('tooltip', () => {
  test('shows for the focused trigger and goes on Escape, leaving the focus on it', async ({ page }) => {
    await open(page, 'tooltip')
    const trigger = page.getByRole('button', { name: 'Add' })
    await trigger.focus()
    const tip = page.getByText('Add a version')
    await expect(tip).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(tip).toBeHidden()
    await expect(trigger).toBeFocused()
  })
})

test.describe('nav-rail', () => {
  test('names a collapsed destination in a tooltip when it has the focus', async ({ page }) => {
    await open(page, 'nav-rail')
    const collapsed = row(page, 'collapsed - icons only, each name in a tooltip beside it')
    const entry = collapsed.getByRole('button', { name: 'Calendar' })
    await entry.focus()
    // The name is in the tooltip, not only in the label a screen reader
    // hears: a sighted keyboard reader on an icon has nothing else to go by.
    // The popup, not its positioner (`role="presentation"`), which carries
    // the same side and the same text.
    const tip = page.locator('[data-side]:not([role="presentation"])').filter({ hasText: /^Calendar$/ })
    await expect(tip).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(tip).toBeHidden()
    await expect(entry).toBeFocused()
  })
})

test.describe('menu', () => {
  test('is driven entirely by the keyboard', async ({ page }) => {
    await open(page, 'menu')
    await menuContract(page, page.getByRole('button', { name: 'Actions' }), ['Rename', 'Duplicate', 'Delete'])
  })

  test('chooses with Enter and gives the focus back to the trigger', async ({ page }) => {
    await open(page, 'menu')
    const trigger = page.getByRole('button', { name: 'View' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('End')
    await expect.poll(() => focusedText(page)).toBe('Reset the layout')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menu')).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('reaches an item that cannot be chosen, and does nothing with it', async ({ page }) => {
    // Reached, not skipped - the menu pattern's own rule, and Base UI's: a
    // reader who never lands on "Export the view" never learns it exists,
    // let alone that it is unavailable right now.
    await open(page, 'menu')
    await page.getByRole('button', { name: 'View' }).focus()
    await page.keyboard.press('Enter')
    await expect.poll(() => focusedText(page)).toBe('Show the grid')
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => focusedText(page)).toBe('Zoom')
    await page.keyboard.press('ArrowDown')
    const unavailable = page.getByRole('menuitem', { name: 'Export the view' })
    await expect(unavailable).toBeFocused()
    await expect(unavailable).toHaveAttribute('aria-disabled', 'true')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menu')).toBeVisible()
    await expect(unavailable).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => focusedText(page)).toBe('Reset the layout')
  })

  test('ticks a checkbox item with Space and stays open', async ({ page }) => {
    await open(page, 'menu')
    await page.getByRole('button', { name: 'View' }).focus()
    await page.keyboard.press('Enter')
    const item = page.getByRole('menuitemcheckbox', { name: 'Show the grid' })
    await expect(item).toBeFocused()
    await expect(item).toHaveAttribute('aria-checked', 'true')
    await page.keyboard.press('Space')
    await expect(item).toHaveAttribute('aria-checked', 'false')
    await expect(probe(page, 'view-state')).toContainText('grid off')
    await expect(page.getByRole('menu')).toBeVisible()
  })

  test('opens a submenu with Right, leaves it with Left, and chooses in it', async ({ page }) => {
    await open(page, 'menu')
    const trigger = page.getByRole('button', { name: 'View' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => focusedText(page)).toBe('Zoom')
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('menu')).toHaveCount(2)
    await expect.poll(() => focusedText(page)).toBe('Zoom in')
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByRole('menu')).toHaveCount(1)
    await expect.poll(() => focusedText(page)).toBe('Zoom')
    await page.keyboard.press('Enter')
    await expect.poll(() => focusedText(page), 'Enter opens a submenu too').toBe('Zoom in')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(probe(page, 'view-state')).toContainText('80%')
    await expect(trigger).toBeFocused()
  })

  test('closes one level per Escape, back to where each was opened from', async ({ page }) => {
    // The menu pattern: Escape closes the menu that has the focus and returns
    // it to what opened that menu - the parent item, then the button.
    await open(page, 'menu')
    const trigger = page.getByRole('button', { name: 'View' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => focusedText(page)).toBe('Zoom in')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(1)
    await expect.poll(() => focusedText(page)).toBe('Zoom')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('menu')).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
})

test.describe('product-switcher', () => {
  test('is driven entirely by the keyboard', async ({ page }) => {
    await open(page, 'product-switcher')
    const trigger = page.getByRole('button', { name: /Switch product/ })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()
    await expectFocusIn(menu)
    const first = await focusedText(page)
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => focusedText(page)).not.toBe(first)
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(trigger).toBeFocused()
  })
})

test.describe('context-menu', () => {
  for (const key of ['Shift+F10', 'ContextMenu']) {
    test(`opens from a focused row on ${key}, and gives the focus back`, async ({ page }) => {
      await open(page, 'context-menu')
      const row = page.getByRole('button', { name: 'Paper boats' })
      await row.focus()
      await page.keyboard.press(key)
      const menu = page.getByRole('menu')
      await expect(menu).toBeVisible()
      await expectFocusIn(menu)
      await page.keyboard.press('ArrowDown')
      await expect.poll(() => focusedText(page)).toBe('Open')
      await page.keyboard.press('ArrowUp')
      await expect.poll(() => focusedText(page), 'round from the first to the last').toBe('Delete')
      await page.keyboard.press('Escape')
      await expect(menu).toBeHidden()
      await expect(row).toBeFocused()
    })
  }
})

test.describe('select', () => {
  test('opens on the chosen option, walks, types ahead, and chooses with Enter', async ({ page }) => {
    await open(page, 'select')
    const trigger = page.getByRole('combobox', { name: 'Fruit', exact: true })
    for (const key of ['Enter', 'Space', 'ArrowDown']) {
      await trigger.focus()
      await page.keyboard.press(key)
      await expect(page.getByRole('listbox')).toBeVisible()
      // The option, by role: the trigger says "Pear" too, and a check by
      // text alone passed before the focus had moved into the list.
      await expect(page.getByRole('option', { name: 'Pear' }), `${key} opens on the chosen option`).toBeFocused()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('listbox')).toBeHidden()
      await expect(trigger).toBeFocused()
      await expect(trigger).toContainText('Pear')
    }

    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('option', { name: 'Pear' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => focusedText(page)).toBe('Plum')
    await page.keyboard.press('Home')
    await expect.poll(() => focusedText(page)).toBe('Apple')
    await page.keyboard.press('End')
    await expect.poll(() => focusedText(page)).toBe('Plum')
    await page.keyboard.type('blu')
    await expect.poll(() => focusedText(page)).toBe('Blueberry')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('listbox')).toBeHidden()
    await expect(trigger).toBeFocused()
    await expect(trigger).toContainText('Blueberry')
  })

  test('keeps a multiple select open while Enter ticks and unticks', async ({ page }) => {
    await open(page, 'select')
    const trigger = page.getByRole('combobox', { name: 'Fruits', exact: true })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const list = page.getByRole('listbox')
    await expect(list).toBeVisible()
    await page.keyboard.press('Home')
    const apple = list.getByRole('option', { name: 'Apple' })
    await expect(apple).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Enter')
    await expect(apple).toHaveAttribute('aria-selected', 'false')
    await expect(list).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })
})

test.describe('page-size', () => {
  test('chooses a number from the keyboard', async ({ page }) => {
    await open(page, 'page-size')
    const trigger = page.getByRole('combobox', { name: 'Rows per page' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('listbox')).toBeVisible()
    await expect(page.getByRole('option', { name: '25' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    const next = await focusedText(page)
    await page.keyboard.press('Enter')
    await expect(page.getByRole('listbox')).toBeHidden()
    await expect(trigger).toBeFocused()
    await expect(trigger).toContainText(next)
  })
})

test.describe('schema-fields', () => {
  test('opens a choice in the form and gives the focus back', async ({ page }) => {
    await open(page, 'schema-fields')
    const trigger = page.getByRole('main').getByRole('combobox').first()
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).toBeHidden()
    await expect(trigger).toBeFocused()
  })
})

test.describe('combobox', () => {
  test('narrows as it is typed into, walks with the arrows, and takes a row with Enter', async ({ page }) => {
    await open(page, 'combobox')
    const input = page.getByRole('combobox', { name: 'Fruit', exact: true })
    await input.focus()
    await page.keyboard.type('ap')
    const list = page.getByRole('listbox')
    await expect(list).toBeVisible()
    await expect(list.getByRole('option')).toHaveText(['Apple', 'Apricot'])
    await page.keyboard.press('ArrowDown')
    await expect(list.getByRole('option', { name: 'Apple' })).toHaveAttribute('data-highlighted', '')
    await page.keyboard.press('ArrowDown')
    await expect(list.getByRole('option', { name: 'Apricot' })).toHaveAttribute('data-highlighted', '')
    // The focus stays in the field the whole time: the list is walked by
    // pointing at it, not by moving into it.
    await expect(input).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(list).toBeHidden()
    await expect(input).toHaveValue('Apricot')
    await expect(input).toBeFocused()
  })

  test('closes the list on Escape and keeps what was typed', async ({ page }) => {
    await open(page, 'combobox')
    const input = page.getByRole('combobox', { name: 'Fruit', exact: true })
    await input.focus()
    await page.keyboard.type('pe')
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).toBeHidden()
    await expect(input).toBeFocused()
  })

  test('takes the last chip back with Backspace from an empty field', async ({ page }) => {
    await open(page, 'combobox')
    const chips = page.getByRole('combobox', { name: 'Fruits', exact: true })
    await chips.focus()
    const before = await page.getByRole('main').getByText('Cherry').count()
    expect(before).toBeGreaterThan(0)
    await page.keyboard.press('Backspace')
    await expect(page.getByRole('main').getByText('Cherry')).toHaveCount(before - 1)
  })
})

test.describe('toast', () => {
  test('is reached with F6, dismissed from the keyboard, and gives the focus back', async ({ page }) => {
    await open(page, 'toast')
    const raise = page.getByRole('button', { name: 'Neutral' })
    await raise.focus()
    await page.keyboard.press('Enter')
    const toast = page.getByRole('dialog', { name: 'Saved' })
    await expect(toast).toBeVisible()
    await page.keyboard.press('F6')
    await expectFocusIn(page.getByRole('region'))
    for (let pressed = 0; pressed < 5 && !(await page.getByRole('button', { name: 'Dismiss' }).evaluate((b) => b === document.activeElement)); pressed++) {
      await page.keyboard.press('Tab')
    }
    await expect(page.getByRole('button', { name: 'Dismiss' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(toast).toBeHidden()
    await expect(raise).toBeFocused()
  })
})

test.describe('layer', () => {
  test('Escape closes the innermost popup first', async ({ page }) => {
    await open(page, 'layer')
    await page.getByRole('button', { name: 'Change the status' }).focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Change the status' })
    await expect(dialog).toBeVisible()
    const select = probe(page, 'layer-dialog-select')
    await select.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).toBeHidden()
    await expect(dialog).toBeVisible()
    await expect(select).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('button', { name: 'Change the status' })).toBeFocused()
  })
})
