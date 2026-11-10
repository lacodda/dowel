import { useState } from 'react'
import { Row } from '../row'
import { ErrorBoundary } from '../../../registry/ui/error-boundary'
import { Button } from '../../../registry/ui/button'

const boundaryLabels = {
  title: 'Something went wrong',
  body: 'This part of the screen could not be drawn.',
  details: 'Details',
  retry: 'Try again',
}

function Thrower({ failing }: { failing: boolean }) {
  if (failing) throw new Error('A component below this one threw while rendering.')
  return <p className="text-sm text-dim">Nothing is wrong here.</p>
}

export function ErrorBoundarySection() {
  const [failing, setFailing] = useState(false)
  /* The key is what clears a caught error. Bumping it is what a router does on
   * navigation - and without it the screen would stay crashed after the cause
   * is gone. */
  const [attempt, setAttempt] = useState(0)

  return (
    <>
      <Row label="break it, then let it recover - retry inside, or a changed key from outside">
        <Button variant="ghost" size="sm" onClick={() => setFailing((f) => !f)}>
          {failing ? 'Stop throwing' : 'Throw'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setAttempt((a) => a + 1)}>
          Change the reset key
        </Button>
      </Row>

      <Row label="the default screen: the message is kept, folded, for whoever files it">
        <div className="w-full">
          <ErrorBoundary labels={boundaryLabels} resetKey={attempt}>
            <Thrower failing={failing} />
          </ErrorBoundary>
        </div>
      </Row>
    </>
  )
}
