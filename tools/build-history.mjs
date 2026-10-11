/*
 * The history of every item in the registry, read from git.
 *
 * A product copies a component and keeps it. Months later it upgrades
 * dowel-ui, `dowel diff` says Button differs from the registry, and the
 * question is the one the CHANGELOG cannot answer quickly: what happened to
 * *Button*, between the version I copied and this one. The CHANGELOG is by
 * release and by kind of change; this is the same history cut the other way,
 * by item - each release that changed the file a product copied, and the
 * commits that changed it.
 *
 * The source is the file, not the commit's scope. A commit scoped
 * `feat(fields)` that touched nine inputs changed nine copies, and every one
 * of them belongs in the history of each; a commit scoped `button` that only
 * touched the docs changed nobody's copy. What a product holds is the file,
 * so the file is what is asked about.
 *
 * Commits after the last tag belong to the version in the manifest once it
 * has been raised past that tag - the moment a release is being prepared -
 * and to nothing before that, so the file does not change with every commit
 * in between. The result is committed (`registry/history.json`) and held to
 * git by `tests/history.test.ts`; the package build copies it rather than
 * computing it, because the publishing checkout has no history to read.
 *
 *   node tools/build-history.mjs
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const defaultRoot = resolve(here, '..')

/** The item a changed path belongs to, or null for a path no item ships. */
export function itemOf(path) {
  const component = path.match(/^registry\/(?:ui|blocks)\/([a-z][a-z0-9-]*)\.tsx$/)
  if (component) return component[1]
  if (path === 'packages/dowel/src/theme.css') return 'theme'
  if (path === 'packages/dowel/src/prose.css') return 'prose'
  if (path === 'registry/files/AGENTS.md') return 'agents'
  return null
}

/** A Conventional Commits header, read: `feat(fields)!: set the size`. */
export function parseSubject(subject) {
  const match = subject.match(/^(\w+)(?:\(([^)]*)\))?(!)?: (.+)$/)
  if (!match) return { type: 'other', scope: null, breaking: false, summary: subject }
  return { type: match[1], scope: match[2] ?? null, breaking: match[3] === '!', summary: match[4] }
}

/** `0.10.0` after `0.9.0`, which a string sort gets wrong. */
function compareVersions(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i += 1) if (pa[i] !== pb[i]) return pa[i] - pb[i]
  return 0
}

/** The items the registry serves today: the files it is built from. */
function currentItems(root) {
  const names = new Set(['theme', 'prose', 'agents'])
  for (const dir of ['registry/ui', 'registry/blocks']) {
    for (const file of readdirSync(resolve(root, dir))) {
      if (file.endsWith('.tsx') && !file.endsWith('.test.tsx')) names.add(basename(file, '.tsx'))
    }
  }
  return names
}

/**
 * The history, as `{ [item]: [{ version, changes: [{ type, scope,
 * breaking, summary, date, commit }] }] }`, newest version first.
 *
 * Throws on a shallow clone rather than answering from the part of history
 * it can see: a history read from one commit says every item was born today.
 */
export function buildHistory(root = defaultRoot) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })

  if (git('rev-parse', '--is-shallow-repository').trim() === 'true') {
    throw new Error(
      'build-history: this is a shallow clone, and the history of the registry is the whole history. ' +
        'Check out with `fetch-depth: 0`.',
    )
  }

  const tags = git('tag', '--list', 'v*')
    .split('\n')
    .map((tag) => tag.trim())
    .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag))
    .map((tag) => tag.slice(1))
    .sort(compareVersions)

  const manifest = JSON.parse(readFileSync(resolve(root, 'packages/dowel/package.json'), 'utf8')).version
  const latest = tags.at(-1)

  // Each version and the range of commits it shipped.
  const ranges = tags.map((version, index) => ({
    version,
    range: index === 0 ? `v${version}` : `v${tags[index - 1]}..v${version}`,
  }))
  if (latest !== undefined && compareVersions(manifest, latest) > 0) {
    ranges.push({ version: manifest, range: `v${latest}..HEAD` })
  }

  const items = currentItems(root)
  const watched = ['registry/ui', 'registry/blocks', 'packages/dowel/src/theme.css', 'packages/dowel/src/prose.css', 'registry/files/AGENTS.md']
  const history = {}

  for (const { version, range } of ranges) {
    // Breaking is said in the header (`!`) or in a footer; the footer needs
    // the body, which is read only for the commits that have one.
    const breakingByFooter = new Set(
      git('log', '--no-merges', '--format=%H', '--grep=BREAKING CHANGE', range).split('\n').filter(Boolean),
    )
    const log = git('log', '--no-merges', '--format=%x00%H%x09%cs%x09%s', '--name-only', range, '--', ...watched)
    for (const entry of log.split('\0').filter((chunk) => chunk.trim() !== '')) {
      const [header, ...paths] = entry.split('\n')
      const [hash, date, subject] = header.split('\t')
      const parsed = parseSubject(subject)
      const change = {
        type: parsed.type,
        scope: parsed.scope,
        breaking: parsed.breaking || breakingByFooter.has(hash),
        summary: parsed.summary,
        date,
        commit: hash.slice(0, 10),
      }
      const touched = new Set(paths.map((path) => itemOf(path.trim())).filter((name) => name !== null && items.has(name)))
      for (const name of touched) {
        history[name] ??= []
        let release = history[name].find((entry) => entry.version === version)
        if (!release) {
          release = { version, changes: [] }
          history[name].push(release)
        }
        release.changes.push(change)
      }
    }
  }

  // Newest version first, and the items in a stable order, so a diff of the
  // file is a diff of the history rather than of the order it was read in.
  const sorted = {}
  for (const name of Object.keys(history).sort()) {
    sorted[name] = history[name].sort((a, b) => compareVersions(b.version, a.version))
  }
  return sorted
}

export function serialize(history) {
  return `${JSON.stringify(history, null, 2)}\n`
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const history = buildHistory()
  writeFileSync(resolve(defaultRoot, 'registry/history.json'), serialize(history))
  const changes = Object.values(history).reduce(
    (sum, releases) => sum + releases.reduce((count, release) => count + release.changes.length, 0),
    0,
  )
  console.log(`history: ${Object.keys(history).length} items, ${changes} changes`)
}
