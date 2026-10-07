import { useState } from 'react'
import { Badge } from '../../../registry/ui/badge'
import { Button } from '../../../registry/ui/button'
import {
  CommandPalette,
  CommandPaletteCollection,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteGroupLabel,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  CommandPalettePopup,
  CommandPaletteRow,
} from '../../../registry/ui/command-palette'
import {
  groupCommands,
  matchCommands,
  useCommandList,
  useCommands,
  type ListedCommand,
} from '../../../registry/ui/commands'
import { Kbd } from '../../../registry/ui/kbd'
import { Row } from '../row'

/*
 * The palette, fed from the list of commands.
 *
 * The rows are the commands this section declares - the same entries the
 * keyboard answers - so each row's hint is the key that works, and the
 * palette's own Ctrl+K is one of them. Typing ranks them with
 * `matchCommands`, which is why the palette's own filter is off.
 */

type Group = ReturnType<typeof groupCommands<ListedCommand>>[number]

export function CommandPaletteSection() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [ran, setRan] = useState<string | null>(null)

  useCommands([
    { id: 'palette', label: 'Show all commands', group: 'Everywhere', keys: 'Mod+K', run: () => setOpen(true) },
    { id: 'new-version', label: 'New version', group: 'Everywhere', keys: 'Mod+Shift+N', run: () => setRan('New version') },
    { id: 'new-note', label: 'New note', group: 'Everywhere', run: () => setRan('New note') },
    { id: 'go-catalogue', label: 'Open the catalogue', group: 'Going places', keys: 'G K', run: () => setRan('Catalogue') },
    { id: 'go-calendar', label: 'Go to the calendar', group: 'Going places', keys: 'G C', run: () => setRan('Calendar') },
    { id: 'settings', label: 'Settings', group: 'Going places', keys: 'Mod+,', run: () => setRan('Settings') },
  ])

  const runnable = useCommandList().filter((command) => command.run)
  const groups = groupCommands(matchCommands(query, runnable))

  const close = (next: boolean) => {
    setOpen(next)
    if (!next) setQuery('')
  }

  return (
    <Row label="press Ctrl+K, or click - the rows are the commands the keyboard answers">
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Open the palette
      </Button>
      {ran !== null && <Badge variant="accent">{ran}</Badge>}

      <CommandPalette
        items={groups}
        filter={null}
        open={open}
        onOpenChange={close}
        onValueChange={(command: ListedCommand | null) => {
          if (command === null) return
          close(false)
          command.run?.()
        }}
        isItemEqualToValue={(a: ListedCommand, b: ListedCommand) => a.id === b.id}
      >
        <CommandPalettePopup aria-label="Commands">
          <CommandPaletteInput
            aria-label="Command"
            placeholder="Type a command"
            hint="Escape"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <CommandPaletteEmpty>Nothing matched</CommandPaletteEmpty>
          <CommandPaletteList>
            {(group: Group) => (
              <CommandPaletteGroup key={group.group ?? ''} items={group.commands}>
                <CommandPaletteGroupLabel className="px-2 pt-2 pb-1 caption">{group.group}</CommandPaletteGroupLabel>
                <CommandPaletteCollection>
                  {(command: ListedCommand) => (
                    <CommandPaletteItem key={command.id} value={command}>
                      <CommandPaletteRow
                        hint={command.keys[0] === undefined ? undefined : <Kbd keys={command.keys[0]} aria-hidden />}
                      >
                        {command.label}
                      </CommandPaletteRow>
                    </CommandPaletteItem>
                  )}
                </CommandPaletteCollection>
              </CommandPaletteGroup>
            )}
          </CommandPaletteList>
        </CommandPalettePopup>
      </CommandPalette>
    </Row>
  )
}
