import { ScrollArea } from '../../../registry/ui/scroll-area'
import { Row } from '../row'

const ACTIVITY = [
  'Draft saved',
  'Cover image replaced',
  'Tag "archive" added',
  'Title changed',
  'Version 3 published',
  'Comment resolved',
  'Two files attached',
  'Shared with the review group',
  'Due date moved to Friday',
  'Version 2 published',
  'Description rewritten',
  'Created from a template',
]

const LOG = [
  '12:04:11  build   compiled 214 modules in 1.8s',
  '12:04:12  test    412 passed, 0 failed, 3 skipped in 6.4s',
  '12:04:19  deploy  uploaded 38 files to the staging host, 2.1 MB in total, cache headers set',
  '12:04:20  deploy  health check passed on the first attempt',
  '12:04:21  notify  release notes sent to the channel',
]

export function ScrollAreaSection() {
  return (
    <>
      <Row label="a list taller than its box - hover or scroll for the bar; Tab reaches it">
        <ScrollArea label="Recent activity" className="h-48 w-72 rounded-lg border border-line bg-bg">
          <ul className="divide-y divide-line text-sm">
            {ACTIVITY.map((entry) => (
              <li key={entry} className="px-3 py-2 text-dim">
                {entry}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </Row>

      <Row label="with fades - an edge fades only while there is more past it">
        <ScrollArea label="Recent activity, faded" fade className="h-48 w-72 rounded-lg border border-line bg-bg">
          <ul className="text-sm">
            {ACTIVITY.map((entry) => (
              <li key={entry} className="px-3 py-2 text-dim">
                {entry}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </Row>

      <Row label="both axes - lines that do not wrap scroll sideways too">
        <ScrollArea label="Deploy log" fade className="h-32 w-full max-w-md rounded-lg border border-line bg-soft">
          <pre className="p-3 font-mono text-xs leading-relaxed text-dim">
            {[...LOG, ...LOG].join('\n')}
          </pre>
        </ScrollArea>
      </Row>
    </>
  )
}
