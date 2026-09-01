// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Alert, alertVariants } from './alert'

/*
 * Alert.
 *
 * Not interactive, so there is no keyboard to drive. What is worth pinning is
 * the shape - three optional slots that must appear when they are given and
 * must not appear when they are not - and the one decision the component
 * deliberately refuses to make for the caller: `role`.
 *
 * That refusal is the whole reason there is a test for an absence here. An
 * alert that is simply part of the page must not be a live region, or a
 * screen reader interrupts itself to read the furniture; an alert that
 * appears because of something the reader just did must be. Only the product
 * knows which it has, so a default would be wrong in half the uses - and a
 * default is exactly the kind of thing that gets added later by someone who
 * read the component's name and not its comment.
 */

const TONES = ['neutral', 'good', 'warn', 'bad', 'info'] as const

describe('Alert', () => {
  it('renders what it is given', () => {
    render(<Alert>The export is out of date.</Alert>)
    expect(screen.getByText('The export is out of date.')).toBeDefined()
  })

  it('draws the slots it is given', () => {
    render(
      <Alert
        icon={<span data-testid="icon" />}
        title="Not saved"
        action={<button type="button">Retry</button>}
      >
        The connection dropped.
      </Alert>,
    )
    expect(screen.getByTestId('icon')).toBeDefined()
    expect(screen.getByText('Not saved')).toBeDefined()
    expect(screen.getByText('The connection dropped.')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDefined()
  })

  it('draws no empty box for a slot it was not given', () => {
    // The half that is easy to get wrong: rendering `{title}` unconditionally
    // leaves an empty element behind, which costs a margin and gives a screen
    // reader a heading with nothing in it. So a one-line alert is checked to
    // be one line.
    const { container } = render(<Alert>Just the sentence.</Alert>)
    const root = container.firstElementChild!
    expect(root.querySelectorAll('svg')).toHaveLength(0)
    // The text wrapper, and nothing either side of it.
    expect(root.children).toHaveLength(1)
    expect(root.textContent).toBe('Just the sentence.')
  })

  it('draws a title with no body, and a body with no title', () => {
    // Both halves are optional independently: a heading on its own is a
    // legitimate alert, and so is a sentence on its own.
    const titleOnly = render(<Alert title="No axes yet" />)
    expect(titleOnly.container.textContent).toBe('No axes yet')
    titleOnly.unmount()

    const bodyOnly = render(<Alert>No axes yet</Alert>)
    expect(bodyOnly.container.textContent).toBe('No axes yet')
  })

  it('has no role of its own', () => {
    // Deliberate, and the reason it is asserted rather than left implicit: a
    // default `role="alert"` would make every alert on a page announce itself
    // on load, over whatever the reader was already being told.
    const { container } = render(<Alert>A condition that is still true.</Alert>)
    expect(container.firstElementChild?.getAttribute('role')).toBeNull()
  })

  it('takes the role the caller gives it', () => {
    // The other half. The prop has to reach the element, or the product that
    // does know it needs a live region cannot get one.
    render(<Alert role="alert">That did not save.</Alert>)
    expect(screen.getByRole('alert').textContent).toBe('That did not save.')
  })

  it('draws every tone, and draws each one differently', () => {
    const base = alertVariants({ tone: 'nonexistent' as never })
    const drawn = new Map(TONES.map((tone) => [tone, alertVariants({ tone })]))

    for (const [tone, classes] of drawn) {
      expect(classes, `\`${tone}\` adds nothing - is it still defined?`).not.toBe(base)
    }
    expect(new Set(drawn.values()).size, 'two tones draw the same').toBe(TONES.length)
  })

  it('carries no colour outside the vocabulary', () => {
    // The rule the system rests on: a primitive never writes a raw colour and
    // never uses a `dark:` utility, because the theme swaps underneath.
    const all = TONES.map((tone) => alertVariants({ tone })).join(' ')
    expect(all).not.toMatch(/\bdark:/)
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('lets the caller win a conflict', () => {
    // `cn` resolves by utility group, so a caller's class beats the
    // component's rather than the two fighting over source order.
    const { container } = render(<Alert className="rounded-full">Something</Alert>)
    expect(container.firstElementChild?.className).toContain('rounded-full')
  })
})

describe('Alert, for a reader', () => {
  it('passes axe in every tone, with everything in it', async () => {
    // Nothing to press, so what is being checked is that the tone is not the
    // only thing carrying the message and that the slots do not produce a
    // structure a screen reader reads wrong.
    for (const tone of TONES) {
      const { unmount } = await expectNoA11yViolations(
        <Alert
          tone={tone}
          role="alert"
          icon={<span aria-hidden />}
          title="Not saved"
          action={<button type="button">Retry</button>}
        >
          The connection dropped.
        </Alert>,
      )
      unmount()
    }
  })
})
