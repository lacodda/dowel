import { RuleTester } from 'eslint'
import { describe, expect, it } from 'vitest'
import dowel, { findRawColor, noRawColor } from './index.js'

/*
 * The rule that keeps colour out of components.
 *
 * Tested from both ends. `findRawColor` is checked directly, string by string,
 * because the patterns are the rule and each one has to be able to fail alone.
 * Then the rule itself is run through ESLint's own tester on real source, so
 * that a correct matcher wired to the wrong visitor - a literal never read, a
 * template piece skipped - cannot pass.
 */

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

describe('findRawColor', () => {
  const rejected: [string, string][] = [
    ['#d9569e', 'a six-digit hex'],
    ['#fff', 'a three-digit hex'],
    ['#d9569e80', 'a hex with alpha'],
    ['rgb(217 86 158)', 'an rgb() colour'],
    ['rgba(217, 86, 158, 0.16)', 'an rgba() colour'],
    ['hsl(320 66% 59%)', 'an hsl() colour'],
    ['bg-zinc-800', "Tailwind's stock palette"],
    ['hover:text-red-500/50', 'a stock colour behind a variant and an opacity'],
    ['dark:bg-neutral-900', 'a dark: utility'],
    ['flex items-center dark:text-text', 'a dark: utility mid-string'],
    ['bg-white', 'opaque white'],
    ['text-black', 'opaque black'],
    ['hover:text-white', 'opaque white behind a variant'],
  ]

  for (const [text, what] of rejected) {
    it(`rejects ${what}`, () => {
      expect(findRawColor(text), `\`${text}\` passed`).toBeDefined()
    })
  }

  const allowed = [
    // The vocabulary itself.
    'bg-accent text-on-accent hover:bg-accent-2',
    'rounded-md border border-line text-dim',
    'bg-accent-soft/60',
    // The theme's own derivation, which is how a token is allowed to be built.
    'color-mix(in oklab, var(--accent-base) 16%, transparent)',
    'oklch(from var(--accent-base) 0.5 c h)',
    // Translucent black and white, which are not theme colours that failed to
    // be named: a scrim is made of black, and a label over a picture is made
    // of white, whatever the theme does. kilna had eleven of these and every
    // one was correct - which is how this exemption was found.
    'fixed inset-0 bg-black/50 backdrop-blur-[2px]',
    'shrink-0 text-white/50 hover:text-white/80',
    'rounded-[4px] bg-black/35 px-0.5 py-px',
    // Words that merely look like the patterns.
    '#section-title',
    'grid-cols-3',
    'gap-500',
    'darkroom',
    'translate-y-500',
  ]

  for (const text of allowed) {
    it(`allows \`${text}\``, () => {
      expect(findRawColor(text), `\`${text}\` was reported`).toBeUndefined()
    })
  }

  it('separates an opaque absolute from a translucent one', () => {
    // The distinction is the whole exemption, and a regex that dropped the
    // lookahead would still pass every other case in this file.
    expect(findRawColor('bg-black')).toBeDefined()
    expect(findRawColor('bg-black/50')).toBeUndefined()
    expect(findRawColor('text-white')).toBeDefined()
    expect(findRawColor('text-white/70')).toBeUndefined()
  })

  it('names the theme in the dark: message, not just the colour', () => {
    // The two messages exist because the fixes differ: a stock colour is
    // swapped for a token, a `dark:` utility is deleted outright.
    const dark = findRawColor('dark:bg-raise')?.message ?? ''
    const raw = findRawColor('#fff')?.message ?? ''
    expect(dark).not.toBe(raw)
    expect(dark).toMatch(/theme/i)
  })
})

// `RuleTester` declares its own suites, so it runs at the top level: called
// from inside an `it` it would be nesting a suite in a test.
ruleTester.run('no-raw-color', noRawColor, {
  valid: [
    { code: "const c = 'bg-accent text-on-accent'" },
    { code: 'const c = `rounded-md ${extra}`' },
    { code: "const c = { primary: 'bg-accent', ghost: 'border-line' }" },
  ],
  invalid: [
    { code: "const c = 'bg-[#d9569e]'", errors: 1 },
    {
      // Inside a cva variant map, which is where a colour actually gets
      // written in this codebase.
      code: "const v = { variants: { tone: { bad: 'text-red-500' } } }",
      errors: 1,
    },
    {
      // A template piece: the literal visitor never sees this one.
      code: 'const c = `flex ${gap} dark:bg-raise`',
      errors: 1,
    },
  ],
})

describe('the plugin', () => {
  it('exposes the rule under the name the config uses', () => {
    const configured = dowel.configs.recommended[0]?.rules?.['dowel/no-raw-color']
    expect(configured).toBe('error')
    expect(dowel.rules?.['no-raw-color']).toBe(noRawColor)
  })

  it('applies only to TypeScript sources', () => {
    // The theme is CSS and the build tools are Node; neither is a component,
    // and the theme is the one place a raw colour belongs.
    expect(dowel.configs.recommended[0]?.files).toEqual(['**/*.{ts,tsx}'])
  })
})
