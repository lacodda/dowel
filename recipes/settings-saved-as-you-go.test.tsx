// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { you } from '../fixtures/world'
import { expectNoA11yViolations } from '../tests/a11y'
import { SettingsSavedAsYouGo, type Settings, type SettingKey, type SettingValue } from './settings-saved-as-you-go'

/*
 * The recipe is code a product copies by reading it, so it is held to what it
 * claims: nothing is sent mid-sentence, the outcome is announced, a failure
 * keeps what was typed and offers another try, and a switch does not wait.
 */

const initial: Settings = { name: you.name, email: you.email, digest: false, density: 'comfortable' }

type Save = (key: SettingKey, value: SettingValue) => Promise<void>

function setup(save: Save) {
  const user = userEvent.setup()
  render(<SettingsSavedAsYouGo initial={initial} save={save} />)
  return user
}

describe('settings that save as you go', () => {
  it('saves nothing while typing, and one thing when the field is left', async () => {
    const save = vi.fn<Save>().mockResolvedValue(undefined)
    const user = setup(save)
    const name = screen.getByRole('textbox', { name: 'Display name' })
    await user.clear(name)
    await user.type(name, 'Ines D.')
    expect(save).not.toHaveBeenCalled()
    await user.tab()
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('name', 'Ines D.')
  })

  it('saves on Enter too, and not at all when nothing changed', async () => {
    const save = vi.fn<Save>().mockResolvedValue(undefined)
    const user = setup(save)
    await user.click(screen.getByRole('textbox', { name: 'Email' }))
    await user.tab()
    expect(save).not.toHaveBeenCalled()
    await user.type(screen.getByRole('textbox', { name: 'Email' }), 'x{Enter}')
    expect(save).toHaveBeenCalledWith('email', `${you.email}x`)
  })

  it('announces saving, then saved, in a live region', async () => {
    let finish: () => void = () => {}
    const save = vi.fn<Save>(() => new Promise<void>((resolve) => (finish = resolve)))
    const user = setup(save)
    await user.type(screen.getByRole('textbox', { name: 'Display name' }), '!')
    await user.tab()
    const live = screen.getByText('Saving').closest('[aria-live]')
    expect(live?.getAttribute('aria-live')).toBe('polite')
    finish()
    await waitFor(() => expect(screen.getByText('Saved')).toBeDefined())
    expect(screen.getByText('Saved').closest('[aria-live]')).toBe(live)
  })

  it('says a save failed, keeps what was typed, and tries again on request', async () => {
    const save = vi.fn<Save>().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
    const user = setup(save)
    const name = screen.getByRole('textbox', { name: 'Display name' })
    await user.clear(name)
    await user.type(name, 'Ines D.')
    await user.tab()
    expect((await screen.findByRole('alert')).textContent).toContain('Not saved')
    expect((screen.getByRole('textbox', { name: 'Display name' }) as HTMLInputElement).value).toBe('Ines D.')
    expect(screen.queryByText('Saved')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Try saving Display name again' }))
    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenLastCalledWith('name', 'Ines D.')
    await waitFor(() => expect(screen.getByText('Saved')).toBeDefined())
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('saves a switch at once, and a choice too', async () => {
    const save = vi.fn<Save>().mockResolvedValue(undefined)
    const user = setup(save)
    await user.click(screen.getByRole('switch', { name: 'Email me a weekly digest' }))
    expect(save).toHaveBeenCalledWith('digest', true)
    await user.click(screen.getByRole('radio', { name: 'Compact' }))
    expect(save).toHaveBeenCalledWith('density', 'compact')
  })

  it('keeps a failed switch where it was put, with its own way out', async () => {
    const save = vi.fn<Save>().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
    const user = setup(save)
    await user.click(screen.getByRole('switch', { name: 'Email me a weekly digest' }))
    await screen.findByRole('alert')
    expect(screen.getByRole('switch', { name: 'Email me a weekly digest' }).getAttribute('aria-checked')).toBe('true')
    await user.click(screen.getByRole('button', { name: 'Try saving Email me a weekly digest again' }))
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
    expect(save).toHaveBeenCalledTimes(2)
  })

  it('lets a late answer to an old attempt land nowhere', async () => {
    let failFirst: (reason: Error) => void = () => {}
    const save = vi.fn<Save>().mockImplementationOnce(() => new Promise<void>((_, reject) => (failFirst = reject)))
    const user = setup(save)
    const digest = screen.getByRole('switch', { name: 'Email me a weekly digest' })
    await user.click(digest)
    // Put back before the first answer arrives; the first one then fails.
    await user.click(digest)
    failFirst(new Error('offline'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByRole('alert')).toBeNull()
    expect(digest.getAttribute('aria-checked')).toBe('false')
  })

  it('passes axe, including with a failure showing', async () => {
    const save = vi.fn<Save>().mockRejectedValue(new Error('offline'))
    const user = userEvent.setup()
    const ui = <SettingsSavedAsYouGo initial={initial} save={save} />
    render(ui)
    await user.click(screen.getByRole('switch', { name: 'Email me a weekly digest' }))
    await screen.findByRole('alert')
    await expectNoA11yViolations(ui)
  })
})
