import { useState } from 'react'
import { Button } from '../../../registry/ui/button'
import { Segment, SegmentedControl } from '../../../registry/ui/segmented-control'
import { Row } from '../row'

/* Local icons, in the shape lucide draws - a segment is small enough that a
 * shared icon set is overkill for the pair this needs. */
function ListIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M3 4h10M3 8h10M3 12h10" strokeLinecap="round" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  )
}

export function SegmentedControlSection() {
  const [theme, setTheme] = useState('system')
  const [view, setView] = useState('list')

  return (
    <>
      <Row label="a theme picker - one option is chosen, and switching back is the same press again">
        <SegmentedControl aria-label="Theme" value={theme} onValueChange={setTheme}>
          <Segment value="light">Light</Segment>
          <Segment value="dark">Dark</Segment>
          <Segment value="system">System</Segment>
        </SegmentedControl>
      </Row>

      <Row label="with an icon beside each word">
        <SegmentedControl aria-label="View" value={view} onValueChange={setView}>
          <Segment value="list">
            <ListIcon />
            List
          </Segment>
          <Segment value="grid">
            <GridIcon />
            Grid
          </Segment>
        </SegmentedControl>
      </Row>

      <Row label="disabled">
        <SegmentedControl aria-label="Theme" defaultValue="system" disabled>
          <Segment value="light">Light</Segment>
          <Segment value="dark">Dark</Segment>
          <Segment value="system">System</Segment>
        </SegmentedControl>
      </Row>

      <Row label="compact - the control sits level with a small button beside it">
        <div data-density="compact" className="flex items-center gap-2">
          <SegmentedControl aria-label="Theme" defaultValue="system">
            <Segment value="light">Light</Segment>
            <Segment value="dark">Dark</Segment>
            <Segment value="system">System</Segment>
          </SegmentedControl>
          <Button size="sm">Save</Button>
        </div>
      </Row>
    </>
  )
}
