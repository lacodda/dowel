import { expect, test, type Page } from '@playwright/test'

/*
 * The theme's two other modes, in a browser: on paper, and under more
 * contrast.
 *
 * The numbers are the palette gate's - every promised pair, every product,
 * both modes. What only a browser shows is what the modes do to a screen: that
 * a dark screen prints as dark ink on white rather than as a blank sheet, that
 * nothing the set draws is cut off at the edge of a scroll box on paper, and
 * what the hairlines look like once they are lines. A few sections each, the
 * ones the modes change most; the rest are the same rules.
 */

const MOMENT = new Date('2026-09-09T12:00:00Z')

/** Sections drawn on paper: the parts of a report. */
const PRINTED = ['stat-tile', 'bar-chart', 'activity-heatmap', 'table', 'badge', 'alert'] as const

/** Sections that hold a frame: what has to let go of its height on paper. */
const FRAMED = ['app-shell', 'frame', 'scroll-area', 'list-detail-screen', 'empty-dashboard-screen'] as const

/** Sections under more contrast: where the hairlines and the quiet inks are. */
const MORE = ['input', 'button', 'table', 'tabs', 'badge', 'timeline'] as const

async function open(page: Page, id: string, theme: 'dark' | 'light') {
  await page.addInitScript((value) => window.localStorage.setItem('dowel.stand.theme', value), theme)
  await page.clock.setFixedTime(MOMENT)
  await page.goto(`./${id}`)
  await page.waitForLoadState('networkidle')
  await expect(page.locator('html')).toHaveClass(new RegExp(theme))
  return page.locator('main [data-stand-section]')
}

test.describe('on paper', () => {
  for (const id of PRINTED) {
    test(`${id} prints dark ink on white from a dark screen`, async ({ page }) => {
      const section = await open(page, id, 'dark')
      const ground = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
      const screen = await ground()
      await page.emulateMedia({ media: 'print' })
      // The paper's ground is the light theme's raised surface, white, and not
      // the dark screen's; fills are told to print. Read from what the page
      // computed rather than from the stylesheet, which the build minified.
      const paper = await page.evaluate(() => {
        const probe = document.body.appendChild(document.createElement('i'))
        probe.style.color = 'var(--raise)'
        const raise = getComputedStyle(probe).color
        probe.remove()
        return {
          ground: getComputedStyle(document.body).backgroundColor,
          raise,
          adjust: getComputedStyle(document.documentElement).getPropertyValue('print-color-adjust'),
        }
      })
      expect(paper.ground).not.toBe(screen)
      expect(paper.ground).toBe(paper.raise)
      expect(paper.adjust).toBe('exact')
      await expect(section).toHaveScreenshot(`${id}-print.png`)
    })
  }

  for (const id of FRAMED) {
    test(`${id} cuts nothing off on paper`, async ({ page }) => {
      const section = await open(page, id, 'light')
      await page.emulateMedia({ media: 'print' })
      // Every box that holds more than it shows and does not let it out.
      // Text kept for a screen reader is clipped on purpose - `sr-only` cuts
      // it to nothing with a clip path, whatever padding it carries.
      const clipped = await section.evaluate((root) =>
        [...root.querySelectorAll<HTMLElement>('*')]
          .filter((element) => getComputedStyle(element).clipPath !== 'inset(50%)')
          .filter((element) => {
            const style = getComputedStyle(element)
            const holds = ['hidden', 'auto', 'scroll', 'clip'].includes(style.overflowY)
            return holds && style.display !== 'none' && element.scrollHeight > element.clientHeight + 1
          })
          .map((element) => `${element.tagName.toLowerCase()}.${[...element.classList].slice(0, 4).join('.')}`),
      )
      expect(clipped).toEqual([])
    })
  }
})

test.describe('under more contrast', () => {
  for (const theme of ['dark', 'light'] as const) {
    for (const id of MORE) {
      test(`${id}, ${theme}`, async ({ page }) => {
        await page.emulateMedia({ contrast: 'more' })
        const section = await open(page, id, theme)
        // The mode is the system's, as a reader's would be: no class pinned.
        // A control's edge is the theme's text at 62% once it is in force.
        const edge = await page.evaluate(() => {
          const probe = document.body.appendChild(document.createElement('i'))
          probe.style.color = 'var(--line-2)'
          const colour = getComputedStyle(probe).color
          probe.remove()
          return colour
        })
        expect(edge).toMatch(/\/ 0\.62\)$/)
        await expect(section).toHaveScreenshot(`${id}-more-${theme}.png`)
      })
    }
  }
})
