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
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
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
function siblingNames(source) {
  return [
    ...new Set(
      [...source.matchAll(/from\s+'\.\/([\w-]+)'/g)].map((match) => match[1]),
    ),
  ].sort()
}

const componentSources = readdirSync(componentDir)
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
  .map((file) => ({
    file,
    name: basename(file, '.tsx'),
    content: readFileSync(resolve(componentDir, file), 'utf8').replace(/\r\n/g, '\n'),
  }))

const componentItems = componentSources.map(({ file, name, content }) => {
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
    registryDependencies: siblingNames(content),
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

/*
 * Presets: a set installed by one command.
 *
 * A product does not start by wanting a Chip. It starts by wanting a screen,
 * and reaches for twelve primitives over the following week - which is twelve
 * commands, each of them a decision about whether this one is really needed
 * yet. The sets below are what the line's products actually converged on, read
 * off their installs rather than composed here: `app` is what kilna has after
 * moving over.
 *
 * A preset carries no files of its own. It is a `registry:style` whose whole
 * content is `registryDependencies`, so `shadcn add` resolves it into the same
 * per-component installs the reader could have typed - the copied files are
 * identical either way, and nothing about the preset survives in the consumer
 * project. That matters: a preset is a starting point, not a bundle to stay
 * subscribed to. Having installed `app`, a product removes what it does not
 * want and the preset has no opinion about it.
 *
 * `extends: none` for the same reason the theme states it: a set of dowel
 * components must not drag in shadcn's stock palette underneath.
 */
const presets = [
  {
    name: 'app',
    title: 'dowel app',
    description:
      'The set a product of the line actually starts from: the everyday controls, the overlays it needs on day one, and the ways of choosing something. What kilna has installed.',
    components: [
      'button',
      'input',
      'textarea',
      'panel',
      'badge',
      'kbd',
      'dialog',
      'confirm-dialog',
      'drawer',
      'menu',
      'select',
      'combobox',
      'toast',
    ],
    docs: 'Import the theme and your product accent first; these are the components on top of it.',
  },
  {
    name: 'forms',
    title: 'dowel forms',
    description:
      'What a form is made of: the fields, the two ways of choosing from a list, and the button that submits it.',
    components: [
      'button',
      'input',
      'textarea',
      'field',
      'checkbox',
      'radio-group',
      'switch',
      'select',
      'combobox',
      'chip',
    ],
    docs: 'Field wraps any of the controls: it is what ties a label, a hint and an error to the thing they belong to.',
  },
  {
    name: 'feedback',
    title: 'dowel feedback',
    description:
      'The three ways of saying that something happened - one that goes away, one that is still true after a reload, one that is true on every screen - and the dialog for anything that needs an answer.',
    components: ['toast', 'alert', 'banner', 'confirm-dialog'],
    docs: 'Which of the four to reach for is the harder question: see https://lacodda.github.io/dowel/guides/overlays/',
  },
]

/** The names a preset resolves to, its components' own siblings included.
 *
 * `shadcn add` does resolve dependencies recursively, so listing only the
 * named components would install correctly. It is written out in full anyway,
 * because the preset is also read: `shadcn list` prints these names, and a set
 * whose printed contents differ from what lands on disk is a set that has to
 * be traced through three files to understand. */
function resolvePreset(names) {
  const byName = new Map(componentItems.map((item) => [item.name, item]))
  const seen = new Set()
  const walk = (name) => {
    if (seen.has(name)) return
    seen.add(name)
    const item = byName.get(name)
    if (!item) throw new Error(`preset names \`${name}\`, which is not a component`)
    for (const sibling of item.registryDependencies) walk(sibling)
  }
  for (const name of names) walk(name)
  return [...seen].sort()
}

const presetItems = presets.map(({ name, title, description, components, docs }) => ({
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  extends: 'none',
  name,
  type: 'registry:style',
  title,
  description,
  registryDependencies: resolvePreset(components),
  docs,
}))

/*
 * The briefing a consumer project keeps for its own agents.
 *
 * A product on dowel has rules that are invisible from inside it: that the
 * components were copied rather than installed and re-adding overwrites edits;
 * that no colour is ever written down; that a `dark:` utility means a missing
 * token. An agent working in that repository cannot infer any of it from the
 * code - the code is simply a file in `components/ui` that looks ordinary.
 *
 * So it installs as an item, like anything else, rather than being a passage in
 * these docs that someone is supposed to copy by hand. It lands at the project
 * root, where the conventions put a file of this kind, and it is the consumer's
 * to edit afterwards.
 */
const agentsItem = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'agents',
  type: 'registry:file',
  title: 'Agent briefing',
  description:
    "What an agent working in a product on dowel has to know: that components are copied rather than installed, that no colour is ever written down, and where to look things up. Lands at the project root as AGENTS.md.",
  files: [
    {
      path: 'files/AGENTS.md',
      target: '~/AGENTS.md',
      type: 'registry:file',
      content: readFileSync(resolve(root, 'registry/files/AGENTS.md'), 'utf8').replace(/\r\n/g, '\n'),
    },
  ],
  docs: 'Replace `<product>` in the accent import with your own, and add whatever else your project expects of an agent.',
}

const items = [themeItem, ...accentItems, ...componentItems, ...presetItems, agentsItem]

/*
 * The registry is served twice.
 *
 * `/r/<name>.json` is the unpinned path and always the newest thing built: it
 * is what the README and the docs tell people to type, and what someone
 * installing a component today should get.
 *
 * `/r/v<major>.<minor>/<name>.json` is a snapshot, written once per minor and
 * never rewritten. It exists because a registry is not a package: nothing in
 * a consumer's lockfile records which version of a component was copied in,
 * so "install what I installed" has no other answer. Inside a snapshot the
 * cross-references point into the same snapshot, so a set installed from one
 * is the set that shipped with that version, down to the sibling a component
 * pulls in.
 *
 * Snapshots are committed rather than built on deploy, like the rest of the
 * registry - the docs workflow publishes `docs/public` as it stands.
 *
 * "Written once" is enforced rather than intended. The minor comes from the
 * package version, so every build between a release and the next version bump
 * targets the snapshot that has already shipped - and the work done in that
 * window is exactly the work that must not appear in it. v0.16 caught this:
 * four new components wrote themselves into the published v0.15 snapshot,
 * which is the one thing it promises never to do. An existing snapshot is now
 * left alone.
 */
const [major, minor] = packageVersion.split('.')
const snapshot = `v${major}.${minor}`
const snapshotDir = resolve(outDir, snapshot)
const snapshotExists = existsSync(snapshotDir)

/** The same items with sibling names turned into URLs against one base. */
function addressed(base) {
  return items.map((item) => {
    if (!item.registryDependencies?.length) return item
    return {
      ...item,
      registryDependencies: item.registryDependencies.map((name) => `${base}/${name}.json`),
    }
  })
}

/** Everything a registry serves, written into one directory. */
function write(dir, base) {
  const addressedItems = addressed(base)
  mkdirSync(dir, { recursive: true })

  // One file per item, at the URL the CLI is given.
  for (const item of addressedItems) {
    writeFileSync(resolve(dir, `${item.name}.json`), `${JSON.stringify(item, null, 2)}\n`)
  }

  // The catalogue: what `shadcn list` and a namespace registration read. The
  // per-item `$schema` is dropped here - the catalogue declares its own, and an
  // item nested inside it is not a document of its own.
  const registry = {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'dowel',
    homepage,
    items: addressedItems.map((item) => {
      const entry = { ...item }
      delete entry.$schema
      return entry
    }),
  }
  writeFileSync(resolve(dir, 'registry.json'), `${JSON.stringify(registry, null, 2)}\n`)
}

write(outDir, `${homepage}/r`)

/* The snapshot is written the first time this minor is built and never again.
 * Re-running the build after a release must not touch what that release
 * served, and the check is presence rather than a comparison: a snapshot that
 * differs from what shipped is not a snapshot to reconcile, it is one that
 * should never have been rewritten. */
if (snapshotExists) {
  console.log(`registry: ${snapshot} snapshot already exists, left untouched`)
} else {
  write(snapshotDir, `${homepage}/r/${snapshot}`)
}

/*
 * The catalogue also ships inside the package.
 *
 * Not to install from - `shadcn add` wants a URL, and the site serves one.
 * What it answers is "what is in this registry", for a reader that has the
 * package and not the network: a namespace registered in `components.json`, a
 * script deciding whether a component exists before shelling out to the CLI,
 * an agent given the dependency rather than the docs site. It is the version
 * that was installed, which is the version whose components the project has.
 *
 * Only the catalogue, not the per-item files: those carry every component's
 * full source, and a package is not a mirror of the registry.
 */
const catalogue = readFileSync(resolve(outDir, 'registry.json'), 'utf8')
writeFileSync(resolve(root, 'packages/dowel/dist/registry.json'), catalogue)

console.log(`registry: ${items.length} items, ${snapshotExists ? `${snapshot} snapshot kept` : `plus the ${snapshot} snapshot`}`)
