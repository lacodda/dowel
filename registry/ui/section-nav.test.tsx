// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { SectionHeading, SectionNav } from './section-nav'

/*
 * What has to be true of a section list.
 *
 * The current section is the point of the column, so the failures are about
 * it being current in one sense and not another: tinted but not announced,
 * or drawn as the product's link but with the product's link losing the row's
 * name and state on the way.
 */

const items = [
  { id: 'general', label: 'General', icon: <svg data-testid="icon-general" /> },
  { id: 'data', label: 'Data' },
  { id: 'agents', label: 'Agents' },
]

describe('SectionNav', () => {
  it('is a landmark named for its caption', () => {
    render(<SectionNav label="Settings" items={items} />)
    expect(screen.getByRole('navigation', { name: 'Settings' })).toBeDefined()
  })

  it('marks the active item as the current page', () => {
    render(<SectionNav label="Settings" items={items} activeId="data" />)
    expect(screen.getByRole('button', { name: 'Data' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: 'General' }).getAttribute('aria-current')).toBeNull()
  })

  it('tints the active item and no other', () => {
    render(<SectionNav label="Settings" items={items} activeId="data" />)
    expect(screen.getByRole('button', { name: 'Data' }).className).toContain('bg-accent-soft')
    expect(screen.getByRole('button', { name: 'General' }).className).not.toContain('bg-accent-soft')
  })

  it('draws the icon', () => {
    render(<SectionNav label="Settings" items={items} />)
    expect(screen.getByTestId('icon-general')).toBeDefined()
  })

  it('reports which item was pressed', async () => {
    const onSelect = vi.fn()
    render(<SectionNav label="Settings" items={items} onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Agents' }))
    expect(onSelect).toHaveBeenCalledWith('agents')
  })

  it('draws each row as the element the product renders', () => {
    // A router's link, most often: the row's clothes, its name and its
    // `aria-current` land on the product's element.
    render(
      <SectionNav
        label="Settings"
        items={items}
        activeId="data"
        render={(item) => <a href={`/settings/${item.id}`} />}
      />,
    )
    const link = screen.getByRole('link', { name: 'Data' })
    expect(link.getAttribute('href')).toBe('/settings/data')
    expect(link.getAttribute('aria-current')).toBe('page')
    expect(link.className).toContain('bg-accent-soft')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('is a button by default, so it submits nothing by accident', () => {
    render(<SectionNav label="Settings" items={items} />)
    expect(screen.getByRole('button', { name: 'Data' }).getAttribute('type')).toBe('button')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<SectionNav label="Settings" items={items} activeId="data" />)
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(
      <SectionNav label="Settings" items={items} activeId="data" render={(item) => <a href={`/s/${item.id}`} />} />,
    )
    unmount()
  })

  it('keeps a long section name to one line', () => {
    // A column of fixed width: a label that wraps makes one row taller than
    // every other, which in a two-language product happens to one section
    // and not the rest. The same rule NavRail's entries follow - one column,
    // one answer.
    render(
      <SectionNav label="Settings" items={[{ id: 'card', label: 'The card of a work' }]} />,
    )
    const label = screen.getByText('The card of a work')
    expect(label.className).toContain('truncate')
    expect(label.className, 'a flex child will not shrink below its content without this').toContain(
      'min-w-0',
    )
  })
})

describe('SectionHeading', () => {
  it('sets the title as a heading, with the hint under it', () => {
    render(<SectionHeading title="Data" description="Where it lives and how to take it away." />)
    expect(screen.getByRole('heading', { name: 'Data' })).toBeDefined()
    expect(screen.getByText('Where it lives and how to take it away.')).toBeDefined()
  })

  it('draws no hint it was not given', () => {
    const { container } = render(<SectionHeading title="Data" />)
    expect(container.querySelector('p')).toBeNull()
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(<SectionHeading title="Data" description="Hint" />)
    unmount()
  })
})
