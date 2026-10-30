// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { works } from '../fixtures/world'
import { expectNoA11yViolations } from '../tests/a11y'
import { DeleteWithAWayBack, type Row } from './delete-with-a-way-back'

/*
 * The recipe is held to its two promises: what can be undone does not ask and
 * can be undone, and what cannot be undone asks first and names what it asks
 * about.
 */

const rows: Row[] = works.slice(0, 4).map(({ id, title, summary }) => ({ id, title, summary }))
const first = rows[0]!
const titles = () =>
  within(screen.getByRole('list'))
    .getAllByRole('listitem')
    .map((item) => item.textContent ?? '')

describe('deleting, with a way back', () => {
  it('archives at once without asking, and offers Undo', async () => {
    const user = userEvent.setup()
    const onArchive = vi.fn()
    render(<DeleteWithAWayBack works={rows} onArchive={onArchive} />)
    await user.click(screen.getByRole('button', { name: `Archive ${first.title}` }))
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.queryByText(first.summary)).toBeNull()
    expect(onArchive).toHaveBeenCalledWith(first.id, true)
    expect(await screen.findByText(`Archived "${first.title}"`)).toBeDefined()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDefined()
  })

  it('puts the work back in its place on Undo', async () => {
    const user = userEvent.setup()
    const onArchive = vi.fn()
    render(<DeleteWithAWayBack works={rows} onArchive={onArchive} />)
    const before = titles()
    await user.click(screen.getByRole('button', { name: `Archive ${first.title}` }))
    expect(titles()).toHaveLength(rows.length - 1)
    await user.click(await screen.findByRole('button', { name: 'Undo' }))
    expect(titles()).toEqual(before)
    expect(onArchive).toHaveBeenLastCalledWith(first.id, false)
  })

  it('puts a work from the middle back in the middle', async () => {
    const user = userEvent.setup()
    render(<DeleteWithAWayBack works={rows} />)
    const middle = rows[2]!
    await user.click(screen.getByRole('button', { name: `Archive ${middle.title}` }))
    await user.click(await screen.findByRole('button', { name: 'Undo' }))
    expect(titles().findIndex((text) => text.includes(middle.title))).toBe(2)
  })

  it('asks before deleting for good, names the work, and says it cannot be undone', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<DeleteWithAWayBack works={rows} onDelete={onDelete} />)
    await user.click(screen.getByRole('button', { name: `Delete ${first.title} for good` }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText(`Delete "${first.title}" for good?`)).toBeDefined()
    expect(within(dialog).getByText(/cannot be undone/)).toBeDefined()
    // Asking is not doing.
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByText(first.summary)).toBeDefined()
  })

  it('starts with focus on the safe choice', async () => {
    const user = userEvent.setup()
    render(<DeleteWithAWayBack works={rows} />)
    await user.click(screen.getByRole('button', { name: `Delete ${first.title} for good` }))
    const dialog = await screen.findByRole('alertdialog')
    await waitFor(() => expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Keep it' })))
  })

  it('changes nothing on Cancel', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<DeleteWithAWayBack works={rows} onDelete={onDelete} />)
    const before = titles()
    await user.click(screen.getByRole('button', { name: `Delete ${first.title} for good` }))
    await user.click(await screen.findByRole('button', { name: 'Keep it' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(onDelete).not.toHaveBeenCalled()
    expect(titles()).toEqual(before)
  })

  it('removes the work on Confirm, with no Undo to offer', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<DeleteWithAWayBack works={rows} onDelete={onDelete} />)
    await user.click(screen.getByRole('button', { name: `Delete ${first.title} for good` }))
    await user.click(await screen.findByRole('button', { name: 'Delete for good' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(onDelete).toHaveBeenCalledWith(first.id)
    expect(titles()).toHaveLength(rows.length - 1)
    expect(screen.queryByText(first.summary)).toBeNull()
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull()
  })

  it('passes axe with the list on screen', async () => {
    await expectNoA11yViolations(<DeleteWithAWayBack works={rows} />)
  })

  it('passes axe with the question open', async () => {
    const user = userEvent.setup()
    await expectNoA11yViolations(<DeleteWithAWayBack works={rows} />, undefined, async () => {
      await user.click(screen.getByRole('button', { name: `Delete ${first.title} for good` }))
      await screen.findByRole('alertdialog')
    })
  })
})
