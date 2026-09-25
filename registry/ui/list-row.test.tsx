// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { ListRow, RowButton } from './list-row'

/*
 * ListRow and RowButton.
 *
 * A row is a fact or a choice, and the tests hold that line: a ListRow is not
 * pressable at all, a RowButton is a real button that says which one is open,
 * and in both the words truncate while the slots keep their size.
 */

describe('ListRow', () => {
  it('lays out the three slots around the words', () => {
    render(
      <ListRow start={<span>•</span>} description="Audio" end={<time>02.09</time>}>
        Harbour lights
      </ListRow>,
    )
    expect(screen.getByText('Harbour lights')).toBeDefined()
    expect(screen.getByText('Audio')).toBeDefined()
    expect(screen.getByText('02.09')).toBeDefined()
  })

  it('is not something to press', () => {
    render(<ListRow>Harbour lights</ListRow>)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('truncates its words and keeps its slots', () => {
    // A row that wraps in one language and not in another stops being a
    // list you can scan.
    render(<ListRow end={<time>02.09</time>}>A very long title</ListRow>)
    expect(screen.getByText('A very long title').className).toContain('truncate')
    expect(screen.getByText('02.09').parentElement?.className).toContain('shrink-0')
  })

  it('takes its height from the row density', () => {
    render(<ListRow data-testid="row">Harbour lights</ListRow>)
    expect(screen.getByTestId('row').className).toContain('py-row')
  })

  it('draws as a list item when asked', () => {
    render(
      <ul>
        <ListRow render={<li />}>Harbour lights</ListRow>
      </ul>,
    )
    expect(screen.getByRole('listitem').textContent).toBe('Harbour lights')
  })
})

describe('RowButton', () => {
  it('is a button that does not submit its form', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault())
    const onClick = vi.fn()
    render(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <RowButton onClick={onClick}>Version 3</RowButton>
      </form>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Version 3' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('names the open row as current, and only that one', () => {
    render(
      <>
        <RowButton selected>Version 3</RowButton>
        <RowButton>Version 2</RowButton>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Version 3' }).getAttribute('aria-current')).toBe('true')
    expect(screen.getByRole('button', { name: 'Version 2' }).hasAttribute('aria-current')).toBe(false)
  })

  it('tints the open row on accent-soft', () => {
    render(<RowButton selected>Version 3</RowButton>)
    expect(screen.getByRole('button').className).toContain('bg-accent-soft')
  })

  it('lets a listbox say selected instead', () => {
    render(
      <RowButton selected aria-current={undefined} aria-selected role="option">
        Version 3
      </RowButton>,
    )
    const row = screen.getByRole('option')
    expect(row.getAttribute('aria-selected')).toBe('true')
    expect(row.hasAttribute('aria-current')).toBe(false)
  })

  it('draws as the product link when given one, with no button type on it', () => {
    render(<RowButton render={<a href="#v3" />}>Version 3</RowButton>)
    const link = screen.getByRole('link', { name: 'Version 3' })
    expect(link.getAttribute('href')).toBe('#v3')
    expect(link.hasAttribute('type')).toBe(false)
  })

  it('does nothing while disabled', async () => {
    const onClick = vi.fn()
    render(
      <RowButton disabled onClick={onClick}>
        Version 3
      </RowButton>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('rows, for a reader', () => {
  it('passes axe as facts in a list', async () => {
    await expectNoA11yViolations(
      <ul>
        <ListRow render={<li />} end="02.09">
          Clip
        </ListRow>
        <ListRow render={<li />} end="—">
          Short
        </ListRow>
      </ul>,
    )
  })

  it('passes axe as choices', async () => {
    await expectNoA11yViolations(
      <div>
        <RowButton selected description="today">
          Version 3
        </RowButton>
        <RowButton description="yesterday">Version 2</RowButton>
      </div>,
    )
  })
})
