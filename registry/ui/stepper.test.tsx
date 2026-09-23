// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Stepper, stepState, type StepperStep } from './stepper'

const labels = { done: 'Completed', error: 'Needs attention' }

const steps: StepperStep[] = [
  { id: 'name', label: 'Name' },
  { id: 'storage', label: 'Storage', description: 'Where files are kept' },
  { id: 'review', label: 'Review' },
]

function item(name: string): HTMLElement {
  // The element carrying the step: its button when clickable, its span
  // otherwise - both hold the label text.
  return screen.getByText(name).closest('button, [aria-current], li > span')! as HTMLElement
}

describe('Stepper', () => {
  it('is an ordered list, one item per step', () => {
    render(<Stepper label="Setup steps" steps={steps} current="storage" stateLabels={labels} />)
    const list = screen.getByRole('list')
    expect(list.tagName).toBe('OL')
    expect(within(list).getAllByRole('listitem')).toHaveLength(3)
  })

  it('marks the current step, and only it, with aria-current="step"', () => {
    // Without it a reader hears three equal names and is not told which one
    // is in front of them.
    render(<Stepper label="Setup steps" steps={steps} current="storage" stateLabels={labels} />)
    const marked = document.querySelectorAll('[aria-current]')
    expect(marked).toHaveLength(1)
    expect(marked[0]!.getAttribute('aria-current')).toBe('step')
    expect(marked[0]!.textContent).toContain('Storage')
  })

  it('says a step is done in words and with a tick, not only in colour', () => {
    render(<Stepper label="Setup steps" steps={steps} current="storage" stateLabels={labels} />)
    const done = item('Name')
    expect(done.textContent).toContain('Completed')
    expect(done.querySelector('svg')).not.toBeNull()
    // The step ahead has neither the word nor a glyph - its number stands.
    const ahead = item('Review')
    expect(ahead.textContent).not.toContain('Completed')
    expect(ahead.querySelector('svg')).toBeNull()
    expect(ahead.textContent).toContain('3')
  })

  it('says a failed step in words and with its own mark', () => {
    render(
      <Stepper
        label="Setup steps"
        steps={[steps[0]!, { ...steps[1]!, status: 'error' }, steps[2]!]}
        current="storage"
        stateLabels={labels}
      />,
    )
    const failed = item('Storage')
    expect(failed.textContent).toContain('Needs attention')
    expect(failed.querySelector('svg')).not.toBeNull()
    // Still the current step: failing does not move you.
    expect(failed.getAttribute('aria-current')).toBe('step')
  })

  it('works out states from position, and lets the product state them', () => {
    expect(stepState({ id: 'a', label: 'A' }, 0, 1)).toBe('done')
    expect(stepState({ id: 'a', label: 'A' }, 1, 1)).toBe('current')
    expect(stepState({ id: 'a', label: 'A' }, 2, 1)).toBe('upcoming')
    expect(stepState({ id: 'a', label: 'A', status: 'done' }, 2, 1)).toBe('done')
    expect(stepState({ id: 'a', label: 'A', status: 'error' }, 0, 1)).toBe('error')
  })

  it('has no controls unless the product asks for them', () => {
    render(<Stepper label="Setup steps" steps={steps} current="storage" stateLabels={labels} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('does not let a step ahead be clicked by default', async () => {
    // Clicking ahead is how a wizard's validation gets skipped.
    const onStepSelect = vi.fn()
    render(
      <Stepper label="Setup steps" steps={steps} current="storage" stateLabels={labels} onStepSelect={onStepSelect} />,
    )
    expect(screen.getByRole('navigation', { name: 'Setup steps' })).toBeDefined()
    expect(screen.getByRole('button', { name: /Name/ })).toBeDefined()
    expect(screen.getByRole('button', { name: /Storage/ })).toBeDefined()
    expect(screen.queryByRole('button', { name: /Review/ })).toBeNull()

    await userEvent.click(screen.getByText('Review'))
    expect(onStepSelect).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /Name/ }))
    expect(onStepSelect).toHaveBeenCalledWith('name')
  })

  it('opens the steps ahead only when told to', () => {
    render(
      <Stepper
        label="Setup steps"
        steps={steps}
        current="storage"
        stateLabels={labels}
        onStepSelect={() => {}}
        reach="any"
      />,
    )
    expect(screen.getByRole('button', { name: /Review/ })).toBeDefined()
  })

  it('lets a step already completed ahead of the current one be clicked', () => {
    render(
      <Stepper
        label="Setup steps"
        steps={[steps[0]!, steps[1]!, { ...steps[2]!, status: 'done' }]}
        current="name"
        stateLabels={labels}
        onStepSelect={() => {}}
      />,
    )
    expect(screen.getByRole('button', { name: /Review/ })).toBeDefined()
    expect(screen.queryByRole('button', { name: /Storage/ })).toBeNull()
  })

  it('keeps folded labels for a reader rather than removing them', () => {
    render(<Stepper label="Setup steps" steps={steps} current="storage" stateLabels={labels} />)
    // Narrow, the others go off screen - but not out of the tree.
    const other = screen.getByText('Name').parentElement!
    expect(other.className).toContain('sr-only')
    expect(other.className).toContain('@xl:not-sr-only')
    const current = screen.getByText('Storage').parentElement!
    expect(current.className).not.toContain('sr-only')
  })

  it('says the position in the product words when given them', () => {
    render(
      <Stepper
        label="Setup steps"
        steps={steps}
        current="storage"
        stateLabels={labels}
        summary={(position, total) => `Step ${position} of ${total}`}
      />,
    )
    expect(screen.getByText('Step 2 of 3')).toBeDefined()
  })

  it('does not fold a vertical stepper', () => {
    render(
      <Stepper label="Setup steps" steps={steps} current="storage" stateLabels={labels} orientation="vertical" />,
    )
    expect(screen.getByText('Name').parentElement!.className).not.toContain('sr-only')
  })
})

describe('Stepper, for a reader', () => {
  it('passes axe as a picture, as navigation, and vertical', async () => {
    for (const element of [
      <Stepper key="plain" label="Setup steps" steps={steps} current="storage" stateLabels={labels} />,
      <Stepper
        key="nav"
        label="Setup steps"
        steps={steps}
        current="storage"
        stateLabels={labels}
        onStepSelect={() => {}}
        summary={(position, total) => `Step ${position} of ${total}`}
      />,
      <Stepper
        key="vertical"
        label="Setup steps"
        steps={steps}
        current="review"
        stateLabels={labels}
        orientation="vertical"
      />,
    ]) {
      const { unmount } = await expectNoA11yViolations(element)
      unmount()
    }
  })
})
