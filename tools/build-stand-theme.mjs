/*
 * The theme's `@theme` block, on its own, for the documentation site.
 *
 * The stand needs Tailwind to compile utilities from the line's vocabulary,
 * and that vocabulary lives in the theme's `@theme` block. It cannot simply
 * import the theme: the rest of that file paints `body`, claims the
 * scrollbars and declares tokens on `:root` - which would repaint Starlight
 * around the stand, and would put one theme on a page that shows both.
 *
 * So the block is extracted rather than copied. A copy would drift from the
 * package within a release, and the drift would be invisible: the stand would
 * keep rendering, just no longer showing what the package ships.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const theme = readFileSync(resolve(root, 'packages/dowel/src/theme.css'), 'utf8')

const start = theme.indexOf('@theme inline')
if (start === -1) throw new Error('the theme no longer has an `@theme inline` block')

let depth = 0
let end = -1
for (let i = theme.indexOf('{', start); i < theme.length; i++) {
  if (theme[i] === '{') depth++
  else if (theme[i] === '}') {
    depth--
    if (depth === 0) {
      end = i + 1
      break
    }
  }
}
if (end === -1) throw new Error('the `@theme inline` block is not closed')

const out = resolve(root, 'docs/src/styles/generated')
mkdirSync(out, { recursive: true })
writeFileSync(
  resolve(out, 'theme-block.css'),
  `/* Generated from packages/dowel/src/theme.css - do not edit. */\n${theme.slice(start, end)}\n`,
)

console.log('stand theme: extracted the @theme block')
