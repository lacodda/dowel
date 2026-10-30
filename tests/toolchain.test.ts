import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * Versions that have to move together, checked rather than commented.
 *
 * A note in a workflow file saying "these two move together" is advice, and
 * advice is followed until the day somebody runs `pnpm update --latest` and
 * reads the diff for the interesting parts. That is what happened during
 * v0.24: the stack update took `@playwright/test` to 1.63.0, the container
 * stayed at 1.62.1, and every one of the 140 snapshots failed with
 * "Executable doesn't exist at /ms-playwright/chromium_headless_shell-…"
 * instead of a diff anybody could read.
 *
 * The workflow already said so, in the same words, three lines above the tag.
 * So the lesson is not "write the note" - it is that a rule spanning two files
 * needs something that reads both.
 */

const root = resolve(import.meta.dirname, '..')
const ci = readFileSync(resolve(root, '.github/workflows/ci.yml'), 'utf8')
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
  devDependencies: Record<string, string>
}

describe('the browser the pictures are taken in', () => {
  const declared = manifest.devDependencies['@playwright/test']

  it('is pinned exactly, because a caret would drift away from the image', () => {
    /* `^1.63.0` installs 1.64 the week it lands, and the container tag cannot
     * follow on its own - the pin is what makes the pair checkable at all. */
    expect(declared, '`@playwright/test` should be an exact version').toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('matches the container the baselines are recorded in', () => {
    const image = ci.match(/mcr\.microsoft\.com\/playwright:v([\d.]+)-noble/)
    expect(image, 'the CI workflow no longer names a Playwright image').not.toBeNull()

    expect(
      image![1],
      `the container is v${image![1]} and \`@playwright/test\` is ${declared}. ` +
        `A minor apart is not a diff - it is every snapshot failing with "Executable doesn't exist", ` +
        `because the image carries the browser revision its own release pinned.`,
    ).toBe(declared)
  })
})

/*
 * A version held back below the latest is a decision, and a decision without
 * its reason is a version nobody dares to move. Every override names why, and
 * what would let it go.
 */
const heldBack: Record<string, string> = {
  // vite 8.3.5's module runner keeps some modules' code as a Buffer, and
  // `extractInlineSourceMap` calls `charCodeAt` on it: the first stack trace
  // vitest 5.0.5 maps - in the global setup, before any test - throws, and the
  // run ends with "No test files found". Let go when a vite past 8.3.5 runs
  // `pnpm test` without the override.
  vite: '8.3.4',
}

describe('versions held back', () => {
  const overrides = (manifest as { pnpm?: { overrides?: Record<string, string> } }).pnpm?.overrides ?? {}

  it('are each held for a stated reason', () => {
    expect(overrides, 'an override in package.json needs its reason in tests/toolchain.test.ts').toEqual(heldBack)
  })
})
