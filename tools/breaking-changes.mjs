/*
 * The breaking changes the changelog records, read back out of it.
 *
 * The upgrading guide lists every change that breaks a product, with the way
 * through it, and the list is not typed there: a second copy of the changelog
 * is a copy that goes stale the first release somebody forgets it. The
 * changelog is written by git-cliff from the commits, and each breaking commit
 * brings its own `BREAKING CHANGE:` paragraph saying what to do - so the page,
 * its Markdown twin and the test that holds them all read this one parser.
 *
 * The shape it reads is the one `cliff.toml` writes:
 *
 *   ## [0.35.0] - 2026-10-07
 *
 *   ### Breaking Changes
 *
 *   - **One list of commands for keys, palette and sheet**
 *   `useShortcut` is removed - declare
 *   ...
 *
 * A paragraph whose every line is indented is code - the before-and-after a
 * commit draws with `-` and `+` - and is kept as written.
 */

/**
 * @typedef {{ kind: 'text' | 'code', text: string }} Block
 * @typedef {{ title: string, blocks: Block[] }} BreakingChange
 * @typedef {{ version: string, date: string, changes: BreakingChange[] }} BreakingRelease
 */

/** Every release with a breaking change, newest first, as the changelog
 * lists them.
 * @param {string} changelog
 * @returns {BreakingRelease[]} */
export function breakingChanges(changelog) {
  const text = changelog.replace(/\r\n/g, '\n')
  const heads = [...text.matchAll(/^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})$/gm)]
  return heads
    .map((head, index) => {
      const end = index + 1 < heads.length ? heads[index + 1].index : text.length
      const section = text.slice(head.index + head[0].length, end)
      const found = /^### Breaking Changes$/m.exec(section)
      if (found === null) return { version: head[1], date: head[2], changes: [] }
      const rest = section.slice(found.index + found[0].length)
      const next = /^### /m.exec(rest)
      return { version: head[1], date: head[2], changes: changesIn(next === null ? rest : rest.slice(0, next.index)) }
    })
    .filter((release) => release.changes.length > 0)
}

/** @param {string} list @returns {BreakingChange[]} */
function changesIn(list) {
  const items = [...list.matchAll(/^- \*\*(.+)\*\*$/gm)]
  return items.map((item, index) => {
    const end = index + 1 < items.length ? items[index + 1].index : list.length
    const body = list.slice(item.index + item[0].length, end)
    return { title: item[1], blocks: blocksOf(body) }
  })
}

/** @param {string} body @returns {Block[]} */
function blocksOf(body) {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/^\n+|\s+$/g, ''))
    .filter((paragraph) => paragraph.trim() !== '')
    .map((paragraph) => {
      const lines = paragraph.split('\n')
      if (lines.every((line) => /^ {2}/.test(line))) {
        return { kind: 'code', text: lines.map((line) => line.slice(2)).join('\n') }
      }
      return { kind: 'text', text: lines.map((line) => line.trim()).join(' ') }
    })
}

/** The same list as Markdown, for the page's machine-readable twin.
 * @param {BreakingRelease[]} releases
 * @returns {string} */
export function breakingChangesMarkdown(releases) {
  return releases
    .map((release) =>
      [
        `### ${release.version} - ${release.date}`,
        ...release.changes.map((change) =>
          [
            `**${change.title}**`,
            ...change.blocks.map((block) => (block.kind === 'code' ? `\`\`\`diff\n${block.text}\n\`\`\`` : block.text)),
          ].join('\n\n'),
        ),
      ].join('\n\n'),
    )
    .join('\n\n')
}
