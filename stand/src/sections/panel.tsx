import { Row } from '../row'
import { Panel, SectionLabel } from '../../../registry/ui/panel'

export function PanelSection() {
  return (
    <Row label="surfaces">
      <Panel className="w-48 p-3">
        <SectionLabel className="mb-2">Raised</SectionLabel>
        <p className="text-xs text-dim">Sits on the page.</p>
      </Panel>

      <Panel variant="floating" className="w-48 p-3">
        <SectionLabel className="mb-2">Floating</SectionLabel>
        <p className="text-xs text-dim">Has left it.</p>
      </Panel>

      <Panel className="w-48 p-3">
        <SectionLabel className="mb-2">With an inset</SectionLabel>
        <Panel variant="inset" className="p-2">
          <p className="text-xs text-dim">Inside another.</p>
        </Panel>
      </Panel>
    </Row>
  )
}
