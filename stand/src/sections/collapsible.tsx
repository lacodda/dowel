import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '../../../registry/ui/collapsible'
import { Row } from '../row'

/*
 * The stand section for Collapsible.
 *
 * Two demos with content of a different length, so the height-driven panel
 * transition is visibly doing real measurement rather than animating toward
 * a number that happened to fit the first example.
 */
export function CollapsibleSection() {
  return (
    <>
      <Row label="closed by default, a short panel">
        <div className="w-80">
          <Collapsible>
            <CollapsibleTrigger>What changed in 1.4</CollapsibleTrigger>
            <CollapsiblePanel>Fixed a crash on startup when the config file was missing.</CollapsiblePanel>
          </Collapsible>
        </div>
      </Row>

      <Row label="open by default, a longer panel">
        <div className="w-80">
          <Collapsible defaultOpen>
            <CollapsibleTrigger>Shipping details</CollapsibleTrigger>
            <CollapsiblePanel>
              Orders placed before 2pm ship the same business day. Standard delivery
              takes three to five days; express arrives the next day for an extra
              fee. Tracking is emailed once the courier picks up the package.
            </CollapsiblePanel>
          </Collapsible>
        </div>
      </Row>

      <Row label="disabled - the trigger neither opens nor takes focus styling from a click">
        <div className="w-80">
          <Collapsible disabled>
            <CollapsibleTrigger>Archived thread</CollapsibleTrigger>
            <CollapsiblePanel>This conversation was archived and can no longer be expanded.</CollapsiblePanel>
          </Collapsible>
        </div>
      </Row>
    </>
  )
}
