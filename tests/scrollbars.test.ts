import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, inject, it } from 'vitest'

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
