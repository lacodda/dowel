import { useState } from 'react'
import { Row } from '../row'
import { SaveState, type SaveStatus } from '../../../registry/ui/save-state'
import { Button } from '../../../registry/ui/button'
import { Input } from '../../../registry/ui/input'

export function SaveStateSection() {
  const [status, setStatus] = useState<SaveStatus>('idle')

  return (
    <>
      <Row label="what a form without a Save button says">
        <div className="flex items-center gap-3">
          <Input aria-label="Title" defaultValue="A field that saves itself" className="w-64" />
          <SaveState status={status} savingLabel="Saving..." savedLabel="Saved" />
        </div>
      </Row>

      <Row label="the three states">
        <div className="flex items-center gap-4">
          <SaveState status="saving" savingLabel="Saving..." savedLabel="Saved" />
          <SaveState status="saved" savingLabel="Saving..." savedLabel="Saved" />
          <span className="rounded border border-dashed border-line px-2 py-1">
            <SaveState status="idle" savingLabel="Saving..." savedLabel="Saved" />
          </span>
        </div>
      </Row>

      <Row label="watch it run">
        <Button
          variant="soft"
          onClick={() => {
            setStatus('saving')
            setTimeout(() => setStatus('saved'), 900)
            setTimeout(() => setStatus('idle'), 2900)
          }}
        >
          Save something
        </Button>
      </Row>
    </>
  )
}
