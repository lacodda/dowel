/*
 * The documentation, in the form a machine reads.
 *
 * Three artefacts, all generated from the same MDX the site is built from, so
 * there is no second copy of the docs to go stale:
 *
 *   /llms.txt       - the index: what dowel is, and a link per page
 *   /llms-full.txt  - every page's prose, concatenated, in one request
 *   /<page>.md      - each page as plain Markdown, beside its HTML
 *
 * The last one is what an agent reaches for when it already knows which page
 * it wants, and it is the reason this is a generator rather than three hand-
 * written files: a page added to the site gets its Markdown twin without
 * anyone remembering to make one.
 *
 * What gets stripped, and why it is not simply deleted:
 *
 * A page is MDX. It imports Astro components and renders them - `<Stand>` is a
 * link to the live component, `<TokenTable>` and `<ScaleTable>` paint swatches,
 * `<AccentGallery>` draws the line's fourteen accents. Dropping those tags
 * silently would hand the reader a page with a hole in it: the token reference
 * would lose the tokens, which are the entire content of that page.
 *
 * So they are expanded rather than removed. A component that carries data
 * (`tokens={[...]}`) becomes that data as a list; one that carries a pointer
 * (`<Stand>`) becomes a sentence saying where it points. The rule is that
 * nothing the reader of the HTML page can see may be missing from the Markdown
 * twin without a sentence in its place.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const contentDir = resolve(root, 'docs/src/content/docs')
const outDir = resolve(root, 'docs/public')
const site = 'https://lacodda.github.io/dowel'

const packageVersion = JSON.parse(
  readFileSync(resolve(root, 'packages/dowel/package.json'), 'utf8'),
).version

/** Every documentation page, as `{ slug, title, description, body }`. */
function pages() {
  const found = []
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(resolve(dir, entry.name), `${prefix}${entry.name}/`)
        continue
      }
      if (!/\.mdx?$/.test(entry.name)) continue

      const source = readFileSync(resolve(dir, entry.name), 'utf8').replace(/\r\n/g, '\n')
      const name = entry.name.replace(/\.mdx?$/, '')
      // `index` is the site root, and Starlight serves it at `/`.
      const slug = name === 'index' ? '' : `${prefix}${name}`
      found.push({ slug, ...parse(source) })
    }
  }
  walk(contentDir, '')
  return found.sort((a, b) => a.slug.localeCompare(b.slug))
}

/** Frontmatter and body, with the MDX machinery turned into prose. */
function parse(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) throw new Error('a documentation page has no frontmatter')

  const [, frontmatter, rest] = match
  const field = (key) => {
    const line = frontmatter.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))
    return line ? line[1].trim().replace(/^['"]|['"]$/g, '') : ''
  }

  return { title: field('title'), description: field('description'), body: expand(rest, frontmatter) }
}

/*
 * Fenced code blocks are held aside for the whole of this pass.
 *
 * Every rule below rewrites a tag, and the examples are full of tags - a page
 * about the Dialog shows `<DialogPopup>` in a fence. Rewriting those would
 * corrupt the one part of the page a machine reader is most likely to copy.
 */
function withCodeHeld(text, transform) {
  const fences = []
  const held = text.replace(/```[\s\S]*?```/g, (block) => {
    fences.push(block)
    return ` FENCE${fences.length - 1} `
  })
  return transform(held).replace(/ FENCE(\d+) /g, (_, index) => fences[Number(index)])
}

/** The body with MDX turned into something readable on its own. */
function expand(body, frontmatter) {
  return withCodeHeld(body, (text) => {
    let out = text

    // Imports are machinery, and the components they name are handled below.
    out = out.replace(/^import .*(\n|$)/gm, '')

    // `<Stand>`: a link to the live component. The caption is the sentence
    // that says what is worth looking at, so it is kept.
    out = out.replace(
      /<Stand\s+component="([\w-]+)"(?:\s+caption="([^"]*)")?\s*\/>/g,
      (_, component, caption) =>
        `See it live on the stand: ${site}/stand/#${component}${caption ? `\n\n${caption}` : ''}`,
    )

    // `<TokenTable>` and `<ScaleTable>`: the swatches are a picture, but the
    // token list is the content. A reader of the Markdown gets the names.
    out = out.replace(/<(TokenTable|ScaleTable)\s+([\s\S]*?)\/>/g, (whole, _tag, props) => {
      const caption = props.match(/caption="([^"]*)"/)?.[1]
      const tokens = [...(props.match(/tokens=\{\[([\s\S]*?)\]\}/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map(
        (m) => `\`--${m[1]}\``,
      )
      if (!tokens.length) return whole
      return [caption, tokens.map((token) => `- ${token}`).join('\n')].filter(Boolean).join('\n\n')
    })

    // `<AccentGallery>`: fourteen product accents drawn in one theme. There is
    // no text equivalent, so it says what it is and where to look.
    out = out.replace(
      /<AccentGallery\s+mode="(\w+)"\s*\/>/g,
      (_, mode) =>
        `[The same screen in every accent of the line, ${mode} theme - see ${site}/reference/accents/]`,
    )

    // A splash page carries its hero in frontmatter, and the body starts
    // mid-thought without it.
    const tagline = frontmatter.match(/tagline:\s*(.*)/)?.[1]?.trim()
    if (tagline && /template:\s*splash/.test(frontmatter)) out = `${tagline}\n${out}`

    return out.replace(/\n{3,}/g, '\n\n').trim()
  })
}

/** Component tags left outside code: markup a machine reader receives as
 * noise, and the signal that a new Astro component needs a rule above.
 *
 * Inline code counts as code, not only fenced blocks. A page about the lint
 * rule discusses `<Select>` in single backticks and a props table names
 * `Ref<HTMLInputElement>`; reporting those would make this check noise, and a
 * check that cries wolf is one nobody reads the day it is right. */
export function remainingComponents(body) {
  const outsideCode = body.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '')
  const found = [...outsideCode.matchAll(/<([A-Z][A-Za-z]*)[\s/>]/g)].map((m) => m[1])
  return [...new Set(found)]
}

