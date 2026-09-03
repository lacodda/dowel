// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { App } from './App'

/*
 * The showcase's own chrome.
 *
 * Every component on the stand has an axe test; the stand around them had
 * none, and the stand is now a thing in its own right - a navigation, a
 * header, a page per component. It is also the first thing anyone sees of the
 * system, so a keyboard trap or an unnamed landmark here is a worse look than
 * the same defect inside a primitive.
 */

describe('the showcase', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', import.meta.env.BASE_URL)
    window.localStorage.clear()

    // jsdom has no `matchMedia`, and the theme hook asks the operating system
    // which theme is showing.
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
        onchange: null,
      })),
    )
  })

  it('has no accessibility violations on the front page', async () => {
    const { unmount } = await expectNoA11yViolations(<App />)
    unmount()
  })

  it('names the navigation, so it is not just one more list of links', () => {
    render(<App />)
    expect(screen.getByRole('navigation', { name: /components/i })).toBeDefined()
  })

  it('shows the version it was built from', () => {
    render(<App />)
    // The number itself is injected from the package manifest - checked in the
    // release-consistency gate - so what matters here is that it is rendered.
    expect(screen.getByText(/^v\d+\.\d+\.\d+$/)).toBeDefined()
  })

  it('opens the component named in the address bar', () => {
    window.history.replaceState(null, '', `${import.meta.env.BASE_URL}badge`)
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Badge' })).toBeDefined()
  })

  it('marks the open component in the navigation, for a reader who cannot see the tint', () => {
    window.history.replaceState(null, '', `${import.meta.env.BASE_URL}badge`)
    render(<App />)
    const nav = screen.getByRole('navigation', { name: /components/i })
    const current = within(nav).getByRole('link', { current: 'page' })
    expect(current.textContent).toBe('Badge')
  })

  it('shows the overview rather than an error for a path that names nothing', () => {
    window.history.replaceState(null, '', `${import.meta.env.BASE_URL}no-such-component`)
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /every component/i })).toBeDefined()
  })

  it('walks to a component from the keyboard alone', async () => {
    const user = userEvent.setup()
    render(<App />)

    const nav = screen.getByRole('navigation', { name: /components/i })
    const link = within(nav).getByRole('link', { name: 'Badge' })
    link.focus()
    await user.keyboard('{Enter}')

    expect(screen.getByRole('heading', { level: 1, name: 'Badge' })).toBeDefined()
  })

  it('has no accessibility violations on a component page either', async () => {
    window.history.replaceState(null, '', `${import.meta.env.BASE_URL}badge`)
    const { unmount } = await expectNoA11yViolations(<App />)
    unmount()
  })
})
