import { useState } from 'react'
import { Row } from '../row'
import { Chip, ChipGroup } from '../../../registry/ui/chip'

export function ChipSection() {
  const [kind, setKind] = useState<string[]>(['song'])
  const [filters, setFilters] = useState<string[]>(['unread'])

  return (
    <>
      <Row label="variants">
        <Chip>plain</Chip>
        <Chip variant="soft">soft</Chip>
        <Chip variant="accent">accent</Chip>
      </Row>

      <Row label="with a count, and removable">
        <Chip count={12}>tags</Chip>
        <Chip onRemove={() => {}} removeLabel="Remove tag">
          removable
        </Chip>
        <Chip variant="accent" count={3} onRemove={() => {}} removeLabel="Remove tag">
          both
        </Chip>
      </Row>

      <Row label="tones - the status vocabulary and the accent">
        <Chip variant="accent">accent</Chip>
        <Chip variant="good">good</Chip>
        <Chip variant="warn">warn</Chip>
        <Chip variant="bad">bad</Chip>
        <Chip variant="info">info</Chip>
      </Row>

      <Row label="dashed - stands for something not there yet">
        <Chip variant="dashed">+ Tag</Chip>
      </Row>

      <Row label="a single choice, as a switch - press one, and it holds">
        <ChipGroup aria-label="Kind" value={kind} onValueChange={setKind}>
          <Chip value="song">Song</Chip>
          <Chip value="clip">Clip</Chip>
          <Chip value="short">Short</Chip>
          <Chip value="cover">Cover</Chip>
        </ChipGroup>
      </Row>

      <Row label="several at once - filters, with a count on each">
        <ChipGroup aria-label="Filters" multiple value={filters} onValueChange={setFilters}>
          <Chip value="unread" count={4}>
            Unread
          </Chip>
          <Chip value="flagged" count={1}>
            Flagged
          </Chip>
          <Chip value="mine" count={12}>
            Mine
          </Chip>
        </ChipGroup>
      </Row>
    </>
  )
}
