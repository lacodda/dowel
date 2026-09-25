import { useState } from 'react'
import { ListRow, RowButton } from '../../../registry/ui/list-row'
import { Panel } from '../../../registry/ui/panel'
import { StatusDot } from '../../../registry/ui/status-dot'
import { Row } from '../row'

const releases = [
  { id: 'r1', title: 'Harbour lights - single', date: '12 Sep', status: 'good' as const, label: 'Released' },
  { id: 'r2', title: 'Tide tables - EP', date: '30 Aug', status: 'info' as const, label: 'Scheduled' },
  { id: 'r3', title: 'Nine of cups - single', date: '02 Aug', status: 'neutral' as const, label: 'Draft' },
]

const versions = [
  { id: 'v1', title: 'Draft 3', description: 'Rewrote the bridge.' },
  { id: 'v2', title: 'Draft 2', description: 'First pass with the new chorus melody.' },
  { id: 'v3', title: 'Draft 1', description: 'Original sketch, kept for reference.' },
]

export function ListRowSection() {
  const [selected, setSelected] = useState('v1')

  return (
    <>
      <Row label="a fact - a status dot in start, a date in end, inside a panel">
        <Panel className="w-80">
          <ul className="m-0 list-none p-0">
            {releases.map((release) => (
              <ListRow
                key={release.id}
                render={<li />}
                start={<StatusDot status={release.status} label={release.label} />}
                end={release.date}
              >
                {release.title}
              </ListRow>
            ))}
          </ul>
        </Panel>
      </Row>

      <Row label="a choice - the open one is tinted and named current; press one to open it">
        <Panel className="w-80 p-1.5">
          {versions.map((version) => (
            <RowButton
              key={version.id}
              selected={selected === version.id}
              description={version.description}
              onClick={() => setSelected(version.id)}
            >
              {version.title}
            </RowButton>
          ))}
        </Panel>
      </Row>

      <Row label="a long title, truncated on one line">
        <Panel className="w-64">
          <ul className="m-0 list-none p-0">
            <ListRow render={<li />} end="09:14">
              A very long title for a release that keeps going well past the width of the row
            </ListRow>
          </ul>
        </Panel>
      </Row>
    </>
  )
}
