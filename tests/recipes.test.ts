import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * The recipes, held to the shape that keeps them true.
 *
 * A recipe is three things: the file in `recipes/`, which the typecheck
 * compiles; its test, which renders it and runs axe over it; and the page that
 * draws the file rather than a copy of it. A recipe without its test is
 * code nobody has run, and a page with its own code block is the copy that
 * rots the day a component changes.
 */

const root = resolve(import.meta.dirname, '..')
const recipes = readdirSync(resolve(root, 'recipes'))
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.test.tsx'))
  .map((file) => file.replace(/\.tsx$/, ''))
const pagesDir = resolve(root, 'docs/src/content/docs/recipes')
const pages = readdirSync(pagesDir).filter((file) => file.endsWith('.mdx'))

describe('every recipe', () => {
  it('exists', () => {
    expect(recipes.length).toBeGreaterThan(0)
  })

  it.each(recipes)('%s has a test', (name) => {
    expect(existsSync(resolve(root, 'recipes', `${name}.test.tsx`))).toBe(true)
  })

  it.each(recipes)('%s has a page that draws its file', (name) => {
    const page = resolve(pagesDir, `${name}.mdx`)
    expect(existsSync(page), `docs/src/content/docs/recipes/${name}.mdx`).toBe(true)
    expect(readFileSync(page, 'utf8')).toContain(`<Recipe name="${name}" />`)
  })
})

describe('every recipe page', () => {
  it.each(pages)('%s draws a recipe that exists, and no code of its own', (file) => {
    const text = readFileSync(resolve(pagesDir, file), 'utf8')
    const drawn = [...text.matchAll(/<Recipe name="([\w-]+)" \/>/g)].map((match) => match[1]!)
    expect(drawn.length, 'a recipe page draws its recipe').toBeGreaterThan(0)
    for (const name of drawn) expect(recipes).toContain(name)
    // A short snippet in prose is fine; a block of tsx is the recipe twice.
    expect(text).not.toMatch(/```tsx/)
  })
})
