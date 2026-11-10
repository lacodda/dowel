import { Row } from '../row'
import { Alert } from '../../../registry/ui/alert'
import { Button } from '../../../registry/ui/button'

export function AlertSection() {
  return (
    <>
      <Row label="tones">
        <div className="flex w-full flex-col gap-2">
          <Alert>This profile has no axes yet, so nothing can be scored.</Alert>
          <Alert tone="good">Every version of this work has been reviewed.</Alert>
          <Alert tone="warn">Two releases are scheduled for the same slot.</Alert>
          <Alert tone="bad" role="alert">
            The last export failed and has not been retried.
          </Alert>
          <Alert tone="info">Scores from before August use the old six axes.</Alert>
        </div>
      </Row>

      <Row label="with a heading and something to do about it">
        <div className="w-full">
          <Alert
            tone="warn"
            title="This calendar is out of date"
            action={
              <Button size="sm" variant="ghost">
                Rebuild
              </Button>
            }
          >
            Four releases have moved since it was last built.
          </Alert>
        </div>
      </Row>
    </>
  )
}
