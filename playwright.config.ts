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
      // Anti-aliasing differs a little between runs of the same browser
      // version. This is small enough that a one-pixel layout shift still
      // fails and large enough that a re-render of the same picture does not.
      maxDiffPixelRatio: 0.002,
      animations: 'disabled',
      caret: 'hide',
    },
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
