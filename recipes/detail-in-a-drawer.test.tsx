// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { describe, expect, it, vi } from 'vitest'
import { people, worldNow, works } from '../fixtures/world'
import { expectNoA11yViolations } from '../tests/a11y'
import { DetailInADrawer } from './detail-in-a-drawer'

/*
 * The recipe is code a product copies by reading it, so it is held to what it
 * claims: a named dialog, Escape that returns the reader to their row, a list
 * that stays put, words for a missing score, and a date that keeps its exact
 * moment.
 */

const harbour = works[0]! // scored, three versions
const quiet = works[1]! // not scored
const noVersions = works[3]! // no versions

function screenUnderTest(onOpenWork: (id: string) => void = () => {}) {
  return <DetailInADrawer works={works} people={people} now={new Date(worldNow)} onOpenWork={onOpenWork} />
}

function rowOf(title: string) {
  return screen.getByRole('button', { name: new RegExp(title) })
}

describe('details in a drawer', () => {
  it('opens a dialog named by the work, with its facts, versions and actions', async () => {
    const user = userEvent.setup()
    render(screenUnderTest())
    await user.click(rowOf(harbour.title))
    const drawer = await screen.findByRole('dialog', { name: harbour.title })
    expect(within(drawer).getByText('Ines Duarte')).toBeDefined()
    expect(within(drawer).getByText('8 / 10')).toBeDefined()
    expect(within(drawer).getByRole('heading', { name: 'Versions' })).toBeDefined()
    expect(within(drawer).getByText('Version 3', { exact: false })).toBeDefined()
    expect(within(drawer).getByRole('button', { name: 'Open work' })).toBeDefined()
    expect(within(drawer).getByRole('button', { name: 'Close' })).toBeDefined()
  })

  it('closes on Escape and gives the focus back to the row that opened it', async () => {
    const user = userEvent.setup()
    render(screenUnderTest())
    const row = rowOf(harbour.title)
    await user.click(row)
    await screen.findByRole('dialog', { name: harbour.title })
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(row)
  })

  it('leaves the list in place and marks the chosen row while the drawer is open', async () => {
    const user = userEvent.setup()
    render(screenUnderTest())
    const row = rowOf(harbour.title)
    expect(row.getAttribute('aria-current')).toBeNull()
    await user.click(row)
    await screen.findByRole('dialog')
    // Out of reach under the scrim, but not unmounted: the list keeps its
    // place and its scroll.
    expect(row.isConnected).toBe(true)
    expect(row.getAttribute('aria-current')).toBe('true')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(row.getAttribute('aria-current')).toBeNull())
  })

  it('says in words when a work has no score, and when it has no versions', async () => {
    const user = userEvent.setup()
    render(screenUnderTest())
    await user.click(rowOf(quiet.title))
    const drawer = await screen.findByRole('dialog', { name: quiet.title })
    expect(within(drawer).getByText('Not scored yet')).toBeDefined()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await user.click(rowOf(noVersions.title))
    expect(await screen.findByText('No versions yet.')).toBeDefined()
  })

  it('writes the update as a relative phrase that carries the exact date', async () => {
    const user = userEvent.setup()
    render(screenUnderTest())
    await user.click(rowOf(harbour.title))
    const drawer = await screen.findByRole('dialog')
    const updated = drawer.querySelector('time')!
    expect(updated.textContent).toBe('2 hours ago')
    expect(updated.getAttribute('datetime')).toBe(new Date(harbour.updated).toISOString())
    expect(updated.getAttribute('title')).toMatch(/2026/)
  })

  it('runs the main action for the work that is open', async () => {
    const user = userEvent.setup()
    const onOpenWork = vi.fn()
    render(screenUnderTest(onOpenWork))
    await user.click(rowOf(harbour.title))
    await user.click(await screen.findByRole('button', { name: 'Open work' }))
    expect(onOpenWork).toHaveBeenCalledWith(harbour.id)
  })

  it('passes axe, list and open drawer both', async () => {
    const user = userEvent.setup()
    await expectNoA11yViolations(screenUnderTest())
    // The drawer is portalled out of the render container, so it is checked
    // on its own.
    await user.click(rowOf(harbour.title))
    const drawer = await screen.findByRole('dialog')
    const results = await axe.run(drawer, {
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    })
    expect(results.violations).toEqual([])
  })
})
