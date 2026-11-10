import { Row } from '../row'
import { Baseline, BarChart, ChartFrame } from '../../../registry/ui/bar-chart'
import { Panel } from '../../../registry/ui/panel'

/* Twelve weeks: a working rhythm, a fortnight off in the middle drawn as a
 * gap rather than a short week, and one week that was recorded as zero. */
const twelveWeeks = [
  { key: 'w1', hours: 38.5 },
  { key: 'w2', hours: 41 },
  { key: 'w3', hours: 36 },
  { key: 'w4', hours: 42.5 },
  { key: 'w5', hours: 12 },
  { key: 'w6', hours: null },
  { key: 'w7', hours: null },
  { key: 'w8', hours: 0 },
  { key: 'w9', hours: 34 },
  { key: 'w10', hours: 39.5 },
  { key: 'w11', hours: 0.3 },
  { key: 'w12', hours: 40 },
] as const

/* Day of month alone: twelve columns in a 28rem panel leave about 30px each,
 * and "Aug 17" truncates to "Aug ..." - a label that says less than nothing.
 * The month belongs in the title beside the chart. */
const weekLabels = ['1', '8', '15', '22', '29', '6', '13', '20', '27', '3', '10', '17']

/* A holiday fortnight: real hours, all of them far under a full week. Their
 * own tallest is 9h, a fifth of the 45h ceiling, so the two scalings of it are
 * plainly different rather than technically different. */
const quiet = [4, 6.5, 2, 9, 5.5, 7]

function quietWeeks() {
  return quiet.map((hours, index) => ({
    key: `q${index}`,
    value: hours,
    label: String(index * 7 + 1),
    title: `week ${index + 1} · ${hours}h`,
  }))
}

function weekBars(tone?: 'accent' | 'muted') {
  return twelveWeeks.map((week, index) => ({
    key: week.key,
    value: week.hours,
    label: weekLabels[index]!,
    tone,
    title:
      week.hours === null
        ? `${weekLabels[index]} · nothing recorded`
        : `${weekLabels[index]} · ${week.hours}h`,
  }))
}

const weekCeiling = 45
const weekMedian = 38.5

export function BarChartSection() {
  const picked = weekBars('muted').map((bar, index) =>
    index === 11 ? { ...bar, tone: 'accent' as const } : bar,
  )

  return (
    <>
      <Row label="twelve weeks - two of them with nothing recorded, one recorded as zero, one of twenty minutes">
        <Panel className="w-112 p-5">
          <ChartFrame gutter={false}>
            <BarChart bars={weekBars()} max={weekCeiling} label="Twelve weeks of work" />
          </ChartFrame>
        </Panel>
      </Row>

      <Row label="with the median named - a chart without its baseline invites the reader to invent one">
        <Panel className="w-112 p-5">
          <ChartFrame>
            <BarChart bars={weekBars()} max={weekCeiling} label="Twelve weeks of work, median 38.5h" />
            <Baseline value={weekMedian} max={weekCeiling}>
              median 38.5h
            </Baseline>
          </ChartFrame>
        </Panel>
      </Row>

      <Row label="emphasis - one column is the story, the rest are the field it stands in">
        <Panel className="w-112 p-5">
          <ChartFrame gutter={false}>
            <BarChart bars={picked} max={weekCeiling} label="Twelve weeks, this week picked out" />
          </ChartFrame>
        </Panel>
      </Row>

      <Row label="sm, for a chart that sits beside something else">
        <Panel className="w-80 p-4">
          <BarChart bars={weekBars().slice(6)} max={weekCeiling} size="sm" label="Six weeks of work" />
        </Panel>
      </Row>

      <Row label="a quiet stretch against the stated ceiling, and the same weeks scaled to themselves">
        <Panel className="flex w-80 flex-col gap-3 p-4">
          {/* Its own data, and it has to be. The point only lands when the
              stretch's own tallest week is far below the ceiling, and no slice
              of the twelve above qualifies - the quietest run still reaches
              76% of 45, which on a 72px plot is a difference of seventeen
              pixels. Two earlier drafts of this row sliced the twelve and
              proved nothing. */}
          <BarChart bars={quietWeeks()} max={weekCeiling} size="sm" label="A quiet fortnight, against the same ceiling as the charts above" />
          <span className="text-xs text-dim">
            <code>max=45</code> - read against the other charts, this fortnight was short
          </span>
          <BarChart bars={quietWeeks()} size="sm" label="The same fortnight, scaled to itself" />
          <span className="text-xs text-dim">
            no <code>max</code> - the same weeks now fill the plot, and nothing says they were quiet
          </span>
        </Panel>
      </Row>
    </>
  )
}
