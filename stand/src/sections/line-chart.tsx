import { Row } from '../row'
import { LineChart } from '../../../registry/ui/line-chart'
import { boundsOf, runs, ticksFor } from '../../../registry/ui/line-scale'
import { Panel } from '../../../registry/ui/panel'

/* A balance sampled weekly across a quarter: it drifts, dips, recovers, and
 * one week was never snapshotted. The range is narrow on purpose - that is
 * what makes the zero-floor comparison worth looking at. */
const balanceWeeks = [4_900, 4_960, 5_020, 4_880, 4_940, null, 5_060, 5_010, 5_140, 5_090, 5_200, 5_260]
const balancePoints = balanceWeeks.map((value, index) => ({ at: index, value }))
const money = (value: number) => `$${value.toLocaleString('en')}`

export function LineScaleSection() {
  const bounds = boundsOf(balancePoints)!
  const stretches = runs(balancePoints, bounds)

  return (
    <>
      <Row label="no markup - a series with a hole becomes two stretches, and nothing moves">
        <div className="flex flex-col gap-1 font-mono text-xs text-dim">
          {stretches.map((run, index) => (
            <div key={run[0]!.at}>
              run {index + 1}: {run.length} points, x {run[0]!.x.toFixed(1)}% to {run.at(-1)!.x.toFixed(1)}%
            </div>
          ))}
          <div className="text-faint">
            the gap is week 6; the stretch after it still starts where week 7 belongs
          </div>
        </div>
      </Row>

      <Row label="ticks land on round numbers, not on the range cut in equal parts">
        <div className="flex flex-col gap-1 font-mono text-xs text-dim">
          <div>range {bounds.min} to {bounds.max}</div>
          <div>ticks: {ticksFor(bounds, 4).join(', ')}</div>
          <div>range 0 to 37 -&gt; {ticksFor({ from: 0, to: 1, min: 0, max: 37 }, 4).join(', ')}</div>
          <div className="text-faint">equal parts would have given 9.25, 18.5, 27.75</div>
        </div>
      </Row>
    </>
  )
}

export function LineChartSection() {
  return (
    <>
      <Row label="a balance across a quarter - week six was never snapshotted, so the line breaks">
        <Panel className="w-112 p-5">
          <LineChart
            points={balancePoints}
            label="Balance, $4,900 to $5,260 across twelve weeks, one not measured"
            formatTick={money}
            footer={
              <>
                <span>1 Jul</span>
                <span>16 Sep</span>
              </>
            }
          />
        </Panel>
      </Row>

      <Row label="the same series with a zero floor - what a line loses when the axis starts at nothing">
        <Panel className="flex w-112 flex-col gap-2 p-5">
          <LineChart
            points={balancePoints}
            bounds={{ min: 0 }}
            label="The same balance, on a zero-based axis"
            formatTick={money}
          />
          <span className="text-xs text-dim">
            every movement flattened into one rule - right for a count, wrong for a level
          </span>
        </Panel>
      </Row>

      <Row label="sm, and the tones a caller who knows the direction can ask for">
        <Panel className="flex w-112 flex-col gap-4 p-5">
          <LineChart points={balancePoints} size="sm" tone="good" ticks={3} formatTick={money} label="Rising, in good" />
          <LineChart
            points={balancePoints.map((point) => ({ ...point, value: point.value === null ? null : 10_000 - point.value }))}
            size="sm"
            tone="bad"
            ticks={3}
            formatTick={money}
            label="The mirror of it, in bad"
          />
        </Panel>
      </Row>

      <Row label="nothing measured - a bare plot with its axis, never a flat line at zero">
        <Panel className="flex w-112 flex-col gap-2 p-5">
          <LineChart
            points={[0, 1, 2, 3].map((at) => ({ at, value: null }))}
            label="Nothing recorded this quarter"
          />
          <span className="text-xs text-dim">
            a line at zero would claim the balance was nil; this claims nothing
          </span>
        </Panel>
      </Row>
    </>
  )
}
