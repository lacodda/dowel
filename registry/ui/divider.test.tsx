// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Divider, SectionHeader, dividerVariants } from './divider'

describe('Divider', () => {
  it('is a boundary a reader is told about', () => {
    // A `div` with a background says nothing: `role="separator"` is what says
    // the content after it is a different thing.
    render(<Divider />)
    expect(screen.getByRole('separator')).toBeDefined()
  })

  it('takes a decorative rule back out of what is read', () => {
    // A reader announcing "separator" six times in one row is being read the
    // styling.
    const { container } = render(<Divider decorative />)
    expect(screen.queryByRole('separator')).toBeNull()
    expect(container.firstElementChild).not.toBeNull()
  })

  it('draws a vertical rule with a height it actually has', () => {
    // `h-full` resolved to zero in a flex row of buttons - a rule that was in
    // the markup and invisible on the screen.
    expect(dividerVariants({ orientation: 'vertical' })).toContain('self-stretch')
    expect(dividerVariants({ orientation: 'vertical' })).not.toContain('h-full')
  })

  it('draws each orientation differently', () => {
    expect(dividerVariants({ orientation: 'horizontal' })).toContain('h-px')
    expect(dividerVariants({ orientation: 'vertical' })).toContain('w-px')
  })

  it('says which way it runs, for a reader', () => {
    render(<Divider orientation="vertical" />)
    expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBe('vertical')
  })

  it('draws every spacing step, and draws each one differently', () => {
    const steps = ['none', 'sm', 'md', 'lg'] as const
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const drawn = new Map(steps.map((spacing) => [spacing, dividerVariants({ orientation, spacing })]))
      expect(
        new Set(drawn.values()).size,
        `two spacing steps draw the same when ${orientation}`,
      ).toBe(steps.length)
    }
  })

  it('spaces a vertical rule sideways and a horizontal one up and down', () => {
    // The same step on the wrong axis is the bug this pair exists to catch.
    expect(dividerVariants({ orientation: 'horizontal', spacing: 'md' })).toContain('my-4')
    expect(dividerVariants({ orientation: 'vertical', spacing: 'md' })).toContain('mx-4')
  })

  it('sits flush by default', () => {
    // The common case is a rule inside something already padded - a list's
    // rows, a table.
    expect(dividerVariants({})).toBe(dividerVariants({ orientation: 'horizontal', spacing: 'none' }))
    expect(dividerVariants({})).not.toMatch(/\bmy-/)
  })

  it('puts a caption in the line and keeps the drawing out of the reading', () => {
    render(<Divider label="Today" />)
    const rule = screen.getByRole('separator')
    expect(rule.textContent).toBe('Today')
    // The two halves of the line are drawing; the row carries the meaning.
    const hidden = rule.querySelectorAll('[aria-hidden="true"]')
    expect(hidden, 'the rules on either side are announced as well').toHaveLength(2)
  })

  it('keeps the caption in the caption type the set already has', () => {
    render(<Divider label="Archived" />)
    expect(screen.getByText('Archived').className).toContain('caption')
  })

  it('lets the caller win a conflict', () => {
    render(<Divider className="bg-accent" data-testid="rule" />)
    expect(screen.getByTestId('rule').className).toContain('bg-accent')
  })
})

describe('SectionHeader', () => {
  it('sits one level inside the page', () => {
    // `PageHeader` holds the screen's `h1`; a section is an `h2`, so a reader
    // moving by heading walks the screen's actual structure.
    render(<SectionHeader title="Versions" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Versions' })).toBeDefined()
  })

  it('takes a line and the actions belonging to this part', () => {
    render(
      <SectionHeader
        title="Versions"
        description="Every take, newest first."
        actions={<button type="button">Add</button>}
      />,
    )
    expect(screen.getByText('Every take, newest first.')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Add' })).toBeDefined()
  })

  it('leaves the line out rather than drawing an empty one', () => {
    const { container } = render(<SectionHeader title="Versions" />)
    expect(container.querySelector('p')).toBeNull()
  })
})

describe('Divider, for a reader', () => {
  it('passes axe plain, decorative, vertical and captioned', async () => {
    for (const element of [
      <Divider key="plain" />,
      <Divider key="decorative" decorative />,
      <Divider key="vertical" orientation="vertical" />,
      <Divider key="labelled" label="Today" />,
    ]) {
      const { unmount } = await expectNoA11yViolations(element)
      unmount()
    }
  })

  it('passes axe as a section heading with actions', async () => {
    await expectNoA11yViolations(
      <SectionHeader
        title="Versions"
        description="Every take, newest first."
        actions={<button type="button">Add</button>}
      />,
    )
  })
})
