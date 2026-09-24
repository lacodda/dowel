import { useState } from 'react'
import { Button } from '../../../registry/ui/button'
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '../../../registry/ui/dialog'
import { Field } from '../../../registry/ui/field'
import { Input } from '../../../registry/ui/input'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '../../../registry/ui/select'
import { Textarea } from '../../../registry/ui/textarea'
import { Row } from '../row'
import { TrashIcon, XIcon } from './icons'

const KINDS = ['Image style', 'Pose', 'Palette', 'Lighting', 'Camera', 'Texture']

/** The fields of an editor longer than a laptop window is tall: the shape
 * that pushed kilna's "Save" 137px off the bottom edge. */
const FIELDS = [
  'Name',
  'Short name',
  'Prompt fragment',
  'Negative fragment',
  'Weight',
  'Seed',
  'Aspect',
  'Source',
  'Licence',
  'Notes for the next pass',
]

function StyleEditor() {
  const [kind, setKind] = useState<string | null>('Image style')

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="primary" />}>Edit the style</DialogTrigger>
      <DialogPopup size="xl">
        <DialogHeader
          action={
            <DialogClose render={<Button variant="icon" size="icon-sm" aria-label="Close" />}>
              <XIcon />
            </DialogClose>
          }
        >
          <DialogTitle>Edit the style</DialogTitle>
          <DialogDescription>What the image is made of, and what it is not.</DialogDescription>
        </DialogHeader>
        <DialogBody data-probe="dialog-body">
          <div className="grid grid-cols-2 gap-3 pb-1">
            <Field label="Kind">
              <Select value={kind} onValueChange={(value) => setKind(value as string)}>
                <SelectTrigger aria-label="Kind" data-probe="dialog-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {KINDS.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </Field>
            {FIELDS.map((label) => (
              <Field key={label} label={label}>
                <Input />
              </Field>
            ))}
            <div className="col-span-2">
              <Field label="Description">
                <Textarea rows={6} />
              </Field>
            </div>
          </div>
        </DialogBody>
        <DialogActions
          data-probe="dialog-actions"
          start={
            <Button variant="danger" size="sm">
              <TrashIcon />
              Delete
            </Button>
          }
        >
          <Button render={<DialogClose />}>Cancel</Button>
          <Button variant="primary" render={<DialogClose />}>
            Save
          </Button>
        </DialogActions>
      </DialogPopup>
    </Dialog>
  )
}

export function DialogSection() {
  return (
    <>
      <Row label="a question - a header and the answers">
        <Dialog>
          <DialogTrigger render={<Button variant="primary" />}>Delete the draft</DialogTrigger>
          <DialogPopup>
            <DialogHeader>
              <DialogTitle>Delete the draft?</DialogTitle>
              <DialogDescription>The version stays in the history. Only this draft goes.</DialogDescription>
            </DialogHeader>
            <DialogActions>
              <Button render={<DialogClose />}>Cancel</Button>
              <Button variant="danger" render={<DialogClose />}>
                Delete
              </Button>
            </DialogActions>
          </DialogPopup>
        </Dialog>
      </Row>

      <Row label="an editor taller than the window - only the body scrolls, the actions stay; the select opens above the dialog">
        <StyleEditor />
      </Row>

      <Row label="full - the window less a margin">
        <Dialog>
          <DialogTrigger render={<Button variant="ghost" />}>Preview the release</DialogTrigger>
          <DialogPopup size="full">
            <DialogHeader
              action={
                <DialogClose render={<Button variant="icon" size="icon-sm" aria-label="Close" />}>
                  <XIcon />
                </DialogClose>
              }
            >
              <DialogTitle>Harbour lights</DialogTitle>
              <DialogDescription>How it goes out on Friday.</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <div className="grid h-full place-items-center rounded-lg border border-dashed border-line text-sm text-dim">
                The preview fills what the header and the actions leave.
              </div>
            </DialogBody>
            <DialogActions>
              <Button render={<DialogClose />}>Close</Button>
            </DialogActions>
          </DialogPopup>
        </Dialog>
      </Row>
    </>
  )
}
