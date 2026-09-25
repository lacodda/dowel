import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { RuleTester } from 'eslint'
import { describe, expect, it } from 'vitest'
import tseslint from 'typescript-eslint'
import dowel, { RADIUS_STEPS, TYPE_STEPS, findArbitraryScale, noArbitraryScale } from './index.js'

/*
 * The rule that keeps sizes on the scale.
 *
 * Two jobs, and each needs its own proof: a length that IS a step written the
 * long way is rewritten to the step, byte for byte, and a length off the
 * scale is reported and left alone - a fix there would be a decision the
 * rule has no right to make. And the other side of both: nothing computed or
 * proportional is touched, because those are relationships, not lengths.
 */

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

ruleTester.run('no-arbitrary-scale', noArbitraryScale, {
  valid: [
    { code: 'const a = <div className="text-sm h-control gap-1.5 rounded-md" />' },
    // Computed, relative, proportional: relationships, not lengths.
    { code: 'const a = <div className="w-[min(22rem,calc(100vw-2rem))] h-[var(--plot)]" />' },
    { code: 'const a = <div className="max-w-[44ch] w-[70%] h-[100dvh] size-[1em] grid-cols-[1fr_auto]" />' },
    { code: 'const a = <div className="leading-[var(--cell)] rounded-[inherit] tracking-[var(--x)]" />' },
    // Not a class at all.
    { code: "const url = 'https://example.com/h-[22px]x'" },
    { code: "const a = 'text-[var(--size)]'" },
  ],
  invalid: [
    // A step written the long way: rewritten to the step.
    {
      code: 'const a = <p className="text-[12px] text-dim" />',
      output: 'const a = <p className="text-sm text-dim" />',
      errors: 1,
    },
    {
      code: "const a = cn('rounded-[9px]', 'hover:text-[10px]')",
      output: "const a = cn('rounded-md', 'hover:text-2xs')",
      errors: 2,
    },
    {
      code: 'const a = <div className="h-[22px] -mt-[2px] mt-[-4px] gap-[3px] p-[0.5rem]" />',
      output: 'const a = <div className="h-5.5 -mt-0.5 -mt-1 gap-hair p-2" />',
      errors: 5,
    },
    {
      code: 'const a = <span className="tracking-[0.085em] data-[open]:leading-[14px] [&_svg]:size-[16px]" />',
      output: 'const a = <span className="tracking-caption data-[open]:leading-3.5 [&_svg]:size-4" />',
      errors: 3,
    },
    // Off the scale: reported, left for a person.
    { code: 'const a = <p className="text-[13px]" />', output: null, errors: 1 },
    { code: 'const a = <p className="rounded-[7px] h-[13px] tracking-[0.08em]" />', output: null, errors: 3 },
    // In a template: reported, not rewritten.
    { code: 'const a = `text-[12px] ${b}`', output: null, errors: 1 },
  ],
})

describe('findArbitraryScale', () => {
  it('names the steps either side of an off-scale size', () => {
    const [finding] = findArbitraryScale('text-[13px]')
    expect(finding?.message).toContain('`text-sm` (12px)')
    expect(finding?.message).toContain('`text-base` (14px)')
    expect(finding?.fix).toBeUndefined()
  })

  it('reads longer utilities before the shorter ones inside them', () => {
    // `min-w` is not `w`, and `rounded-tl` is not `rounded`.
    expect(findArbitraryScale('min-w-[24px]')[0]?.fix).toBe('min-w-6')
    expect(findArbitraryScale('rounded-tl-[12px]')[0]?.fix).toBe('rounded-tl-lg')
  })

  it('says why, not merely that', () => {
    // A rule that only says "forbidden" gets an exemption written for it.
    expect(findArbitraryScale('h-[13px]')[0]?.message).toMatch(/chosen by eye/)
  })
})

describe('the scales it knows are the theme', () => {
  // The rule carries the steps as numbers, because a lint rule cannot read a
  // stylesheet. The numbers are held to the theme here, so a step renamed or
  // moved there cannot leave the rule fixing towards a size that is gone.
  const theme = readFileSync(resolve(import.meta.dirname, '../theme.css'), 'utf8')

  it('knows the type steps the theme declares, and no others', () => {
    const declared = Object.fromEntries(
      [...theme.matchAll(/--text-(\w+):\s*(\d+)px;/g)].map((match) => [Number(match[2]), match[1]]),
    )
    expect(TYPE_STEPS).toEqual(declared)
  })

  it('knows the radius steps the theme declares, and no others', () => {
    const declared = Object.fromEntries(
      [...theme.matchAll(/--radius-([\w-]+):\s*(\d+)px;/g)].map((match) => [Number(match[2]), match[1]]),
    )
    expect(RADIUS_STEPS).toEqual(declared)
  })
})

describe('the plugin', () => {
  it('turns the rule on for every source', () => {
    expect(dowel.configs.recommended[0]?.rules?.['dowel/no-arbitrary-scale']).toBe('error')
    expect(dowel.rules?.['no-arbitrary-scale']).toBe(noArbitraryScale)
  })
})
