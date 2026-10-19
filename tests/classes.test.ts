import { describe, expect, it } from 'vitest'
import { classLists, hasRule, registrySources, utilityOf } from './classes'
import { compileClasses } from './compile'

/*
 * Every class the set writes compiles to something.
 *
 * Tailwind takes a class it cannot make and makes nothing: no error, no
 * warning, an element without the property. The set has paid for it three
 * times - `w-window-button` off a `--size-*` token (v0.29), `duration-quick`
 * and `duration-base` in eight primitives for a dozen releases (v0.37), and
 * TableHead's `z-sticky`, which let a table's pinned cells slide over its
 * header (found by kilna, v0.79). Each was found by somebody looking; this
 * finds the next one by compiling.
 *
 * Every class is put through the real compiler over the real theme, and each
 * must come out as a rule of its own. What counts as a class is the
 * scanner's (`classes.ts`): every word of a string in a class position, and
 * the words of any other string that holds at least one class.
 */

/** Words that are classes and compile to nothing on purpose: names that
 * other classes refer to, not rules of their own. Each with the reason. */
const MARKERS: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /^(group|peer)(\/[\w-]+)?$/,
    reason: 'Names an element for `group-*:` and `peer-*:` variants below or beside it to look at.',
  },
]

const isMarker = (name: string) => MARKERS.some(({ pattern }) => pattern.test(name))

const sources = registrySources()
const found = sources.flatMap((source) => classLists(source).map((list) => ({ file: source.file, ...list })))
const words = [...new Set(found.flatMap((list) => list.classes))].sort()

const lists = (text: string) => classLists({ file: 'probe.tsx', text })
const sureIn = (text: string) =>
  lists(text)
    .filter((list) => list.sure)
    .flatMap((list) => list.classes)
const looseIn = (text: string) =>
  lists(text)
    .filter((list) => !list.sure)
    .flatMap((list) => list.classes)

describe('the scanner', () => {
  it('is sure of a string where only classes go', () => {
    expect(sureIn(`<i className="flex gap-1" />`)).toEqual(['flex', 'gap-1'])
    expect(sureIn(`<i className={cn('p-1', open && 'z-sticky', wide ? 'w-full' : 'w-fit', className)} />`)).toEqual([
      'p-1',
      'z-sticky',
      'w-full',
      'w-fit',
    ])
    expect(sureIn(`<i contentClassName={'px-2'} />`)).toEqual(['px-2'])
    expect(sureIn('<i className={`flex ${gap} h-${size}`} />')).toEqual(['flex'])
  })

  it('reads where cva keeps its classes, and nothing else of its config', () => {
    const code = `cva('inline-flex', {
      variants: { size: { sm: 'h-6', md: ['h-8', 'px-3'] } },
      compoundVariants: [{ size: 'sm', tone: 'quiet', class: 'text-dim' }],
      defaultVariants: { size: 'md' },
    })`
    expect(sureIn(code)).toEqual(['inline-flex', 'h-6', 'h-8', 'px-3', 'text-dim'])
    expect(looseIn(code)).toEqual([])
  })

  it('does not take an operand, a key or another attribute for a class list', () => {
    const code = `
      'use client'
      import { x } from './button'
      const a = cn(variant === 'ghost' && 'bg-soft', map['p-9'], format('w-9'))
      const b = <i type="button" aria-label="flex" role="grid" />
      switch (side) { case 'h-4': break }`
    expect(sureIn(code)).toEqual(['bg-soft'])
    expect(looseIn(code)).toEqual([])
  })

  it('keeps a string held elsewhere as a list that may be one', () => {
    expect(looseIn(`const slot = 'flex shrink-0 [&_svg]:size-3'`)).toEqual(['flex', 'shrink-0', '[&_svg]:size-3'])
    expect(looseIn(`const sizes = { sm: 'h-6 px-2' }`)).toEqual(['h-6', 'px-2'])
  })

  it('finds the classes the set is known to write', () => {
    // A scanner gone blind passes the gate below; these it must not miss.
    for (const known of ['sticky', 'target-min', 'caption', 'h-control', 'sr-only', 'focus-visible:outline-accent']) {
      expect(words, known).toContain(known)
    }
    expect(found.filter((list) => list.sure).length).toBeGreaterThan(500)
    expect(found.some((list) => !list.sure && list.classes.includes('shrink-0'))).toBe(true)
  })
})

describe('every class the set writes', () => {
  it('compiles to a rule of its own', async () => {
    // Proven on a class that cannot exist before it is trusted on the ones
    // that should.
    expect(hasRule(await compileClasses(['z-nowhere']), 'z-nowhere')).toBe(false)
    expect(hasRule(await compileClasses(['z-10']), 'z-10')).toBe(true)

    const css = await compileClasses(words)
    const live = new Set(words.filter((name) => hasRule(css, name)))
    const dead = found.flatMap(({ file, line, classes, sure }) => {
      // A loose string is a class list only when it holds a class.
      if (!sure && !classes.some((name) => live.has(name))) return []
      return classes.filter((name) => !live.has(name) && !isMarker(name)).map((name) => `${file}:${line} ${name}`)
    })
    expect(dead, 'these compile to nothing').toEqual([])
  })

  it('names no marker the set has stopped writing', () => {
    const unused = MARKERS.filter(({ pattern }) => !words.some((name) => pattern.test(name)))
    expect(unused.map(({ pattern }) => String(pattern))).toEqual([])
    // A marker is a whole word, never a utility with a variant in front.
    expect(words.filter((name) => isMarker(name) && utilityOf(name) !== name)).toEqual([])
  })
})
