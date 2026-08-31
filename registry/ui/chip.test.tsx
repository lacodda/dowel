// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Chip } from './chip'

describe('Chip', () => {
  it('renders what it is given', () => {
    render(<Chip>draft</Chip>)
    expect(screen.getByText('draft')).toBeDefined()
  })

  it('shows a count beside the label', () => {
    render(<Chip count={12}>tags</Chip>)
    expect(screen.getByText('12')).toBeDefined()
  })

  it('has no remove button unless it can be removed', () => {
    render(<Chip>plain</Chip>)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('removes on click', async () => {
    const onRemove = vi.fn()
    render(<Chip onRemove={onRemove} removeLabel="Remove">draft</Chip>)

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('removes from the keyboard, because the cross is a real button', async () => {
    // The bug this guards: every product wrote the cross as a `<span>`, which
    // the keyboard cannot reach and a screen reader does not announce.
    const onRemove = vi.fn()
    render(<Chip onRemove={onRemove} removeLabel="Remove">draft</Chip>)

    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove' }))
    await userEvent.keyboard('{Enter}')
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('takes the label for the remove button from the product', () => {
    // A primitive with a string of its own cannot be translated.
    render(
      <Chip onRemove={() => {}} removeLabel="Удалить">
        draft
      </Chip>,
    )
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeDefined()
  })

  it('does not set off whatever it sits inside', async () => {
    // A chip is usually inside something else that is also clickable.
    const onRemove = vi.fn()
    const onParent = vi.fn()
    render(
      <div onClick={onParent}>
        <Chip onRemove={onRemove} removeLabel="Remove">draft</Chip>
      </div>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onRemove).toHaveBeenCalledOnce()
    expect(onParent, 'the click reached the row behind the chip').not.toHaveBeenCalled()
  })
})

describe('Chip, for a reader and a keyboard', () => {
  it('passes axe plain', async () => {
    await expectNoA11yViolations(<Chip>draft</Chip>)
  })

  it('passes axe when removable', async () => {
    await expectNoA11yViolations(<Chip onRemove={() => {}} removeLabel="Remove">draft</Chip>)
  })

  it('reaches the remove button by Tab and fires it on Enter and Space', async () => {
    const onRemove = vi.fn()
    render(<Chip onRemove={onRemove} removeLabel="Remove">draft</Chip>)

    await userEvent.tab()
    const button = screen.getByRole('button', { name: 'Remove' })
    expect(document.activeElement).toBe(button)

    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onRemove).toHaveBeenCalledTimes(2)
  })

  it('announces the remove button by its label', () => {
    // The product's word, not a string baked into the component - checked the
    // same way a screen reader would find it: by its accessible name.
    render(
      <Chip onRemove={() => {}} removeLabel="Remove tag">
        draft
      </Chip>,
    )
    expect(screen.getByRole('button', { name: 'Remove tag' })).toBeDefined()
  })
})
