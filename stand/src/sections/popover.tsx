import { Row } from '../row'
import { Button } from '../../../registry/ui/button'
import { Chip } from '../../../registry/ui/chip'
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from '../../../registry/ui/popover'

export function PopoverSection() {
  return (
    <Row label="click to open - the page stays usable behind it">
      <Popover>
        <PopoverTrigger render={<Button variant="ghost" />}>Filters</PopoverTrigger>
        <PopoverPopup>
          <PopoverTitle>Filters</PopoverTitle>
          <PopoverDescription>Narrow the list without leaving it.</PopoverDescription>
          <div className="mt-3 flex gap-2">
            <Chip variant="accent">drafts</Chip>
            <Chip>scored</Chip>
          </div>
        </PopoverPopup>
      </Popover>
    </Row>
  )
}
