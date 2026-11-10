import { Row } from '../row'
import { Textarea } from '../../../registry/ui/textarea'

export function TextareaSection() {
  return (
    <>
      <Row label="fixed">
        <Textarea placeholder="Resizable by hand" rows={2} />
      </Row>

      <Row label="grows with the content, up to six rows">
        <Textarea
          autoResize
          maxRows={6}
          placeholder="Type several lines and watch it grow, then keep going and watch it stop."
        />
      </Row>
    </>
  )
}
