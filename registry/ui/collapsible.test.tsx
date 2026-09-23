// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from './collapsible'

/*
 * Collapsible.
 *
 * The behaviour a reader depends on is the wiring between the trigger and the
 * panel it opens: `aria-expanded` follows the real state, the panel is
 * reachable by `aria-controls`, and the keyboard opens it the same way a
 * click does. None of that is re-implemented here - it is Base UI's - so what
 * these tests prove is that dowel's markup does not break the wiring, and
 * that a caller's `className` still lands.
 */

function Notes({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger>Release notes</CollapsibleTrigger>
      <CollapsiblePanel>Fixed a crash on startup.</CollapsiblePanel>
    </Collapsible>
  )
}

describe('Collapsible', () => {
  it('reports its state through aria-expanded, not only through what is visible', async () => {
    const user = userEvent.setup()
    render(<Notes />)
    const trigger = screen.getByRole('button', { name: 'Release notes' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    await user.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
  })

  it('starts open when defaultOpen is set', () => {
    render(<Notes defaultOpen />)
    expect(screen.getByRole('button', { name: 'Release notes' }).getAttribute('aria-expanded')).toBe('true')
  })

  it('is controlled when open and onOpenChange are given', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    function Controlled() {
      return (
        <Collapsible open={false} onOpenChange={onOpenChange}>
          <CollapsibleTrigger>Release notes</CollapsibleTrigger>
          <CollapsiblePanel>Fixed a crash on startup.</CollapsiblePanel>
        </Collapsible>
      )
    }
    render(<Controlled />)
    const trigger = screen.getByRole('button', { name: 'Release notes' })
    await user.click(trigger)
    // A controlled collapsible does not open itself - the caller decides.
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything())
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('opens with the keyboard, not only a click', async () => {
    const user = userEvent.setup()
    render(<Notes />)
    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Release notes' }))

    await user.keyboard('{Enter}')
    expect(screen.getByRole('button', { name: 'Release notes' }).getAttribute('aria-expanded')).toBe('true')

    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Release notes' }).getAttribute('aria-expanded')).toBe('false')
  })

  it('connects the trigger to its panel', () => {
    render(<Notes defaultOpen />)
    const trigger = screen.getByRole('button', { name: 'Release notes' })
    const panelId = trigger.getAttribute('aria-controls')
    expect(panelId).toBeTruthy()
    expect(document.getElementById(panelId!)?.textContent).toBe('Fixed a crash on startup.')
  })

  it('does not open when disabled', async () => {
    const user = userEvent.setup()
    render(
      <Collapsible disabled>
        <CollapsibleTrigger>Release notes</CollapsibleTrigger>
        <CollapsiblePanel>Fixed a crash on startup.</CollapsiblePanel>
      </Collapsible>,
    )
    const trigger = screen.getByRole('button', { name: 'Release notes' })
    await user.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('lets the caller win a className conflict on the trigger', () => {
    render(
      <Collapsible>
        <CollapsibleTrigger className="w-16">Release notes</CollapsibleTrigger>
        <CollapsiblePanel>Fixed a crash on startup.</CollapsiblePanel>
      </Collapsible>,
    )
    expect(screen.getByRole('button', { name: 'Release notes' }).className).toContain('w-16')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Notes defaultOpen />)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe closed and open', async () => {
    await expectNoA11yViolations(<Notes />)
    await expectNoA11yViolations(<Notes defaultOpen />)
  })
})
