import { Row } from '../row'
import { Badge } from '../../../registry/ui/badge'
import { Sparkline } from '../../../registry/ui/sparkline'
import { Panel } from '../../../registry/ui/panel'

const scoreHistory = [18, 34, 30, 57, 71, 82]

export function SparklineSection() {
  return (
    <>
      <Row label="beside a total - the shape, with the figure it belongs to">
        <Panel className="flex flex-wrap items-center gap-3 p-4">
          <span className="font-mono text-2xl font-semibold tabular-nums">82.0</span>
          <Badge variant="accent">Clip</Badge>
          <Sparkline values={scoreHistory} max={100} label="Score, 18 to 82 over six versions" />
        </Panel>
      </Row>

      <Row label="sm, beside a row - a line per axis of a rubric">
        <Panel className="flex w-80 flex-col gap-2 p-4 text-sm">
          {[
            { axis: 'Craft', line: [3, 3, 4, 4], scale: 5, now: 4 },
            { axis: 'Voice', line: [2, 3, 3, 5], scale: 5, now: 5 },
            { axis: 'Shape', line: [4, 4, 3, 3], scale: 5, now: 3 },
          ].map(({ axis, line, scale, now }) => (
            <span key={axis} className="flex items-center justify-between gap-3">
              <span className="text-dim">{axis}</span>
              <span className="flex items-center gap-2">
                <Sparkline
                  values={line}
                  max={scale}
                  size="sm"
                  label={`${axis}, ${line[0]} to ${line.at(-1)} over four versions`}
                />
                <span className="w-6 text-right font-mono text-sm text-dim tabular-nums">{now}</span>
              </span>
            </span>
          ))}
        </Panel>
      </Row>

      <Row label="the same two values against a stated ceiling, and against their own range">
        <Panel className="flex flex-wrap items-center gap-6 p-4 text-sm">
          <span className="flex items-center gap-3">
            <Sparkline values={[61, 63]} max={100} label="Score, 61 to 63, against a ceiling of 100" />
            <span className="text-dim">
              <code className="text-xs">max=100</code> — the small change it was
            </span>
          </span>
          <span className="flex items-center gap-3">
            <Sparkline values={[61, 63]} label="Score, 61 to 63, scaled to its own range" />
            <span className="text-dim">
              no <code className="text-xs">max</code> — the same two numbers, read as a climb
            </span>
          </span>
        </Panel>
      </Row>

      <Row label="up and down are drawn identically - the line reports, it does not judge">
        <Panel className="flex flex-wrap items-center gap-6 p-4 text-sm">
          <span className="flex items-center gap-3">
            <Sparkline values={[20, 45, 70, 90]} max={100} label="Rising, 20 to 90" />
            <span className="text-dim">rising</span>
          </span>
          <span className="flex items-center gap-3">
            <Sparkline values={[90, 70, 45, 20]} max={100} label="Falling, 90 to 20" />
            <span className="text-dim">falling — and for time-to-answer this is the good news</span>
          </span>
        </Panel>
      </Row>

      <Row label="tone, for a caller who does know what the direction means">
        <Panel className="flex flex-wrap items-center gap-6 p-4 text-sm">
          <span className="flex items-center gap-3">
            <Sparkline values={[40, 55, 52, 78]} max={100} tone="accent" label="Accent, 40 to 78" />
            <span className="text-dim">accent — the line is the subject</span>
          </span>
          <span className="flex items-center gap-3">
            <Sparkline values={[40, 55, 52, 78]} max={100} tone="good" label="Good, 40 to 78" />
            <span className="text-dim">good</span>
          </span>
          <span className="flex items-center gap-3">
            <Sparkline values={[78, 52, 55, 40]} max={100} tone="bad" label="Bad, 78 to 40" />
            <span className="text-dim">bad</span>
          </span>
        </Panel>
      </Row>

      <Row label="fewer than two points draws nothing - there is no history to show">
        <Panel className="flex items-center gap-3 p-4 text-sm">
          <Sparkline values={[82]} max={100} label="One version only" />
          <span className="text-dim">one value, and nothing is drawn beside this text</span>
        </Panel>
      </Row>
    </>
  )
}
