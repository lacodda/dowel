import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { rewriteRenamed } from './codemod.js'
import { run } from './index.js'
import { renamedIn, scanSource } from './scan.js'
import type { Deprecation } from '../deprecated.js'

/*
 * A name of dowel's own that has moved, as a product meets it.
 *
 * The table is empty until something is renamed, so the commands run here over a
 * table of made-up renames: this is the path a real one will take on the day, and
 * a report that first runs that day is a report nobody has read.
 */

const ROWS = vi.hoisted(() => {
  const dates = { since: '1.1.0', removeIn: '2.0.0' }
  return [
    { kind: 'token', from: 'old-ink', to: 'dim', ...dates },
    { kind: 'utility', from: 'h-old', to: 'h-control', ...dates },
    { kind: 'item', from: 'old-button', to: 'button', ...dates },
  ] as Deprecation[]
})

vi.mock('../deprecated.js', async (original) => ({
  ...(await original<typeof import('../deprecated.js')>()),
  deprecations: ROWS,
}))

let directory: string
let out: string[]

beforeEach(() => {
  directory = mkdtempSync(resolve(tmpdir(), 'dowel-renamed-'))
  out = []
  vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    out.push(String(chunk))
    return true
  })
  vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
    out.push(String(chunk))
    return true
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  rmSync(directory, { recursive: true, force: true })
})

const printed = () => out.join('')

function file(path: string, contents: string): void {
  const full = resolve(directory, path)
  mkdirSync(resolve(full, '..'), { recursive: true })
  writeFileSync(full, contents)
}

const read = (path: string) => readFileSync(resolve(directory, path), 'utf8')

const [token, utility, item] = ROWS as [Deprecation, Deprecation, Deprecation]

describe('finding a renamed name', () => {
  it('finds a token as a property and as a utility', () => {
    const source = '<div className="text-old-ink hover:bg-old-ink" style={{ color: "var(--old-ink)" }} />'
    expect(renamedIn(source, token).map((found) => [found.text, found.to])).toEqual([
      ['--old-ink', '--dim'],
      ['text-old-ink', 'text-dim'],
      ['bg-old-ink', 'bg-dim'],
    ])
  })

  it('points at the name, not at what came before it', () => {
    const source = 'const a = "hover:text-old-ink"'
    const [found] = renamedIn(source, token)
    expect(source.slice(found!.index, found!.index + found!.text.length)).toBe('text-old-ink')
  })

  it('finds a utility exactly, under any variant', () => {
    expect(renamedIn('"h-old sm:h-old"', utility).map((found) => found.text)).toEqual(['h-old', 'h-old'])
  })

  it.each([
    ['a longer token', '.x { color: var(--old-ink-soft); }', token],
    ['a longer utility', '"text-old-ink-soft"', token],
    ['a utility inside a word', '"custom-text-old-ink"', token],
    ['a longer class', '"h-older"', utility],
    ['a class inside a word', '"mh-old"', utility],
    ['an import of something longer', "import x from './old-button-group'", item],
  ])('leaves %s alone', (_what, source, row) => {
    expect(renamedIn(source, row)).toEqual([])
  })

  it('finds an item where it is imported', () => {
    const source = "import { OldButton } from '@/components/ui/old-button'"
    expect(renamedIn(source, item).map((found) => [found.text, found.to])).toEqual([['old-button', 'button']])
  })

  it('takes a name literally, whatever it contains', () => {
    const row = { ...utility, from: 'h-old.5' }
    expect(renamedIn('"h-old.5"', row)).toHaveLength(1)
    expect(renamedIn('"h-oldx5"', row)).toHaveLength(0)
  })
})

describe('reporting it', () => {
  it('says what it became and when the old name goes', () => {
    const [finding] = scanSource('.x { color: var(--old-ink); }', 'a.css', [token])
    expect(finding).toMatchObject({ kind: 'renamed', text: '--old-ink', replacement: { kind: 'token', token: '--dim' } })
    expect(finding!.message).toBe('`--old-ink` was renamed `--dim` in 1.1.0; the old name goes in 2.0.0.')
  })

  it('reads a stylesheet’s `@apply` too', () => {
    expect(scanSource('.x { @apply text-old-ink; }', 'a.css', [token])).toHaveLength(1)
  })

  it('does not report the theme’s own alias', () => {
    // A copied theme declares the old name on purpose: it is what keeps every
    // other file working.
    const theme = ':root { --accent-base: #123456; --old-ink: var(--dim); }'
    expect(scanSource(theme, 'dowel/theme.css', [token])).toEqual([])
  })

  it('says nothing with an empty table', () => {
    expect(scanSource('.x { color: var(--old-ink); }', 'a.css', [])).toEqual([])
  })
})

