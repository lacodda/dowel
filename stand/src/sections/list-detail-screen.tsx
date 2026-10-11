import { useState } from 'react'
import { ListDetailScreen, type ListDetailScreenWords } from '../../../registry/blocks/list-detail-screen'
import { Badge } from '../../../registry/ui/badge'
import { Button } from '../../../registry/ui/button'
import { KeyValue, KeyValueRow } from '../../../registry/ui/key-value'
import { ListRow } from '../../../registry/ui/list-row'
import { RelativeTime } from '../../../registry/ui/relative-time'
import { StatusDot, type Status } from '../../../registry/ui/status-dot'
import { personOf, works, worldNow, type Work, type WorkStage } from '../../../fixtures/world'
import { Row } from '../row'
import { WidthSwitch, Window, type WindowWidth } from './window'

const WORDS: ListDetailScreenWords = {
  list: 'Works',
  search: 'Find a work',
  clear: 'Clear the search',
  back: 'All works',
  nothingYet: { title: 'No works yet', body: 'Everything you start shows up here.' },
  nothingFound: { title: 'No work answers to that', body: 'Try a shorter word, or clear the search.' },
  nothingOpen: { title: 'Nothing open', body: 'Choose a work on the left to read it here.' },
}

/** Where a work stands, as a dot's status and the word beside it. */
const STAGE: Record<WorkStage, { status: Status; label: string }> = {
  idea: { status: 'neutral', label: 'Idea' },
  draft: { status: 'info', label: 'Draft' },
  ready: { status: 'warn', label: 'Ready' },
  released: { status: 'good', label: 'Released' },
}

const now = new Date(worldNow)

/** Newest change first, as the screen's description says. */
const byChange = [...works].sort((a, b) => b.updated.localeCompare(a.updated))

function WorkDetail({ work }: { work: Work }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-dim">{work.summary}</p>
      <KeyValue>
        <KeyValueRow label="Owner">{personOf(work.owner)?.name}</KeyValueRow>
        <KeyValueRow label="Stage">
          <StatusDot status={STAGE[work.stage].status} label={STAGE[work.stage].label} showLabel />
        </KeyValueRow>
        <KeyValueRow label="Changed">
          <RelativeTime value={work.updated} now={now} />
        </KeyValueRow>
        <KeyValueRow label="Tags">
          <span className="flex flex-wrap gap-1">
            {work.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </span>
        </KeyValueRow>
      </KeyValue>
      {work.versions.length === 0 ? null : (
        <div className="flex flex-col">
          <h3 className="caption mb-1">Versions</h3>
          {work.versions.map((version) => (
            <ListRow key={version.id} description={version.note} end={<RelativeTime value={version.at} now={now} />}>
              {version.label}
            </ListRow>
          ))}
        </div>
      )}
    </div>
  )
}

export function ListDetailScreenSection() {
  const [selected, setSelected] = useState<string | null>('w1')
  const [width, setWidth] = useState<WindowWidth>('wide')

  return (
    <>
      <Row label="choose a work, search, walk the list with the arrows - and at a phone's width, one at a time">
        <div className="flex w-full flex-col gap-3">
          <WidthSwitch value={width} onChange={setWidth} />
          <Window width={width}>
            <ListDetailScreen<Work>
              title="Works"
              description="Everything in progress, newest change first."
              actions={
                <Button variant="primary" size="sm">
                  New work
                </Button>
              }
              items={byChange}
              itemKey={(work) => work.id}
              row={(work) => ({
                start: <StatusDot status={STAGE[work.stage].status} label={STAGE[work.stage].label} />,
                title: work.title,
                description: personOf(work.owner)?.name,
                end: <RelativeTime value={work.updated} now={now} />,
              })}
              selected={selected}
              onSelect={setSelected}
              matches={(work, query) => work.title.toLowerCase().includes(query.toLowerCase())}
              detailTitle={(work) => work.title}
              detailActions={() => (
                <Button size="sm" variant="ghost">
                  Rename
                </Button>
              )}
              detail={(work) => <WorkDetail work={work} />}
              words={WORDS}
            />
          </Window>
        </div>
      </Row>

      <Row label="nothing yet - one empty state for the screen, with the way out">
        <Window short>
          <ListDetailScreen<Work>
            title="Works"
            items={[]}
            itemKey={(work) => work.id}
            row={(work) => ({ title: work.title })}
            selected={null}
            onSelect={() => {}}
            detailTitle={(work) => work.title}
            detail={() => null}
            emptyAction={
              <Button variant="primary" size="sm">
                New work
              </Button>
            }
            words={WORDS}
          />
        </Window>
      </Row>
    </>
  )
}
