// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Switch } from './switch'

/*
 * Switch.
 *
 * It has to be a `switch` to anything reading the page, not a checkbox that
 * happens to slide: the role is what tells a reader this takes effect now
 * rather than when a form is submitted. That distinction is the component's
 * only reason to exist next to Checkbox, so it is the first test.
 */

describe('Switch', () => {
  it('is a switch, not a checkbox', () => {
    render(<Switch>Notify me</Switch>)
    expect(screen.getByRole('switch', { name: 'Notify me' })).toBeDefined()
  })

  it('is operated by clicking its words', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<Switch onCheckedChange={onCheckedChange}>Notify me</Switch>)

    await user.click(screen.getByText('Notify me'))
    // Base UI passes its own event details second; the value is the subject.
    expect(onCheckedChange.mock.calls[0]?.[0]).toBe(true)
  })

  it('toggles with the space key', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<Switch onCheckedChange={onCheckedChange}>Notify me</Switch>)

    await user.tab()
    await user.keyboard(' ')
    expect(onCheckedChange.mock.calls[0]?.[0]).toBe(true)
  })

  it('reports its state, not only its position', () => {
    // The thumb slides; a reader hears `aria-checked`. Under reduced motion
    // the slide is gone and this is all that is left.
    render(<Switch defaultChecked>Notify me</Switch>)
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true')
  })

  it('renders alone when it has no words', () => {
    render(<Switch aria-label="Notify me" />)
    expect(screen.getByRole('switch', { name: 'Notify me' })).toBeDefined()
  })

  it('lets the caller win a conflict on the bare control', () => {
    const { container } = render(<Switch aria-label="Notify me" className="w-16" />)
    expect(container.firstElementChild?.className).toContain('w-16')
  })

  it('does not fire when disabled', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(
      <Switch disabled onCheckedChange={onCheckedChange}>
        Notify me
      </Switch>,
    )

    await user.click(screen.getByText('Notify me'))
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Switch defaultChecked>Notify me</Switch>)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe in both states', async () => {
    await expectNoA11yViolations(<Switch>Notify me</Switch>)
    await expectNoA11yViolations(<Switch defaultChecked>Notify me</Switch>)
  })
})
