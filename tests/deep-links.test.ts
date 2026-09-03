import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/*
 * A deep link into the stand has to survive a reload.
 *
 * This shipped broken once, and the reason is worth keeping: writing the built
 * index to `stand/dist/404.html` is the standard fix for a client-routed app
 * on GitHub Pages, and it does nothing here. Pages serves the 404 at the
 * *site* root for every miss on the site, and the stand is published under a
 * documentation site that owns that page - so `/dowel/stand/button` came back
 * as the docs' "page not found". The local build looked right, because the
 * file was generated exactly as intended; nothing about it said Pages would
 * never read it.
 *
 * So what these check is the handoff that replaced it, in the two halves it
 * needs to work: the script that goes into the site's one 404 page, and the
 * router that reads what it left behind. A build with one half is a deep link
 * that fails again.
 */

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

/** The key the two halves meet on. Named once here so a rename that touches
 * only one side fails this file rather than production. */
const KEY = 'dowel.stand.redirect'

describe('a stand deep link on GitHub Pages', () => {
  it('is handed back to the stand by the site 404, not by a stand-local one', () => {
    const builder = read('tools/build-404.mjs')
    expect(builder).toContain(KEY)
    expect(builder, 'the handoff should send the reader to the stand').toContain('location.replace')

    // Into `<head>`: appending to the body paints the documentation's 404
    // first and then moves, which reads as a broken link that fixed itself.
    expect(builder).toContain('</head>')
  })

  it('is claimed by the router, which puts the real URL back', () => {
    const router = read('stand/src/router.ts')
    expect(router).toContain(KEY)
    // `replaceState`, not `pushState`: the redirect is not a place the back
    // button should return to.
    expect(router).toContain('replaceState')
  })

  it('does not rely on a stand-local 404, which Pages never reads', () => {
    const config = read('stand/vite.config.ts')
    expect(
      config.includes("'404.html'") || config.includes('"404.html"'),
      'the stand should not write its own 404.html; the site root owns that page',
    ).toBe(false)
  })

  it('is wired into the deploy, or the built site never gets the handoff', () => {
    // The script is not part of `pnpm build`; it runs against the assembled
    // site, after the stand has been copied under the docs.
    const workflow = read('.github/workflows/docs.yml')
    expect(workflow).toContain('tools/build-404.mjs')

    const copyAt = workflow.indexOf('docs/dist/stand')
    const buildAt = workflow.indexOf('tools/build-404.mjs')
    expect(copyAt, 'the stand should be copied in before the 404 is rewritten').toBeLessThan(
      buildAt,
    )
  })
})
