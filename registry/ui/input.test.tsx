// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Input } from './input'

describe('Input', () => {
  it('is a real input, so the browser does its part', async () => {
    render(<Input placeholder="Name" />)
    const field = screen.getByPlaceholderText('Name')

    await userEvent.type(field, 'Kirill')
    expect((field as HTMLInputElement).value).toBe('Kirill')
  })

  it('passes the type through, so the right keyboard appears', () => {
    render(<Input type="email" placeholder="Email" />)
    expect(screen.getByPlaceholderText('Email')).toHaveProperty('type', 'email')
  })

  it('hands the element back', () => {
    // Callers need it to focus the field or read its selection.
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('shows an invalid field as invalid', () => {
    // Driven by `aria-invalid` rather than a prop of its own: the attribute is
    // what a screen reader reads, so the colour follows the same fact.
    render(<Input aria-invalid placeholder="Broken" />)
    expect(screen.getByPlaceholderText('Broken').className).toContain('aria-invalid:border-bad')
  })

  it('lets the caller win a conflict', () => {
    render(<Input className="rounded-full" placeholder="x" />)
    const className = screen.getByPlaceholderText('x').className
    expect(className).toContain('rounded-full')
    expect(className).not.toContain('rounded-md')
  })

  it('carries no colour outside the vocabulary', () => {
    render(<Input placeholder="x" />)
    const className = screen.getByPlaceholderText('x').className
    expect(className).not.toMatch(/\bdark:/)
    expect(className).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })
})

describe('Input, for a reader and a keyboard', () => {
  it('passes axe when it has an associated label', async () => {
    // An input on its own is a violation waiting to happen - the label has to
    // come from the caller, so the test provides one the way a product would.
    await expectNoA11yViolations(
      <div>
        <label htmlFor="name">Name</label>
        <Input id="name" />
      </div>,
    )
  })

  it('still passes axe when marked invalid', async () => {
    // `aria-invalid` changes the colour, not the accessible name - it should
    // not by itself upset axe on a labelled field.
    await expectNoA11yViolations(
      <div>
        <label htmlFor="broken">Broken</label>
        <Input id="broken" aria-invalid />
      </div>,
    )
  })

  it('takes focus by Tab', async () => {
    render(<Input placeholder="Name" />)
    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByPlaceholderText('Name'))
  })

  it('is skipped by Tab while disabled', async () => {
    render(<Input placeholder="Name" disabled />)
    await userEvent.tab()
    expect(document.activeElement).not.toBe(screen.getByPlaceholderText('Name'))
  })
})
