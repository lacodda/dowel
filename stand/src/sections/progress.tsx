import { useState } from 'react'
import { Row } from '../row'
import { Progress } from '../../../registry/ui/progress'
import { Button } from '../../../registry/ui/button'

export function ProgressSection() {
  const [value, setValue] = useState(35)

  return (
    <>
      <Row label="a known fraction - the number is shown because there is one">
        <div className="w-96">
          <Progress value={value} label="Uploading">
            Uploading
          </Progress>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setValue((v) => Math.min(100, v + 15))}>
          Advance
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setValue(35)}>
          Reset
        </Button>
      </Row>

      <Row label="not known - it says so, rather than creeping to 90% and waiting">
        <div className="w-96">
          <Progress label="Working">Working</Progress>
        </div>
      </Row>

      <Row label="the tones, and the thin size for a bar under something else">
        <div className="flex w-96 flex-col gap-3">
          <Progress value={70} tone="good" size="sm" label="Good" />
          <Progress value={45} tone="warn" size="sm" label="Warn" />
          <Progress value={20} tone="bad" size="sm" label="Bad" />
        </div>
      </Row>
    </>
  )
}
