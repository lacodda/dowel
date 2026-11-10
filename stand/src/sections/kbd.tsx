import { Row } from '../row'
import { Kbd } from '../../../registry/ui/kbd'

export function KbdSection() {
  return (
    <>
      <Row label="shortcuts, written the way this platform writes them">
        <Kbd keys="Mod+K" />
        <Kbd keys="Mod+Shift+P" />
        <Kbd keys="Escape" />
      </Row>

      <Row label="a sequence - G, then D">
        <Kbd keys="G D" />
        <Kbd keys="G C" />
      </Row>

      <Row label="single keys">
        <Kbd>K</Kbd>
        <Kbd keys="Enter" />
        <Kbd keys="ArrowUp" />
        <Kbd keys="ArrowDown" />
        <Kbd keys="?" />
      </Row>
    </>
  )
}
