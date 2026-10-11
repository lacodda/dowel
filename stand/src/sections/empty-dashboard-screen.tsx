import { useState } from 'react'
import {
  EmptyDashboardScreen,
  type EmptyDashboardScreenWords,
  type FirstStep,
} from '../../../registry/blocks/empty-dashboard-screen'
import { Button } from '../../../registry/ui/button'
import { you } from '../../../fixtures/world'
import { Row } from '../row'
import { WidthSwitch, Window, type WindowWidth } from './window'

const WORDS: EmptyDashboardScreenWords = {
  steps: 'Getting started',
  progress: (done, total) => `${done} of ${total} done`,
  done: 'done',
  notYet: 'not yet',
  figures: 'What will show here',
}

const FIGURES = [{ label: 'Works' }, { label: 'In progress' }, { label: 'Released' }, { label: 'Hours this week' }]

export function EmptyDashboardScreenSection() {
  const [width, setWidth] = useState<WindowWidth>('wide')
  const [finished, setFinished] = useState<string[]>(['account'])
  const finish = (id: string) => setFinished((was) => [...was, id])

  const steps: FirstStep[] = [
    { id: 'account', title: 'Make your account', description: 'Done when you signed in.', done: finished.includes('account') },
    {
      id: 'work',
      title: 'Start your first work',
      description: 'A song, a clip, a cover - anything you will make versions of.',
      done: finished.includes('work'),
      action: (
        <Button size="sm" variant="primary" onClick={() => finish('work')}>
          New work
        </Button>
      ),
    },
    {
      id: 'version',
      title: 'Add a version',
      description: 'Every change is kept, so trying something costs nothing.',
      done: finished.includes('version'),
      action: (
        <Button size="sm" variant="primary" onClick={() => finish('version')}>
          Add a version
        </Button>
      ),
    },
    {
      id: 'release',
      title: 'Plan a release',
      description: 'Put it on the calendar, and the dashboard starts counting.',
      done: finished.includes('release'),
      action: (
        <Button size="sm" variant="primary" onClick={() => finish('release')}>
          Plan a release
        </Button>
      ),
    },
  ]

  return (
    <Row label="the first day - press the next step to move on; the figures wait with a dash, not a zero">
      <div className="flex w-full flex-col gap-3">
        <div className="flex items-center gap-3">
          <WidthSwitch value={width} onChange={setWidth} />
          <Button size="sm" onClick={() => setFinished(['account'])}>
            Start over
          </Button>
        </div>
        <Window width={width}>
          <EmptyDashboardScreen
            title={`Welcome, ${you.name.split(' ')[0]}`}
            description="Three things, and this page starts filling itself."
            steps={steps}
            figures={FIGURES}
            words={WORDS}
          />
        </Window>
      </div>
    </Row>
  )
}
