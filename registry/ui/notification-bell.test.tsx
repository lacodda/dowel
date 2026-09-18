// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { NotificationBell } from './notification-bell'

/*
 * What has to be true of the bell.
 *
 * The count is the whole message, so the defects are about it: a badge drawn
 * at zero is a bell that is always lit, a badge reading "128" is a badge too
 * wide for its corner, and a "mark all read" that is offered when there is
 * nothing to mark is a button that does nothing.
 */

const labels = {
  label: 'Notifications',
  title: 'Recent',
  markAllLabel: 'Mark all read',
  seeAllLabel: 'See all',
  emptyLabel: 'Nothing recent.',
}

const badge = (container: HTMLElement) => container.querySelector('[data-badge]')

describe('NotificationBell', () => {
  it('shows nothing at zero', () => {
    const { container } = render(<NotificationBell count={0} {...labels} />)
    expect(badge(container)).toBeNull()
  })

  it('shows the count', () => {
    const { container } = render(<NotificationBell count={3} {...labels} />)
    expect(badge(container)?.textContent).toBe('3')
  })

  it('caps the count past nine', () => {
    const { container } = render(<NotificationBell count={42} {...labels} />)
    expect(badge(container)?.textContent).toBe('9+')
  })

  it('is named for a screen reader', () => {
    render(<NotificationBell count={0} {...labels} />)
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeDefined()
  })

  it('opens the panel under its heading', async () => {
    render(
      <NotificationBell count={1} {...labels}>
        <p>A release lost its slot.</p>
      </NotificationBell>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(await screen.findByRole('heading', { name: 'Recent' })).toBeDefined()
    expect(screen.getByText('A release lost its slot.')).toBeDefined()
  })

  it('says so when there is nothing to show', async () => {
    render(<NotificationBell count={0} {...labels} />)
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(await screen.findByText('Nothing recent.')).toBeDefined()
  })

  it('offers to mark everything read only while something is unread', async () => {
    const { rerender } = render(<NotificationBell count={0} {...labels} />)
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    await screen.findByRole('heading', { name: 'Recent' })
    expect(screen.queryByRole('button', { name: 'Mark all read' })).toBeNull()

    rerender(<NotificationBell count={2} {...labels} />)
    expect(await screen.findByRole('button', { name: 'Mark all read' })).toBeDefined()
  })

  it('calls back when everything is marked read', async () => {
    const onMarkAll = vi.fn()
    render(<NotificationBell count={2} {...labels} onMarkAll={onMarkAll} />)
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Mark all read' }))
    expect(onMarkAll).toHaveBeenCalledTimes(1)
  })

  it('waits while the product is busy marking', async () => {
    render(<NotificationBell count={2} {...labels} busy />)
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    const button = await screen.findByRole('button', { name: 'Mark all read' })
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })

  it('hands over to the whole history and closes', async () => {
    const onSeeAll = vi.fn()
    render(<NotificationBell count={2} {...labels} onSeeAll={onSeeAll} />)
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    await userEvent.click(await screen.findByRole('button', { name: 'See all' }))
    expect(onSeeAll).toHaveBeenCalledTimes(1)
    await vi.waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Recent' })).toBeNull()
    })
  })

  it('can be driven from outside', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(<NotificationBell count={0} {...labels} open={false} onOpenChange={onOpenChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
    // Still closed: the product did not say yes.
    expect(screen.queryByRole('heading', { name: 'Recent' })).toBeNull()

    rerender(<NotificationBell count={0} {...labels} open onOpenChange={onOpenChange} />)
    expect(await screen.findByRole('heading', { name: 'Recent' })).toBeDefined()
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<NotificationBell count={12} {...labels} />)
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(<NotificationBell count={3} {...labels} />)
    unmount()
  })
})
