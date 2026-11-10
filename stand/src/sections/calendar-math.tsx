import { Row } from '../row'
import {
  addDays,
  addMonths,
  daysInMonth,
  isIsoDate,
  today,
} from '../../../registry/ui/calendar-math'

export function CalendarMathSection() {
  /* The cases that break naive date code, answered live. Each row shows the
   * call and what it returns, so the stand demonstrates the module the way
   * the Shortcut section demonstrates a hook - by running it. */
  const cases: [string, string][] = [
    ['today()', today()],
    ["addMonths('2026-03-31', -1)", addMonths('2026-03-31', -1)],
    ["addMonths('2024-03-31', -1)", addMonths('2024-03-31', -1)],
    ["addDays('2026-12-31', 1)", addDays('2026-12-31', 1)],
    ["addDays('2024-02-28', 1)", addDays('2024-02-28', 1)],
    ["daysInMonth(1900, 2)", String(daysInMonth(1900, 2))],
    ["daysInMonth(2000, 2)", String(daysInMonth(2000, 2))],
    ["isIsoDate('2026-02-31')", String(isIsoDate('2026-02-31'))],
    ["isIsoDate('2024-02-29')", String(isIsoDate('2024-02-29'))],
  ]

  return (
    <Row label="no markup - the sums the Calendar runs on, answering live">
      <div className="flex flex-col gap-1">
        {cases.map(([call, answer]) => (
          <div key={call} className="flex items-baseline gap-2 font-mono text-xs">
            <span className="text-dim">{call}</span>
            <span className="text-faint">-&gt;</span>
            <span className="text-accent tabular-nums">{answer}</span>
          </div>
        ))}
      </div>
    </Row>
  )
}
