// The stylesheets ship as authored: not bundled, not minified. A product reads
// these declarations to learn the vocabulary, and Tailwind needs the `@theme`
// block intact to compile utilities from it.
//
// `prose.css` travels the same way and for a stronger reason: it is nothing
// but declarations, and a product that wants a different measure or a tighter
// rhythm overrides them with ordinary CSS.
import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

for (const name of ['theme.css', 'prose.css']) {
  copyFileSync(fileURLToPath(new URL(`../packages/dowel/src/${name}`, import.meta.url)), `dist/${name}`)
}
