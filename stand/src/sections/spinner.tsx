import { Row } from '../row'
import { Button } from '../../../registry/ui/button'
import { Spinner } from '../../../registry/ui/spinner'

export function SpinnerSection() {
  return (
    <>
      <Row label="sizes">
        <Spinner size="sm" label="Loading" />
        <Spinner size="md" label="Loading" />
        <Spinner size="lg" label="Loading" />
      </Row>

      <Row label="tones, and beside something">
        <Spinner tone="dim" label="Loading" />
        <Spinner tone="accent" label="Loading" />
        <Button variant="ghost" disabled>
          <Spinner size="sm" label="Saving" />
          Saving
        </Button>
      </Row>
    </>
  )
}
