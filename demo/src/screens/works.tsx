import { ListDetailScreen } from '@/components/blocks/list-detail-screen'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KeyValue, KeyValueRow } from '@/components/ui/key-value'
import { ListRow } from '@/components/ui/list-row'
import { RelativeTime } from '@/components/ui/relative-time'
import { StatusDot } from '@/components/ui/status-dot'
import { personOf, type Work } from '../../../fixtures/world'
import { go, href } from '../router'
import type { DemoState } from '../state'
import { STAGE, now } from '../works'

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

/**
 * Works: the list beside the open one, the open one in the address - so a
 * work can be linked to, and the back button walks between the ones read.
 */
export function Works({ state, open }: { state: DemoState; open: string | null }) {
  const works = [...state.works].sort((a, b) => b.updated.localeCompare(a.updated))
  return (
    <ListDetailScreen<Work>
      title="Works"
      description="Everything in progress, newest change first."
      items={works}
      itemKey={(work) => work.id}
      row={(work) => ({
        start: <StatusDot status={STAGE[work.stage].status} label={STAGE[work.stage].label} />,
        title: work.title,
        description: personOf(work.owner)?.name,
        end: <RelativeTime value={work.updated} now={now} />,
      })}
      selected={open}
      onSelect={(id) => go(id === null ? 'works' : `works/${id}`)}
      rowRender={(work) => <a href={href(`works/${work.id}`)} />}
      matches={(work, query) => work.title.toLowerCase().includes(query.toLowerCase())}
      detailTitle={(work) => work.title}
      detail={(work) => <WorkDetail work={work} />}
      emptyAction={
        <Button variant="primary" size="sm" onClick={state.bringSamples}>
          Bring in the samples
        </Button>
      }
      words={{
        list: 'Works',
        search: 'Find a work',
        clear: 'Clear the search',
        back: 'All works',
        nothingYet: { title: 'No works yet', body: 'Start one, or bring in the samples to see this screen full.' },
        nothingFound: { title: 'No work answers to that', body: 'Try a shorter word, or clear the search.' },
        nothingOpen: { title: 'Nothing open', body: 'Choose a work on the left to read it here.' },
      }}
    />
  )
}
