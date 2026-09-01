// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxClear,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
  comboboxInputVariants,
  comboboxItemVariants,
  comboboxPopupVariants,
} from './combobox'

/*
 * Combobox.
 *
 * The filter is the component. A Select that opens and closes is Select's
 * test; what is worth pinning here is that typing narrows the list, that
 * nothing matching says so, and that the multiple case is reachable from the
 * keyboard - chips being where a hand-made multi-select usually loses it.
 */

const fruit = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry']

function Example({ multiple }: { multiple?: boolean } = {}) {
  return (
    <Combobox items={fruit} multiple={multiple}>
      <ComboboxInput aria-label="Fruit" placeholder="Search fruit" />
      <ComboboxPopup>
        <ComboboxEmpty>Nothing matched</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}

describe('Combobox', () => {
  it('renders an input, not a native select', async () => {
    // The same rule Select is built on. This one really is an `<input>` -
    // which is the point, since it is typed into - but there is still no
    // `<select>` under it and no `<option>` in the list.
    const user = userEvent.setup()
    render(<Example />)

    const input = screen.getByRole('combobox')
    expect(input.tagName).toBe('INPUT')
    expect(document.querySelectorAll('select, option, optgroup')).toHaveLength(0)

    await user.click(input)
    await screen.findByRole('listbox')
    expect(document.querySelectorAll('select, option, optgroup')).toHaveLength(0)
  })

  it('shows everything before anything is typed', async () => {
    const user = userEvent.setup()
    render(<Example />)

    await user.click(screen.getByRole('combobox'))
    await screen.findByRole('listbox')
    expect(screen.getAllByRole('option')).toHaveLength(fruit.length)
  })

  it('filters the list as it is typed', async () => {
    // The whole reason to reach for this rather than Select.
    const user = userEvent.setup()
    render(<Example />)

    await user.click(screen.getByRole('combobox'))
    await screen.findByRole('listbox')

    await user.keyboard('ap')
    await waitFor(() =>
      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Apple', 'Apricot']),
    )

    await user.keyboard('r')
    await waitFor(() =>
      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Apricot']),
    )
  })

  it('matches anywhere in the word, not only the start', async () => {
    const user = userEvent.setup()
    render(<Example />)

    await user.click(screen.getByRole('combobox'))
    await screen.findByRole('listbox')
    await user.keyboard('berry')

    await waitFor(() =>
      expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Blueberry']),
    )
  })

  it('says so when nothing matched', async () => {
    // `Empty` stays mounted for the announcement to fire, so what changes is
    // its children rather than whether it is in the document.
    const user = userEvent.setup()
    render(<Example />)

    await user.click(screen.getByRole('combobox'))
    await screen.findByRole('listbox')
    await user.keyboard('zzz')

    await waitFor(() => expect(screen.queryAllByRole('option')).toHaveLength(0))
    expect(await screen.findByText('Nothing matched')).toBeDefined()
  })

  it('clears the chosen value once there is one', async () => {
    const user = userEvent.setup()
    render(
      <Combobox items={fruit}>
        <ComboboxInput aria-label="Fruit" />
        <ComboboxClear aria-label="Clear" />
        <ComboboxPopup>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>,
    )

    // `Clear` is not a "clear what I typed" button: in single-selection mode
    // Base UI shows it only once a value is *selected*, so typing a query
    // that matches nothing leaves it hidden. That is the right behaviour -
    // the query clears itself when the popup closes - but it is not what the
    // name suggests, so it is pinned in both directions.
    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.keyboard('cher')
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1))
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull()

    await user.click(await screen.findByRole('option', { name: 'Cherry' }))
    await waitFor(() => expect((input as HTMLInputElement).value).toBe('Cherry'))

    await user.click(await screen.findByRole('button', { name: 'Clear' }))
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(''))
  })

  it('yields a chip per value when it is `multiple`', async () => {
    const user = userEvent.setup()
    render(<Multiple />)

    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.click(await screen.findByRole('option', { name: 'Apple' }))
    await user.click(await screen.findByRole('option', { name: 'Cherry' }))

    await waitFor(() => expect(screen.getAllByTestId('chip')).toHaveLength(2))
    expect(screen.getAllByTestId('chip').map((c) => c.textContent)).toEqual([
      expect.stringContaining('Apple'),
      expect.stringContaining('Cherry'),
    ])
  })

  it('removes a chip from the keyboard', async () => {
    // Where a hand-made multi-select fails: chips reachable only by pointer.
    // Backspace from the empty input takes the last one.
    const user = userEvent.setup()
    render(<Multiple />)

    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.click(await screen.findByRole('option', { name: 'Apple' }))
    await user.click(await screen.findByRole('option', { name: 'Cherry' }))
    await waitFor(() => expect(screen.getAllByTestId('chip')).toHaveLength(2))

    // One press, one chip - the last one. It only fires while the input is
    // empty, so Backspace still edits the query when there is one.
    input.focus()
    await user.keyboard('{Backspace}')

    await waitFor(() => expect(screen.getAllByTestId('chip')).toHaveLength(1))
    expect(screen.getByTestId('chip').textContent).toContain('Apple')

    await user.keyboard('{Backspace}')
    await waitFor(() => expect(screen.queryAllByTestId('chip')).toHaveLength(0))
  })

  it('removes a chip with its own button', async () => {
    const user = userEvent.setup()
    render(<Multiple />)

    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.click(await screen.findByRole('option', { name: 'Apple' }))
    await waitFor(() => expect(screen.getAllByTestId('chip')).toHaveLength(1))

    await user.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(screen.queryAllByTestId('chip')).toHaveLength(0))
  })

  it('draws every size, and draws each one differently', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    expect(new Set(sizes.map((size) => comboboxInputVariants({ size }))).size).toBe(sizes.length)
    expect(new Set(sizes.map((size) => comboboxPopupVariants({ size }))).size).toBe(sizes.length)
  })

  it('carries no colour outside the vocabulary', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    const all = [
      ...sizes.map((size) => comboboxInputVariants({ size })),
      ...sizes.map((size) => comboboxPopupVariants({ size })),
      comboboxItemVariants(),
    ].join(' ')
    expect(all).not.toMatch(/\bdark:/)
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('lets the caller win a conflict', async () => {
    const user = userEvent.setup()
    render(
      <Combobox items={fruit}>
        <ComboboxInput aria-label="Fruit" className="rounded-full" />
        <ComboboxPopup className="rounded-full">
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>,
    )

    expect(screen.getByRole('combobox').className).toContain('rounded-full')
    await user.click(screen.getByRole('combobox'))
    const popup = (await screen.findByRole('listbox')).closest('[class*="shadow-float"]')
    expect(popup?.className).toContain('rounded-full')
  })

  it('passes axe when open', async () => {
    // The list is portalled, so it is opened into a container of its own and
    // axe is pointed at that.
    const host = document.createElement('div')
    document.body.appendChild(host)

    const user = userEvent.setup()
    await expectNoA11yViolations(
      <Combobox items={fruit}>
        <ComboboxInput aria-label="Fruit" />
        <ComboboxPopup container={host}>
          <ComboboxEmpty>Nothing matched</ComboboxEmpty>
          <ComboboxList>
            {(item: string) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>,
    )

    await user.click(screen.getByRole('combobox'))
    const opened = await screen.findByRole('listbox')
    // Checked before axe runs, and not decoration: axe over an empty node
    // finds nothing and reports a pass. Without this the test would go on
    // being green if `container` were ever dropped on the way to the portal,
    // which is the whole thing it is here to exercise.
    expect(host.contains(opened), 'it did not open into the container').toBe(true)

    const results = await import('axe-core').then((axe) => axe.default.run(host))
    expect(results.violations, JSON.stringify(results.violations.map((v) => v.id))).toEqual([])
  })
})

function Multiple() {
  return (
    <Combobox items={fruit} multiple>
      <ComboboxChips>
        {/* `Chips` takes plain children; it is `Value` that maps the chosen
            values, because it is the part that knows what they are. */}
        <ComboboxValue>
          {(value: string[]) =>
            value.map((item) => (
              <ComboboxChip key={item} data-testid="chip">
                {item}
                <ComboboxChipRemove aria-label="Remove" />
              </ComboboxChip>
            ))
          }
        </ComboboxValue>
        <ComboboxInput aria-label="Fruit" />
      </ComboboxChips>
      <ComboboxPopup>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}
