import { useState } from 'react'
import { Row } from '../row'
import { CopyButton } from '../../../registry/ui/copy-button'

export function CopyButtonSection() {
  const [last, setLast] = useState<string>('nothing yet')

  return (
    <>
      <Row label="in the corner of a block - hover the panel, not the button, and Tab reaches it too">
        <div className="group relative w-88 rounded-md border border-line bg-soft p-3">
          <p className="pr-8 font-mono text-xs text-dim">
            a4f19c2e-77b0-4c31-9a2e-1f0b3d5c8e44
          </p>
          <CopyButton
            value="a4f19c2e-77b0-4c31-9a2e-1f0b3d5c8e44"
            label="Copy the identifier"
            copiedLabel="Copied"
            onCopy={(ok) => setLast(ok ? 'the clipboard took it' : 'the clipboard refused')}
            className="absolute right-2 top-2"
          />
        </div>
      </Row>

      <Row label="what the product is told - a refusal is reported rather than swallowed">
        <span className="text-xs text-dim">{last}</span>
      </Row>
    </>
  )
}
