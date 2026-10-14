import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, inject, it } from 'vitest'
import {
  classStrings,
  compiled,
  hasRule,
  isLoop,
  isMotion,
  motionSources,
  motionStrings,
  utilityOf,
  withoutComments,
} from './motion'

/*
 * Motion, held to the reader who asked for less of it.
 *
 * The theme carries one rule for `prefers-reduced-motion` - every transition
 * and animation cut to nothing - and every primitive leans on it. A rule that
 * everything leans on is only as good as the classes under it, so this gate
 * holds the classes:
 *
 * - every class of motion the set writes compiles to something. Eight
 *   primitives wrote `duration-quick` and `duration-base` for a dozen
 *   releases, and both compiled to nothing: the transitions ran on Tailwind's
 *   150ms, and no test, screenshot or reader noticed;
 * - every duration is one of the line's three steps, never a number;
 * - a loop says what it looks like standing still, rather than leaving the
 *   theme to stop it wherever its one fast turn happened to end;
 * - nothing moves by script, where the stylesheet's rule cannot reach;
 * - and, in a real browser, the rule takes every one of them to rest - and
 *   without the request, every duration resolves to a step.
 */

const sources = motionSources()
const strings = sources.flatMap((source) => motionStrings(source).map((classes) => ({ file: source.file, classes })))
const classes = [...new Set(strings.flatMap((string) => string.classes))].sort()

describe('the scanner', () => {
  it('finds motion in the shapes the set writes it', () => {
    expect(classStrings("cn(`${a}b`, 'flex transition-colors duration-150', \"animate-spin\")").flat().filter(isMotion)).toEqual([
      'transition-colors',
      'duration-150',
      'animate-spin',
    ])
    // The closing quote of a template is not the opening of a string: read
    // that way, the class below came out as `transition-colors',` and was
    // reported as compiling to nothing.
    expect(classStrings("a={`${id}n`} b={cn('p-1 transition-colors', 'x')} c={`${id}l`}").flat().filter(isMotion)).toEqual([
      'transition-colors',
    ])
    expect(isMotion('data-[orientation=vertical]:transition-[top,height]')).toBe(true)
    expect(isMotion('[transition:opacity_var(--duration-quick)_var(--ease-out)]')).toBe(true)
    expect(isMotion('motion-reduce:animate-none')).toBe(true)
    expect(isMotion('data-[starting-style]:opacity-0')).toBe(false)
    expect(utilityOf('group-data-[panel-open]:rotate-180')).toBe('rotate-180')
  })

  it('reads code, not the prose about it', () => {
    expect(classStrings(withoutComments(`/* \`animate-pulse bg-soft\` */\nconst a = 'transition-opacity'`)).flat()).toEqual([
      'transition-opacity',
    ])
  })

  it('finds the motion the set is known to have', () => {
    // A scanner gone blind passes every rule below; these are the ones it
    // must not miss.
    for (const known of ['transition-colors', 'duration-quick', 'duration-base', 'animate-spin', 'animate-pulse']) {
      expect(classes, known).toContain(known)
    }
    expect(classes.some((name) => name.startsWith('[transition:'))).toBe(true)
    expect(classes.some((name) => name.startsWith('animate-['))).toBe(true)
  })
})

describe('every class of motion', () => {
  it('compiles to something', async () => {
    const css = await compiled(classes)
    // The check is proven on a class that cannot exist before it is trusted
    // on the ones that should.
    expect(hasRule(await compiled(['duration-nowhere']), 'duration-nowhere')).toBe(false)
    const dead = classes.filter((name) => !hasRule(css, name))
    expect(dead, `these compile to nothing: ${dead.join(', ')}`).toEqual([])
  })

  it('takes its duration from the line’s steps, never a number', () => {
    const literal = strings.flatMap(({ file, classes: found }) =>
      found
        .filter((name) => {
          const utility = utilityOf(name)
          // A loop's period is the loop's own; it is brought to rest below.
          if (isLoop(name)) return false
          if (/^(duration|delay)-/.test(utility)) {
            return !/^(duration|delay)-(quick|base|slow|\(--duration-(quick|base|slow)\))$/.test(utility)
          }
          return /(^|[^\w-])\d*\.?\d+m?s(?![\w-])/.test(utility.replace(/var\([^)]*\)/g, ''))
        })
        .map((name) => `${file}: ${name}`),
    )
    expect(literal, 'a duration written as a number rather than a step').toEqual([])
  })
})

