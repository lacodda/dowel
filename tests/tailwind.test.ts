import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compile } from 'tailwindcss'
import { describe, expect, it } from 'vitest'

/*
 * The theme compiled, not just read.
 *
 * `theme.test.ts` checks the stylesheet as text: that a token is declared,
 * that it is mapped into `@theme`. Text cannot tell whether Tailwind agrees -
 * a malformed `@theme` block, a namespace that does not exist, a token whose
 * name cannot become a utility, all read fine and produce nothing.
 *
 * So this runs the real compiler over the real theme and asks for the
 * utilities a product will actually write.
 */

const root = resolve(import.meta.dirname, '..')
const theme = readFileSync(resolve(root, 'packages/dowel/src/theme.css'), 'utf8')

/** Tailwind's own stylesheets, read off disk. The compiler asks for them by
 * the specifier a product would write; nothing else needs resolving here. */
const tailwindDir = resolve(root, 'node_modules/tailwindcss')

/** Compile `@import 'tailwindcss'` plus the theme, and return the CSS produced
 * for the given utility classes. */
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

describe('the theme compiles', () => {
  it('turns colour tokens into utilities', async () => {
    const css = await build(['bg-raise', 'text-dim', 'border-line'])
    expect(css).toContain('var(--raise)')
    expect(css).toContain('var(--dim)')
    expect(css).toContain('var(--line)')
  })

  it('refuses the stock palette', async () => {
    // `--color-*: initial` is what drops it. If a product could still write
    // `bg-zinc-800`, the vocabulary would not be the only way to say a colour.
    const css = await build(['bg-zinc-800', 'text-red-500'])
    expect(css).not.toContain('zinc')
    expect(css).not.toContain('oklch(63.7% 0.237 25.331)')
  })
})
