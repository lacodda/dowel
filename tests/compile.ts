import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compile } from 'tailwindcss'

/*
 * The real compiler over the real theme, for a test that needs to know what a
 * class list turns into rather than what it says.
 *
 * A class name is a promise the compiler keeps or silently breaks: `w-foo` off
 * a `--size-*` token compiles to nothing, and a selector inside an arbitrary
 * variant can come out different from the one written. So what is asserted is
 * the CSS Tailwind produces for the classes a component actually carries.
 */

const root = resolve(import.meta.dirname, '..')
const theme = readFileSync(resolve(root, 'packages/dowel/src/theme.css'), 'utf8')
const tailwindDir = resolve(root, 'node_modules/tailwindcss')

/** The CSS Tailwind writes for these utility classes, over the theme.
 *
 * A fresh compiler every call, and not for tidiness: `build` is incremental,
 * so a shared compiler answers each call with every class it was ever given -
 * and a test asking what `sm` compiles to is told about `md` as well. */
export async function compileClasses(classes: string[]): Promise<string> {
  const compiler = compile(`@import 'tailwindcss';\n${theme}`, {
    base: root,
    loadStylesheet: async (id, base) => {
      const file = id === 'tailwindcss' ? 'index.css' : id.replace(/^tailwindcss\//, '')
      const path = resolve(tailwindDir, file)
      return { base, content: readFileSync(path, 'utf8'), path }
    },
  })
  return (await compiler).build(classes)
}

/** The rules of the utilities layer as selector and declarations, flat.
 *
 * Tailwind writes the layer unnested, one rule per utility, so a brace scan
 * is enough - and the theme's own `:root` blocks, which come after, are left
 * out, because they are not what a class produced. */
export function utilityRules(css: string): { selector: string; body: string }[] {
  const start = css.indexOf('@layer utilities {')
  if (start < 0) return []
  const rules: { selector: string; body: string }[] = []
  let depth = 0
  let i = css.indexOf('{', start) + 1
  let selectorStart = i
  let bodyStart = -1
  for (; i < css.length; i += 1) {
    const char = css[i]
    if (char === '{') {
      if (depth === 0) bodyStart = i + 1
      depth += 1
    } else if (char === '}') {
      if (depth === 0) break
      depth -= 1
      if (depth === 0) {
        rules.push({ selector: css.slice(selectorStart, bodyStart - 1).trim(), body: css.slice(bodyStart, i).trim() })
        selectorStart = i + 1
      }
    }
  }
  return rules
}
