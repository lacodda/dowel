import { AboutPlate } from '../../../registry/ui/about-plate'
import { Row } from '../row'

export function AboutPlateSection() {
  return (
    <Row label="two products' plates - the same shape, each in its own mark">
      <div className="grid w-full gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-bg p-6">
          <AboutPlate
            product="nitid"
            name="nitid"
            version="v0.34.0"
            tagline="A fast image viewer with honest colour and HDR."
            lineLabel="Part of the lacodda line"
            lineHref="https://github.com/lacodda"
          />
        </div>
        <div className="rounded-lg border border-line bg-bg p-6">
          <AboutPlate
            product="scheda"
            name="scheda"
            version="v0.10.0"
            tagline="A markdown notepad that turns into a vault when there is a folder around it."
            lineLabel="Part of the lacodda line"
          >
            <span>MIT licence</span>
            <span className="font-mono">build 4f2a91c</span>
          </AboutPlate>
        </div>
      </div>
    </Row>
  )
}
