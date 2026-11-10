import { Row } from '../row'
import { StatusBadge, StatusDot } from '../../../registry/ui/status-dot'

export function StatusDotSection() {
  const tick = (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3.5 8.5l3 3 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  const cross = (
    <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  )

  return (
    <>
      <Row label="the dot alone - the word is still there, for a reader who does not see the colour">
        <StatusDot status="good" label="Online" />
        <StatusDot status="warn" label="Degraded" />
        <StatusDot status="bad" label="Down" />
        <StatusDot status="info" label="Syncing" />
        <StatusDot status="neutral" label="Unknown" />
      </Row>

      <Row label="with the word printed, which is the better answer when there is room">
        <StatusDot status="good" label="Online" showLabel />
        <StatusDot status="warn" label="Degraded" showLabel />
        <StatusDot status="bad" label="Down" showLabel />
        <StatusDot status="neutral" label="Unknown" showLabel />
      </Row>

      <Row label="a shape instead of the dot - the second channel">
        <StatusDot status="good" label="Passed" icon={tick} showLabel />
        <StatusDot status="bad" label="Failed" icon={cross} showLabel />
      </Row>

      <Row label="sizes">
        <StatusDot status="good" label="Online" size="sm" showLabel />
        <StatusDot status="good" label="Online" size="md" showLabel />
        <StatusDot status="good" label="Online" size="lg" showLabel />
      </Row>

      <Row label="the badge, when the state deserves the words">
        <StatusBadge status="good">Passed</StatusBadge>
        <StatusBadge status="warn">Flaky</StatusBadge>
        <StatusBadge status="bad">Failed</StatusBadge>
        <StatusBadge status="info">Queued</StatusBadge>
        <StatusBadge status="neutral">Skipped</StatusBadge>
      </Row>

      <Row label="a badge carrying a shape rather than a second dot">
        <StatusBadge status="good" icon={tick}>
          Passed
        </StatusBadge>
        <StatusBadge status="bad" icon={cross}>
          Failed
        </StatusBadge>
      </Row>
    </>
  )
}
