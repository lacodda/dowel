import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { type Browser, type Page, chromium } from '@playwright/test'
import ts from 'typescript'
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import { compileClasses } from './compile'

/*
 * What the theme's scrollbars do in a browser, with the bars shown.
 *
 * Playwright launches Chromium with `--hide-scrollbars`, and that flag is why
 * these were once called impossible to measure: `offsetWidth - clientWidth` read
 * zero for any stylesheet at all, so the gate read the stylesheet's text and
 * passed while every product in a WebView drew the system's bar with its step
 * arrows. Chromium ignores `::-webkit-scrollbar` on an element with the standard
 * properties set, which no reading of the text would say.
 */

const measure = inject('scrollbars')
const root = resolve(import.meta.dirname, '..')

/*
 * The engine's own bar, the way a desktop window gets it. A press on it lands
 * only while it is up, so each case waits for it to go to sleep first, and each
 * reads the width as well: a mode that went back to a classic bar also lets
 * every press land.
 */
describe('an engine that draws its own overlay bar', { timeout: 90_000 }, () => {
  const FEATURE = '--enable-features=OverlayScrollbar'
  // Longer than the bar stays up with nobody on it.
  const ASLEEP = 2800
  const browsers: Browser[] = []
  let css: string
  let script: string

  const open = async (args: string[], options: { call?: boolean; mark?: boolean } = {}): Promise<Page> => {
    const browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'], args })
    browsers.push(browser)
    const page = await browser.newPage({ viewport: { width: 800, height: 400 } })
    await page.setContent(
      `<html><head><style>${css}</style></head><body style="margin:0">` +
        // Half of it fits, so the thumb fills the top half of the track, and a
        // press at a quarter of the height is on it on any platform.
        `<div id="box" style="margin:40px;width:300px;height:200px;overflow:auto;background:#222">` +
        `<div id="head" style="position:sticky;top:0;height:20px;background:#444"></div>` +
        `<div style="height:380px"></div></div>` +
        `</body></html>`,
    )
    await page.addScriptTag({ content: script })
    if (options.call) await page.evaluate(() => void (window as unknown as { overlayScrollbars(): void }).overlayScrollbars())
    if (options.mark) await page.evaluate(() => void (document.documentElement.dataset.scrollbars = 'overlay'))
    return page
  }

  const width = (page: Page) =>
    page.evaluate(() => {
      const box = document.getElementById('box')!
      return box.offsetWidth - box.clientWidth
    })

  /** A hand: into the box, to the edge, press on the thumb, pull. How far it scrolled. */
  const pull = async (
    page: Page,
    { stopAtEdge = 0, stillFor = 80 }: { stopAtEdge?: number; stillFor?: number } = {},
  ): Promise<number> => {
    const edge = { x: 40 + 300 - 4, y: 40 + 50 }
    // At a hand's pace, a frame or two to a step. Left to itself Playwright gets
    // there within one frame, so nothing moves onto the bar after it comes up.
    for (const offset of [150, 110, 80, 60, 45, 34, 26, 18, 12, 8, 4, 2, 0]) {
      await page.mouse.move(edge.x - offset, edge.y)
      await page.waitForTimeout(24)
    }
    if (stopAtEdge) {
      await page.waitForTimeout(stopAtEdge)
      await page.mouse.move(edge.x, edge.y + 2, { steps: 2 })
    }
    await page.waitForTimeout(stillFor)
    await page.mouse.down()
    await page.mouse.move(edge.x, edge.y + 40, { steps: 6 })
    await page.waitForTimeout(60)
    const scrolled = await page.evaluate(() => document.getElementById('box')!.scrollTop)
    await page.mouse.up()
    return scrolled
  }

  beforeAll(async () => {
    css = await compileClasses([])
    const source = readFileSync(resolve(root, 'packages/dowel/src/scrollbars.ts'), 'utf8')
    script = ts
      .transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } })
      .outputText.replace(/^export /m, '')
  })

  afterAll(async () => {
    await Promise.all(browsers.map((browser) => browser.close()))
  })

  it('takes no width once it is told, and the theme’s rules stand aside', async () => {
    const page = await open([FEATURE])
    expect(await width(page), 'until the call the theme’s strip stands').toBe(10)
    await page.evaluate(() => void (window as unknown as { overlayScrollbars(): void }).overlayScrollbars())
    expect(await page.evaluate(() => document.documentElement.dataset.scrollbars)).toBe('overlay')
    expect(await width(page)).toBe(0)
  })

  it('colours the bar from the palette', async () => {
    const page = await open([FEATURE], { call: true })
    const [bar, dim] = await page.evaluate(() => {
      const probe = document.body.appendChild(document.createElement('i'))
      probe.style.color = 'var(--dim)'
      return [getComputedStyle(document.getElementById('box')!).scrollbarColor, getComputedStyle(probe).color]
    })
    expect(bar).toContain(dim)
  })

  it('leaves the strip where the engine draws a classic bar', async () => {
    // The flag gone in a runtime update, or a browser that never had it: without
    // the measure this would be a stock 15px bar with arrows.
    const page = await open([], { call: true })
    expect(await page.evaluate(() => document.documentElement.dataset.scrollbars)).toBeUndefined()
    expect(await width(page)).toBe(10)
  })

  it('stands aside by its own rule, not only because a colour is set', async () => {
    // Chromium drops the -webkit rules wherever `scrollbar-color` is set, so the
    // mark's colour alone reads the same here. A browser that does not, and a
    // scroller that resets the colour, are left with the strip unless the rules
    // themselves stop at the mark.
    const page = await open([FEATURE], { mark: true })
    await page.evaluate(() => void (document.getElementById('box')!.style.scrollbarColor = 'auto'))
    expect(await width(page)).toBe(0)
  })

  it('draws the strip on the page’s own scroller while there is no mark', async () => {
    // The rules hang off the root's descendants, and the engine reads the page's
    // bar from the body: lose that and the page alone goes back to a stock bar.
    const page = await open([])
    await page.evaluate(() => void (document.body.style.height = '3000px'))
    expect(await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth)).toBe(10)
  })

  it('cannot be taken from sleep on its own', async () => {
    // The control: what the wake is for. Should the engine start waking it for
    // a pointer by itself, this goes red and the wake can go.
    const page = await open([FEATURE], { mark: true })
    await page.waitForTimeout(ASLEEP)
    expect(await width(page)).toBe(0)
    expect(await pull(page)).toBe(0)
  })

  it('can be taken from sleep by a mouse coming to it', async () => {
    const page = await open([FEATURE], { call: true })
    await page.waitForTimeout(ASLEEP)
    expect(await width(page)).toBe(0)
    expect(await pull(page)).toBeGreaterThan(20)
  })

  it('can be taken after the pointer stopped by it long enough for it to sleep', async () => {
    const page = await open([FEATURE], { call: true })
    await page.waitForTimeout(ASLEEP)
    expect(await pull(page, { stopAtEdge: ASLEEP })).toBeGreaterThan(20)
  })

  it('stays up for a hand that stops dead on it and presses later', async () => {
    // What a test pressing at once cannot see: the engine keeps a bar up only for
    // a pointer that moved onto it after it showed. Woken on arrival, this one
    // goes back to sleep under a still pointer and the press selects text.
    const page = await open([FEATURE], { call: true })
    await page.waitForTimeout(ASLEEP)
    expect(await pull(page, { stillFor: ASLEEP })).toBeGreaterThan(20)
  })

  it('moves nothing when it wakes', async () => {
    const page = await open([FEATURE], { call: true })
    await page.evaluate(() => {
      const box = document.getElementById('box')!
      box.scrollTop = 60
      const seen = { scrolls: 0, tops: new Set<number>(), widths: new Set<number>(), positions: new Set<number>() }
      box.addEventListener('scroll', () => (seen.scrolls += 1))
      const record = () => {
        seen.tops.add(document.getElementById('head')!.getBoundingClientRect().top)
        seen.widths.add(box.clientWidth)
        seen.positions.add(box.scrollTop)
        requestAnimationFrame(record)
      }
      // Reading layout in a frame of its own, as the page's paint would see it.
      requestAnimationFrame(record)
      ;(window as unknown as { seen: typeof seen }).seen = seen
    })
    await page.waitForTimeout(ASLEEP)
    await page.mouse.move(150, 90, { steps: 3 })
    await page.mouse.move(336, 90, { steps: 5 })
    await page.waitForTimeout(300)
    const seen = await page.evaluate(() => {
      const { scrolls, tops, widths, positions } = (
        window as unknown as { seen: { scrolls: number; tops: Set<number>; widths: Set<number>; positions: Set<number> } }
      ).seen
      return { scrolls, tops: [...tops], widths: [...widths], positions: [...positions] }
    })
    expect(seen.tops, 'the sticky head moved').toHaveLength(1)
    expect(seen.widths, 'the content’s width changed').toHaveLength(1)
    expect(seen.positions, 'the position changed').toEqual([60])
    // The one from setting the position above, delivered at the next frame.
    expect(seen.scrolls).toBeLessThanOrEqual(1)
  })
})

