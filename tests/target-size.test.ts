import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { compile } from 'tailwindcss'
import { describe, expect, it } from 'vitest'

/*
 * How small a thing you are asked to click is allowed to be.
 *
 * WCAG 2.2 puts the floor at 24 CSS pixels (2.5.8, AA) and the set was under
 * it in three places out of four - measured on the stand, not guessed: a
 * chip's cross at 16, Copyable at 19, CopyButton at 21, a search field's clear
 * at 24. One set, four answers to one question, and nowhere the answer was
 * written down.
 *
 * The failure this prevents is a quiet one. A cross missed by a thumb on a
 * tablet, or by a hand that is not steady, does not remove the tag - and does
 * not report anything either. Nothing on the screen says the press was a near
 * miss, so the reader presses again, and the product looks broken rather than
 * small.
 *
 * **Why the classes are compiled rather than read.** `size-4` is 16px only
 * because the theme says a spacing step is 0.25rem; `size-6` is 24px for the
 * same reason. A gate matching class names would be asserting against a
 * convention it cannot see, and would go on passing if the step ever changed.
 * So the real compiler runs over the real theme, and what is checked is the
 * pixels it produces.
 *
 * What the gate cannot see is layout: a control made large by its padding, by
 * a parent's `items-stretch`, or by the text beside it. That is why the escape
 * is a named one - `target-min` - and not a threshold. A primitive is either
 * big enough by its own declared size, or it says out loud that it grows its
 * hit area.
 */

const root = resolve(import.meta.dirname, '..')
const componentDir = resolve(root, 'registry/ui')
const theme = readFileSync(resolve(root, 'packages/dowel/src/theme.css'), 'utf8')
const tailwindDir = resolve(root, 'node_modules/tailwindcss')

/** The floor, read from the theme rather than repeated here - a second copy of
 * the number is a second thing to forget. */
const FLOOR = Number(theme.match(/--size-target:\s*(\d+)px/)?.[1])

const components = readdirSync(componentDir)
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
  .map((file) => ({
    name: file.replace(/\.tsx$/, ''),
    source: readFileSync(resolve(componentDir, file), 'utf8'),
  }))

