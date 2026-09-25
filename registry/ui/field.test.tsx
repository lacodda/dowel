// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Field, FieldGroup } from './field'
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

describe('Field and FieldGroup share one caption', () => {
  it('sets the label in the caption role, at 600', () => {
    // The two kinds of field sit in one form; their names must be one kind.
    render(
      <>
        <Field label="Title">
          <Input />
        </Field>
        <FieldGroup label="Type">
          <button type="button">Pose</button>
        </FieldGroup>
      </>,
    )
    expect(screen.getByText('Title').className).toContain('caption')
    expect(screen.getByText('Type').className).toContain('caption')
  })
})

describe('FieldGroup', () => {
  function Kinds({ onPick }: { onPick: (kind: string) => void }) {
    return (
      <FieldGroup label="Type" help="What the style describes.">
        <div className="flex gap-1">
          <button type="button" onClick={() => onPick('image')}>
            Image
          </button>
          <button type="button" onClick={() => onPick('pose')}>
            Pose
          </button>
        </div>
      </FieldGroup>
    )
  }

  it('is a group named by its caption', () => {
    render(<Kinds onPick={() => {}} />)
    expect(screen.getByRole('group', { name: 'Type' })).toBeDefined()
  })

  it('describes the group with its hint', () => {
    render(<Kinds onPick={() => {}} />)
    expect(screen.getByRole('group', { description: 'What the style describes.' })).toBeDefined()
  })

  it('does not forward a click on its caption to the first control inside', async () => {
    // The defect this exists for, measured in kilna: a caption that was a
    // `<label>` around a row of buttons pressed the first of them - setting
    // a value, or deleting a picture - whenever someone clicked the words.
    const onPick = vi.fn()
    render(<Kinds onPick={onPick} />)
    await userEvent.click(screen.getByText('Type'))
    await userEvent.click(screen.getByText('What the style describes.'))
    expect(onPick).not.toHaveBeenCalled()
  })

  it('has no label element at all', () => {
    const { container } = render(<Kinds onPick={() => {}} />)
    expect(container.querySelector('label')).toBeNull()
  })

  it('shows the error instead of the hint, as the description', () => {
    render(
      <FieldGroup label="Type" help="What the style describes." error="Choose one.">
        <button type="button">Pose</button>
      </FieldGroup>,
    )
    expect(screen.queryByText('What the style describes.')).toBeNull()
    expect(screen.getByRole('group', { description: 'Choose one.' })).toBeDefined()
  })

  it('disables every control inside when disabled', () => {
    render(
      <FieldGroup label="Type" disabled>
        <button type="button">Pose</button>
      </FieldGroup>,
    )
    // A `<fieldset disabled>` disables its descendants natively.
    expect((screen.getByRole('button', { name: 'Pose' }) as HTMLButtonElement).matches(':disabled')).toBe(true)
  })

  it('keeps a hidden caption as the group name', () => {
    render(
      <FieldGroup label="Type" labelHidden>
        <button type="button">Pose</button>
      </FieldGroup>,
    )
    expect(screen.getByText('Type').className).toContain('sr-only')
    expect(screen.getByRole('group', { name: 'Type' })).toBeDefined()
  })

  it('passes axe with a hint and with an error', async () => {
    await expectNoA11yViolations(<Kinds onPick={() => {}} />)
    await expectNoA11yViolations(
      <FieldGroup label="Type" error="Choose one." required>
        <button type="button">Pose</button>
      </FieldGroup>,
    )
  })
})
