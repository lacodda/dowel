import { useState } from 'react'
import { Row } from '../row'
import { RatingScale } from '../../../registry/ui/rating-scale'

export function RatingScaleSection() {
  const [score, setScore] = useState<number | undefined>(3)
  const [unjudged, setUnjudged] = useState<number | undefined>(undefined)

  return (
    <>
      <Row label="scored - click the filled mark again to clear it">
        <div className="w-64">
          <RatingScale
            scale={5}
            value={score}
            onValueChange={setScore}
            label="Difficulty"
            emptyLabel="Not judged"
          />
        </div>
      </Row>

      <Row label="not judged yet, which is a state and not a zero">
        <div className="w-64">
          <RatingScale
            scale={5}
            value={unjudged}
            onValueChange={setUnjudged}
            label="Polish"
            emptyLabel="Not judged"
          />
        </div>
      </Row>

      <Row label="a longer scale, and one that cannot be changed">
        <div className="w-64">
          <RatingScale
            scale={10}
            value={7}
            onValueChange={() => {}}
            label="Ten"
            emptyLabel="Not judged"
          />
        </div>
        <div className="w-40">
          <RatingScale
            scale={5}
            value={2}
            onValueChange={() => {}}
            label="Disabled"
            emptyLabel="Not judged"
            disabled
          />
        </div>
      </Row>
    </>
  )
}
