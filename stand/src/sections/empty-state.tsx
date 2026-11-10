import { Row } from '../row'
import { EmptyState } from '../../../registry/ui/empty-state'
import { Button } from '../../../registry/ui/button'
import { Panel } from '../../../registry/ui/panel'

export function EmptyStateSection() {
  return (
    <>
      <Row label="nothing here yet, and the one thing worth doing about it">
        <EmptyState
          className="w-96"
          title="No works yet"
          body="Everything you start will show up here."
          action={<Button variant="primary">New work</Button>}
        />
      </Row>

      <Row label="plenty here, none of it matching - the way out is a wider filter">
        <EmptyState
          className="w-96"
          variant="filtered"
          title="Nothing matches"
          body="Three filters are on. Clearing the tier would show 42 works."
          action={<Button variant="ghost">Clear filters</Button>}
        />
      </Row>

      <Row label="nothing is missing - something failed, and the way out is to retry">
        <EmptyState
          className="w-96"
          variant="error"
          title="Could not load"
          body="The server did not answer."
          action={<Button variant="ghost">Try again</Button>}
        />
      </Row>

      <Row label="plain - no frame, no mark, for something that already has one - a panel in a widget">
        <Panel className="w-72 p-4">
          <EmptyState
            plain
            title="No works yet"
            body="Everything you start will show up here."
            action={
              <Button size="sm" variant="primary">
                New work
              </Button>
            }
          />
        </Panel>
        <Panel className="w-72 p-4">
          <EmptyState
            plain
            variant="filtered"
            title="Nothing matches"
            body="Clearing the tier would show 42 works."
            action={<Button size="sm">Clear filters</Button>}
          />
        </Panel>
        <Panel className="w-72 p-4">
          <EmptyState
            plain
            variant="error"
            title="Could not load"
            body="The server did not answer."
            action={<Button size="sm">Try again</Button>}
          />
        </Panel>
      </Row>
    </>
  )
}
