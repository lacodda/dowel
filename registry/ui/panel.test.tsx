// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Panel, SectionLabel, panelVariants } from './panel'

describe('Panel', () => {
  it('renders what it is given', () => {
    render(<Panel>content</Panel>)
    expect(screen.getByText('content')).toBeDefined()
  })

  it('draws every variant, and draws each one differently', () => {
    const base = panelVariants({ variant: 'nonexistent' as never })
    const variants = ['raised', 'floating', 'inset'] as const
    const drawn = new Map(variants.map((variant) => [variant, panelVariants({ variant })]))

    for (const [variant, classes] of drawn) {
      expect(classes, `\`${variant}\` adds nothing - is it still defined?`).not.toBe(base)
    }
    expect(new Set(drawn.values()).size, 'two variants draw the same').toBe(variants.length)
  })

  it('gives a floating panel its elevation', () => {
    // The difference between a surface on the page and one above it.
    expect(panelVariants({ variant: 'floating' })).toContain('shadow-raise')
    expect(panelVariants({ variant: 'raised' })).not.toContain('shadow')
  })

  it('lets the caller win a conflict', () => {
    render(<Panel className="rounded-full">x</Panel>)
    expect(screen.getByText('x').className).toContain('rounded-full')
  })
})

describe('SectionLabel', () => {
  it('uses the one tracking the products argued about', () => {
    // 0.08em in six files and 0.09em in three, for the same visual element.
    render(<SectionLabel>Details</SectionLabel>)
    expect(screen.getByText('Details').className).toContain('tracking-caption')
  })
})
