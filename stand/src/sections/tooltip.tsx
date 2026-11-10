import { Row } from '../row'
import { Button } from '../../../registry/ui/button'
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from '../../../registry/ui/tooltip'
import { Dots } from './shared'

function Plus() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M8 3.5v9M3.5 8h9" strokeLinecap="round" />
    </svg>
  )
}

export function TooltipSection() {
  return (
    <TooltipProvider>
      <Row label="hover or focus - the trigger carries its own label">
        <Tooltip>
          <TooltipTrigger render={<Button variant="icon" size="icon-md" aria-label="Delete" />}>
            <Dots />
          </TooltipTrigger>
          <TooltipPopup>Delete</TooltipPopup>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger render={<Button variant="icon" size="icon-md" aria-label="Add" />}>
            <Plus />
          </TooltipTrigger>
          <TooltipPopup>Add a version</TooltipPopup>
        </Tooltip>
      </Row>
    </TooltipProvider>
  )
}
