import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildHistory, itemOf, parseSubject, serialize } from '../tools/build-history.mjs'

/*
 * The history of each item is git's, and the committed file has to say what
 * git says.
 *
 * It is committed because the places that read it - the package build, the
 * docs - run from a checkout with no history. So it can fall behind: a
 * release prepared without regenerating it ships a history that stops a
 * version short. This reads git again and compares, which needs the whole
 * history: CI checks out with `fetch-depth: 0`, and a shallow clone fails
 * here with a message saying so rather than passing on what it cannot see.
 */

const root = resolve(import.meta.dirname, '..')

describe('the history', () => {
  it('is what git says', () => {
    const committed = readFileSync(resolve(root, 'registry/history.json'), 'utf8').replace(/\r\n/g, '\n')
    expect(
      committed === serialize(buildHistory(root)),
      'registry/history.json is behind git: run `node tools/build-history.mjs` and commit it',
    ).toBe(true)
  })

  it('reads the same history in one pass as release by release', () => {
    // The one pass is what runs; the release-by-release road is what a merge
    // in the history would force. Both answer here, and must agree.
    expect(buildHistory(root)).toEqual(buildHistory(root, { exact: true }))
  }, 30_000)

  it('knows the components, the theme, prose and the briefing', () => {
    const history = buildHistory(root)
    for (const name of ['button', 'theme', 'prose', 'input']) expect(history[name], name).toBeDefined()
  })
})

describe('the documentation', () => {
  it('draws the history on every component and block page', () => {
    // Through Starlight's MarkdownContent, once, rather than a line in each
    // page that the next page forgets.
    const config = readFileSync(resolve(root, 'docs/astro.config.mjs'), 'utf8')
    expect(config).toContain("MarkdownContent: './src/components/MarkdownContent.astro'")
    expect(config).toContain("routeMiddleware: './src/route-data.ts'")
    const override = readFileSync(resolve(root, 'docs/src/components/MarkdownContent.astro'), 'utf8')
    expect(override).toContain('<History')
    const pages = readFileSync(resolve(root, 'docs/src/lib/history.ts'), 'utf8')
    expect(pages, 'the pages that carry a history').toContain('(components|blocks)')
  })
})

describe('reading a path', () => {
  it('names the item a file ships as', () => {
    expect(itemOf('registry/ui/button.tsx')).toBe('button')
    expect(itemOf('registry/blocks/login-screen.tsx')).toBe('login-screen')
    expect(itemOf('packages/dowel/src/theme.css')).toBe('theme')
  })

  it('ignores what no product copies', () => {
    // A test changes nobody's copy.
    expect(itemOf('registry/ui/button.test.tsx')).toBeNull()
    expect(itemOf('stand/src/App.tsx')).toBeNull()
  })
})

describe('reading a commit', () => {
  it('reads a Conventional Commits header', () => {
    expect(parseSubject('fix(fields): set typed text at 16px')).toEqual({
      type: 'fix',
      scope: 'fields',
      breaking: false,
      summary: 'set typed text at 16px',
    })
  })

  it('reads the mark of a breaking change', () => {
    expect(parseSubject('feat(commands)!: one list').breaking).toBe(true)
  })

  it('keeps a header it cannot read, whole', () => {
    expect(parseSubject('Merge something')).toEqual({ type: 'other', scope: null, breaking: false, summary: 'Merge something' })
  })
})
