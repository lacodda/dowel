/*
 * The shadcn-compatible registry.
 *
 * Two kinds of item today: the theme, and an accent per product of the line.
 * Primitives join them when the component pipeline lands.
 *
 * The theme ships as a *file*, not as `cssVars`. That is a deliberate choice
 * and worth stating, because `cssVars` looks like the obvious home for a set
 * of tokens: its values are plain strings by schema, one flat level, no
 * at-rules. The theme is not that. It is `color-mix()` over a product's own
 * accent, `oklch(from …)` relative colour, a Tailwind `@theme` block, two
 * `prefers-color-scheme` blocks, a `prefers-reduced-motion` block and the
 * scrollbars. Decomposed into key-value pairs it would stop being the file
 * that was tested; shipped whole, what a product installs is what this
 * repository builds.
 *
 * Output goes to the docs site, so the registry is served from the same place
 * as the documentation that explains it.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lineProducts } from '../packages/dowel/src/line.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const outDir = resolve(root, 'docs/public/r')
const homepage = 'https://lacodda.github.io/dowel'

const theme = readFileSync(resolve(root, 'packages/dowel/src/theme.css'), 'utf8')

/** The theme, as a style that starts from nothing.
 *
 * `extends: none` is the whole point: dowel is not shadcn/ui with different
 * colours. Its vocabulary is its own, and the stock palette is deliberately
 * dropped, so inheriting shadcn's defaults would bring back exactly what the
 * theme removes. */
const themeItem = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  extends: 'none',
  name: 'theme',
  type: 'registry:style',
  title: 'dowel theme',
  description:
    "The token vocabulary of the lacodda line, in dark and light. A product sets `--accent-base` to its own colour and the theme derives the rest, including what colour text has to be on an accent fill.",
  files: [
    {
      path: 'dowel/theme.css',
      target: '~/dowel/theme.css',
      type: 'registry:file',
      content: theme,
    },
  ],
  docs: [
    'Import the theme, then your product accent:',
    '',
    "    @import './dowel/theme.css';",
    "    @import './dowel/accents/kilna.css';",
    '',
    'Outside the line, set the colour directly instead:',
    '',
    '    :root { --accent-base: #2f7d6b; }',
  ].join('\n'),
}

/*
 * One item per product. Each is a single declaration, and deliberately does
 * NOT depend on the theme item.
 *
 * Naming the theme in `registryDependencies` was the obvious thing to write
 * and wrong twice over. It made installing an accent re-install a theme the
 * project may already have and may have edited - the whole point of a registry
 * is that the copied file becomes yours - and it pinned an absolute URL that
 * does not resolve while the site is being built or served anywhere else.
 * The accent is a colour; the docs say what to import it after.
 */
const accentItems = lineProducts.map(({ name, code, accent, colorName }) => ({
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: `accent-${name}`,
  type: 'registry:file',
  title: `${name} accent`,
  description: `${colorName} ${accent} - the colour of the ${name} mark (${code}). Import after the theme.`,
  files: [
    {
      path: `dowel/accents/${name}.css`,
      target: `~/dowel/accents/${name}.css`,
      type: 'registry:file',
      content: `/*
 * ${name} - ${colorName} ${accent}, the colour of its mark (${code}).
 *
 * Import after the theme. Everything else - the hover shade, the soft fill,
 * the focus ring, the colour of text on an accent fill, and the trace of the
 * hue the greys carry - is derived from this one value.
 */
:root {
  --accent-base: ${accent};
}
`,
    },
  ],
}))

const items = [themeItem, ...accentItems]

mkdirSync(outDir, { recursive: true })

// One file per item, at the URL the CLI is given.
for (const item of items) {
  writeFileSync(resolve(outDir, `${item.name}.json`), `${JSON.stringify(item, null, 2)}\n`)
}

// The catalogue: what `shadcn list` and a namespace registration read. The
// per-item `$schema` is dropped here - the catalogue declares its own, and an
// item nested inside it is not a document of its own.
const registry = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  name: 'dowel',
  homepage,
  items: items.map((item) => {
    const entry = { ...item }
    delete entry.$schema
    return entry
  }),
}
writeFileSync(resolve(outDir, 'registry.json'), `${JSON.stringify(registry, null, 2)}\n`)

console.log(`registry: ${items.length} items`)