describe('a scrolling element on the theme', () => {
  it('leaves the standard properties to the browsers that have no other', () => {
    expect(measure.plain.scrollbarWidth, 'Chromium is ignoring the -webkit rules').toBe('auto')
  })

  it('draws the theme’s strip rather than the system’s', () => {
    expect(measure.plain.gutter).toBe(10)
  })

  it('takes the bar away for a utility that says so', () => {
    // An unlayered rule beats every layered one, so while the theme's sat
    // outside a layer `[scrollbar-width:none]` lost to the `*`.
    expect(measure.utility).toEqual({ scrollbarWidth: 'none', gutter: 0 })
  })

  it('takes the bar away for Base UI’s class, from the theme alone', () => {
    // The page has no Base UI on it, and so no `<style>` of Base UI's: what a
    // ScrollArea in a window with a strict policy is left with.
    expect(measure.baseUi.gutter).toBe(0)
  })
})

describe('what a window with a strict policy would refuse', () => {
  it('holds Base UI’s rule to what the installed Base UI writes', () => {
    const source = readFileSync(resolve(root, 'node_modules/@base-ui/react/utils/styles.js'), 'utf8')
    const className = source.match(/DISABLE_SCROLLBAR_CLASS_NAME = '([^']+)'/)?.[1]
    const template = source.match(/children: `([^`]+)`/)?.[1]
    expect(className, 'Base UI no longer names its class where this reads it').toBeTruthy()
    expect(template, 'Base UI no longer writes its rule where this reads it').toBeTruthy()

    const rules = template!.replaceAll('${DISABLE_SCROLLBAR_CLASS_NAME}', className!).split('}').filter(Boolean)
    expect(rules.length).toBeGreaterThan(0)
    const theme = readFileSync(resolve(root, 'packages/dowel/src/theme.css'), 'utf8').replace(/\s+/g, '')
    for (const rule of rules) {
      const [selector, declaration] = rule.split('{')
      expect(theme, `the theme has no \`${rule}}\``).toContain(`${selector}{${declaration};}`)
    }
  })

  it('runs Splash’s sweep on the keyframes the theme carries', () => {
    expect(measure.sweepRunning).toBe(true)
  })

  it('finds no `<style>` rendered anywhere in the set', () => {
    // React renders these at run time, and under that policy the browser keeps
    // the element and drops its rules without a word. jsdom has no policy, so
    // the only test that sees it is one reading what the set writes.
    const rendering = ['registry/ui', 'registry/blocks'].flatMap((dir) =>
      readdirSync(resolve(root, dir))
        .filter((file) => file.endsWith('.tsx') && !file.includes('.test.'))
        .filter((file) =>
          readFileSync(resolve(root, dir, file), 'utf8')
            .split('\n')
            .filter((line) => !/^\s*(?:\*|\/\/|\/\*)/.test(line))
            .some((line) => /<style[\s>]/.test(line)),
        )
        .map((file) => `${dir}/${file}`),
    )
    expect(rendering).toEqual([])
  })
})
