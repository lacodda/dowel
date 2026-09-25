// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Chip, ChipGroup, chipVariants } from './chip'

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

describe('Chip, as a switch', () => {
  it('is a button that says whether it is on', async () => {
    // The defect this replaces: twenty-three hand-drawn filter chips in one
    // product, and not one told a screen reader whether it was on.
    render(<Chip defaultPressed={false}>Clips</Chip>)
    const chip = screen.getByRole('button', { name: 'Clips' })
    expect(chip.getAttribute('aria-pressed')).toBe('false')

    await userEvent.click(chip)
    expect(chip.getAttribute('aria-pressed')).toBe('true')
  })

  it('reports the new state, and follows the one it is given', async () => {
    const onPressedChange = vi.fn()
    const { rerender } = render(
      <Chip pressed={false} onPressedChange={onPressedChange}>
        Clips
      </Chip>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Clips' }))
    expect(onPressedChange).toHaveBeenCalledWith(true)
    // Controlled: nothing changes until the owner says so.
    expect(screen.getByRole('button', { name: 'Clips' }).getAttribute('aria-pressed')).toBe('false')

    rerender(
      <Chip pressed onPressedChange={onPressedChange}>
        Clips
      </Chip>,
    )
    expect(screen.getByRole('button', { name: 'Clips' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('draws "on" from the same attribute that announces it', () => {
    // The look and the announcement cannot disagree when one is read from
    // the other. A class toggled by a prop could drift from `aria-pressed`.
    render(<Chip pressed>Clips</Chip>)
    const chip = screen.getByRole('button', { name: 'Clips' })
    expect(chip.hasAttribute('data-pressed')).toBe(true)
    expect(chip.className).toContain('data-[pressed]:bg-accent-soft')
  })

  it('switches from the keyboard', async () => {
    const onPressedChange = vi.fn()
    render(<Chip onPressedChange={onPressedChange}>Clips</Chip>)
    await userEvent.tab()
    await userEvent.keyboard(' ')
    expect(onPressedChange).toHaveBeenCalledWith(true)
  })

  it('does nothing while disabled', async () => {
    const onPressedChange = vi.fn()
    render(
      <Chip onPressedChange={onPressedChange} disabled>
        Clips
      </Chip>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Clips' }))
    expect(onPressedChange).not.toHaveBeenCalled()
  })

  it('grows its hit area, not itself', () => {
    // 21 pixels tall by design; a switch is a pointer target.
    render(<Chip defaultPressed>Clips</Chip>)
    expect(screen.getByRole('button', { name: 'Clips' }).className).toContain('target-min')
  })

  it('stays a plain span when nothing about it can be pressed', () => {
    render(<Chip variant="warn">late</Chip>)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('cannot be removable and switchable at once', () => {
    // A cross inside a switch is a button inside a button. The union refuses
    // it at compile time; this line fails the typecheck if the union ever
    // stops doing so.
    // @ts-expect-error - onRemove and pressed are exclusive
    const both = <Chip pressed onRemove={() => {}} removeLabel="Remove">x</Chip>
    expect(both).toBeDefined()
  })
})

describe('Chip variants', () => {
  it('has a dashed outline for a chip that stands for something not there yet', () => {
    expect(chipVariants({ variant: 'dashed' })).toContain('border-dashed')
  })

  it.each(['accent', 'good', 'warn', 'bad', 'info'] as const)('wears %s in the pair Badge uses', (tone) => {
    // Fill and ink from the same token, so a chip and a badge in one row do
    // not disagree about what a tone looks like.
    const classes = chipVariants({ variant: tone })
    expect(classes).toContain(`bg-${tone}-soft`)
    expect(classes).toContain(`text-${tone}`)
  })
})

function Kinds(props: { multiple?: boolean; onValueChange?: (value: string[]) => void }) {
  return (
    <ChipGroup aria-label="Kind" defaultValue={['clip']} {...props}>
      <Chip value="song">Song</Chip>
      <Chip value="clip">Clip</Chip>
      <Chip value="short">Short</Chip>
    </ChipGroup>
  )
}

const pressedNames = () =>
  screen
    .getAllByRole('button')
    .filter((button) => button.getAttribute('aria-pressed') === 'true')
    .map((button) => button.textContent)

describe('ChipGroup', () => {
  it('is one named group', () => {
    render(<Kinds />)
    expect(screen.getByRole('group', { name: 'Kind' })).toBeDefined()
  })

  it('holds one at a time unless told otherwise', async () => {
    const onValueChange = vi.fn()
    render(<Kinds onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Song' }))
    expect(pressedNames()).toEqual(['Song'])
    expect(onValueChange).toHaveBeenLastCalledWith(['song'])
  })

  it('holds several when it is multiple', async () => {
    render(<Kinds multiple />)
    await userEvent.click(screen.getByRole('button', { name: 'Song' }))
    expect(pressedNames()).toEqual(['Song', 'Clip'])
  })

  it('is one stop on Tab, and the arrows walk it', async () => {
    // A filter bar of eight kinds should not be eight Tab presses long.
    render(
      <>
        <Kinds />
        <button type="button">after</button>
      </>,
    )
    await userEvent.tab()
    expect(document.activeElement?.textContent).toBe('Song')
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement?.textContent).toBe('Clip')
    await userEvent.tab()
    expect(document.activeElement?.textContent).toBe('after')
  })
})

describe('Chip as a switch, for a reader', () => {
  it('passes axe alone', async () => {
    await expectNoA11yViolations(<Chip defaultPressed>Clips</Chip>)
  })

  it('passes axe in a group', async () => {
    await expectNoA11yViolations(<Kinds multiple />)
  })
})
