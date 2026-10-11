import { EmptyDashboardScreen, type FirstStep } from '@/components/blocks/empty-dashboard-screen'
import { Button } from '@/components/ui/button'
import { Frame, Pane } from '@/components/ui/frame'
import { RowButton } from '@/components/ui/list-row'
import { PageHeader } from '@/components/ui/page-header'
import { Panel } from '@/components/ui/panel'
import { RelativeTime } from '@/components/ui/relative-time'
import { StatRow, StatTile } from '@/components/ui/stat-tile'
import { StatusDot } from '@/components/ui/status-dot'
import { you } from '../../../fixtures/world'
import { href } from '../router'
import type { DemoState } from '../state'
import { STAGE, now } from '../works'

const firstName = you.name.split(' ')[0]

/**
 * Home: the first day until there is something to show, then the dashboard.
 *
 * The steps are read off the data rather than ticked by hand - a work exists,
 * a work has a version, a work is out - so the screen changes the moment
 * what it describes does.
 */
export function Home({ state }: { state: DemoState }) {
  const { works } = state
  const steps: FirstStep[] = [
    { id: 'account', title: 'Make your account', description: 'Done when you signed in.', done: true },
    {
      id: 'work',
      title: 'Start your first work',
      description: 'Or bring in the sample works, and see the screens with something on them.',
      done: works.length > 0,
      action: (
        <Button size="sm" variant="primary" onClick={state.bringSamples}>
          Bring in the samples
        </Button>
      ),
    },
    {
      id: 'version',
      title: 'Add a version',
      description: 'Every change is kept, so trying something costs nothing.',
      done: works.some((work) => work.versions.length > 0),
    },
    {
      id: 'release',
      title: 'Release something',
      description: 'Once a work is out, this page starts counting.',
      done: works.some((work) => work.stage === 'released'),
    },
  ]

  if (steps.some((step) => !step.done)) {
    return (
      <EmptyDashboardScreen
        title={`Welcome, ${firstName}`}
        description="A few things, and this page starts filling itself."
        steps={steps}
        figures={[{ label: 'Works' }, { label: 'In progress' }, { label: 'Ready' }, { label: 'Released' }]}
        words={{
          steps: 'Getting started',
          progress: (done, total) => `${done} of ${total} done`,
          done: 'done',
          notYet: 'not yet',
          figures: 'What will show here',
        }}
      />
    )
  }

  const count = (stage: string) => works.filter((work) => work.stage === stage).length
  const recent = [...works].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 5)

  return (
    <Frame head={<PageHeader title={`Good afternoon, ${firstName}`} className="mb-0 w-full" />}>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5">
        <Panel className="shrink-0 p-4">
          <StatRow>
            <StatTile label="Works" value={works.length} />
            <StatTile label="In progress" value={count('draft') + count('idea')} />
            <StatTile label="Ready" value={count('ready')} />
            <StatTile label="Released" value={count('released')} tone="accent" />
          </StatRow>
        </Panel>
        <Pane label="Recently changed" head={<h2 className="text-sm font-semibold text-text">Recently changed</h2>} bodyClassName="p-1" className="flex-initial">
          {recent.map((work) => (
            <RowButton
              key={work.id}
              render={<a href={href(`works/${work.id}`)} />}
              start={<StatusDot status={STAGE[work.stage].status} label={STAGE[work.stage].label} />}
              description={work.summary}
              end={<RelativeTime value={work.updated} now={now} />}
            >
              {work.title}
            </RowButton>
          ))}
        </Pane>
      </div>
    </Frame>
  )
}
