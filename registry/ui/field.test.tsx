// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Field } from './field'
import { Input } from './input'

/*
 * Field.
 *
 * Everything worth testing here is a relationship rather than a class: the
 * label points at the control, the hint and the error are named by it, and
 * the control is marked invalid while an error shows. All four are invisible
 * when they work and none of them fail a screenshot - which is the whole
 * reason the component exists, and so the whole subject of these tests.
 */

describe('Field', () => {
  it('ties the label to the control', () => {
    // The commonest bug in a hand-written field: a label that sits beside the
    // input rather than naming it. `getByLabelText` fails unless the
    // association is real.
    render(
      <Field label="Email">
        <Input />
      </Field>,
    )
    expect(screen.getByLabelText('Email')).toBeDefined()
  })

  it('names the control with the hint underneath it', () => {
    render(
      <Field label="Email" help="We only use it to sign you in.">
        <Input />
      </Field>,
    )
    const control = screen.getByLabelText('Email')
    const describedBy = control.getAttribute('aria-describedby')
    expect(describedBy, 'the hint is not announced with the field').toBeTruthy()
    const hint = document.getElementById(describedBy!.split(' ')[0]!)
    expect(hint?.textContent).toContain('We only use it')
  })

  it('marks the control invalid while an error is showing', () => {
    // The error string is what decides this - there is no separate `invalid`
    // prop that could disagree with it.
    render(
      <Field label="Email" error="That address is not valid.">
        <Input />
      </Field>,
    )
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).toBe('true')
  })

  it('leaves the control valid when there is no error', () => {
    render(
      <Field label="Email">
        <Input />
      </Field>,
    )
    expect(screen.getByLabelText('Email').getAttribute('aria-invalid')).not.toBe('true')
  })

  it('announces the error with the field', () => {
    render(
      <Field label="Email" error="That address is not valid.">
        <Input />
      </Field>,
    )
    const control = screen.getByLabelText('Email')
    const describedBy = control.getAttribute('aria-describedby')
    expect(describedBy, 'the error is not announced with the field').toBeTruthy()
    const ids = describedBy!.split(' ')
    const text = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ')
    expect(text).toContain('not valid')
  })

  it('shows the error instead of the hint, not both', () => {
    // Two lines of small print under one control is one too many, and the
    // error is the one that matters.
    render(
      <Field label="Email" help="We only use it to sign you in." error="That address is not valid.">
        <Input />
      </Field>,
    )
    expect(screen.getByText('That address is not valid.')).toBeDefined()
    expect(screen.queryByText('We only use it to sign you in.')).toBeNull()
  })

  it('keeps a hidden label in the accessibility tree', () => {
    // `sr-only`, not `display: none`: the label still names the control.
    render(
      <Field label="Search" labelHidden>
        <Input />
      </Field>,
    )
    expect(screen.getByLabelText('Search')).toBeDefined()
    expect(screen.getByText('Search').className).toContain('sr-only')
  })

  it('does not announce the required mark as a word', () => {
    // The asterisk is decoration over the label's own text; read aloud it
    // would be "Email star".
    render(
      <Field label="Email" required>
        <Input />
      </Field>,
    )
    expect(screen.getByText('*').getAttribute('aria-hidden')).toBe('true')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(
      <Field label="Email" error="No.">
        <Input />
      </Field>,
    )
    const html = container.innerHTML
    expect(html).not.toMatch(/\bdark:/)
    expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe in both its states', async () => {
    await expectNoA11yViolations(
      <Field label="Email" help="We only use it to sign you in.">
        <Input />
      </Field>,
    )
    await expectNoA11yViolations(
      <Field label="Email" error="That address is not valid.">
        <Input />
      </Field>,
    )
  })
})
