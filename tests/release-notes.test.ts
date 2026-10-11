import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { History } from '../tools/build-history.mjs'
import { LIMIT, readInputs, screensSection } from '../tools/release-notes.mjs'

/*
 * The pictures a release note carries: what the release added or changed the
 * look of, drawn by the stand, linked at the tag.
 */

const root = resolve(import.meta.dirname, '..')

const change = (type: string) => ({ type, scope: null, breaking: false, summary: 'x', date: '2026-10-11', commit: 'abc' })

const HISTORY: History = {
  button: [
    { version: '0.36.0', changes: [change('fix')] },
    { version: '0.4.0', changes: [change('feat')] },
  ],
  frame: [{ version: '0.36.0', changes: [change('feat')] }],
  table: [{ version: '0.36.0', changes: [change('refactor')] }],
  theme: [{ version: '0.36.0', changes: [change('feat')] }],
  input: [{ version: '0.35.0', changes: [change('fix')] }],
}

const TITLES = new Map([
  ['button', 'Button'],
  ['frame', 'Frame'],
  ['table', 'Table'],
])

const pictures = (...names: string[]) => new Set(names.map((name) => `${name}-dark-chromium-linux.png`))

const notes = (history = HISTORY, baselines = pictures('button', 'frame', 'table', 'input')) =>
  screensSection({ tag: 'v0.36.0', history, titles: TITLES, baselines })

describe('the pictures in a release note', () => {
  it('draws what the release added, first, and what it changed', () => {
    const text = notes()
    expect(text.indexOf('**Frame** - new')).toBeGreaterThan(-1)
    expect(text.indexOf('**Button** - changed')).toBeGreaterThan(text.indexOf('**Frame** - new'))
  })

  it('links each picture at the tag, so the note keeps showing that release', () => {
    expect(notes()).toContain(
      '![Frame](https://raw.githubusercontent.com/lacodda/dowel/v0.36.0/tests/visual/stand.spec.ts-snapshots/frame-dark-chromium-linux.png)',
    )
  })

  it('leaves out a change that cannot have changed the look', () => {
    // A refactor of Table changed nobody's picture.
    expect(notes()).not.toContain('Table')
  })

  it('leaves out what the stand does not draw', () => {
    // The theme has no picture of its own.
    expect(notes()).not.toContain('**theme**')
  })

  it('leaves out what another release changed', () => {
    expect(notes()).not.toContain('Input')
  })

  it('says nothing when nothing looks different', () => {
    expect(notes({ table: HISTORY.table! })).toBe('')
  })

  it('stops at a dozen and names the rest', () => {
    const many: History = {}
    const names = Array.from({ length: LIMIT + 3 }, (_, index) => `item-${String(index).padStart(2, '0')}`)
    for (const name of names) many[name] = [{ version: '0.36.0', changes: [change('feat')] }]
    const text = notes(many, pictures(...names))
    expect(text.match(/!\[/g)).toHaveLength(LIMIT)
    expect(text).toContain('And 3 more:')
  })

  it('reads the real repository', () => {
    // v0.35.0 added ShortcutsDialog and changed Kbd: both have pictures.
    const text = screensSection({ tag: 'v0.35.0', ...readInputs(root) })
    expect(text).toContain('**ShortcutsDialog** - new')
    expect(text).toContain('**Kbd** - changed')
    const workflow = readFileSync(resolve(root, '.github/workflows/release.yml'), 'utf8')
    expect(workflow, 'the release workflow does not append the pictures').toContain('node tools/release-notes.mjs')
  })
})
