// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import {
  Select,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
  selectItemVariants,
  selectPopupVariants,
  selectTriggerVariants,
} from './select'

/*
 * Select.
 *
 * The first test is the reason the component exists: no native `<select>`
 * anywhere in the tree. Everything after it is the price of that - the
 * keyboard and the announcement a browser would have given for free, which
 * now have to be shown to work.
 */

function Example({
  multiple,
  onPick,
}: { multiple?: boolean; onPick?: (value: unknown) => void } = {}) {
  return (
    <Select multiple={multiple} onValueChange={(value: unknown) => onPick?.(value)}>
      <SelectTrigger aria-label="Fruit">
        <SelectValue placeholder="Choose a fruit" />
      </SelectTrigger>
      <SelectPopup>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="pear">Pear</SelectItem>
        <SelectItem value="plum">Plum</SelectItem>
      </SelectPopup>
    </Select>
  )
}

describe('Select', () => {
  it('renders no native select, which is the whole point', async () => {
    // The oldest convention in the line, asserted rather than trusted: the
    // browser draws a `<select>` popup itself, in the operating system's
    // chrome, where no stylesheet reaches. What is here instead is a button
    // that says it is a combobox.
    const user = userEvent.setup()
    render(<Example />)

    const trigger = screen.getByRole('combobox')
    expect(trigger.tagName).toBe('BUTTON')
    expect(document.querySelectorAll('select, option, optgroup')).toHaveLength(0)

    // And still none once the list is open and the options exist.
    await user.click(trigger)
    await screen.findByRole('listbox')
    expect(screen.getAllByRole('option')).toHaveLength(3)
    expect(document.querySelectorAll('select, option, optgroup')).toHaveLength(0)
  })

  it('is closed until something opens it', () => {
    render(<Example />)
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('opens on a click, and the trigger says so', async () => {
    const user = userEvent.setup()
    render(<Example />)

    const trigger = screen.getByRole('combobox')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    await user.click(trigger)
    expect(await screen.findByRole('listbox')).toBeDefined()
    await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('true'))
  })

  it('picks with the keyboard alone', async () => {
    // What the native element gave for free, and what a hand-rolled dropdown
    // almost always loses.
    const user = userEvent.setup()
    const picked: unknown[] = []
    render(<Example onPick={(value) => picked.push(value)} />)

    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('combobox'))

    await user.keyboard('{Enter}')
    await screen.findByRole('listbox')
    await user.keyboard('{ArrowDown}{Enter}')

    await waitFor(() => expect(picked).toEqual(['pear']))
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  })

  it('echoes the choice in the trigger, showing the placeholder until there is one', async () => {
    // `SelectValue` shows the raw *value* by default - `plum`, not `Plum`.
    // The label only appears when the root is given an `items` map, which is
    // the next test. Worth pinning both, because a product that skips `items`
    // gets its own identifiers on screen and it is not obvious why.
    const user = userEvent.setup()
    render(<Example />)

    const trigger = screen.getByRole('combobox')
    expect(trigger.textContent).toContain('Choose a fruit')

    await user.click(trigger)
    await user.click(await screen.findByRole('option', { name: 'Plum' }))

    await waitFor(() => expect(trigger.textContent).toContain('plum'))
  })

  it('shows the label rather than the value when the root knows the items', async () => {
    const user = userEvent.setup()
    render(
      <Select items={{ apple: 'Apple', plum: 'Plum' }}>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Choose a fruit" />
        </SelectTrigger>
        <SelectPopup>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="plum">Plum</SelectItem>
        </SelectPopup>
      </Select>,
    )

    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    await user.click(await screen.findByRole('option', { name: 'Plum' }))

    await waitFor(() => expect(trigger.textContent).toContain('Plum'))
  })

  it('marks the chosen option as selected for a screen reader', async () => {
    const user = userEvent.setup()
    render(<Example />)

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Pear' }))

    await user.click(screen.getByRole('combobox'))
    const chosen = await screen.findByRole('option', { name: 'Pear' })
    await waitFor(() => expect(chosen.getAttribute('aria-selected')).toBe('true'))
  })

  it('takes more than one when it is `multiple`', async () => {
    // `multiple` changes what the value *is* - an array rather than a single
    // value - which is why it lives on the root beside the value and not on
    // the trigger.
    const user = userEvent.setup()
    const picked: unknown[] = []
    render(<Example multiple onPick={(value) => picked.push(value)} />)

    await user.click(screen.getByRole('combobox'))
    const list = await screen.findByRole('listbox')
    expect(list.getAttribute('aria-multiselectable')).toBe('true')

    await user.click(screen.getByRole('option', { name: 'Apple' }))
    // The list stays open, which is the difference that matters: choosing one
    // of several is not finishing.
    await user.click(await screen.findByRole('option', { name: 'Plum' }))

    await waitFor(() => expect(picked.at(-1)).toEqual(['apple', 'plum']))
    expect(screen.queryByRole('listbox')).not.toBeNull()
  })

  it('names a group by its label', async () => {
    const user = userEvent.setup()
    render(
      <Select>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Choose a fruit" />
        </SelectTrigger>
        <SelectPopup>
          <SelectGroup>
            <SelectGroupLabel>Stone fruit</SelectGroupLabel>
            <SelectItem value="plum">Plum</SelectItem>
          </SelectGroup>
        </SelectPopup>
      </Select>,
    )

    await user.click(screen.getByRole('combobox'))
    expect(await screen.findByRole('group', { name: 'Stone fruit' })).toBeDefined()
  })

  it('draws every size, and draws each one differently', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    const triggers = new Set(sizes.map((size) => selectTriggerVariants({ size })))
    expect(triggers.size).toBe(sizes.length)
    const popups = new Set(sizes.map((size) => selectPopupVariants({ size })))
    expect(popups.size).toBe(sizes.length)
  })

  it('carries no colour outside the vocabulary', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    const all = [
      ...sizes.map((size) => selectTriggerVariants({ size })),
      ...sizes.map((size) => selectPopupVariants({ size })),
      selectItemVariants(),
    ].join(' ')
    expect(all).not.toMatch(/\bdark:/)
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('lets the caller win a conflict', async () => {
    const user = userEvent.setup()
    render(
      <Select>
        <SelectTrigger aria-label="Fruit" className="rounded-full">
          <SelectValue placeholder="Choose a fruit" />
        </SelectTrigger>
        <SelectPopup className="rounded-full">
          <SelectItem value="apple">Apple</SelectItem>
        </SelectPopup>
      </Select>,
    )

    expect(screen.getByRole('combobox').className).toContain('rounded-full')
    await user.click(screen.getByRole('combobox'))

    // The popup is the listbox's *parent*: with a `List` inside it, Base UI
    // moves `role="listbox"` down to the list and leaves the popup
    // presentational. The clothes stay on the popup, which is the element
    // that has a border and a shadow.
    const popup = (await screen.findByRole('listbox')).parentElement
    expect(popup?.className).toContain('rounded-full')
  })

  it('passes axe when open', async () => {
    // The list is portalled, so it is not inside what `render` returns -
    // which is why it is opened into a container of its own and axe is
    // pointed at that.
    const host = document.createElement('div')
    document.body.appendChild(host)

    const user = userEvent.setup()
    await expectNoA11yViolations(
      <Select>
        <SelectTrigger aria-label="Fruit">
          <SelectValue placeholder="Choose a fruit" />
        </SelectTrigger>
        <SelectPopup container={host}>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="pear">Pear</SelectItem>
        </SelectPopup>
      </Select>,
    )

    await user.click(screen.getByRole('combobox'))
    await screen.findByRole('listbox')
    const results = await import('axe-core').then((axe) => axe.default.run(host))
    expect(results.violations, JSON.stringify(results.violations.map((v) => v.id))).toEqual([])
  })
})
