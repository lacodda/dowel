import { Row } from '../row'
import { Truncate } from '../../../registry/ui/truncate'

export function TruncateSection() {
  return (
    <>
      <Row label="one line - hover to see the rest">
        <div className="w-64">
          <Truncate>
            A path that is far too long to fit in the space it has been given, as paths tend to be
          </Truncate>
        </div>
      </Row>

      <Row label="two lines">
        <div className="w-64">
          <Truncate lines={2}>
            A description long enough to need two lines and then some more, which is where the
            clamp comes in and quietly stops it
          </Truncate>
        </div>
      </Row>
    </>
  )
}
