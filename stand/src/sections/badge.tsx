import { Row } from '../row'
import { Badge } from '../../../registry/ui/badge'

export function BadgeSection() {
  return (
    <>
      <Row label="variants">
        <Badge>Draft</Badge>
        <Badge variant="soft">Queued</Badge>
        <Badge variant="accent">Selected</Badge>
      </Row>

      <Row label="status - always with a word, never colour alone">
        <Badge variant="good">Passed</Badge>
        <Badge variant="warn">Slow</Badge>
        <Badge variant="bad">Failed</Badge>
        <Badge variant="info">Skipped</Badge>
      </Row>
    </>
  )
}
