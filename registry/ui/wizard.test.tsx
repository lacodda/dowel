// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Wizard, type WizardStep } from './wizard'

const labels = { done: 'Completed', error: 'Needs attention' }

function Workspace({
  canName = () => true,
  onNext,
  onFinish = () => {},
  onError,
}: {
  canName?: () => boolean
  onNext?: WizardStep['onNext']
  onFinish?: () => void
  onError?: (error: unknown) => void
}) {
  const wizardSteps: WizardStep[] = [
    {
      id: 'name',
      label: 'Name the workspace',
      canAdvance: canName,
      onNext,
      content: (
        <label>
          Workspace name
          <input name="workspace" />
        </label>
      ),
    },
    {
      id: 'storage',
      label: 'Choose a storage folder',
      content: (
        <label>
          Folder
          <input name="folder" />
        </label>
      ),
    },
    { id: 'review', label: 'Review', content: <p>Everything is ready.</p> },
  ]
  return (
    <Wizard
      steps={wizardSteps}
      stepperLabel="Setup steps"
      stateLabels={labels}
      backLabel="Back"
      nextLabel="Next"
      finishLabel="Create workspace"
      onFinish={onFinish}
      onError={onError}
    />
  )
}

function heading(): HTMLElement {
  return screen.getByRole('heading', { level: 2 })
}

describe('Wizard', () => {
  it('shows the first step, with Next and without Back', () => {
    render(<Workspace />)
    expect(heading().textContent).toBe('Name the workspace')
    expect(screen.getByRole('button', { name: 'Next' })).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Create workspace' })).toBeNull()
  })

  it('does not take focus when it first appears', () => {
    render(<Workspace />)
    expect(document.activeElement).toBe(document.body)
  })

  it('moves focus to the new step heading when the step changes', async () => {
    // Otherwise focus stays on Next - now the button of a different page -
    // and a reader is told nothing about where they have landed.
    render(<Workspace />)
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(heading().textContent).toBe('Choose a storage folder')
    expect(document.activeElement).toBe(heading())

    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(document.activeElement).toBe(heading())
    expect(heading().textContent).toBe('Name the workspace')
  })

  it('stays on the step when canAdvance says no, and marks it failed', async () => {
    render(<Workspace canName={() => false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(heading().textContent).toBe('Name the workspace')
    const current = document.querySelector('[aria-current="step"]')!
    expect(current.textContent).toContain('Needs attention')
  })

  it('stays on the step when an async onNext returns false', async () => {
    render(<Workspace onNext={async () => false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(heading().textContent).toBe('Name the workspace')
  })

  it('stays on the step when onNext throws, and hands the error over', async () => {
    const onError = vi.fn()
    render(
      <Workspace
        onNext={async () => {
          throw new Error('Name taken')
        }}
        onError={onError}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(heading().textContent).toBe('Name the workspace')
    expect(onError).toHaveBeenCalledOnce()
  })

  it('runs the checks on Enter rather than skipping past them', async () => {
    render(<Workspace canName={() => false} />)
    await userEvent.type(screen.getByLabelText('Workspace name'), 'Studio{Enter}')
    expect(heading().textContent).toBe('Name the workspace')
  })

  it('moves on with Enter when the checks pass', async () => {
    render(<Workspace />)
    await userEvent.type(screen.getByLabelText('Workspace name'), 'Studio{Enter}')
    expect(heading().textContent).toBe('Choose a storage folder')
  })

  it('respects the browser constraints of the current step fields', async () => {
    const wizardSteps: WizardStep[] = [
      {
        id: 'name',
        label: 'Name the workspace',
        content: (
          <label>
            Workspace name
            <input name="workspace" required />
          </label>
        ),
      },
      { id: 'review', label: 'Review', content: <p>Ready.</p> },
    ]
    render(
      <Wizard
        steps={wizardSteps}
        stepperLabel="Setup steps"
        stateLabels={labels}
        backLabel="Back"
        nextLabel="Next"
        finishLabel="Create"
        onFinish={() => {}}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(heading().textContent).toBe('Name the workspace')
    await userEvent.type(screen.getByLabelText('Workspace name'), 'Studio')
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(heading().textContent).toBe('Review')
  })

  it('keeps what was typed when going Back', async () => {
    render(<Workspace />)
    await userEvent.type(screen.getByLabelText('Workspace name'), 'Studio')
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await userEvent.type(screen.getByLabelText('Folder'), 'D:/work')
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect((screen.getByLabelText('Workspace name') as HTMLInputElement).value).toBe('Studio')
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect((screen.getByLabelText('Folder') as HTMLInputElement).value).toBe('D:/work')
  })

  it('offers Finish only on the last step, and finishes only when pressed', async () => {
    const onFinish = vi.fn()
    render(<Workspace onFinish={onFinish} />)
    expect(screen.queryByRole('button', { name: 'Create workspace' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByRole('button', { name: 'Create workspace' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    expect(onFinish).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Create workspace' }))
    expect(onFinish).toHaveBeenCalledOnce()
  })

  it('does not finish on Enter in a field of the last step', async () => {
    // Finishing creates something; it takes the button that says so, not a
    // key pressed to leave a field.
    const onFinish = vi.fn()
    render(
      <Wizard
        steps={[
          {
            id: 'note',
            label: 'Add a note',
            content: (
              <label>
                Note
                <input name="note" />
              </label>
            ),
          },
        ]}
        stepperLabel="Setup steps"
        stateLabels={labels}
        backLabel="Back"
        nextLabel="Next"
        finishLabel="Create"
        onFinish={onFinish}
      />,
    )
    await userEvent.type(screen.getByLabelText('Note'), 'Hello{Enter}')
    expect(onFinish).not.toHaveBeenCalled()
  })

  it('goes back through the stepper, and forward only through the checks', async () => {
    let allow = true
    render(<Workspace canName={() => allow} />)
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(heading().textContent).toBe('Review')

    // Back to the first step through the stepper.
    await userEvent.click(screen.getByRole('button', { name: /Name the workspace/ }))
    expect(heading().textContent).toBe('Name the workspace')

    // The storage step was completed before, so it can be clicked - but the
    // first step's check still runs on the way, and a failure stops there.
    // Review was only seen, never completed, so it is not a way forward.
    expect(screen.queryByRole('button', { name: /^Review/ })).toBeNull()
    allow = false
    await userEvent.click(screen.getByRole('button', { name: /Choose a storage folder/ }))
    expect(heading().textContent).toBe('Name the workspace')

    allow = true
    await userEvent.click(screen.getByRole('button', { name: /Choose a storage folder/ }))
    expect(heading().textContent).toBe('Choose a storage folder')
  })

  it('moves when a controlled product says so, after the checks', async () => {
    const onStepChange = vi.fn()
    function Controlled() {
      const [step, setStep] = useState('name')
      return (
        <Wizard
          steps={[
            { id: 'name', label: 'Name the workspace', content: <p>Name</p> },
            { id: 'review', label: 'Review', content: <p>Ready.</p> },
          ]}
          step={step}
          onStepChange={(id) => {
            onStepChange(id)
            setStep(id)
          }}
          stepperLabel="Setup steps"
          stateLabels={labels}
          backLabel="Back"
          nextLabel="Next"
          finishLabel="Create"
          onFinish={() => {}}
        />
      )
    }
    render(<Controlled />)
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onStepChange).toHaveBeenCalledWith('review')
    expect(heading().textContent).toBe('Review')
  })
})

describe('Wizard, for a reader', () => {
  it('passes axe as a wizard', async () => {
    await expectNoA11yViolations(<Workspace />)
  })
})
