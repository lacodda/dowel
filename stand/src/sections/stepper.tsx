import { useState } from 'react'
import { Row } from '../row'
import { Stepper, type StepperStep } from '../../../registry/ui/stepper'

/*
 * Stepper on the stand.
 *
 * Every state side by side, so the four marks can be compared in both themes
 * and in greyscale. The narrow row is the same stepper in a container under
 * the fold point, which is the only way to see the fold on a wide screen. The
 * form that moves through the steps is the Wizard's section.
 */

const stateLabels = { done: 'Completed', error: 'Needs attention' }
const summary = (position: number, total: number) => `Step ${position} of ${total}`

const setup: StepperStep[] = [
  { id: 'name', label: 'Name', description: 'What it is called' },
  { id: 'storage', label: 'Storage', description: 'Where files live' },
  { id: 'members', label: 'Members', description: 'Who can open it' },
  { id: 'review', label: 'Review', description: 'Check and create' },
]

export function StepperSection() {
  const [current, setCurrent] = useState('storage')

  return (
    <>
      <Row label="done, current and upcoming - a tick, a filled number, an outlined one">
        <Stepper
          className="w-full"
          label="Setup steps"
          steps={setup}
          current="members"
          stateLabels={stateLabels}
          summary={summary}
        />
      </Row>

      <Row label="a step that failed its check carries its own mark, not just a red number">
        <Stepper
          className="w-full"
          label="Setup steps"
          steps={setup.map((step) => (step.id === 'storage' ? { ...step, status: 'error' as const } : step))}
          current="storage"
          stateLabels={stateLabels}
          summary={summary}
        />
      </Row>

      <Row label="clickable - done steps and the current one; the steps ahead stay text">
        <Stepper
          className="w-full"
          label="Setup steps"
          steps={setup}
          current={current}
          stateLabels={stateLabels}
          summary={summary}
          onStepSelect={setCurrent}
        />
      </Row>

      <Row label="narrow container - the marks stay, only the current label is written, the position in words">
        <div className="w-72 rounded-md border border-line bg-bg p-3">
          <Stepper
            label="Setup steps"
            steps={setup}
            current="storage"
            stateLabels={stateLabels}
            summary={summary}
          />
        </div>
      </Row>

      <Row label="vertical - beside the content, with room for every description">
        <Stepper
          label="Setup steps"
          steps={setup}
          current="members"
          stateLabels={stateLabels}
          orientation="vertical"
        />
      </Row>
    </>
  )
}
