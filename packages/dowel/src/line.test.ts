import { describe, expect, it } from 'vitest'
import { lineProduct, lineProducts } from './line'

/*
 * The line's products, as the package states them: the table the accents,
 * the palettes and the Rust modules are generated from. Its own facts are held
 * here, where the mutation run reads them; that every product has an accent
 * file and a palette is the release gates' to say.
 */

describe('the products of the line', () => {
  it('finds a product by its name, and nothing for a name it does not hold', () => {
    expect(lineProduct('dowel')).toEqual({ name: 'dowel', code: 'dw', accent: '#E8862D', colorName: 'signal amber' })
    expect(lineProduct('kilna')?.code).toBe('ki')
    expect(lineProduct('scheda')?.accent).toBe('#D9704A')
    expect(lineProduct('not-a-product')).toBeUndefined()
    expect(lineProduct('')).toBeUndefined()
  })

  it('gives every product its own name and code, a two-letter code and a six-digit colour', () => {
    expect(new Set(lineProducts.map((product) => product.name)).size).toBe(lineProducts.length)
    expect(new Set(lineProducts.map((product) => product.code)).size).toBe(lineProducts.length)
    for (const product of lineProducts) {
      expect(product.code, product.name).toMatch(/^[a-z]{2}$/)
      expect(product.accent, product.name).toMatch(/^#[0-9A-F]{6}$/)
      expect(product.colorName.length, product.name).toBeGreaterThan(0)
    }
  })

  it('carries the first colour of a pair, and only the pairs share one', () => {
    // Two products may share a hue only as the first of two pairs.
    const byAccent = new Map<string, string[]>()
    for (const product of lineProducts) byAccent.set(product.accent, [...(byAccent.get(product.accent) ?? []), product.name])
    const shared = [...byAccent.values()].filter((names) => names.length > 1)
    expect(shared).toEqual([['scheda', 'furca']])
    for (const name of shared.flat()) expect(lineProduct(name)!.colorName).toContain('paired with')
  })
})
