// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { works } from '../fixtures/world'
import { expectNoA11yViolations } from '../tests/a11y'
import { ListThatLoads, type Row } from './list-that-loads'

/*
 * The recipe is code a product copies by reading it, so it is held to what it
 * claims: the three moments that are not the list, a search that starts again
 * at page one, and a failure with a way out.
 */

const rows: Row[] = Array.from({ length: 24 }, (_, index) => {
  const work = works[index % works.length]!
  return { id: `${work.id}-${index}`, title: `${work.title} ${index + 1}`, summary: work.summary }
})

describe('a list that loads', () => {
  it('shows the rows once they arrive, ten to a page', async () => {
    render(<ListThatLoads load={() => Promise.resolve(rows)} onOpen={() => {}} />)
    expect(await screen.findByText(`${works[0]!.title} 1`)).toBeDefined()
    expect(within(screen.getByRole('list')).getAllByRole('button')).toHaveLength(10)
    expect(screen.getByRole('navigation', { name: 'Pages' })).toBeDefined()
  })

  it('says it failed, and loads again when asked', async () => {
    const user = userEvent.setup()
    const load = vi.fn<() => Promise<readonly Row[]>>().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(rows)
    render(<ListThatLoads load={load} onOpen={() => {}} />)
    expect(await screen.findByText('The works did not load')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(`${works[0]!.title} 1`)).toBeDefined()
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('tells nothing-matches from nothing-yet, and searches from the first page', async () => {
    const user = userEvent.setup()
    render(<ListThatLoads load={() => Promise.resolve(rows)} onOpen={() => {}} />)
    await screen.findByText(`${works[0]!.title} 1`)
    await user.click(screen.getByRole('button', { name: 'Page 2' }))
    await user.type(screen.getByRole('searchbox', { name: 'Search works' }), 'zzz')
    expect(screen.getByText('Nothing called "zzz"')).toBeDefined()
    await user.clear(screen.getByRole('searchbox', { name: 'Search works' }))
    // Back on page one, not on the page 2 the search was started from.
    expect(screen.getByText(`${works[0]!.title} 1`)).toBeDefined()
  })

  it('opens the row that was chosen', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<ListThatLoads load={() => Promise.resolve(rows)} onOpen={onOpen} />)
    await user.click(await screen.findByText(`${works[0]!.title} 1`))
    expect(onOpen).toHaveBeenCalledWith(rows[0]!.id)
  })

  it('passes axe with rows on screen', async () => {
    await expectNoA11yViolations(<ListThatLoads load={() => Promise.resolve(rows)} onOpen={() => {}} />, undefined, () =>
      screen.findByText(`${works[0]!.title} 1`),
    )
  })
})
