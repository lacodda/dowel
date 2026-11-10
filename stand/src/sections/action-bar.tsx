import { Row } from '../row'
import {
  ActionBar,
  ActionBarButton,
  ActionBarGroup,
  ActionBarSeparator,
  ActionBarSpacer,
} from '../../../registry/ui/action-bar'
import { Button } from '../../../registry/ui/button'

export function ActionBarSection() {
  return (
    <>
      <Row label="at the foot of a form">
        <div className="w-full rounded-md border border-line">
          <div className="p-4 text-sm text-dim">A form, and its actions below it.</div>
          <ActionBar
            position="static"
            aria-label="Form actions"
            className="border-t border-line px-4 py-3"
          >
            <ActionBarButton render={<Button variant="primary">Save</Button>} />
            <ActionBarButton render={<Button variant="ghost">Cancel</Button>} />
            <ActionBarSpacer />
            <ActionBarButton render={<Button variant="danger">Delete</Button>} />
          </ActionBar>
        </div>
      </Row>

      <Row label="groups, separated">
        <div className="w-full rounded-md border border-line px-4 py-3">
          <ActionBar aria-label="Editor">
            <ActionBarGroup>
              <ActionBarButton
                render={
                  <Button variant="ghost" size="sm">
                    Bold
                  </Button>
                }
              />
              <ActionBarButton
                render={
                  <Button variant="ghost" size="sm">
                    Italic
                  </Button>
                }
              />
            </ActionBarGroup>
            <ActionBarSeparator />
            <ActionBarGroup>
              <ActionBarButton
                render={
                  <Button variant="ghost" size="sm">
                    Link
                  </Button>
                }
              />
              <ActionBarButton
                render={
                  <Button variant="ghost" size="sm">
                    Quote
                  </Button>
                }
              />
            </ActionBarGroup>
          </ActionBar>
        </div>
      </Row>
    </>
  )
}
