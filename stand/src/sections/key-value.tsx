import { Row } from '../row'
import { Badge } from '../../../registry/ui/badge'
import { NumberFormat } from '../../../registry/ui/number-format'
import { RelativeTime } from '../../../registry/ui/relative-time'
import { KeyValue, KeyValueRow } from '../../../registry/ui/key-value'
import { standNow } from '../clock'

export function KeyValueSection() {
  return (
    <>
      <Row label="names in a column, values beside them - for a panel of properties">
        <KeyValue className="w-80">
          <KeyValueRow label="Title">Harbour lights</KeyValueRow>
          <KeyValueRow label="Owner">Ines</KeyValueRow>
          <KeyValueRow label="Words">
            <NumberFormat value={4120} />
          </KeyValueRow>
          <KeyValueRow label="Updated">
            <RelativeTime value="2026-09-09T09:40:00Z" now={standNow} />
          </KeyValueRow>
          <KeyValueRow label="Status">
            <Badge variant="info">In review</Badge>
          </KeyValueRow>
        </KeyValue>
      </Row>

      <Row label="name above value - for a card, and for a column too narrow to pair">
        <KeyValue layout="stacked" className="w-48">
          <KeyValueRow label="Title">Harbour lights</KeyValueRow>
          <KeyValueRow label="Owner">Ines</KeyValueRow>
          <KeyValueRow label="Words">
            <NumberFormat value={4120} />
          </KeyValueRow>
        </KeyValue>
      </Row>
    </>
  )
}
