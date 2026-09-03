import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/*
 * The version shown on the stand is read from the package manifest, never
 * typed. A number a human keeps in sync is a number that drifts, and the
 * release-consistency gate exists because that already happened to the prose.
 */
const pkg = new URL('../packages/dowel/package.json', import.meta.url)
const version = JSON.parse(readFileSync(pkg, 'utf8')).version

/*
 * There is no `404.html` here on purpose.
 *
 * Writing the built index to `stand/dist/404.html` is the standard trick for a
 * client-routed app on Pages, and here it does nothing: Pages serves the 404
 * at the *site* root for every miss on the site, and this stand is published
 * under a documentation site that owns that page. A stand-local copy is never
 * consulted - the deep link came back as the docs' "page not found", which
 * looks like a bad link rather than a server that has not been told about
 * client routes.
 *
 * The handoff lives in `tools/build-404.mjs`, which teaches the site's one 404
 * page to give a stand path back to the stand.
 */

export default defineConfig({
  // Served under the project page alongside the documentation.
  base: '/dowel/stand/',
  plugins: [react(), tailwindcss()],
  define: {
    __DOWEL_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias: {
      // What a copied component imports; here it is the source next door.
      'dowel-ui': new URL('../packages/dowel/src/index.ts', import.meta.url).pathname,
    },
  },
})
