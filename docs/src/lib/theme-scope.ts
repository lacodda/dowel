import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/*
 * The theme, re-scoped for the stand.
 *
 * `theme.css` is written for a product to load at its root: it declares tokens
 * on `:root`, paints `body`, claims the scrollbars and exposes a Tailwind
 * `@theme` block. A docs page needs none of that, and needs one thing the
 * product never does - both themes visible at once, on one page.
 *
 * So the stand rewrites the theme rather than restating it. The token blocks
 * are re-pointed at `.dowel-theme.dark` and `.dowel-theme.light`; everything
 * that only makes sense at a document root is dropped. There is still exactly
 * one source for the values, so a token that changes in the package changes on
 * the stand in the same build, and a token that is removed disappears from
 * both.
 */

/* Read at build time, from the workspace rather than from this module's own
 * location: the module is bundled into the build output, and `import.meta.url`
 * would then point at the bundle instead of at the source tree. */
const themeCss = readFileSync(resolve(process.cwd(), '../packages/dowel/src/theme.css'), 'utf8')

/** The body of the rule that starts at `from`, with its braces. */
function ruleAt(css: string, from: number): { body: string; end: number } | null {
  const open = css.indexOf('{', from)
  if (open === -1) return null
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') {
      depth--
      if (depth === 0) return { body: css.slice(open + 1, i), end: i + 1 }
    }
  }
  return null
}

/** Custom-property declarations of a rule, as authored. */
function declarations(body: string): string {
  return [...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => `  ${m[1]}: ${m[2]!.trim()};`).join('\n')
}

function bodyOf(selector: string): string {
  const start = themeCss.indexOf(selector)
  if (start === -1) throw new Error(`the theme no longer contains \`${selector}\``)
  const rule = ruleAt(themeCss, start)
  if (!rule) throw new Error(`\`${selector}\` is not a closed rule`)
  return rule.body
}

/** The rule that declares `--on-accent`. It lives in a `:root` block of its
 * own, after both themes, because it is derived from whichever accent the
 * theme in force resolved to. Found by the declaration rather than by the
 * selector, since `:root` appears several times. */
function onAccentBody(): string {
  const at = themeCss.search(/--on-accent\s*:/)
  if (at === -1) throw new Error('the theme no longer declares `--on-accent`')
  const open = themeCss.lastIndexOf('{', at)
  const rule = ruleAt(themeCss, open - 1)
  if (!rule) throw new Error('the `--on-accent` rule is not closed')
  return rule.body
}

const darkBody = bodyOf(':root {')
const lightBody = bodyOf(':root.light')

/** Names a rule declares. */
function names(body: string): string[] {
  return [...body.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]!)
}

/*
 * In the package the light theme is nested under the same root as the dark
 * one, so a parameter the light theme does not restate - the tint amounts, for
 * instance - simply carries over. On the stand the two are siblings, and
 * nothing carries. So the light block is topped up with whatever the dark
 * block declares and it does not, which reproduces the inheritance the theme
 * relies on instead of quietly resolving a dark value on a light swatch.
 */
const restated = new Set(names(lightBody))
const inherited = [...darkBody.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)]
  .filter((m) => !restated.has(m[1]!))
  .map((m) => `  ${m[1]}: ${m[2]!.trim()};`)
  .join('\n')

const dark = declarations(darkBody)
const light = [inherited, declarations(lightBody)].filter(Boolean).join('\n')
const onAccent = declarations(onAccentBody())

/**
 * The stand's stylesheet: the same token values the package ships, addressed
 * by a class so that both themes can sit side by side on one page.
 */
export const scopedTheme = `
.dowel-theme.dark {
  color-scheme: dark;
${dark}
${onAccent}
}

.dowel-theme.light {
  color-scheme: light;
${light}
${onAccent}
}
`
