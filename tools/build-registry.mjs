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
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { lineProducts } from '../packages/dowel/src/line.ts'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const outDir = resolve(root, 'docs/public/r')
const homepage = 'https://lacodda.github.io/dowel'

/*
 * Line endings are normalised on the way in. The registry embeds the theme as
 * a JSON string, and a checkout on Windows hands back CRLF for a file written
 * with LF - which lands in the JSON as `\r\n` and makes the generated registry
 * differ by platform. Committed on one machine, regenerated on another, it
 * would read as stale when nothing had changed; and a consumer would receive
 * whichever endings the publisher's checkout happened to have.
 */
const theme = readFileSync(resolve(root, 'packages/dowel/src/theme.css'), 'utf8').replace(/\r\n/g, '\n')

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

/*
 * Components, read from `registry/ui`.
 *
 * The entry is derived from the file rather than written beside it: the npm
 * dependencies are the ones it actually imports, so a component that grows a
 * dependency and does not declare it - the failure that only shows up in
 * someone else's install - cannot happen.
 */
const componentDir = resolve(root, 'registry/ui')

/*
 * The version of the package a component needs.
 *
 * A component imports `cn` from `dowel-ui`, and a bare `dowel-ui` in the
 * dependency list installs whatever is latest - which, at the moment a
 * component gains an API, is the version that does not have it yet. Installing
 * Button on the day it was written failed exactly that way: `Module
 * '"dowel-ui"' has no exported member 'cn'`.
 *
 * So the registry pins the version being released alongside it. `^` because a
 * later minor still has the API; the floor is what matters.
 */
const packageVersion = JSON.parse(
  readFileSync(resolve(root, 'packages/dowel/package.json'), 'utf8'),
).version

/** npm packages a source file imports, ignoring its own siblings. */
function npmDependencies(source) {
  const specifiers = [...source.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1])
  return [
    ...new Set(
      specifiers
        .filter((name) => !name.startsWith('.'))
        // React is a peer of any React component and is always already there;
        // declaring it would reinstall it in every consumer.
        .filter((name) => name !== 'react' && name !== 'react-dom')
        // Scoped packages keep both segments: `@radix-ui/react-slot`.
        .map((name) => (name.startsWith('@') ? name.split('/').slice(0, 2).join('/') : name.split('/')[0])),
    ),
  ]
    .sort()
    .map((name) => (name === 'dowel-ui' ? `dowel-ui@^${packageVersion}` : name))
}

/*
 * Components this one imports from.
 *
 * A primitive that reuses a sibling - the textarea shares the input's field
 * styling - needs it installed too, or the copied file arrives with an import
 * that does not resolve.
 *
 * The name has to be a full URL, and that is not a preference. A bare `input`
 * in `registryDependencies` means *shadcn's* input: the CLI resolves plain
 * names against shadcn/ui, and it duly installed a stranger's component next
 * to ours, whose `fieldClasses` the textarea then could not find. The URL says
 * which registry, and it is built from the homepage rather than written out,
 * because a hardcoded absolute URL is what broke the accents.
 */
function siblingDependencies(source) {
  return [
    ...new Set(
      [...source.matchAll(/from\s+'\.\/([\w-]+)'/g)].map((match) => match[1]),
    ),
  ]
    .sort()
    .map((name) => `${homepage}/r/${name}.json`)
}

const componentItems = readdirSync(componentDir)
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
  .map((file) => {
    const name = basename(file, '.tsx')
    const content = readFileSync(resolve(componentDir, file), 'utf8').replace(/\r\n/g, '\n')
    const title = name.charAt(0).toUpperCase() + name.slice(1)

    // The first paragraph of the file's own block comment, so the description
    // and the code cannot disagree about what the component is for.
    const doc = content.match(/\/\*\n \* [A-Z][^\n]*\n \*\n \* ([\s\S]*?)\.\n/)
    const description = doc ? `${doc[1].replace(/\n \* /g, ' ').trim()}.` : `The ${name} primitive.`

    return {
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      name,
      type: 'registry:ui',
      title,
      description,
      dependencies: npmDependencies(content),
      registryDependencies: siblingDependencies(content),
      files: [
        {
          path: `ui/${file}`,
          target: `@ui/${file}`,
          type: 'registry:ui',
          content,
        },
      ],
    }
  })

const items = [themeItem, ...accentItems, ...componentItems]

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
