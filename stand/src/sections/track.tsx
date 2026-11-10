import { Row } from '../row'
import { Track, TrackScale } from '../../../registry/ui/track'
import { markerAt, place } from '../../../registry/ui/track-segments'
import { Panel } from '../../../registry/ui/panel'

/* A history that actually travels. The first draft of this example ran
 * 61 → 82 against a ceiling of 100, which occupies a fifth of the box: it made
 * the point of the row below - "against a stated ceiling, a small change stays
 * small" - twice, and the row above it demonstrated nothing. */
/* A day in minutes from its own start: 3h, a 45m break, 4h15m. */
const workingDay = [
  { key: 'am', start: 0, end: 180, tone: 'accent' as const, label: 'Worked · 3h' },
  { key: 'lunch', start: 180, end: 225, tone: 'idle' as const, label: 'Break · 45m' },
  { key: 'pm', start: 225, end: 465, tone: 'accent' as const, label: 'Worked · 4h' },
  { key: 'tea', start: 465, end: 474, tone: 'idle' as const, label: 'Break · 9m' },
  { key: 'late', start: 474, end: 480, tone: 'accent' as const, label: 'Worked · 6m' },
]

const tiers = [
  { key: 'draft', label: 'Draft', min: 0 },
  { key: 'keep', label: 'Keep', min: 40 },
  { key: 'good', label: 'Good', min: 62 },
  { key: 'clip', label: 'Clip', min: 78 },
]

function tierSegments(score: number) {
  return tiers.map((tier, index) => {
    const next = tiers[index + 1]?.min ?? 100
    const reached = score >= tier.min
    const standing = reached && score < next
    return {
      key: tier.key,
      start: tier.min,
      end: next,
      tone: standing ? ('accent' as const) : reached ? ('past' as const) : ('idle' as const),
      label: `${tier.label} · ${tier.min}+`,
    }
  })
}

export function TrackSegmentsSection() {
  /* The two things the arithmetic does that are worth seeing as numbers: it
   * widens a sliver to the floor, and it refuses to widen one over the next. */
  const day = [
    { start: 0, end: 239 },
    { start: 239, end: 239.2 },
    { start: 239.2, end: 480 },
  ]
  const toScale = place(day, { from: 0, to: 480, minWidth: 0 })
  const floored = place(day, { from: 0, to: 480 })

  const crowded = [
    { start: 1000, end: 1001 },
    { start: 1003, end: 1004 },
  ]
  const placedCrowded = place(crowded, { from: 0, to: 10_000 })

  const show = (list: ReturnType<typeof place>) =>
    list.map((p) => `left ${p.left.toFixed(2)}%  width ${p.width.toFixed(2)}%${p.widened ? '  widened' : ''}`)

  return (
    <>
      <Row label="no markup - a twelve-second break, to scale and with the floor">
        <div className="flex flex-wrap gap-8">
          {[
            ['exactly to scale', show(toScale)],
            ['with the floor', show(floored)],
          ].map(([label, list]) => (
            <div key={label as string} className="flex flex-col gap-1">
              <div className="text-2xs uppercase tracking-caption text-dim">{label}</div>
              {(list as string[]).map((line) => (
                <div key={line} className="font-mono text-xs text-dim">
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Row>

      <Row label="two slivers three units apart - the floor is held back, so they cannot overlap">
        <div className="flex flex-col gap-1">
          {show(placedCrowded).map((line) => (
            <div key={line} className="font-mono text-xs text-dim">
              {line}
            </div>
          ))}
          <div className="font-mono text-xs text-faint">
            first ends at {(placedCrowded[0]!.left + placedCrowded[0]!.width).toFixed(2)}%, second starts at{' '}
            {placedCrowded[1]!.left.toFixed(2)}%
          </div>
        </div>
      </Row>

      <Row label="a marker outside the track is absent, not pinned to the edge">
        <div className="flex flex-col gap-1 font-mono text-xs text-dim">
          <div>markerAt(78, 0, 100) = {String(markerAt(78, 0, 100))}</div>
          <div>markerAt(240, 0, 480) = {String(markerAt(240, 0, 480))}</div>
          <div>markerAt(120, 0, 100) = {String(markerAt(120, 0, 100))}</div>
        </div>
      </Row>
    </>
  )
}

export function TrackSection() {
  return (
    <>
      <Row label="spans - a working day, read against itself">
        <Panel className="flex w-96 flex-col gap-2 p-4">
          <Track segments={workingDay} from={0} to={480} label="Worked 7h 6m, two breaks of 45m and 9m" />
          <span className="font-mono text-xs text-faint tabular-nums">08:12 - 16:12</span>
        </Panel>
      </Row>

      <Row label="a twelve-second break: to scale it is 0.04% and invisible, with the floor it is 0.6%">
        <Panel className="flex w-96 flex-col gap-2 p-4 text-sm">
          <Track
            segments={[
              { key: 'am', start: 0, end: 239, tone: 'accent', label: 'Worked' },
              { key: 'blink', start: 239, end: 239.2, tone: 'idle', label: 'Break · 12s' },
              { key: 'pm', start: 239.2, end: 480, tone: 'accent', label: 'Worked' },
            ]}
            from={0}
            to={480}
            minWidth={0}
            label="A twelve-second break, drawn exactly to scale"
          />
          <span className="text-dim">
            to scale - the break is 0.04% of the day, which rounds to no pixels at all
          </span>
          <Track
            segments={[
              { key: 'am', start: 0, end: 239, tone: 'accent', label: 'Worked' },
              { key: 'blink', start: 239, end: 239.2, tone: 'idle', label: 'Break · 12s' },
              { key: 'pm', start: 239.2, end: 480, tone: 'accent', label: 'Worked' },
            ]}
            from={0}
            to={480}
            label="A twelve-second break, widened to stay visible"
          />
          <span className="text-dim">
            with the floor - the sliver is drawn at 0.6% and pushes the rest of the day along; the
            bar still ends exactly at its own edge
          </span>
        </Panel>
      </Row>

      <Row label="thresholds - the tiers, with the score standing among them">
        <Panel className="flex w-96 flex-col gap-4 p-4">
          {[71, 82, 24].map((score) => (
            <span key={score} className="flex flex-col gap-1">
              <span className="flex items-baseline justify-between">
                <span className="font-mono text-sm tabular-nums">{score.toFixed(1)}</span>
                <span className="text-xs text-dim">
                  {score >= 78 ? 'Clip' : score >= 62 ? 'Good' : score >= 40 ? 'Keep' : 'Draft'}
                </span>
              </span>
              <Track
                segments={tierSegments(score)}
                from={0}
                to={100}
                marker={score}
                size="sm"
                divided
                label={`Score ${score}, among four tiers`}
              />
              <TrackScale>
                {tiers.map((tier) => (
                  <span key={tier.key}>{tier.label}</span>
                ))}
              </TrackScale>
            </span>
          ))}
        </Panel>
      </Row>

      <Row label="an empty track is a bar with nothing in it - not an absent bar">
        <Panel className="flex w-96 flex-col gap-2 p-4 text-sm">
          <Track segments={[]} label="Nothing recorded for this day" />
          <span className="text-dim">
            nothing recorded - an absent bar would read as "no such day" rather than "nothing in it"
          </span>
        </Panel>
      </Row>
    </>
  )
}
