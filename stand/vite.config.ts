import { readFileSync, writeFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/*
 * The version shown on the stand is read from the package manifest, never
 * typed. A number a human keeps in sync is a number that drifts, and the
 * release-consistency gate exists because that already happened to the prose.
 */
const pkg = new URL('../packages/dowel/package.json', import.meta.url)
const version = JSON.parse(readFileSync(pkg, 'utf8')).version

/**
 * GitHub Pages serves static files and knows nothing about the stand's routes:
 * a reload on `/dowel/stand/button` looks for a file of that name and answers
 * 404. Pages does, however, serve `404.html` for every miss - so shipping the
 * built `index.html` under that name hands the miss back to the router, and
 * the deep link resolves. This is the standard trick, and the reason the stand
 * can have real URLs instead of anchors.
 */
function pagesDeepLinks(): Plugin {
  return {
    name: 'stand-pages-deep-links',
    apply: 'build',
    closeBundle() {
      const dir = new URL('./dist/', import.meta.url)
      writeFileSync(new URL('404.html', dir), readFileSync(new URL('index.html', dir)))
    },
  }
}

export default defineConfig({
  // Served under the project page alongside the documentation.
  base: '/dowel/stand/',
  plugins: [react(), tailwindcss(), pagesDeepLinks()],
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
