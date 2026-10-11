import { useState } from 'react'
import { Button } from '../../../registry/ui/button'
import { Frame, ListDetail, ListDetailBack, Pane } from '../../../registry/ui/frame'
import { KeyValue, KeyValueRow } from '../../../registry/ui/key-value'
import { RowButton } from '../../../registry/ui/list-row'
import { SectionNav } from '../../../registry/ui/section-nav'
import { Segment, SegmentedControl } from '../../../registry/ui/segmented-control'
import { personOf, works } from '../../../fixtures/world'
import { Row } from '../row'

const SECTIONS = [
  { id: 'general', label: 'General', description: 'Theme, language, start screen' },
  { id: 'profile', label: 'Profile', description: 'Name, address, signature' },
  { id: 'data', label: 'Data', description: 'Export, backup, reset' },
]

export function FrameSection() {
  const [open, setOpen] = useState<string | null>('w1')
  const [width, setWidth] = useState('wide')
  const [section, setSection] = useState('general')
  const work = works.find((entry) => entry.id === open)

  return (
    <>
      <Row label="a screen's column - the head and the foot stand, only the pane's body scrolls">
        <div className="flex h-72 w-full max-w-xl">
          <Frame
            head={
              <>
                <span className="text-base font-semibold text-text">Works</span>
                <Button size="sm" variant="primary" className="ml-auto">
                  New work
                </Button>
              </>
            }
            foot={<span className="text-xs text-dim">{works.length} works, sorted by the last change</span>}
          >
            <Pane label="Works" bodyClassName="p-1">
              {works.map((entry) => (
                <RowButton key={entry.id} description={entry.summary}>
                  {entry.title}
                </RowButton>
              ))}
            </Pane>
          </Frame>
        </div>
      </Row>

      <Row label="a list beside what is open - at the width of a phone, one at a time, with the way back in the head">
        <div className="flex w-full flex-col gap-3">
          <SegmentedControl aria-label="Width" value={width} onValueChange={setWidth}>
            <Segment value="wide">Wide</Segment>
            <Segment value="phone">Phone</Segment>
          </SegmentedControl>
          <div className={width === 'phone' ? 'flex h-80 w-full max-w-sm' : 'flex h-80 w-full'}>
            <ListDetail
              open={work !== undefined}
              list={
                <Pane label="Works" bodyClassName="p-1">
                  {works.map((entry) => (
                    <RowButton
                      key={entry.id}
                      selected={entry.id === open}
                      onClick={() => setOpen(entry.id)}
                      description={personOf(entry.owner)?.name}
                    >
                      {entry.title}
                    </RowButton>
                  ))}
                </Pane>
              }
              detail={
                work === undefined ? (
                  <Pane label="Nothing open" bodyClassName="p-4">
                    <p className="text-sm text-dim">Choose a work to read it here.</p>
                  </Pane>
                ) : (
                  <Pane
                    label={work.title}
                    head={
                      <>
                        <ListDetailBack label="All works" onClick={() => setOpen(null)} />
                        <span className="truncate text-sm font-semibold text-text">{work.title}</span>
                      </>
                    }
                    bodyClassName="flex flex-col gap-3 p-4"
                  >
                    <p className="text-sm text-dim">{work.summary}</p>
                    <KeyValue>
                      <KeyValueRow label="Owner">{personOf(work.owner)?.name}</KeyValueRow>
                      <KeyValueRow label="Stage">{work.stage}</KeyValueRow>
                      <KeyValueRow label="Versions">{work.versions.length}</KeyValueRow>
                    </KeyValue>
                  </Pane>
                )
              }
            />
          </div>
        </div>
      </Row>

      <Row label="the rail's width - a column of destinations, the sections of a settings screen">
        <div className="flex h-56 w-full">
          <ListDetail
            open
            width="rail"
            list={
              <Pane label="Settings" bodyClassName="p-1.5">
                <SectionNav
                  label="Settings"
                  labelHidden
                  items={SECTIONS}
                  activeId={section}
                  onSelect={setSection}
                />
              </Pane>
            }
            detail={
              <Pane label={SECTIONS.find((entry) => entry.id === section)!.label} bodyClassName="p-4">
                <p className="text-sm text-dim">
                  {SECTIONS.find((entry) => entry.id === section)!.description}.
                </p>
              </Pane>
            }
          />
        </div>
      </Row>
    </>
  )
}
