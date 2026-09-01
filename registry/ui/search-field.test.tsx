// @vitest-environment jsdom
import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { SearchField } from './search-field'

/*
 * SearchField.
 *
 * Three small things that the products kept not doing, so all three are held
 * here: the clear button exists and a keyboard can reach it, the shortcut
 * focuses the field without stealing keystrokes from someone typing
 * elsewhere, and neither of them invents a word.
 */

function Example(props: Partial<Parameters<typeof SearchField>[0]> = {}) {
  const [value, setValue] = useState(props.value ?? '')
  return (
    <SearchField
      aria-label="Search"
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next)
        props.onValueChange?.(next)
      }}
    />
  )
}

describe('SearchField', () => {
  it('is a search box, which is what offers previous queries', () => {
    render(<Example />)
    expect(screen.getByRole('searchbox')).toBeDefined()
  })

  it('reports what is typed', async () => {
    const user = userEvent.setup()
    const seen: string[] = []
    render(<Example onValueChange={(value) => seen.push(value)} />)

    await user.type(screen.getByRole('searchbox'), 'plum')
    expect(seen.at(-1)).toBe('plum')
  })

  it('draws no clear button until there is something to clear', async () => {
    const user = userEvent.setup()
    render(<Example clearLabel="Clear" />)

    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull()
    await user.type(screen.getByRole('searchbox'), 'p')
    expect(await screen.findByRole('button', { name: 'Clear' })).toBeDefined()
  })

  it('draws no clear button at all without a word for it', async () => {
    // A button announced as nothing is worse than no button: a screen reader
    // reads it out and cannot say what it does. So the label is what turns it
    // on, rather than a separate flag that can disagree with it.
    const user = userEvent.setup()
    render(<Example />)

    await user.type(screen.getByRole('searchbox'), 'plum')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('clears, and puts the cursor back in the field', async () => {
    // Clearing to then have to click the field again is half a feature.
    const user = userEvent.setup()
    render(<Example clearLabel="Clear" />)

    const field = screen.getByRole('searchbox')
    await user.type(field, 'plum')
    await user.click(screen.getByRole('button', { name: 'Clear' }))

    expect((field as HTMLInputElement).value).toBe('')
    expect(document.activeElement).toBe(field)
  })

  it('lets the keyboard reach the clear button', async () => {
    const user = userEvent.setup()
    render(<Example clearLabel="Clear" />)

    const field = screen.getByRole('searchbox')
    await user.type(field, 'plum')
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Clear' }))

    await user.keyboard('{Enter}')
    expect((field as HTMLInputElement).value).toBe('')
  })

  it('focuses on its shortcut, from anywhere', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <button type="button">elsewhere</button>
        <Example shortcut={['Mod', 'K']} />
      </div>,
    )

    const field = screen.getByRole('searchbox')
    await user.click(screen.getByRole('button', { name: 'elsewhere' }))
    expect(document.activeElement).not.toBe(field)

    await user.keyboard('{Control>}k{/Control}')
    await waitFor(() => expect(document.activeElement).toBe(field))
  })

  it('selects what is there, so the shortcut replaces rather than appends', async () => {
    const user = userEvent.setup()
    render(<Example shortcut={['Mod', 'K']} value="plum" />)

    const field = screen.getByRole('searchbox') as HTMLInputElement
    await user.type(field, 'plum')
    field.blur()

    await user.keyboard('{Control>}k{/Control}')
    await waitFor(() => expect(document.activeElement).toBe(field))
    expect(field.selectionStart, 'the existing query was not selected').toBe(0)
    expect(field.selectionEnd).toBe(field.value.length)
  })

  it('does not steal the shortcut from someone typing elsewhere', async () => {
    // Ctrl+K in another field is that field's business - in a text editor it
    // is "delete to end of line", and a search box grabbing it is a bug the
    // person will never be able to explain.
    const user = userEvent.setup()
    render(
      <div>
        <input aria-label="Somewhere else" />
        <Example shortcut={['Mod', 'K']} />
      </div>,
    )

    const other = screen.getByRole('textbox', { name: 'Somewhere else' })
    await user.click(other)
    await user.keyboard('{Control>}k{/Control}')

    expect(document.activeElement).toBe(other)
  })

  it('shows the shortcut until there is something to clear', async () => {
    // The hint and the clear button share the right edge; two things in one
    // place is how a field ends up with a cross drawn over a Ctrl.
    const user = userEvent.setup()
    const { container } = render(<Example clearLabel="Clear" shortcut={['Mod', 'K']} />)

    expect(container.querySelector('kbd')).not.toBeNull()
    await user.type(screen.getByRole('searchbox'), 'plum')
    await waitFor(() => expect(container.querySelector('kbd')).toBeNull())
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Example clearLabel="Clear" shortcut={['Mod', 'K']} />)
    const classes = [...container.querySelectorAll('*')]
      .map((node) => node.className)
      .filter((name) => typeof name === 'string')
      .join(' ')
    expect(classes).not.toMatch(/\bdark:/)
    expect(classes).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('lets the caller win a conflict', () => {
    const { container } = render(<Example className="w-96" />)
    expect(container.firstElementChild?.className).toContain('w-96')
  })

  it('passes axe, with and without the clear button', async () => {
    const { unmount } = await expectNoA11yViolations(<Example aria-label="Search" />)
    unmount()
    await expectNoA11yViolations(
      <Example aria-label="Search" value="plum" clearLabel="Clear" shortcut={['Mod', 'K']} />,
    )
  })
})
