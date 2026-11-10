import { useState } from 'react'
import { Row } from '../row'
import { Slider } from '../../../registry/ui/slider'

export function SliderSection() {
  const [volume, setVolume] = useState(60)
  const [range, setRange] = useState<number[]>([20, 70])

  return (
    <>
      <Row label="one value">
        <div className="w-64">
          <Slider
            value={volume}
            onValueChange={(next) => setVolume(next as number)}
            aria-label="Volume"
          />
        </div>
      </Row>

      <Row label="with its value shown">
        <div className="w-64">
          <Slider
            value={volume}
            onValueChange={(next) => setVolume(next as number)}
            showValue
            aria-label="Volume"
          />
        </div>
      </Row>

      <Row label="a range - two thumbs, each with its own name">
        <div className="w-64">
          <Slider
            value={range}
            onValueChange={(next) => setRange(next as number[])}
            showValue
            aria-label="Price"
            getThumbLabel={(index) => (index === 0 ? 'Lowest price' : 'Highest price')}
          />
        </div>
      </Row>

      <Row label="disabled">
        <div className="w-64">
          <Slider defaultValue={40} disabled aria-label="Disabled" />
        </div>
      </Row>

      <Row label="vertical - its own row, because it is a head taller than a field">
        <Slider defaultValue={40} orientation="vertical" aria-label="Vertical" />
      </Row>
    </>
  )
}
