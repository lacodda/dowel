import { useState } from 'react'
import { cn } from 'dowel-ui'
import { Row } from '../row'
import { NotificationBell } from '../../../registry/ui/notification-bell'
import { bellLabels } from './shared'

const recentEntries = [
  { text: 'A release lost its slot: Harbour lights, Friday.', warn: true, when: '2h' },
  { text: 'Tide tables was scored.', warn: false, when: '5h' },
  { text: 'A new version of Harbour lights was pasted in.', warn: false, when: '1d' },
]

export function NotificationBellSection() {
  const [unread, setUnread] = useState(1)
  const [seen, setSeen] = useState('nothing yet')

  const rows = (
    <ul className="m-0 list-none p-0">
      {recentEntries.map((entry) => (
        <li key={entry.text} className="flex items-baseline gap-2.5 border-b border-line py-2 last:border-b-0">
          <span
            aria-hidden
            className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', entry.warn && unread > 0 ? 'bg-warn' : 'bg-line-2')}
          />
          <p className={cn('m-0 min-w-0 flex-1 text-sm text-dim', entry.warn && unread > 0 && 'text-text')}>
            {entry.text}
          </p>
          <span className="shrink-0 text-2xs tabular-nums text-faint">{entry.when}</span>
        </li>
      ))}
    </ul>
  )

  return (
    <>
      <Row label="lit by one thing that needs a look - open it, mark it read, or see everything">
        <NotificationBell
          count={unread}
          {...bellLabels}
          onMarkAll={() => setUnread(0)}
          onSeeAll={() => setSeen('sent to the whole history')}
        >
          {rows}
        </NotificationBell>
        <span className="text-xs text-dim">{seen}</span>
      </Row>

      <Row label="at zero, at three, and past nine">
        <NotificationBell count={0} {...bellLabels} />
        <NotificationBell count={3} {...bellLabels}>
          {rows}
        </NotificationBell>
        <NotificationBell count={42} {...bellLabels}>
          {rows}
        </NotificationBell>
      </Row>
    </>
  )
}
