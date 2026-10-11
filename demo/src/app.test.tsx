// @vitest-environment jsdom
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { you } from '../../fixtures/world'
import { App } from './App'
import { DEMO_PASSWORD } from './screens/sign-in'

/*
 * kilna-lite, walked the way a visitor walks it: in through the sign-in,
 * the first day, the samples, a work by its address, and back to the first
 * day from the settings. The blocks have tests of their own; this is the
 * test that they still work as a product uses them - under a router that
 * owns the address, over data that changes underneath.
 */

function go(path: string) {
  act(() => {
    window.location.hash = `/${path}`
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

beforeEach(() => {
  window.sessionStorage.clear()
  window.history.replaceState(null, '', '/')
  // jsdom has no media queries; a desktop window, then.
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
})

async function signIn() {
  await userEvent.type(screen.getByLabelText(/^Email/), you.email)
  await userEvent.type(screen.getByLabelText(/^Password/), DEMO_PASSWORD)
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  await screen.findByRole('heading', { level: 1, name: /Welcome/ })
}

describe('kilna-lite', () => {
  it('lets nobody in with the wrong password', async () => {
    render(<App />)
    await userEvent.type(screen.getByLabelText(/^Email/), you.email)
    await userEvent.type(screen.getByLabelText(/^Password/), 'nope')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/do not match/)
  })

  it('opens on the first day, and fills when the samples arrive', async () => {
    render(<App />)
    await signIn()
    expect(screen.getByRole('progressbar', { name: 'Getting started' })).toBeDefined()
    await userEvent.click(screen.getByRole('button', { name: 'Bring in the samples' }))
    expect(screen.getByRole('heading', { level: 1, name: /Good afternoon/ })).toBeDefined()
  })

  it('opens a work by its address', async () => {
    render(<App />)
    await signIn()
    await userEvent.click(screen.getByRole('button', { name: 'Bring in the samples' }))
    go('works/w3')
    expect(screen.getByRole('heading', { level: 2, name: 'Ash and after' })).toBeDefined()
    const row = screen.getByRole('link', { name: /Ash and after/ })
    expect(row.getAttribute('aria-current')).toBe('true')
    expect(row.getAttribute('href')).toBe('#/works/w3')
  })

  it('goes back to the first day when the workspace is reset', async () => {
    render(<App />)
    await signIn()
    await userEvent.click(screen.getByRole('button', { name: 'Bring in the samples' }))
    go('settings/data')
    await userEvent.click(screen.getByRole('button', { name: 'Reset the workspace' }))
    const dialog = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reset' }))
    expect(await screen.findByRole('heading', { level: 1, name: /Welcome/ })).toBeDefined()
  })

  it('remembers who is signed in for the tab, and forgets on sign-out', async () => {
    const { unmount } = render(<App />)
    await signIn()
    unmount()
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /Welcome/ })).toBeDefined()
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(screen.getByRole('heading', { level: 1, name: /Sign in/ })).toBeDefined()
  })
})
