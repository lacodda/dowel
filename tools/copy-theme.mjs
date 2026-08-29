// The theme ships as authored: not bundled, not minified. A product reads
// these declarations to learn the vocabulary, and Tailwind needs the `@theme`
// block intact to compile utilities from it.
import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const src = fileURLToPath(new URL('../packages/dowel/src/theme.css', import.meta.url))
copyFileSync(src, 'dist/theme.css')
