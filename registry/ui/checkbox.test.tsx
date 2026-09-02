// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Checkbox, CheckboxGroup } from './checkbox'

/*
 * Checkbox.
 *
 * The first test is why the label is part of the component: a `<label>` next
 * to an input looks identical to one tied to it, and only one of them lets a
 * reader click the words. After that, the states - because the box is drawn
 * rather than native, every one of them is ours to get right.
 */

describe('Checkbox', () => {
  it('is operated by clicking its words', () => {
    // Not "the label exists" - that a click on the text reaches the control.
    render(<Checkbox>Remember me</Checkbox>)
    expect(screen.getByRole('checkbox', { name: 'Remember me' })).toBeDefined()
  })

  it('toggles when the words are clicked', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<Checkbox onCheckedChange={onCheckedChange}>Remember me</Checkbox>)

    await user.click(screen.getByText('Remember me'))
    // Base UI passes its own event details as a second argument; the test is
    // about the value, so it asserts the value.
    expect(onCheckedChange.mock.calls[0]?.[0]).toBe(true)
  })

  it('toggles with the space key', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(<Checkbox onCheckedChange={onCheckedChange}>Remember me</Checkbox>)

    await user.tab()
    await user.keyboard(' ')
    expect(onCheckedChange.mock.calls[0]?.[0]).toBe(true)
  })

  it('reports its state to a reader, not only in colour', () => {
    render(<Checkbox defaultChecked>Remember me</Checkbox>)
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('true')
  })

  it('announces indeterminate as mixed rather than as unchecked', () => {
    // The whole point of the state: "some of these are checked" has to reach
    // a screen reader, where a dash is nothing at all.
    render(<Checkbox indeterminate>All</Checkbox>)
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('mixed')
  })

  it('renders the box alone when it has no words', () => {
    // For a table cell, where the row is the label. It still has to be a
    // checkbox with a name.
    render(<Checkbox aria-label="Select row" />)
    expect(screen.getByRole('checkbox', { name: 'Select row' })).toBeDefined()
  })

  it('lets the caller win a conflict on the bare box', () => {
    const { container } = render(<Checkbox aria-label="Select row" className="rounded-full" />)
    expect(container.firstElementChild?.className).toContain('rounded-full')
  })

  it('does not fire when disabled', async () => {
    const user = userEvent.setup()
    const onCheckedChange = vi.fn()
    render(
      <Checkbox disabled onCheckedChange={onCheckedChange}>
        Remember me
      </Checkbox>,
    )

    await user.click(screen.getByText('Remember me'))
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Checkbox defaultChecked>Remember me</Checkbox>)
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe', async () => {
    await expectNoA11yViolations(<Checkbox>Remember me</Checkbox>)
    await expectNoA11yViolations(<Checkbox indeterminate>All</Checkbox>)
  })
})

describe('CheckboxGroup', () => {
  it('collects the values of what is checked', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <CheckboxGroup defaultValue={['a']} onValueChange={onValueChange}>
        <Checkbox name="a" value="a">
          Apple
        </Checkbox>
        <Checkbox name="b" value="b">
          Pear
        </Checkbox>
      </CheckboxGroup>,
    )

    await user.click(screen.getByText('Pear'))
    expect(onValueChange.mock.calls[0]?.[0]).toEqual(['a', 'b'])
  })

  it('drives a parent checkbox from the children', async () => {
    // The reason the group exists: `allValues` is what makes the parent
    // indeterminate when some children are checked, which is the part that
    // goes wrong when it is written by hand.
    const user = userEvent.setup()
    render(
      <CheckboxGroup allValues={['a', 'b']} defaultValue={['a']}>
        <Checkbox parent aria-label="All" />
        <Checkbox name="a" value="a">
          Apple
        </Checkbox>
        <Checkbox name="b" value="b">
          Pear
        </Checkbox>
      </CheckboxGroup>,
    )

    const parent = screen.getByRole('checkbox', { name: 'All' })
    expect(parent.getAttribute('aria-checked')).toBe('mixed')

    await user.click(parent)
    expect(parent.getAttribute('aria-checked')).toBe('true')
  })

  it('passes axe', async () => {
    await expectNoA11yViolations(
      <CheckboxGroup defaultValue={['a']}>
        <Checkbox name="a" value="a">
          Apple
        </Checkbox>
        <Checkbox name="b" value="b">
          Pear
        </Checkbox>
      </CheckboxGroup>,
    )
  })
})
