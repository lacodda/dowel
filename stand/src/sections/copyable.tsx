import { Row } from '../row'
import { Copyable } from '../../../registry/ui/copyable'
import { Panel, SectionLabel } from '../../../registry/ui/panel'

export function CopyableSection() {
  return (
    <>
      <Row label="click to copy">
        <Copyable label="Copy" copiedLabel="Copied">7f3c9a2</Copyable>
        <Copyable value="/very/long/path/to/the/actual/file.txt" label="Copy" copiedLabel="Copied">/very/long/…/file.txt</Copyable>
      </Row>

      <Row label="in a row of its own, as an id usually is">
        <Panel className="w-full p-3">
          <SectionLabel className="mb-2">Session</SectionLabel>
          <Copyable label="Copy" copiedLabel="Copied">0177BynFdagmBzF7jKoH3wxx</Copyable>
        </Panel>
      </Row>
    </>
  )
}
