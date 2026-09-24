import { useState } from 'react'
import { Button } from '../../../registry/ui/button'
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogClose,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '../../../registry/ui/dialog'
import { Popover, PopoverPopup, PopoverTitle, PopoverTrigger } from '../../../registry/ui/popover'
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '../../../registry/ui/select'
import { Tooltip, TooltipPopup, TooltipProvider, TooltipTrigger } from '../../../registry/ui/tooltip'
import { Row } from '../row'

const STATUSES = ['Draft', 'In review', 'Scheduled', 'Released', 'Archived']

function StatusSelect({ probe }: { probe: string }) {
  const [status, setStatus] = useState<string | null>('Draft')
  return (
    <Select value={status} onValueChange={(value) => setStatus(value as string)}>
      <SelectTrigger className="w-40" aria-label="Status" data-probe={probe}>
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        {STATUSES.map((name) => (
          <SelectItem key={name} value={name}>
            {name}
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

export function LayerSection() {
  return (
    <>
      <Row label="a select in a dialog - it opens above the dialog, and is not clipped by the body">
        <Dialog>
          <DialogTrigger render={<Button variant="ghost" />}>Change the status</DialogTrigger>
          <DialogPopup size="sm">
            <DialogHeader>
              <DialogTitle>Change the status</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <StatusSelect probe="layer-dialog-select" />
            </DialogBody>
            <DialogActions>
              <Button render={<DialogClose />}>Done</Button>
            </DialogActions>
          </DialogPopup>
        </Dialog>
      </Row>

      <Row label="a select in a popover - a layer inside the page, one rung above the popover">
        <Popover>
          <PopoverTrigger render={<Button variant="ghost" />}>Filter</PopoverTrigger>
          <PopoverPopup size="sm">
            <PopoverTitle>Filter by status</PopoverTitle>
            <div className="mt-2">
              <StatusSelect probe="layer-popover-select" />
            </div>
          </PopoverPopup>
        </Popover>
      </Row>

      <Row label="a popover in a dialog, and a select in that - a layer inside a layer">
        <Dialog>
          <DialogTrigger render={<Button variant="ghost" />}>Schedule the release</DialogTrigger>
          <DialogPopup size="sm">
            <DialogHeader>
              <DialogTitle>Schedule the release</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <TooltipProvider>
                <Popover>
                  <PopoverTrigger render={<Button variant="ghost" data-probe="layer-nested-popover" />}>
                    Options
                  </PopoverTrigger>
                  <PopoverPopup size="sm">
                    <PopoverTitle>Options</PopoverTitle>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusSelect probe="layer-nested-select" />
                      <Tooltip>
                        <TooltipTrigger render={<Button variant="icon" size="icon-sm" aria-label="About" />}>
                          ?
                        </TooltipTrigger>
                        <TooltipPopup>Where the release lands on the calendar.</TooltipPopup>
                      </Tooltip>
                    </div>
                  </PopoverPopup>
                </Popover>
              </TooltipProvider>
            </DialogBody>
            <DialogActions>
              <Button render={<DialogClose />}>Done</Button>
            </DialogActions>
          </DialogPopup>
        </Dialog>
      </Row>
    </>
  )
}
