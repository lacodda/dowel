import { Row } from '../row'
import { ActivityHeatmap } from '../../../registry/ui/activity-heatmap'
import { ActivityLegend } from '../../../registry/ui/activity-legend'
import { stepFor, weeks } from '../../../registry/ui/activity-weeks'
import { Panel } from '../../../registry/ui/panel'

/* A demo year, made rather than copied: a working rhythm with weekends off,
 * a fortnight away in July, and a few days still open at the end. */
function demoYear() {
  const entries: { date: string; value: number | null }[] = []
  const start = Date.parse('2025-10-01T00:00:00Z')
  for (let i = 0; i < 360; i++) {
    const time = start + i * 86_400_000
    const date = new Date(time).toISOString().slice(0, 10)
    const weekday = new Date(time).getUTCDay()
    if (weekday === 0 || weekday === 6) {
      // Some weekends, not none: a grid where the weekends are always blank
      // hides whether the component can draw one that is not.
      if (i % 11 !== 0) continue
      entries.push({ date, value: 1800 + ((i * 37) % 3600) })
      continue
    }
    if (date >= '2026-07-06' && date <= '2026-07-19') continue
    if (date >= '2026-09-24') {
      entries.push({ date, value: null })
      continue
    }
    if (i % 17 === 0) continue
    /* Spread across the whole scale on purpose. The first draft ran
     * 12600..34200 against a ceiling of 34200, so no weekday could reach below
     * the second step and three quarters of the year landed on the top three -
     * a grid of one colour, which demonstrates that the steps exist without
     * showing that they can be told apart. */
    entries.push({ date, value: 1_800 + ((i * 911) % 32_400) })
  }
  return entries
}

const year = demoYear()
const busiestSeconds = Math.max(...year.map((entry) => entry.value ?? 0))
const hours = (seconds: number) => `${Math.floor(seconds / 3600)}h ${String(Math.round((seconds % 3600) / 60)).padStart(2, '0')}m`
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function describeCell(cell: { date: string; kind: string; value: number | null }) {
  if (cell.kind === 'value') return `${cell.date} · ${hours(cell.value ?? 0)}`
  if (cell.kind === 'partial') return `${cell.date} · still open`
  if (cell.kind === 'outside') return `${cell.date} · outside the range`
  return `${cell.date} · nothing recorded`
}

export function ActivityWeeksSection() {
  const fortnight = weeks(
    [
      { date: '2026-09-07', value: 28_800 },
      { date: '2026-09-08', value: 7_200 },
      { date: '2026-09-09', value: null },
      { date: '2026-09-11', value: 0 },
    ],
    { from: '2026-09-07', to: '2026-09-13', busiest: 28_800 },
  )

  return (
    <>
      <Row label="no markup - one week, and what each of its seven cells is">
        <div className="flex flex-col gap-1">
          {fortnight[0]!.map((cell) => (
            <div key={cell.date} className="font-mono text-xs text-dim">
              {cell.date} {cell.kind.padEnd(8)} step {cell.step ?? '-'}
              {cell.weekend ? '  weekend' : ''}
            </div>
          ))}
        </div>
      </Row>

      <Row label="a measured zero is an answer, an absent day is not - and they differ">
        <div className="flex flex-col gap-1 font-mono text-xs text-dim">
          <div>stepFor(0, 28800) = {stepFor(0, 28_800)}  (zero, measured)</div>
          <div>stepFor(1, 28800) = {stepFor(1, 28_800)}  (one second is still a day)</div>
          <div>stepFor(14400, 28800) = {stepFor(14_400, 28_800)}</div>
          <div>stepFor(28800, 28800) = {stepFor(28_800, 28_800)}</div>
          <div className="text-faint">a day with no entry never reaches this function at all</div>
        </div>
      </Row>
    </>
  )
}

export function ActivityLegendSection() {
  return (
    <>
      <Row label="the full legend - the five steps, the relative ceiling named, and the two meanings that are not numbers">
        <Panel className="p-4">
          <ActivityLegend
            less="Less"
            more="More"
            busiest={`busiest ${hours(busiestSeconds)}`}
            none="Nothing recorded"
            partial="Still open"
          />
        </Panel>
      </Row>

      <Row label="only the ramp, for a grid whose data has no gaps and nothing under way">
        <Panel className="p-4">
          <ActivityLegend less="Less" more="More" busiest={`busiest ${hours(busiestSeconds)}`} />
        </Panel>
      </Row>

      <Row label="without the ceiling - and this is what it costs">
        <Panel className="flex flex-col gap-2 p-4">
          <ActivityLegend less="Less" more="More" />
          <span className="text-xs text-dim">
            the same five shades, now reading as an absolute measure of a full day - which no grid here
            has an opinion about
          </span>
        </Panel>
      </Row>
    </>
  )
}

export function ActivityHeatmapSection() {
  return (
    <>
      <Row label="a year, with weekends, a fortnight away in July, and the last week still open">
        <Panel className="flex flex-col gap-3 overflow-x-auto p-5">
          <ActivityHeatmap
            entries={year}
            from="2025-10-01"
            to="2026-09-30"
            busiest={busiestSeconds}
            size="sm"
            label={`A year of work, busiest day ${hours(busiestSeconds)}`}
            describe={describeCell}
            weekdayLabel={(day) => WEEKDAYS[day]}
          />
          <ActivityLegend
            less="Less"
            more="More"
            busiest={`busiest ${hours(busiestSeconds)}`}
            none="Nothing recorded"
            partial="Still open"
          />
        </Panel>
      </Row>

      <Row label="md, for a quarter - where there is room to hover a square">
        <Panel className="flex flex-col gap-3 overflow-x-auto p-5">
          <ActivityHeatmap
            entries={year}
            from="2026-07-01"
            to="2026-09-30"
            busiest={busiestSeconds}
            label={`A quarter of work, busiest day ${hours(busiestSeconds)}`}
            describe={describeCell}
            weekdayLabel={(day) => WEEKDAYS[day]}
          />
          <ActivityLegend less="Less" more="More" busiest={`busiest ${hours(busiestSeconds)}`} />
        </Panel>
      </Row>

      <Row label="the same quarter scaled to itself - every grid gets a darkest square, which is why busiest is stated">
        <Panel className="flex flex-col gap-3 overflow-x-auto p-5">
          <ActivityHeatmap
            entries={year}
            from="2026-07-01"
            to="2026-09-30"
            label="A quarter of work, scaled to itself"
            describe={describeCell}
            weekdayLabel={(day) => WEEKDAYS[day]}
          />
          <span className="text-xs text-dim">
            no <code>busiest</code> - the darkest square is this quarter&rsquo;s own best day, so it cannot
            be compared with the grid above
          </span>
        </Panel>
      </Row>

      <Row label="without a weekday column, because those words are the product's">
        <Panel className="flex flex-col gap-3 overflow-x-auto p-5">
          <ActivityHeatmap
            entries={year}
            from="2026-08-01"
            to="2026-09-30"
            busiest={busiestSeconds}
            label="Two months of work"
            describe={describeCell}
          />
        </Panel>
      </Row>
    </>
  )
}
