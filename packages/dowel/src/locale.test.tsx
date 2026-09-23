// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LocaleProvider, documentLocale, useLocale } from './locale'

/*
 * Where a date's language comes from.
 *
 * The order is the whole contract - explicit, provider, `<html lang>`,
 * English - and the one answer that must never come out is the browser's.
 */

function Shows({ explicit }: { explicit?: string }) {
  return <span data-testid="locale">{useLocale(explicit)}</span>
}

const shown = () => screen.getByTestId('locale').textContent

afterEach(() => {
  document.documentElement.lang = ''
  vi.restoreAllMocks()
})

describe('useLocale', () => {
  it('speaks the page’s language, not the browser’s', () => {
    // The kasl-server defect: an English interface, a Russian browser.
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ru-RU')
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ru-RU'])
    document.documentElement.lang = 'en'
    render(<Shows />)
    expect(shown()).toBe('en')
  })

  it('falls back to English when the page names nothing', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ru-RU')
    render(<Shows />)
    expect(shown()).toBe('en')
    expect(documentLocale()).toBe('en')
  })

  it('lets a provider speak for part of the page', () => {
    document.documentElement.lang = 'en'
    render(
      <LocaleProvider locale="de">
        <Shows />
      </LocaleProvider>,
    )
    expect(shown()).toBe('de')
  })

  it('lets an explicit locale beat both', () => {
    render(
      <LocaleProvider locale="de">
        <Shows explicit="pt-BR" />
      </LocaleProvider>,
    )
    expect(shown()).toBe('pt-BR')
  })

  it('follows the page when it changes language', async () => {
    document.documentElement.lang = 'en'
    render(<Shows />)
    await act(async () => {
      document.documentElement.lang = 'de'
      // The observer reports on a microtask.
      await Promise.resolve()
    })
    expect(shown()).toBe('de')
  })
})
