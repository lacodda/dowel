// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Badge, badgeVariants } from './badge'

describe('Badge', () => {
  it('renders what it is given', () => {
    render(<Badge>3 new</Badge>)
    expect(screen.getByText('3 new')).toBeDefined()
  })

  it('draws every variant, and draws each one differently', () => {
    const base = badgeVariants({ variant: 'nonexistent' as never })
    const variants = ['outline', 'soft', 'accent', 'good', 'warn', 'bad', 'info'] as const
    const drawn = new Map(variants.map((variant) => [variant, badgeVariants({ variant })]))

    for (const [variant, classes] of drawn) {
      expect(classes, `\`${variant}\` adds nothing - is it still defined?`).not.toBe(base)
    }
    expect(new Set(drawn.values()).size, 'two variants draw the same').toBe(variants.length)
  })

  it('is not a button', () => {
    // A badge is state attached to something; if it can be clicked it is a
    // Chip. Rendering it as a button would promise an action it does not have.
    render(<Badge>state</Badge>)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('carries no colour outside the vocabulary', () => {
    const all = (['outline', 'soft', 'accent', 'good', 'warn', 'bad', 'info'] as const)
      .map((variant) => badgeVariants({ variant }))
      .join(' ')
    expect(all).not.toMatch(/\bdark:/)
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })
})

describe('Badge, for a reader', () => {
  it('passes axe in every variant', async () => {
    // Not interactive, so nothing to press - only whether the state it
    // carries reaches a screen reader cleanly in each colour.
    for (const variant of ['outline', 'soft', 'accent', 'good', 'warn', 'bad', 'info'] as const) {
      const { unmount } = await expectNoA11yViolations(<Badge variant={variant}>3 new</Badge>)
      unmount()
    }
  })
})
