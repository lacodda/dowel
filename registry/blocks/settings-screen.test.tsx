// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { SettingsGroup, SettingsScreen, type SettingsScreenProps, type SettingsSection } from './settings-screen'

const SECTIONS: SettingsSection[] = [
  {
    id: 'general',
    label: 'General',
    description: 'Theme, language, start screen',
    content: <p>The theme</p>,
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Name and address',
    content: <p>Your name</p>,
    foot: <button type="button">Save the profile</button>,
  },
  { id: 'data', label: 'Data', content: <p>Export everything</p> },
]

const WORDS = { sections: 'Settings', back: 'All settings' }

function Screen({ initial = 'general', ...props }: Partial<SettingsScreenProps> & { initial?: string | null }) {
  const [active, setActive] = useState<string | null>(initial)
  return (
    <SettingsScreen
      title="Settings"
      sections={SECTIONS}
      active={active}
      onSelect={setActive}
      words={WORDS}
      {...props}
    />
  )
}

const column = () => screen.getByRole('navigation', { name: 'Settings' })

afterEach(() => {
  delete (HTMLElement.prototype as { checkVisibility?: unknown }).checkVisibility
})

describe('SettingsScreen', () => {
  it('lists every section by its name and what is in it', () => {
    render(<Screen />)
    const rows = within(column()).getAllByRole('button')
    expect(rows.map((row) => row.textContent)).toEqual([
      'GeneralTheme, language, start screen',
      'ProfileName and address',
      'Data',
    ])
  })

  it('opens what is pressed, and names it as the current page', async () => {
    render(<Screen />)
    await userEvent.click(within(column()).getByRole('button', { name: /Profile/ }))
    expect(within(column()).getByRole('button', { name: /Profile/ }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('heading', { level: 2, name: 'Profile' })).toBeDefined()
    expect(screen.getByText('Your name')).toBeDefined()
    expect(screen.queryByText('The theme')).toBeNull()
  })

  it('stands a section bar at the foot of the section that has one', async () => {
    render(<Screen />)
    expect(screen.queryByRole('button', { name: 'Save the profile' })).toBeNull()
    await userEvent.click(within(column()).getByRole('button', { name: /Profile/ }))
    const bar = screen.getByRole('button', { name: 'Save the profile' })
    // Outside the part that scrolls, so it is in sight however far down.
    expect(screen.getByRole('group', { name: 'Profile' }).contains(bar)).toBe(false)
  })

  it('shows the first section where nothing is open', () => {
    // On a wide screen something is always open; on a narrow one, `null` is
    // the column alone - which the frame decides from `open`.
    const { container } = render(<Screen initial={null} />)
    expect(screen.getByText('The theme')).toBeDefined()
    expect(container.querySelector('[data-list-detail]')!.hasAttribute('data-open')).toBe(false)
    expect(within(column()).getByRole('button', { name: /General/ }).getAttribute('aria-current')).toBe('page')
  })

  it('goes back to the column', async () => {
    const onSelect = vi.fn()
    render(<SettingsScreen title="Settings" sections={SECTIONS} active="data" onSelect={onSelect} words={WORDS} />)
    await userEvent.click(screen.getByRole('button', { name: 'All settings' }))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('keeps the column a landmark named for the screen, its caption off the screen', () => {
    render(<Screen />)
    expect(column()).toBeDefined()
    expect(within(column()).getByRole('heading', { name: 'Settings' }).className).toContain('sr-only')
  })

  it('draws a section as the product link when given one', async () => {
    const onSelect = vi.fn()
    render(
      <SettingsScreen
        title="Settings"
        sections={SECTIONS}
        active="general"
        onSelect={onSelect}
        sectionRender={(section) => <a href={`#/settings/${section.id}`} onClick={(event) => event.preventDefault()} />}
        words={WORDS}
      />,
    )
    const link = within(column()).getByRole('link', { name: /Data/ })
    expect(link.getAttribute('href')).toBe('#/settings/data')
    await userEvent.click(link)
    expect(onSelect).not.toHaveBeenCalled()
  })

  describe('where only one of the two fits', () => {
    function narrow() {
      ;(HTMLElement.prototype as { checkVisibility?: () => boolean }).checkVisibility = function (this: HTMLElement) {
        const root = this.closest('[data-list-detail]')
        if (root === null) return true
        const open = root.hasAttribute('data-open')
        if (this.closest('[data-list]')) return !open
        if (this.closest('[data-detail]')) return open
        return true
      }
    }

    it('hands the focus to the section once the column steps aside', async () => {
      narrow()
      render(<Screen initial={null} />)
      await userEvent.click(within(column()).getByRole('button', { name: /Data/ }))
      const heading = screen.getByRole('heading', { level: 2, name: 'Data' })
      expect(document.activeElement).toBe(heading)
      expect(heading.getAttribute('tabindex')).toBe('-1')
    })

    it('hands it back to the section that was open', async () => {
      narrow()
      render(<Screen initial={null} />)
      await userEvent.click(within(column()).getByRole('button', { name: /Data/ }))
      await userEvent.click(screen.getByRole('button', { name: 'All settings' }))
      expect(document.activeElement).toBe(within(column()).getByRole('button', { name: /Data/ }))
    })
  })

  it('has no accessibility violations', async () => {
    await expectNoA11yViolations(<Screen initial="profile" />)
  })
})

describe('SettingsGroup', () => {
  it('captions its fields', () => {
    render(
      <SettingsGroup title="Appearance" description="How the screen looks.">
        <label>
          Theme <input />
        </label>
      </SettingsGroup>,
    )
    expect(screen.getByRole('heading', { level: 3, name: 'Appearance' })).toBeDefined()
    expect(screen.getByText('How the screen looks.')).toBeDefined()
  })

  it('stands at the width of a field, and lets the caller win', () => {
    const { container, rerender } = render(<SettingsGroup title="Appearance">{null}</SettingsGroup>)
    expect(container.firstElementChild!.className).toContain('max-w-md')
    rerender(
      <SettingsGroup title="Appearance" className="max-w-lg">
        {null}
      </SettingsGroup>,
    )
    expect(container.firstElementChild!.className).toContain('max-w-lg')
    expect(container.firstElementChild!.className).not.toContain('max-w-md')
  })

  it('has no accessibility violations', async () => {
    await expectNoA11yViolations(
      <SettingsGroup title="Appearance">
        <label>
          Theme <input />
        </label>
      </SettingsGroup>,
    )
  })
})
