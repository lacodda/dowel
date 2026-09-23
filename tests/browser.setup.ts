import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import type { TestProject } from 'vitest/node'
import { lineProducts } from '../packages/dowel/src/line'

/*
 * Every browser the suite needs, launched once and before any worker starts.
 *
 * The palettes are written by Chromium, and three tests used to launch it on
 * their own - in the middle of a run where four workers each carry a jsdom and
 * an axe. On a machine short of memory the browser starved them, and eight axe
 * checks hit the five-second timeout with no component wrong: the gate reported
 * the load on the machine, not the state of the code. Here the browser runs
 * alone, and the tests only read what it answered.
 */

/** Opaque colours painted into a canvas, per product and theme: token -> RGBA. */
export type Painted = Record<string, Record<'dark' | 'light', Record<string, number[]>>>

/** The products the canvas check paints; one per region of the hue circle. */
export const paintedProducts = ['nitid', 'kasl', 'hilvan']

const root = resolve(import.meta.dirname, '..')

export default async function setup(project: TestProject) {
  // Into a directory of its own: the release gate reads `dist` in a parallel
  // worker, and on Windows a file cannot be replaced while another process has
  // it open.
  const dir = mkdtempSync(resolve(tmpdir(), 'dowel-palettes-'))
  execFileSync('node', ['tools/build-palettes.mjs', dir], { cwd: root })
  project.provide('palettesDir', dir)
  project.provide('painted', await paint(dir))
  return () => rmSync(dir, { recursive: true, force: true })
}

/*
 * The browser answers in `oklab()` for a mix, and the build script converts
 * that to sRGB itself. The browser is asked again here by a different route -
 * it paints each opaque colour into a canvas, converting it on its own - so a
 * wrong matrix or sign in the script's conversion shows up as a pixel that
 * disagrees, not as a plausible colour nobody questions.
 */
async function paint(dir: string): Promise<Painted> {
  const { chromium } = await import('@playwright/test')
  const theme = readFileSync(resolve(root, 'packages/dowel/src/theme.css'), 'utf8')
  const written = new Set(readdirSync(dir))
  const browser = await chromium.launch()
  const painted: Painted = {}
  try {
    const page = await browser.newPage()
    for (const { name, accent } of lineProducts.filter((p) => paintedProducts.includes(p.name))) {
      // A product the build left out is the palette test's failure to report,
      // with a name, rather than a crash here with none.
      if (!written.has(`${name}.json`)) continue
      const palette = JSON.parse(readFileSync(resolve(dir, `${name}.json`), 'utf8'))
      painted[name] = { dark: {}, light: {} }
      for (const mode of ['dark', 'light'] as const) {
        await page.emulateMedia({ colorScheme: mode })
        await page.setContent(
          `<html class="${mode}"><head><style>${theme}</style><style>:root{--accent-base:${accent}}</style></head><body></body></html>`,
        )
        const colours: Record<string, { $value: string }> = palette.color[mode]
        const opaque = Object.keys(colours).filter((token) => colours[token]!.$value.length === 7)
        painted[name][mode] = await page.evaluate((tokens) => {
          const canvas = document.createElement('canvas')
          canvas.width = canvas.height = 1
          const context = canvas.getContext('2d')!
          const probe = document.body.appendChild(document.createElement('i'))
          return Object.fromEntries(
            tokens.map((token) => {
              // The computed colour, in whatever space the browser keeps it,
              // goes to the canvas; the canvas does its own conversion to the
              // sRGB pixel. A value the canvas refuses is assigned silently
              // and leaves the sentinel in place - reported, not passed.
              probe.style.color = `var(--${token})`
              context.fillStyle = '#010203'
              context.fillStyle = getComputedStyle(probe).color
              if (context.fillStyle === '#010203') return [token, [-1, -1, -1]]
              context.clearRect(0, 0, 1, 1)
              context.fillRect(0, 0, 1, 1)
              return [token, [...context.getImageData(0, 0, 1, 1).data]]
            }),
          )
        }, opaque)
      }
    }
  } finally {
    await browser.close()
  }
  return painted
}

declare module 'vitest' {
  export interface ProvidedContext {
    palettesDir: string
    painted: Painted
  }
}
