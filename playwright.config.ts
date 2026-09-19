import { defineConfig, devices } from '@playwright/test'

/*
 * Visual snapshots of the stand.
 *
 * What this catches is the one thing the rest of the suite cannot: shape. A
 * class-list assertion proves a component asked for `rounded-md`; axe proves a
 * reader can use it; the contrast tests prove the colours clear AA. None of
 * them notice that a padding change made every button in the line two pixels
 * taller, or that a variant stopped looking different from its neighbour.
 *
 * Snapshots are taken on Linux only, and the reason is in the theme: the line
 * uses the operating system's own typeface on purpose (a desktop tool should
 * read in the face its user reads everything else in). That makes byte-equal
 * screenshots across operating systems impossible by construction, not by
 * misconfiguration. Pinning one platform keeps the baselines meaningful; the
 * Windows CI job runs everything else.
 */
export default defineConfig({
  testDir: './tests/visual',
  // A screenshot diff is a comparison against a committed baseline, so a
  // stray `.only` left in a file would silently narrow the gate.
  forbidOnly: Boolean(process.env.CI),
  // A missing baseline is a failure, not an invitation to write one. The
  // default only enforces that under CI, which means a first local run records
  // twenty pictures and reports success - a gate that passes before it exists.
  // New baselines are recorded on purpose, with `pnpm visual:update`.
  updateSnapshots: 'none',
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',

  // The stand is a static build; serving it is the whole setup.
  webServer: {
    command: 'pnpm --filter dowel-stand preview --port 4173 --strictPort',
    url: 'http://localhost:4173/dowel/stand/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  use: {
    baseURL: 'http://localhost:4173/dowel/stand/',
    // A fixed viewport: a snapshot of a component in a differently sized
    // window is a different picture for reasons that have nothing to do with
    // the component.
    viewport: { width: 1000, height: 800 },
  },

  expect: {
    toHaveScreenshot: {
      /*
       * An absolute count, not a ratio - and the difference is the whole
       * point.
       *
       * This was `maxDiffPixelRatio: 0.002`, with a comment claiming a
       * one-pixel layout shift would still fail. It does not, and the size of
       * the section is why: a ratio makes the allowance grow with the picture.
       * The StatTile section is 896x862, so two tenths of a percent is 1,545
       * pixels of licence - and three 16x16 marks added to it come to 768. The
       * gate compared them and passed.
       *
       * That was found by noticing the gate had *not* gone red when the marks
       * landed, rather than by it failing; a tolerance that scales with the
       * thing it measures hides most in exactly the biggest screens, where
       * there is most to hide.
       *
       * A hundred pixels sits between the two populations cleanly.
       * Anti-aliasing on text edges differs by tens of pixels between runs of
       * the same browser; the smallest real change - one 16x16 glyph - is 256,
       * a one-pixel shift of a 400px row is 400, and a two-pixel height change
       * across the section is 1,792.
       */
      maxDiffPixels: 100,
      animations: 'disabled',
      caret: 'hide',
    },
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
