import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { compile } from 'tailwindcss'

/*
 * The classes of motion the set writes, found in its source.
 *
 * Shared by the motion gate and the browser that measures it: both have to
 * agree on what counts as motion, or the browser measures one list and the
 * gate holds another.
 */

const root = resolve(import.meta.dirname, '..')

export interface MotionSource {
  /** `ui/spinner.tsx`, as the registry names the file. */
  file: string
  /** The code with its comments taken out: a class named in prose is not a
   * class anything is drawn with. */
  code: string
}

/** Every primitive and block, as shipped. */
export function motionSources(): MotionSource[] {
  return ['ui', 'blocks'].flatMap((dir) =>
    readdirSync(resolve(root, 'registry', dir))
      .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
      .map((file) => ({
        file: `${dir}/${file}`,
        code: withoutComments(readFileSync(resolve(root, 'registry', dir, file), 'utf8')),
      })),
  )
}

export function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
}

/** The utility a class ends in, past its variants: `transition-[top,height]`
 * for `data-[orientation=vertical]:transition-[top,height]`. A colon inside
 * brackets belongs to the value, not to a variant. */
export function utilityOf(name: string): string {
  let depth = 0
  let start = 0
  for (let at = 0; at < name.length; at++) {
    const char = name[at]
    if (char === '[' || char === '(') depth++
    else if (char === ']' || char === ')') depth--
    else if (char === ':' && depth === 0) start = at + 1
  }
  return name.slice(start).replace(/^!/, '')
}

/** Whether a class moves something, or says how fast something moves. */
export function isMotion(name: string): boolean {
  const utility = utilityOf(name)
  return /^(transition|duration|ease|delay|animate)(-|$)/.test(utility) || /^\[(transition|animation)[a-z-]*:/.test(utility)
}

/** Each string the code holds, split into classes: a class list is a string,
 * and one string is one element's worth of classes far more often than not. */
export function classStrings(code: string): string[][] {
  // Read left to right, a whole string at a time - a template literal with
  // `${}` in it included - so the closing quote of one string is never taken
  // for the opening of the next.
  return [...code.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)]
    .map((match) => (match[1] ?? match[2] ?? (match[3] ?? '').replace(/\$\{[^}]*\}/g, ' ')).split(/\s+/).filter(Boolean))
    .filter((classes) => classes.length > 0)
}

/** The motion each string of a source writes, one entry per string that has
 * any. */
export function motionStrings(source: MotionSource): string[][] {
  return classStrings(source.code)
    .map((classes) => classes.filter(isMotion))
    .filter((classes) => classes.length > 0)
}

/** Whether an animation repeats - the kind the theme's rule would run once
 * and leave wherever it stopped. */
export function isLoop(name: string): boolean {
  const utility = utilityOf(name)
  return /^animate-(spin|pulse|ping|bounce)$/.test(utility) || (/^animate-\[/.test(utility) && utility.includes('infinite'))
}

/** The theme and Tailwind, compiled for the classes given - what a product's
 * build makes of them. */
export async function compiled(classes: readonly string[]): Promise<string> {
  const theme = readFileSync(resolve(root, 'packages/dowel/src/theme.css'), 'utf8')
  const tailwindDir = resolve(root, 'node_modules/tailwindcss')
  const compiler = await compile(`@import 'tailwindcss';\n${theme}`, {
    base: root,
    loadStylesheet: async (id, base) => {
      const file = id === 'tailwindcss' ? 'index.css' : id.replace(/^tailwindcss\//, '')
      const path = resolve(tailwindDir, file)
      return { base, content: readFileSync(path, 'utf8'), path }
    },
  })
  return compiler.build([...classes])
}

/** A class as it appears in a selector: every character outside a-z, 0-9,
 * `-` and `_` escaped, as `CSS.escape` and Tailwind escape it. */
export function selectorOf(name: string): string {
  return `.${name.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`)}`
}

/** Whether the stylesheet has a rule for the class - the selector, followed by
 * something that ends a class name, so `.transition` is not found inside
 * `.transition-colors`. */
export function hasRule(css: string, name: string): boolean {
  const selector = selectorOf(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`${selector}(?![a-zA-Z0-9_\\\\-])`).test(css)
}