const all = pages()

/*
 * The index. `llms.txt` is a convention rather than a schema - an H1, a
 * blockquote summarising the project, then linked sections - and the links
 * point at the Markdown twins rather than at the HTML, because that is the
 * form the reader following them wants.
 */
const sections = [
  ['Start here', (page) => page.slug === '' || page.slug === 'getting-started'],
  ['Concepts', (page) => page.slug.startsWith('concepts/')],
  ['Components', (page) => page.slug.startsWith('components/')],
  ['Guides', (page) => page.slug.startsWith('guides/')],
  ['Reference', (page) => page.slug.startsWith('reference/')],
]

/*
 * A page belonging to no section would be dropped from the index and from the
 * full text, silently, while its Markdown twin still existed - so the site
 * would have a page the machine-readable half denies. That is exactly what
 * happened when `concepts/` was added: two pages, written and published,
 * missing from both.
 *
 * Failing here rather than in a test means it cannot be published at all.
 */
const unsectioned = all.filter((page) => !sections.some(([, belongs]) => belongs(page)))
if (unsectioned.length) {
  throw new Error(
    `no section in build-llms.mjs covers: ${unsectioned.map((page) => page.slug).join(', ')}`,
  )
}

const link = (page) =>
  `- [${page.title}](${site}/${page.slug ? `${page.slug}.md` : 'index.md'}): ${page.description}`

const index = [
  '# dowel',
  '',
  `> The lacodda line design system: theme tokens and React primitives, distributed as a shadcn-compatible registry. Version ${packageVersion}.`,
  '',
  'Components are copied into a project with `npx shadcn add <url>` rather than imported, so they become that project\'s own code. The theme is an npm package, `dowel-ui`. Every colour goes through a token and no component uses a `dark:` utility, so the same component is correct in both themes and in each product\'s accent.',
  '',
  ...sections.flatMap(([heading, belongs]) => {
    const matching = all.filter(belongs)
    return matching.length ? [`## ${heading}`, '', ...matching.map(link), ''] : []
  }),
  '## Registry',
  '',
  `- [Catalogue](${site}/r/registry.json): every item served - the theme, an accent per product, each component, and the sets`,
  `- [JSON Schema](${site}/r/schema.json): the shape of a dowel registry item, for validating or generating one`,
  `- Sets install in one command: \`app\`, \`forms\`, \`feedback\` at ${site}/r/app.json and siblings`,
  `- Each minor is also served frozen at \`${site}/r/v<major>.<minor>/\`, for an install that has to be repeatable`,
  '',
  '## Full text',
  '',
  `- [llms-full.txt](${site}/llms-full.txt): every page above, in one document`,
  '',
].join('\n')

writeFileSync(resolve(outDir, 'llms.txt'), index)

/* Every page in one document, in the order the index lists them. */
const full = [
  `# dowel ${packageVersion}`,
  '',
  'The complete documentation of the lacodda line design system, generated from the same sources the site is built from.',
  '',
  ...sections.flatMap(([, belongs]) =>
    all.filter(belongs).flatMap((page) => [
      '---',
      '',
      `# ${page.title}`,
      '',
      `Source: ${site}/${page.slug || ''}`,
      '',
      page.body,
      '',
    ]),
  ),
].join('\n')

writeFileSync(resolve(outDir, 'llms-full.txt'), full)

/* One Markdown twin per page, beside where its HTML will be served. */
let leftovers = 0
for (const page of all) {
  const path = page.slug ? `${page.slug}.md` : 'index.md'
  const target = resolve(outDir, path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(
    target,
    [`# ${page.title}`, '', `Source: ${site}/${page.slug || ''}`, '', page.body, ''].join('\n'),
  )
  leftovers += remainingComponents(page.body).length
}

console.log(
  `llms: ${all.length} pages, ${(full.length / 1024).toFixed(0)} kB full text` +
    (leftovers ? `, ${leftovers} unexpanded components` : ''),
)