async function build(classes: string[]): Promise<string> {
  const compiler = await compile(`@import 'tailwindcss';\n${theme}`, {
    base: root,
    loadStylesheet: async (id, base) => {
      const file = id === 'tailwindcss' ? 'index.css' : id.replace(/^tailwindcss\//, '')
      const path = resolve(tailwindDir, file)
      return { base, content: readFileSync(path, 'utf8'), path }
    },
  })
  return compiler.build(classes)
}

/** What a class is worth in pixels, per property, according to the compiler.
 *
 * `rem` is resolved at 16px, which is the browser default and what every
 * product of the line ships - the theme sets no root font size. A product that
 * changed it would scale the whole interface, floor included. */
async function pixelsOf(classes: string[]): Promise<Map<string, Record<string, number>>> {
  const css = await build(classes)
  const found = new Map<string, Record<string, number>>()

  for (const name of classes) {
    /*
     * Tailwind escapes `.`, `/`, `[`, `]` and the rest with a backslash in the
     * selector it writes, so `size-3.5` comes out as `.size-3\.5`. The pattern
     * has to match that literal backslash - and building it by escaping the
     * class name for a regex does the opposite of what it looks like: the `\.`
     * is read as a regex dot, which matches any character, so the rule found
     * is a neighbour's or none.
     *
     * `py-0.5` and `size-3.5` both went missing that way, which is how it was
     * noticed - the two classes this gate most needed to see.
     */
    const selector = [...name]
      .map((char) => (/[a-z0-9-]/i.test(char) ? char : `\\\\${char}`))
      .join('')
    const rule = css.match(new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`))
    if (!rule) continue

    const sizes: Record<string, number> = {}
    for (const [, property, value] of rule[1]!.matchAll(
      /(width|height|min-width|min-height|padding[a-z-]*)\s*:\s*([^;]+)/g,
    )) {
      const px = value!.match(/^([\d.]+)px$/)
      const rem = value!.match(/^([\d.]+)rem$/)
      const calc = value!.match(/calc\(var\(--spacing\)\s*\*\s*([\d.]+)\)/)
      // One whole step is written without the multiplication: `p-1` compiles
      // to a bare `var(--spacing)`, not to `calc(var(--spacing) * 1)`.
      const bare = /^var\(--spacing\)$/.test(value!.trim())
      if (px) sizes[property!] = Number(px[1])
      else if (rem) sizes[property!] = Number(rem[1]) * 16
      // `--spacing` is 0.25rem, so a step is four pixels.
      else if (calc) sizes[property!] = Number(calc[1]) * 4
      else if (bare) sizes[property!] = 4
    }
    if (Object.keys(sizes).length > 0) found.set(name, sizes)
  }

  return found
}

/**
 * Every element in the source that a pointer is asked to hit, with the classes
 * it carries.
 *
 * Only `<button>` is looked at, and deliberately so: a primitive that makes
 * something clickable any other way is already breaking a rule the set has -
 * `Chip` exists because every product made its cross a `<span>` - and the
 * budget gate catches a bare `onClick` on a div. What is measured here is the
 * thing that is honestly a control.
 */
function buttonsIn(source: string): Array<{ at: number; classes: string[]; glyph?: number }> {
  const buttons: Array<{ at: number; classes: string[]; glyph?: number }> = []

  // Comments explain why a control is a real button rather than a span - the
  // set has that argument written down in four files - and the word `<button`
  // appears in them. Measuring prose would report sizes for elements that do
  // not exist.
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/^[ \t]*\/\/.*$/gm, (line) => line.replace(/[^\n]/g, ' '))

  for (const match of code.matchAll(/<button\b/g)) {
    const start = match.index
    // The element's own attributes end at the first `>` that is not inside a
    // brace expression - `className={cn(...)}` may contain one in an arrow.
    let depth = 0
    let end = start
    for (let i = start; i < source.length; i += 1) {
      const char = source[i]
      if (char === '{') depth += 1
      else if (char === '}') depth -= 1
      else if (char === '>' && depth === 0) {
        end = i
        break
      }
    }

    const tag = code.slice(start, end)
    // Every bare string in the tag - `cn('a b', cond && 'c')` included. The
    // conditional ones count: a variant that is sometimes small is small.
    const classes = [...tag.matchAll(/'([^']*)'/g)]
      .flatMap((literal) => literal[1]!.split(/\s+/))
      .filter((name) => /^[a-z[]/.test(name))

    // What stands inside it, up to the closing tag - enough to tell a glyph
    // from a line of text, which is what a padded button's height is built
    // from. A rough slice is the right tool: this is not a parser, and the
    // question it answers is only "how tall is the thing in the middle".
    const closing = code.indexOf('</button>', end)
    let body = closing > end ? code.slice(end, closing) : ''

    /*
     * A glyph is often a component of its own - `<Tick />`, `<Clipboard />` -
     * declared further down the same file, and its size lives in there. Read
     * literally, the body of such a button holds no size at all, and the gate
     * would report the control as unmeasurable and pass it.
     *
     * That is not hypothetical: `CopyButton` is exactly this shape, and it is
     * one of the three that measured under the floor on the stand. So a local
     * component named in the body is pulled in and measured with it.
     */
    for (const [, local] of body.matchAll(/<([A-Z]\w*)\s*\/?>/g)) {
      const declared = code.match(new RegExp(`function ${local}\\b[\\s\\S]*?\\n\\}`))
      if (declared) body += declared[0]
    }

    const glyphs = [...body.matchAll(/\bsize-([\d.]+)\b/g)].map(
      (match) => Number(match[1]) * 4,
    )
    const heights = [...body.matchAll(/\bh-([\d.]+)\b/g)].map((match) => Number(match[1]) * 4)
    // An `<svg height="13">` states its size outright, which is how most of
    // the set's icons are drawn.
    const attrs = [...body.matchAll(/\bheight="(\d+)"/g)].map((match) => Number(match[1]))
    const inside = [...glyphs, ...heights, ...attrs]

    buttons.push({
      at: start,
      classes,
      // The tallest thing inside sets the box.
      glyph: inside.length > 0 ? Math.max(...inside) : undefined,
    })
  }

  return buttons
}

/**
 * How tall and wide a set of classes makes the control.
 *
 * Not simply a search for `h-*` and `w-*`. The set's small controls are small
 * in two different ways, and only one of them declares a size: `Chip`'s cross
 * is `size-4`, while `CopyButton` is `p-1` around a glyph and `Copyable` is
 * `py-0.5` around a line of `text-xs`. Both of the latter measured under the
 * floor on the stand - 21 and 19 pixels - and a gate that only read `h-*`
 * would have called them fine.
 *
 * So a height is either declared or built: the content's own height plus the
 * padding above and below it. The content is a glyph when the button holds one
 * (`size-3.5` on an icon is 14px) and a line of text otherwise, in which case
 * the type step's line height is what the box is.
 *
 * Width is only reported when it is declared. A button's width is its content,
 * and its content is usually the product's own word - unknowable here, and
 * usually wide enough that the height is the side that fails.
 */
function declaredSize(
  classes: string[],
  pixels: Map<string, Record<string, number>>,
  content: { glyph?: number; lineHeight?: number },
): { width?: number; height?: number } {
  const out: { width?: number; height?: number } = {}
  let padTop: number | undefined
  let padBottom: number | undefined

  for (const name of classes) {
    const sizes = pixels.get(name)
    if (!sizes) continue
    if (sizes.width !== undefined) out.width = sizes.width
    if (sizes.height !== undefined) out.height = sizes.height
    // `py-*` compiles to `padding-block` rather than to a top and a bottom,
    // and `p-*` to the shorthand. Reading only `padding-top` would have missed
    // every padded control in the set, which is all of the small ones.
    if (sizes['padding-top'] !== undefined) padTop = sizes['padding-top']
    if (sizes['padding-bottom'] !== undefined) padBottom = sizes['padding-bottom']
    if (sizes['padding-block'] !== undefined) {
      padTop = sizes['padding-block']
      padBottom = sizes['padding-block']
    }
    if (sizes.padding !== undefined) {
      padTop = sizes.padding
      padBottom = sizes.padding
    }
  }

  if (out.height === undefined) {
    // A button holding both a word and a glyph is as tall as the taller of
    // them - they sit on one line. Taking the glyph alone under-reports:
    // `Copyable` came out 16px that way and measures 19 on the stand, because
    // its `text-xs` line is taller than its 13px clipboard.
    const inside = Math.max(content.glyph ?? 0, content.lineHeight ?? 0)
    if (inside > 0 && (padTop !== undefined || padBottom !== undefined)) {
      out.height = inside + (padTop ?? 0) + (padBottom ?? 0)
    }
  }

  return out
}

/** The line height a type step compiles to, which is the height of a button
 * whose content is a word rather than a glyph. Read from the theme so it
 * follows the scale rather than repeating it. */
function lineHeightOf(classes: string[]): number | undefined {
  for (const name of classes) {
    // `text-xs`, `text-2xs`, `text-base` - a size, not a colour (`text-dim`)
    // and not an alignment (`text-left`), both of which share the prefix.
    const step = name.match(/^text-(2?x?s|sm|base|lg|xl|2xl)$/)?.[1]
    if (!step) continue
    // The backslashes are doubled because this is a template literal on its
    // way into `RegExp`: written `\s`, the string hands over a bare `s` and
    // the pattern matches the letter. That is how this returned nothing for
    // `Copyable` - the one button in the set whose height is its text.
    const declared = theme.match(new RegExp(`--text-${step}--line-height:\\s*(\\d+)px`))
    if (declared) return Number(declared[1])
  }
  return undefined
}

describe('what a pointer is asked to hit', () => {
  it('declares the floor in the theme, as a token', async () => {
    // Read rather than repeated, so the gate cannot drift from the value the
    // components compile against.
    expect(FLOOR, 'the theme declares no `--size-target`').toBe(24)

    const css = await build(['target-min', 'size-target'])
    expect(css, '`target-min` compiles to nothing').toContain('.target-min')
    expect(css, '`size-target` compiles to nothing').toContain('.size-target')
  })

  it('grows the hit area without moving the glyph', async () => {
    // The whole point of the utility: a control keeps its size and its place
    // in the row, and gains an invisible margin of target on every side.
    const css = await build(['target-min'])
    const rule = css.slice(css.indexOf('.target-min'))

    expect(rule, '`target-min` establishes no containing block').toContain('position: relative')
    expect(rule, 'the target is not centred on the control').toContain('translate: -50% -50%')
    expect(rule, 'the target does not take the floor from the token').toContain(
      'min-width: var(--size-target)',
    )
    expect(rule).toContain('min-height: var(--size-target)')

    // It must not change the box the control occupies - so what is inspected
    // is what the class declares on the element itself, which is everything
    // before the nested `&::after`. The sizes inside that block belong to the
    // pseudo-element and are the entire point.
    const onTheElement = rule.slice(0, rule.indexOf('&::after'))
    expect(onTheElement, "`target-min` alters the control's own box").not.toMatch(
      /\b(padding|margin|width|height|inset|top|left)\s*:/,
    )
  })

  it.each(components.map((c) => [c.name, c.source] as const))(
    '%s asks for nothing smaller than the floor',
    async (name, source) => {
      const buttons = buttonsIn(source)
      if (buttons.length === 0) return

      const classes = [...new Set(buttons.flatMap((button) => button.classes))]
      const pixels = await pixelsOf(classes)

      const tooSmall = buttons
        .map((button) => {
          if (button.classes.includes('target-min')) return null

          const { width, height } = declaredSize(button.classes, pixels, {
            glyph: button.glyph,
            lineHeight: lineHeightOf(button.classes),
          })
          // A control that declares no size of its own is sized by its
          // content and its padding, which this cannot see. The named escape
          // is the answer for those, not a silent pass - but a gate that
          // failed everything unsized would be a gate nobody could satisfy,
          // so what is caught is a size that is declared and too small.
          if (width === undefined && height === undefined) return null

          const smallest = Math.min(width ?? Infinity, height ?? Infinity)
          if (smallest >= FLOOR) return null

          const line = source.slice(0, button.at).split('\n').length
          return `line ${line}: ${smallest}px (${button.classes.filter((c) => pixels.has(c)).join(' ')})`
        })
        .filter((entry): entry is string => entry !== null)

      expect(
        tooSmall,
        `\`${name}\` has a pointer target under ${FLOOR}px:\n  ${tooSmall.join('\n  ')}\n` +
          'WCAG 2.2 (2.5.8, AA) puts the floor there. Add `target-min`, which grows the hit ' +
          'area without changing how the control looks or where it sits.',
      ).toEqual([])
    },
  )
})
