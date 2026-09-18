// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { FilterPopover } from './filter-popover'

/*
 * What has to be true of a column's funnel.
 *
 * The state it shows is one bit - does this column narrow the list - and
 * the defects are about that bit: a funnel that looks the same whether or
 * not a filter is on, so a table narrowed last week looks like a smaller
 * table; and a Clear that is offered when there is nothing to clear.
 */

const labels = { title: 'Owner', label: 'Filter by owner', clearLabel: 'Clear' }

describe('FilterPopover', () => {
  it('is named for a screen reader', () => {
    render(
      <FilterPopover {...labels} active={false} onClear={() => {}}>
        <span>boxes</span>
      </FilterPopover>,
    )
    expect(screen.getByRole('button', { name: 'Filter by owner' })).toBeDefined()
  })

  it('carries data-active while the column is narrowing', () => {
    const { rerender } = render(
      <FilterPopover {...labels} active onClear={() => {}}>
        <span>boxes</span>
      </FilterPopover>,
    )
    expect(screen.getByRole('button', { name: 'Filter by owner' }).hasAttribute('data-active')).toBe(true)

    rerender(
      <FilterPopover {...labels} active={false} onClear={() => {}}>
        <span>boxes</span>
      </FilterPopover>,
    )
    expect(screen.getByRole('button', { name: 'Filter by owner' }).hasAttribute('data-active')).toBe(false)
  })

  it('opens the panel under the column name, with the controls in it', async () => {
    render(
      <FilterPopover {...labels} active={false} onClear={() => {}}>
        <span>boxes</span>
      </FilterPopover>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Filter by owner' }))
    expect(await screen.findByText('Owner')).toBeDefined()
    expect(screen.getByText('boxes')).toBeDefined()
  })

  it('clears from inside the panel', async () => {
    const onClear = vi.fn()
    render(
      <FilterPopover {...labels} active onClear={onClear}>
        <span>boxes</span>
      </FilterPopover>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Filter by owner' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Clear' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('offers Clear only while there is something to clear', async () => {
    render(
      <FilterPopover {...labels} active={false} onClear={() => {}}>
        <span>boxes</span>
      </FilterPopover>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Filter by owner' }))
    const clear = (await screen.findByRole('button', { name: 'Clear' })) as HTMLButtonElement
    expect(clear.disabled).toBe(true)
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(
      <FilterPopover {...labels} active onClear={() => {}}>
        <span>boxes</span>
      </FilterPopover>,
    )
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(
      <FilterPopover {...labels} active onClear={() => {}}>
        <span>boxes</span>
      </FilterPopover>,
    )
    unmount()
  })
})
