// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import axe from 'axe-core'
import { expectNoA11yViolations } from '../../tests/a11y'
import { PasswordField } from './password-field'

/*
 * PasswordField.
 *
 * The first two tests are the component's promises about the reveal: it
 * starts masked, and nothing but the reader's own click changes that. They
 * are the ones worth breaking a build over - a password on screen that
 * nobody asked for is the single failure this component must not have.
 */

function Example(props: Partial<React.ComponentProps<typeof PasswordField>> = {}) {
  return (
    <PasswordField
      showLabel="Show password"
      hideLabel="Hide password"
      aria-label="Password"
      {...props}
    />
  )
}

describe('PasswordField', () => {
  it('starts masked', () => {
    render(<Example />)
    expect(screen.getByLabelText('Password').getAttribute('type')).toBe('password')
  })

  it('cannot be talked into starting revealed', () => {
    /* The guarantee is that a product cannot put a password on screen without
     * the reader asking. The type enforces it - there is no such prop, so
     * passing one does not compile - and this covers the runtime half: the
     * plausible names a caller might reach for are spread onto the input and
     * must not turn into something that unmasks it. */
    for (const attempt of [{ revealed: true }, { visible: true }, { type: 'text' }]) {
      const { unmount } = render(<Example {...(attempt as Record<string, unknown>)} />)
      expect(
        screen.getByLabelText('Password').getAttribute('type'),
        `\`${JSON.stringify(attempt)}\` unmasked the field`,
      ).toBe('password')
      unmount()
    }
  })

  it('reveals when the reader asks, and hides again', async () => {
    const user = userEvent.setup()
    render(<Example />)

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(screen.getByLabelText('Password').getAttribute('type')).toBe('text')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(screen.getByLabelText('Password').getAttribute('type')).toBe('password')
  })

  it('renames the button for what it will do next', () => {
    // The name is what a screen reader announces, so it has to describe the
    // action rather than the state.
    render(<Example />)
    expect(screen.getByRole('button', { name: 'Show password' })).toBeDefined()
  })

  it('says whether the password is showing', async () => {
    const user = userEvent.setup()
    render(<Example />)
    const button = screen.getByRole('button', { name: 'Show password' })
    expect(button.getAttribute('aria-pressed')).toBe('false')

    await user.click(button)
    expect(screen.getByRole('button', { name: 'Hide password' }).getAttribute('aria-pressed')).toBe(
      'true',
    )
  })

  it('points the button at the field it controls', () => {
    render(<Example />)
    const controls = screen.getByRole('button').getAttribute('aria-controls')
    expect(controls).toBeTruthy()
    expect(screen.getByLabelText('Password').getAttribute('id')).toBe(controls)
  })

  it('does not submit the form it sits in', () => {
    // A reveal button that defaults to `type="submit"` sends the form on the
    // first click - with the password half typed.
    render(<Example />)
    expect(screen.getByRole('button').getAttribute('type')).toBe('button')
  })

  it('reports what is typed', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(<Example onValueChange={onValueChange} />)

    await user.type(screen.getByLabelText('Password'), 'hunter2')
    expect(onValueChange).toHaveBeenCalled()
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe('hunter2')
  })

  it('passes autoComplete through rather than choosing one', async () => {
    // `current-password` on a login and `new-password` on a sign-up are
    // different, and only the product knows which this is.
    render(<Example autoComplete="new-password" />)
    expect(screen.getByLabelText('Password').getAttribute('autocomplete')).toBe('new-password')
  })

  it('is inert when disabled', async () => {
    const user = userEvent.setup()
    render(<Example disabled />)
    await user.click(screen.getByRole('button'))
    expect(screen.getByLabelText('Password').getAttribute('type')).toBe('password')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Example />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe, masked and revealed', async () => {
    // Both states, because the revealed one swaps the input's type and the
    // button's name - and an accessible name that goes missing on toggle is
    // exactly the kind of thing only the second state shows.
    await expectNoA11yViolations(<Example />)

    /* The revealed state cannot go through the helper - it renders its own
     * tree, so it would photograph a fresh masked field rather than the one
     * just toggled. axe is run over the interacted container directly. */
    const user = userEvent.setup()
    const { container } = render(<Example />)
    await user.click(screen.getAllByRole('button', { name: 'Show password' })[0]!)

    const results = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    })
    expect(results.violations.map((violation) => violation.id)).toEqual([])
  })
})
