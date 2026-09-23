import { useState } from 'react'
import { Row } from '../row'
import { Wizard } from '../../../registry/ui/wizard'
import { Field } from '../../../registry/ui/field'
import { Input } from '../../../registry/ui/input'
import { Switch } from '../../../registry/ui/switch'
import { KeyValue, KeyValueRow } from '../../../registry/ui/key-value'
import { Button } from '../../../registry/ui/button'

/*
 * Wizard on the stand.
 *
 * A real one - setting up a workspace - so what the stand shows is the
 * behaviour and not only the drawing: Next refuses an empty name, the storage
 * step waits on a slow check with its controls disabled, Back finds the
 * fields as they were left, a completed step can be clicked and a step ahead
 * cannot. The second is the same wizard with the stepper down the side.
 */

const stateLabels = { done: 'Completed', error: 'Needs attention' }
const summary = (position: number, total: number) => `Step ${position} of ${total}`

export function WizardSection() {
  return (
    <>
      <Row label="Next checks the step, Back keeps what was typed, Enter is Next and never Finish">
        <WorkspaceWizard />
      </Row>

      <Row label="vertical - the stepper beside the content">
        <WorkspaceWizard orientation="vertical" />
      </Row>
    </>
  )
}

function WorkspaceWizard({ orientation }: { orientation?: 'horizontal' | 'vertical' }) {
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string>()
  const [folder, setFolder] = useState('')
  const [sync, setSync] = useState(true)
  const [created, setCreated] = useState(false)
  const [run, setRun] = useState(0)

  if (created) {
    return (
      <div className="flex w-full items-center justify-between gap-4">
        <p className="text-sm text-text">Workspace “{name}” created.</p>
        <Button
          size="sm"
          onClick={() => {
            setName('')
            setFolder('')
            setSync(true)
            setCreated(false)
            setRun(run + 1)
          }}
        >
          Start again
        </Button>
      </div>
    )
  }

  return (
    <Wizard
      key={run}
      orientation={orientation}
      className="w-full"
      stepperLabel="Workspace setup"
      stateLabels={stateLabels}
      summary={summary}
      backLabel="Back"
      nextLabel="Next"
      finishLabel="Create workspace"
      onFinish={async () => {
        await new Promise((resolve) => setTimeout(resolve, 400))
        setCreated(true)
      }}
      steps={[
        {
          id: 'name',
          label: 'Name the workspace',
          description: 'Shown in the sidebar and in shared links.',
          canAdvance: () => {
            const error = name.trim() === '' ? 'Give the workspace a name.' : undefined
            setNameError(error)
            return error === undefined
          },
          content: (
            <Field label="Name" error={nameError} help="You can change it later.">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Research notes" />
            </Field>
          ),
        },
        {
          id: 'storage',
          label: 'Choose a storage folder',
          description: 'Files stay on this machine unless sync is on.',
          // A pretend check against the disk, slow enough to see the controls
          // wait for it.
          onNext: async () => {
            await new Promise((resolve) => setTimeout(resolve, 400))
            return folder.trim() !== ''
          },
          content: (
            <div className="flex flex-col gap-3">
              <Field label="Folder" help="An empty folder is best." required>
                <Input
                  value={folder}
                  onChange={(event) => setFolder(event.target.value)}
                  placeholder="D:/Workspaces/research"
                  required
                />
              </Field>
              <Switch checked={sync} onCheckedChange={setSync}>
                Sync to other devices
              </Switch>
            </div>
          ),
        },
        {
          id: 'review',
          label: 'Review',
          description: 'Nothing is created until you press the button.',
          content: (
            <KeyValue>
              <KeyValueRow label="Name">{name}</KeyValueRow>
              <KeyValueRow label="Folder">{folder}</KeyValueRow>
              <KeyValueRow label="Sync">{sync ? 'On' : 'Off'}</KeyValueRow>
            </KeyValue>
          ),
        },
      ]}
    />
  )
}
