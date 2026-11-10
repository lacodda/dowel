import { Row } from '../row'
import { Splash } from '../../../registry/ui/splash'
import { splashMark } from './shared'

export function SplashSection() {
  return (
    <>
      <Row label="opening - the sweep runs until there is something to draw">
        <div className="relative h-80 w-full overflow-hidden rounded-lg border border-line">
          <Splash
            className="absolute"
            mark={splashMark}
            name="kilna"
            tagline="From raw idea to shipped work."
            version="v0.74.0"
            status="Opening the workspace"
            tip="Ctrl+K finds anything."
          />
        </div>
      </Row>

      <Row label="waiting on a person - still, and without the two lines">
        <div className="relative h-64 w-full overflow-hidden rounded-lg border border-line">
          <Splash className="absolute" mark={splashMark} name="kilna" tagline="From raw idea to shipped work." version="v0.74.0" busy={false} />
        </div>
      </Row>
    </>
  )
}
