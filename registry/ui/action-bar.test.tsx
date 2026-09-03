// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Button } from './button'
import {
  ActionBar,
  ActionBarButton,
  ActionBarGroup,
  ActionBarSeparator,
  ActionBarSpacer,
  actionBarVariants,
} from './action-bar'

function Bar() {
  return (
    <ActionBar aria-label="Form actions">
      <ActionBarButton render={<Button variant="primary">Save</Button>} />
      <ActionBarButton render={<Button variant="ghost">Cancel</Button>} />
    </ActionBar>
  )
}

describe('ActionBar', () => {
  it('is a toolbar, named so a page may have more than one', () => {
    render(<Bar />)
    expect(screen.getByRole('toolbar', { name: 'Form actions' })).toBeDefined()
  })

  it('is one tab stop, with the arrows moving inside it', async () => {
    const user = userEvent.setup()
    render(
      <>
        <input aria-label="Before" />
        <Bar />
      </>,
    )

    screen.getByLabelText('Before').focus()
    await user.tab()

    // Tabbing out of the last field must land on Save, not in a queue of
    // buttons - which is the whole reason to build this on a toolbar.
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save' }))

    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }))
  })

  it('keeps the buttons the product gave it', () => {
    render(<Bar />)
    // `render` composes rather than replaces: the set's own Button keeps its
    // variants and the toolbar keeps its keyboard handling.
    expect(screen.getByRole('button', { name: 'Save' }).className).toContain('bg-accent')
  })

  it('sticks only when it is asked to', () => {
    expect(actionBarVariants({ position: 'static' })).not.toContain('sticky')
    expect(actionBarVariants({ position: 'bottom' })).toContain('sticky')
    expect(actionBarVariants({ position: 'top' })).toContain('sticky')
  })

  it('grows its seam on the side facing the content', () => {
    // Stuck at the bottom, the rule belongs on top of the bar; at the top, the
    // other way about. A bar that drew both would read as a box.
    expect(actionBarVariants({ position: 'bottom' })).toContain('border-t')
    expect(actionBarVariants({ position: 'top' })).toContain('border-b')
  })

  it('clears what scrolls under it, using the theme order rather than a number', () => {
    const { container } = render(
      <ActionBar position="bottom" aria-label="Form actions">
        <ActionBarButton render={<Button>Save</Button>} />
      </ActionBar>,
    )
    expect(container.firstElementChild?.getAttribute('style')).toContain('var(--z-sticky)')
  })

  it('leaves a bar in the flow of the page unlayered', () => {
    const { container } = render(
      <ActionBar aria-label="Form actions">
        <ActionBarButton render={<Button>Save</Button>} />
      </ActionBar>,
    )
    expect(container.firstElementChild?.getAttribute('style')).toBeNull()
  })

  it('separates groups without announcing a control', () => {
    render(
      <ActionBar aria-label="Editor">
        <ActionBarGroup>
          <ActionBarButton render={<Button>Bold</Button>} />
        </ActionBarGroup>
        <ActionBarSeparator />
        <ActionBarGroup>
          <ActionBarButton render={<Button>Link</Button>} />
        </ActionBarGroup>
      </ActionBar>,
    )

    expect(screen.getByRole('separator')).toBeDefined()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('pushes what follows to the far end without a wrapper', () => {
    const { container } = render(
      <ActionBar aria-label="Form actions">
        <ActionBarSpacer />
        <ActionBarButton render={<Button>Save</Button>} />
      </ActionBar>,
    )
    // Decorative: a spacer a screen reader stops at is a spacer in the way.
    expect(container.querySelector('[aria-hidden="true"]')?.className).toContain('flex-1')
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(<Bar />)
    unmount()
  })
})
