import { Timeline, TimelineItem } from '../../../registry/ui/timeline'

export function TimelineSection() {
  const tick = (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M3.5 8.5l3 3 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  const cross = (
    <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  )

  return (
    <>
      <div className="mb-4">
        <div className="mb-2 text-2xs uppercase tracking-caption text-dim">
          a history - the rail stops at the last entry rather than trailing off
        </div>
        <div className="rounded-lg border border-line bg-raise p-4">
          <Timeline>
            <TimelineItem title="Opened" time="3 days ago" status="neutral">
              by Ines Almeida
            </TimelineItem>
            <TimelineItem title="Review requested" time="2 days ago" status="info" statusLabel="Waiting">
              Ravi Chandrasekaran, Kit Brennan
            </TimelineItem>
            <TimelineItem title="Checks passed" time="yesterday" status="good" statusLabel="Succeeded" icon={tick}>
              2,621 tests in 81 seconds
            </TimelineItem>
            <TimelineItem title="Deploy failed" time="an hour ago" status="bad" statusLabel="Failed" icon={cross} last>
              Rolled back after the health check
            </TimelineItem>
          </Timeline>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-2 text-2xs uppercase tracking-caption text-dim">
          steps, with the ones not taken yet drawn as empty rings
        </div>
        <div className="rounded-lg border border-line bg-raise p-4">
          <Timeline>
            <TimelineItem title="Written" status="good" statusLabel="Done" icon={tick} />
            <TimelineItem title="Reviewed" status="good" statusLabel="Done" icon={tick} />
            <TimelineItem title="Mixed" status="accent" statusLabel="In progress" />
            <TimelineItem title="Mastered" pending />
            <TimelineItem title="Published" pending last />
          </Timeline>
        </div>
      </div>
    </>
  )
}
