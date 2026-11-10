import { useRef, useState } from 'react'
import { Row } from '../row'
import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from '../../../registry/ui/combobox'
import { FRUIT } from './shared'

export function ComboboxSection() {
  const [one, setOne] = useState<string | null>(null)
  const [many, setMany] = useState<string[]>(['Cherry'])
  const chipsRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <Row label="type to narrow the list">
        <Combobox items={FRUIT} value={one} onValueChange={(value) => setOne(value as string)}>
          <ComboboxInput className="w-56" placeholder="Fruit" aria-label="Fruit" />
          <ComboboxPopup>
            <ComboboxEmpty>Nothing matches</ComboboxEmpty>
            <ComboboxList>
              {(fruit: string) => (
                <ComboboxItem key={fruit} value={fruit}>
                  {fruit}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </Combobox>
      </Row>

      <Row label="several, as chips">
        <Combobox
          multiple
          items={FRUIT}
          value={many}
          onValueChange={(value) => setMany(value as string[])}
        >
          <ComboboxChips ref={chipsRef} className="w-72">
            {/* `Value` is what knows the chosen items, so the chips are drawn
                from it rather than from the state next to it. */}
            <ComboboxValue>
              {(chosen: string[]) =>
                chosen.map((fruit) => (
                  <ComboboxChip key={fruit}>
                    {fruit}
                    <ComboboxChipRemove aria-label="Remove" />
                  </ComboboxChip>
                ))
              }
            </ComboboxValue>
            {/* `bare` because the chips container is the field here: the
                input drops its own border and sits on the same line as the
                last chip. */}
            <ComboboxInput bare placeholder="Fruit" aria-label="Fruits" />
          </ComboboxChips>
          {/* Anchored to the chips box, not the input inside it: an empty
              input is narrower than the field, and the list would hang short
              of the box a reader is looking at. */}
          <ComboboxPopup anchor={chipsRef}>
            <ComboboxEmpty>Nothing matches</ComboboxEmpty>
            <ComboboxList>
              {(fruit: string) => (
                <ComboboxItem key={fruit} value={fruit}>
                  {fruit}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </Combobox>
      </Row>
    </>
  )
}
