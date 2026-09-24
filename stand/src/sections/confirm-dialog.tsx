import { Button } from '../../../registry/ui/button'
import {
  ConfirmDialog,
  ConfirmDialogActions,
  ConfirmDialogBody,
  ConfirmDialogClose,
  ConfirmDialogDescription,
  ConfirmDialogHeader,
  ConfirmDialogPopup,
  ConfirmDialogTitle,
  ConfirmDialogTrigger,
} from '../../../registry/ui/confirm-dialog'
import { Row } from '../row'

const TAKEN = [
  'Harbour lights - 3 versions, 2 releases',
  'The quiet mile - 1 version',
  'Ash and after - 5 versions, 4 releases',
  'Nine of cups - 2 versions',
  'Undertow - 4 versions, 1 release',
  'Ember street - 1 version',
]

export function ConfirmDialogSection() {
  return (
    <>
      <Row label="click to open - clicking away will not dismiss it">
        <ConfirmDialog>
          <ConfirmDialogTrigger render={<Button variant="danger" />}>Revoke the key</ConfirmDialogTrigger>
          <ConfirmDialogPopup>
            <ConfirmDialogHeader>
              <ConfirmDialogTitle>Revoke the key?</ConfirmDialogTitle>
              <ConfirmDialogDescription>
                Every machine using it loses access at once. This cannot be undone.
              </ConfirmDialogDescription>
            </ConfirmDialogHeader>
            <ConfirmDialogActions>
              <Button render={<ConfirmDialogClose />}>Keep it</Button>
              <Button variant="danger" render={<ConfirmDialogClose />}>
                Revoke
              </Button>
            </ConfirmDialogActions>
          </ConfirmDialogPopup>
        </ConfirmDialog>
      </Row>

      <Row label="what it takes with it, in a body that scrolls if the list runs long">
        <ConfirmDialog>
          <ConfirmDialogTrigger render={<Button variant="danger" />}>Delete the collection</ConfirmDialogTrigger>
          <ConfirmDialogPopup>
            <ConfirmDialogHeader>
              <ConfirmDialogTitle>Delete the collection?</ConfirmDialogTitle>
              <ConfirmDialogDescription>These six works go to the trash with it.</ConfirmDialogDescription>
            </ConfirmDialogHeader>
            <ConfirmDialogBody>
              <ul className="flex flex-col gap-1 text-sm text-dim">
                {TAKEN.map((work) => (
                  <li key={work}>{work}</li>
                ))}
              </ul>
            </ConfirmDialogBody>
            <ConfirmDialogActions>
              <Button render={<ConfirmDialogClose />}>Keep it</Button>
              <Button variant="danger" render={<ConfirmDialogClose />}>
                Delete
              </Button>
            </ConfirmDialogActions>
          </ConfirmDialogPopup>
        </ConfirmDialog>
      </Row>
    </>
  )
}
