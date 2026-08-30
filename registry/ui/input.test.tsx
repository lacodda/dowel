// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
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
