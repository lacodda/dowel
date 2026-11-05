import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { cn } from '../packages/dowel/src/cn'

/*
 * `cn` lets the caller win, over every word the theme has.
 *
 * `tailwind-merge` only recognises a size it has been told about. Every word here
 * is read from the theme, so a token added there without a line in `cn.ts` fails
 * by name, instead of a product finding out that its `h-auto` did nothing.
 */

const theme = readFileSync(resolve(import.meta.dirname, '../packages/dowel/src/theme.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
)

const steps = (namespace: string) => [
  ...new Set([...theme.matchAll(new RegExp(`(?<![\\w-])--${namespace}-([a-z0-9-]+)\\s*:`, 'g'))].map((match) => match[1]!)),
].filter((step) => !step.endsWith('-'))

const handWritten = [...theme.matchAll(/@utility\s+([\w-]+)/g)].map((match) => match[1]!)

describe('a word of the theme, against the utility that overrules it', () => {
  it.each(steps('spacing').map((step) => [step]))('`%s` as a width, a height and a padding', (step) => {
    expect(cn(`w-${step}`, 'w-4')).toBe('w-4')
    expect(cn(`h-${step}`, 'h-auto')).toBe('h-auto')
    expect(cn(`p-${step}`, 'p-1')).toBe('p-1')
    expect(cn(`min-h-${step}`, 'min-h-0')).toBe('min-h-0')
  })

  it.each(steps('radius').map((step) => [step]))('`rounded-%s`', (step) => {
    expect(cn(`rounded-${step}`, 'rounded-none')).toBe('rounded-none')
  })

  it.each(steps('shadow').map((step) => [step]))('`shadow-%s`', (step) => {
    expect(cn(`shadow-${step}`, 'shadow-none')).toBe('shadow-none')
  })

  it.each(steps('tracking').map((step) => [step]))('`tracking-%s`', (step) => {
    expect(cn(`tracking-${step}`, 'tracking-normal')).toBe('tracking-normal')
  })

  it.each(steps('transition-duration').map((step) => [step]))('`duration-%s`', (step) => {
    expect(cn(`duration-${step}`, 'duration-75')).toBe('duration-75')
  })

  it.each(steps('size').map((step) => [step]))('`size-%s`', (step) => {
    expect(cn(`size-${step}`, 'size-4')).toBe('size-4')
  })

  it.each(steps('text').filter((step) => !step.includes('--')).map((step) => [step]))('`text-%s`', (step) => {
    expect(cn(`text-${step}`, 'text-[10px]')).toBe('text-[10px]')
  })

  it.each(steps('font-weight').map((step) => [step]))('`font-%s`', (step) => {
    expect(cn(`font-${step}`, 'font-bold')).toBe('font-bold')
  })

  it.each(handWritten.filter((name) => /^(?:h|py)-/.test(name)).map((name) => [name]))('`%s`', (name) => {
    const [utility] = name.split('-')
    expect(cn(name, `${utility}-1`)).toBe(`${utility}-1`)
  })
})

describe('the words themselves', () => {
  it('read a width and a height of the theme, so the lists above are not empty', () => {
    expect(steps('spacing')).toContain('rail')
    expect(steps('radius')).toContain('inner')
    expect(steps('shadow')).toContain('float')
    expect(handWritten).toContain('h-control')
  })

  it('overrule each other, last one winning', () => {
    expect(cn('h-control', 'h-control-sm')).toBe('h-control-sm')
    expect(cn('rounded-lg', 'rounded-inner')).toBe('rounded-inner')
    expect(cn('shadow-lift', 'shadow-float')).toBe('shadow-float')
    expect(cn('w-4', 'w-rail')).toBe('w-rail')
    expect(cn('duration-quick', 'duration-base')).toBe('duration-base')
  })

  it('do not take each other for something else', () => {
    // An ink and a size, a shadow's size and its colour: two utilities that both
    // start `text-` or `shadow-` and do not conflict.
    expect(cn('text-2xs', 'text-dim')).toBe('text-2xs text-dim')
    expect(cn('shadow-float', 'shadow-accent')).toBe('shadow-float shadow-accent')
    expect(cn('h-control', 'w-rail', 'py-row')).toBe('h-control w-rail py-row')
  })

  it('still join and drop what clsx does', () => {
    expect(cn('a', false, null, undefined, ['b', { c: true, d: false }])).toBe('a b c')
  })
})
