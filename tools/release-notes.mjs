/*
 * The pictures in a release note.
 *
 * A release of a design system is mostly a change in how something looks,
 * and the note said so in words only: "set the caption in dim", "stand on the
 * control rows". The reader who wants to know whether to take the release
 * has to open the stand and remember what it looked like before.
 *
 * So the note shows them. Every item the release added or changed the look
 * of - a `feat`, a `fix`, a `perf` or a `style` that touched its file, read
 * from `registry/history.json` - is drawn with the stand's own picture of it:
 * the visual gate's baseline, recorded in CI before the tag and committed
 * with it. The image is linked at the tag rather than at `main`, so the note
 * goes on showing what that release looked like after the next one changes
 * it. The pictures are of the stand, which is drawn on an invented world -
 * nothing in a release note is anybody's.
 *
 * Appended to git-cliff's notes by `.github/workflows/release.yml`:
 *
 *   node tools/release-notes.mjs v0.36.0
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const defaultRoot = resolve(here, '..')

export const REPOSITORY = 'lacodda/dowel'
export const STAND = 'https://lacodda.github.io/dowel/stand'
const BASELINES = 'tests/visual/stand.spec.ts-snapshots'

/** The kinds of change that can change how an item looks. A refactor, a
 * test or a comment changes nobody's picture. */
const LOOKS = new Set(['feat', 'fix', 'perf', 'style'])

/** At most this many pictures; past it, a note is a scroll nobody finishes. */
export const LIMIT = 12

/**
 * The section, as Markdown - or an empty string when the release changed the
 * look of nothing the stand draws.
 *
 * `history` is `registry/history.json`; `titles` maps an item to the name
 * the registry gives it; `baselines` is the set of picture files there are.
 */
export function screensSection({ tag, history, titles, baselines, limit = LIMIT }) {
  const version = tag.replace(/^v/, '')
  const shown = []

  for (const [name, releases] of Object.entries(history)) {
    const release = releases.find((entry) => entry.version === version)
    if (!release || !release.changes.some((change) => LOOKS.has(change.type))) continue
    const picture = `${name}-dark-chromium-linux.png`
    if (!baselines.has(picture)) continue
    // New when this release is the oldest the item has.
    const isNew = releases.at(-1).version === version
    shown.push({ name, picture, isNew, title: titles.get(name) ?? name })
  }
  if (shown.length === 0) return ''

  // New first, then changed; within each, by name, so the order is stable.
  shown.sort((a, b) => Number(b.isNew) - Number(a.isNew) || a.name.localeCompare(b.name))
  const drawn = shown.slice(0, limit)

  const lines = [
    '### On the stand',
    '',
    'What this release added or changed the look of, as the stand draws it - the dark theme, on invented data.',
    '',
  ]
  for (const item of drawn) {
    lines.push(`**${item.title}** - ${item.isNew ? 'new' : 'changed'} · [live](${STAND}/${item.name})`, '')
    lines.push(`![${item.title}](https://raw.githubusercontent.com/${REPOSITORY}/${tag}/${BASELINES}/${item.picture})`, '')
  }
  if (shown.length > drawn.length) {
    const rest = shown.slice(drawn.length).map((item) => `[${item.title}](${STAND}/${item.name})`)
    lines.push(`And ${rest.length} more: ${rest.join(', ')}.`, '')
  }
  return lines.join('\n')
}

/** Everything `screensSection` needs, read from the repository. */
export function readInputs(root = defaultRoot) {
  const history = JSON.parse(readFileSync(resolve(root, 'registry/history.json'), 'utf8'))
  const catalogue = JSON.parse(readFileSync(resolve(root, 'docs/public/r/registry.json'), 'utf8'))
  const titles = new Map(catalogue.items.map((item) => [item.name, item.title]))
  const dir = resolve(root, BASELINES)
  const baselines = new Set(existsSync(dir) ? readdirSync(dir) : [])
  return { history, titles, baselines }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const tag = process.argv[2]
  if (!tag || !/^v\d+\.\d+\.\d+$/.test(tag)) {
    console.error('usage: node tools/release-notes.mjs v0.36.0')
    process.exit(2)
  }
  const section = screensSection({ tag, ...readInputs() })
  if (section) process.stdout.write(`\n${section}`)
}
