import { Row } from '../row'
import { StatRow, StatTile } from '../../../registry/ui/stat-tile'
import { Panel } from '../../../registry/ui/panel'

/** A triangle for a figure that is a problem. Inlined rather than pulled from
 * an icon set: the stand shows what a product would pass, and a product passes
 * its own. */
function WarningMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M8 2.5 14.5 13.5h-13L8 2.5Z" strokeLinejoin="round" />
      <path d="M8 6.5v3.2" strokeLinecap="round" />
      <path d="M8 11.8h.01" strokeLinecap="round" />
    </svg>
  )
}

export function StatTileSection() {
  return (
    <>
      <Row label="a row of figures, one of them the panel's own">
        <Panel className="p-5">
          <StatRow>
            <StatTile label="Worked" value="32h 10m" tone="accent" />
            <StatTile label="Paused" value="3h 04m" />
            <StatTile label="Days recorded" value="5" />
          </StatRow>
        </Panel>
      </Row>

      <Row label="movement underneath, and its tone said rather than read off the sign">
        <Panel className="p-5">
          <StatRow>
            <StatTile
              label="Worked"
              value="32h 10m"
              tone="accent"
              delta="+2h 40m vs last week"
              deltaTone="good"
            />
            {/* Down is the good direction here, which no component could guess. */}
            <StatTile
              label="Time to answer"
              value="2m 10s"
              delta="-30s vs last week"
              deltaTone="good"
            />
            <StatTile
              label="Silent"
              value="3"
              tone="warn"
              icon={<WarningMark />}
              delta="1 more than yesterday"
              deltaTone="bad"
            />
          </StatRow>
        </Panel>
      </Row>

      <Row label="a figure that is itself the problem - and why the mark is required">
        <Panel className="p-5">
          <StatRow>
            {/* The accented tile and the warning one, side by side. This
                product's accent is close enough to the warning hue that the
                colour alone does not separate them - which is the whole reason
                the type will not let a judgement be drawn without a mark. */}
            <StatTile label="Worked" value="219h" tone="accent" />
            <StatTile label="Queue" value="128" tone="warn" icon={<WarningMark />} />
            <StatTile label="Failed" value="4" tone="bad" icon={<WarningMark />} />
          </StatRow>
        </Panel>
      </Row>

      <Row label="lg, for a figure that leads a page rather than sitting in a row of six">
        <Panel className="p-5">
          <StatTile label="Recorded this month" value="147h 26m" tone="accent" size="lg" delta="+9h vs August" deltaTone="good" />
        </Panel>
      </Row>

      <Row label="a delta of zero is drawn - it says the figure was measured and did not move">
        <Panel className="p-5">
          <StatRow>
            {/* The point of the example is that `0` survives: a truthiness
                guard would swallow it and the line would vanish, which reads
                as "not measured" rather than "did not move". So the delta has
                to say that in words - a bare `0` under the figure demonstrates
                nothing, and looks like a stray digit. */}
            <StatTile label="Open days" value="0" delta="0 change from last week" />
            {/* And the bare numeric zero, which is what the guard in the
                component is actually about: `{delta && …}` would drop this
                line entirely. */}
            <StatTile label="Reopened" value="2" delta={0} />
            {/* Nothing to compare against, so nothing is said at all. Put
                beside it, because the pair is the demonstration: one tile has
                a second line, the other has none. */}
            <StatTile label="People" value="14" />
          </StatRow>
        </Panel>
      </Row>
    </>
  )
}