describe('a loop', () => {
  it('says what it looks like standing still', () => {
    // The theme's rule runs an animation once, for a hundredth of a
    // millisecond, and leaves it wherever that ended. A loop says its rest
    // itself - a still ring, a placeholder that does not breathe.
    const restless = sources
      .filter((source) => motionStrings(source).flat().some(isLoop))
      .filter((source) => !source.code.includes('motion-reduce:animate-none'))
      .map((source) => source.file)
    expect(restless).toEqual([])
  })

  it('is found where the set has one', () => {
    const looping = sources.filter((source) => motionStrings(source).flat().some(isLoop)).map((source) => source.file)
    expect(looping).toEqual(expect.arrayContaining(['ui/spinner.tsx', 'ui/skeleton.tsx', 'ui/splash.tsx']))
  })
})

describe('motion by script', () => {
  /** Calls that move something past the stylesheet, where the theme's rule
   * cannot reach. */
  const MOVES = [/\.animate\(/, /behavior:\s*['"]smooth['"]/]
  const moving = (code: string) => MOVES.some((pattern) => pattern.test(code))

  it('is seen when it is there', () => {
    expect(moving(`node.scrollIntoView({ behavior: 'smooth' })`)).toBe(true)
    expect(moving(`element.animate([{ opacity: 0 }], 200)`)).toBe(true)
    expect(moving(`list.scrollTop = 0`)).toBe(false)
  })

  it('asks the reader first, wherever it is used', () => {
    const unasked = sources
      .filter((source) => moving(source.code) && !source.code.includes('prefers-reduced-motion'))
      .map((source) => source.file)
    expect(unasked).toEqual([])
  })
})

describe('in a browser', () => {
  const measured = inject('motion')
  const seconds = (list: string) => list.split(',').map((value) => Number.parseFloat(value))

  it('measured every string of motion the set writes', () => {
    expect(measured.map((entry) => entry.classes)).toEqual(strings.map((string) => string.classes))
  })

  it('takes every transition and animation to rest for a reader who asked for less motion', () => {
    const moving = measured
      .filter(({ reduce }) => {
        const transitions = seconds(reduce.transitionDuration).some((value) => value > 0.00001)
        const animates =
          reduce.animationName !== 'none' &&
          (seconds(reduce.animationDuration).some((value) => value > 0.00001) || reduce.animationIterationCount !== '1')
        return transitions || animates
      })
      .map(({ file, classes: found, reduce }) => `${file}: ${found.join(' ')} -> ${JSON.stringify(reduce)}`)
    expect(moving).toEqual([])
  })

  it('stops every loop outright rather than after one fast turn', () => {
    const turning = measured
      .filter(({ classes: found }) => found.some(isLoop) && found.includes('motion-reduce:animate-none'))
      .filter(({ reduce }) => reduce.animationName !== 'none')
      .map(({ file }) => file)
    expect(turning).toEqual([])
  })

  it('times everything else by a step, for a reader who wants motion', () => {
    const theme = readFileSync(resolve(import.meta.dirname, '../packages/dowel/src/theme.css'), 'utf8')
    const steps = [...theme.matchAll(/--duration-(?:quick|base|slow):\s*(\d+)ms/g)].map((match) => Number(match[1]) / 1000)
    expect(steps).toHaveLength(3)
    const offStep = measured
      .filter(({ full }) => seconds(full.transitionDuration).some((value) => value !== 0 && !steps.includes(value)))
      .map(({ file, classes: found, full }) => `${file}: ${found.join(' ')} -> ${full.transitionDuration}`)
    expect(offStep).toEqual([])
  })

  it('moves at all without the request - the measurement is not of a page where nothing moves', () => {
    expect(measured.some(({ full }) => seconds(full.transitionDuration).some((value) => value > 0))).toBe(true)
    expect(measured.some(({ full }) => full.animationName !== 'none')).toBe(true)
  })
})
