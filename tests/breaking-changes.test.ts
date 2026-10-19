import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { breakingChanges, breakingChangesMarkdown } from '../tools/breaking-changes.mjs'

/*
 * The upgrading guide's list of breaks, held to the changelog and to git.
 *
 * The page draws the list from CHANGELOG.md, so the page and the changelog
 * cannot part. What can go wrong is the reading: a heading git-cliff writes a
 * little differently, and the parser finds nothing - a page that says there
 * is nothing to do. So the parser is held to the commits themselves: every
 * release whose commits carry a breaking change is on the list.
 */

const root = resolve(import.meta.dirname, '..')
const changelog = readFileSync(resolve(root, 'CHANGELOG.md'), 'utf8')
const releases = breakingChanges(changelog)

describe('the parser', () => {
  it('reads a release, its breaks, their paragraphs and their code', () => {
    const text = [
      '## [0.8.0] - 2026-08-31',
      '',
      '### Breaking Changes',
      '',
      '- **Compose with `render`**',
      '`asChild` is replaced by `render`, which takes the',
      'element instead of a boolean.',
      '',
      '  - <Button asChild><a /></Button>',
      '  + <Button render={<a />} />',
      '',
      '- **A second one**',
      'Said in one line.',
      '',
      '### Bug Fixes',
      '- Not a break',
      '',
      '## [0.7.0] - 2026-08-30',
      '',
      '### Features',
      '- Nothing broke',
    ].join('\r\n')
    expect(breakingChanges(text)).toEqual([
      {
        version: '0.8.0',
        date: '2026-08-31',
        changes: [
          {
            title: 'Compose with `render`',
            blocks: [
              { kind: 'text', text: '`asChild` is replaced by `render`, which takes the element instead of a boolean.' },
              { kind: 'code', text: '- <Button asChild><a /></Button>\n+ <Button render={<a />} />' },
            ],
          },
          { title: 'A second one', blocks: [{ kind: 'text', text: 'Said in one line.' }] },
        ],
      },
    ])
  })

  it('writes code as a block of its own in the Markdown twin', () => {
    const markdown = breakingChangesMarkdown([
      { version: '0.8.0', date: '2026-08-31', changes: [{ title: 'T', blocks: [{ kind: 'code', text: '- a\n+ b' }] }] },
    ])
    expect(markdown).toContain('### 0.8.0 - 2026-08-31')
    expect(markdown).toContain('```diff\n- a\n+ b\n```')
  })
})

describe('the list the guide draws', () => {
  it('has every release whose commits broke something', () => {
    // From git rather than from the changelog: the changelog is what is read.
    // One walk of the history, oldest first, rather than a `git log` per tag -
    // forty processes took seven seconds on a Windows runner. A commit
    // belongs to the first tag at or after it.
    const log = execFileSync('git', ['log', '--reverse', '--decorate=short', '--format=%D%x01%s%n%b%x00', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
    })
    const breaking: string[] = []
    let broke = false
    for (const entry of log.split('\0')) {
      const [refs = '', message = ''] = entry.replace(/^\n/, '').split('\x01')
      if (/^\w+(\([^)]*\))?!:/.test(message.trim()) || /^BREAKING CHANGE:/m.test(message)) broke = true
      const tag = /tag: (v[\d.]+)/.exec(refs)?.[1]
      if (tag === undefined) continue
      if (broke) breaking.push(tag)
      broke = false
    }
    expect(breaking.length).toBeGreaterThanOrEqual(8)
    expect(releases.map((release) => `v${release.version}`).sort()).toEqual(expect.arrayContaining(breaking.sort()))
  })

  it('says what to do about each, not only what it is called', () => {
    for (const release of releases) {
      for (const change of release.changes) {
        expect(change.title, release.version).not.toBe('')
        expect(change.blocks.length, `${release.version}: ${change.title}`).toBeGreaterThan(0)
      }
    }
  })
})