describe('rewriting it', () => {
  it('rewrites every form, and nothing else', () => {
    const { source, edits } = rewriteRenamed('<div className="text-old-ink h-old" style={{ color: "var(--old-ink)" }} />', ROWS)
    expect(source).toBe('<div className="text-dim h-control" style={{ color: "var(--dim)" }} />')
    expect(edits).toHaveLength(3)
  })

  it('applies a rename whose result is longer than the old name', () => {
    // From the end of the file, or each edit moves the offsets of the next.
    const { source } = rewriteRenamed('"h-old h-old h-old"', ROWS)
    expect(source).toBe('"h-control h-control h-control"')
  })

  it('records the line each edit is on, in order', () => {
    const { edits } = rewriteRenamed('"h-old"\n\n"text-old-ink"', ROWS)
    expect(edits).toEqual([
      { line: 1, from: 'h-old', to: 'h-control' },
      { line: 3, from: 'text-old-ink', to: 'text-dim' },
    ])
  })

  it('leaves an import of a renamed item to `shadcn add`', () => {
    const input = "import { X } from '@/components/ui/old-button'"
    expect(rewriteRenamed(input, ROWS)).toEqual({ source: input, edits: [] })
  })

  it('does not read the output of another row', () => {
    const chain: Deprecation[] = [
      { ...utility, from: 'h-a', to: 'h-b' },
      { ...utility, from: 'h-b', to: 'h-c' },
    ]
    expect(rewriteRenamed('"h-a h-b"', chain).source).toBe('"h-b h-c"')
  })
})

describe('check', () => {
  it('warns, and does not fail: the old name still works', () => {
    file('src/a.tsx', 'export const a = <div className="text-old-ink" />')
    expect(run(['check', '--cwd', directory])).toBe(0)
    expect(printed()).toContain('moved')
    expect(printed()).toContain('`--old-ink` was renamed `--dim`')
    expect(printed()).toContain('1 renamed')
    expect(printed()).toContain('can be rewritten')
  })

  it('still fails over anything that does not work', () => {
    file('src/a.tsx', 'export const a = <div className="text-old-ink bg-muted" />')
    expect(run(['check', '--cwd', directory])).toBe(1)
  })

  it('tells a machine the same thing, with the same exit code', () => {
    file('src/a.tsx', 'export const a = <div className="text-old-ink" />')
    expect(run(['check', '--cwd', directory, '--json'])).toBe(0)
    const { findings } = JSON.parse(printed())
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ kind: 'renamed', text: 'text-old-ink', replacement: { token: 'text-dim' } })
  })

  it('is not read as nothing to migrate', () => {
    file('src/a.tsx', 'export const a = <div className="text-old-ink" />')
    run(['check', '--cwd', directory])
    expect(printed()).not.toContain('Nothing to migrate')
  })
})

describe('codemod', () => {
  it('plans first, and writes when asked', () => {
    file('src/a.tsx', 'export const a = <div className="text-old-ink" />')
    run(['codemod', '--cwd', directory])
    expect(printed()).toContain('text-old-ink')
    expect(printed()).toContain('text-dim')
    expect(read('src/a.tsx')).toContain('text-old-ink')

    run(['codemod', '--cwd', directory, '--write'])
    expect(read('src/a.tsx')).toBe('export const a = <div className="text-dim" />')
  })

  it('carries a stock name and a renamed one in the same file', () => {
    file('src/a.tsx', 'export const a = <div className="bg-muted text-old-ink" />')
    run(['codemod', '--cwd', directory, '--write'])
    expect(read('src/a.tsx')).toBe('export const a = <div className="bg-soft text-dim" />')
  })

  it('leaves the alias in a copied theme alone', () => {
    const theme = ':root { --accent-base: #123456; --old-ink: var(--dim); }\n'
    file('src/dowel/theme.css', theme)
    run(['codemod', '--cwd', directory, '--write'])
    expect(read('src/dowel/theme.css')).toBe(theme)
  })
})

describe('diff', () => {
  const button = { name: 'button', type: 'registry:ui', files: [{ path: 'ui/button.tsx', content: 'import "dowel-ui"\n' }] }

  it('compares a copy under its old name with the item it became', () => {
    file('node_modules/dowel-ui/package.json', JSON.stringify({ name: 'dowel-ui', version: '1.1.0' }))
    file('node_modules/dowel-ui/dist/registry.json', JSON.stringify({ items: [button] }))
    file('src/components/ui/old-button.tsx', 'import "dowel-ui"\nexport const edited = 1\n')
    run(['diff', '--cwd', directory, '--json'])
    const { changed, local } = JSON.parse(printed())
    expect(changed.map((copy: { name: string }) => copy.name)).toEqual(['button'])
    expect(local).toEqual([])
  })
})
