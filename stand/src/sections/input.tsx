import { Row } from '../row'
import { Input } from '../../../registry/ui/input'

export function InputSection() {
  return (
    <>
      <Row label="states">
        <Input aria-label="Empty" placeholder="Empty" />
        <Input aria-label="With a value" defaultValue="With a value" />
        <Input aria-label="Disabled" disabled defaultValue="Disabled" />
        <Input aria-label="Invalid" aria-invalid defaultValue="Invalid" />
      </Row>

      <Row label="types">
        <Input aria-label="Email" type="email" placeholder="you@example.com" />
        <Input aria-label="Password" type="password" defaultValue="secret" />
        <Input aria-label="Count" type="number" defaultValue={42} />
      </Row>
    </>
  )
}
