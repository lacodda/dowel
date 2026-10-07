import { useEffect, useRef, useState } from 'react'
import { Badge } from '../../../registry/ui/badge'
import { Button } from '../../../registry/ui/button'
import { setKeymap, useCommandConflicts, useCommands } from '../../../registry/ui/commands'
import { ShortcutList } from '../../../registry/ui/shortcuts-dialog'
import { Switch } from '../../../registry/ui/switch'
import { Row } from '../row'

/*
 * Commands, live.
 *
 * Everything here is declared once and read three ways, so the section is
 * built to show the three agreeing: press a key and it runs, open a screen and
 * its keys join the list, declare a clash and the loser's key disappears from
 * the list as well as the keyboard, rebind and the list follows.
 */

/** The commands a work screen adds while it is open. */
function WorkScreen({ onRun }: { onRun: (what: string) => void }) {
  useCommands([
    { id: 'score', label: 'Score this work', group: 'This work', keys: 'S', run: () => onRun('Score this work') },
    { id: 'release', label: 'Put it on the calendar', group: 'This work', keys: 'R', run: () => onRun('Release') },
  ])
  return null
}

/** A second command on the search key, to show what a conflict does. */
function Clash({ onRun }: { onRun: (what: string) => void }) {
  useCommands([{ id: 'link', label: 'Insert a link', group: 'Everywhere', keys: 'Mod+K', run: () => onRun('Insert a link') }])
  return null
}

export function CommandsSection() {
  const [ran, setRan] = useState<string | null>(null)
  const [screenOpen, setScreenOpen] = useState(false)
  const [clash, setClash] = useState(false)
  const [rebound, setRebound] = useState(false)
  const [inPanel, setInPanel] = useState(0)
  const panel = useRef<HTMLDivElement>(null)
  const conflicts = useCommandConflicts()

  useCommands([
    { id: 'search', label: 'Search', group: 'Everywhere', keys: 'Mod+K', run: () => setRan('Search') },
    { id: 'undo', label: 'Undo', group: 'Everywhere', keys: 'Mod+Z', run: () => setRan('Undo') },
    { id: 'go-dashboard', label: 'Dashboard', group: 'Going places', keys: 'G D', run: () => setRan('Dashboard') },
    { id: 'go-calendar', label: 'Calendar', group: 'Going places', keys: 'G C', run: () => setRan('Calendar') },
    {
      id: 'next-row',
      label: 'Next row',
      group: 'In the list',
      keys: 'J',
      within: panel,
      run: () => setInPanel((count) => count + 1),
    },
  ])

  // The keymap belongs to the window; leaving the section gives it back.
  useEffect(() => () => setKeymap({}), [])

  return (
    <>
      <Row label="press Ctrl+K, Ctrl+Z, or G then D - outside a field">
        <Badge variant={ran === null ? 'outline' : 'accent'}>{ran ?? 'nothing yet'}</Badge>
      </Row>

      <Row label="a screen's commands join the list while it is open">
        <Switch checked={screenOpen} onCheckedChange={setScreenOpen}>
          Open the work screen
        </Switch>
        {screenOpen && <WorkScreen onRun={setRan} />}
      </Row>

      <Row label="a second command on Ctrl+K loses it - in the keyboard and in the list">
        <Switch checked={clash} onCheckedChange={setClash}>
          Declare a second Ctrl+K
        </Switch>
        {clash && <Clash onRun={setRan} />}
        {conflicts.map((conflict) => (
          <Badge key={conflict.lost} variant="warn">
            {conflict.lost} lost {conflict.keys} to {conflict.kept}
          </Badge>
        ))}
      </Row>

      <Row label="rebinding moves the key everywhere it is shown">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setKeymap(rebound ? {} : { search: 'Mod+P' })
            setRebound(!rebound)
          }}
        >
          {rebound ? 'Put search back on Ctrl+K' : 'Rebind search to Ctrl+P'}
        </Button>
      </Row>

      <Row label="J answers only inside this list - click it, then press J">
        <div
          ref={panel}
          role="group"
          tabIndex={0}
          aria-label="A list with keys of its own"
          className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-dim focus-visible:outline-2 focus-visible:outline-accent"
        >
          rows walked <Badge variant="outline">{inPanel}</Badge>
        </div>
      </Row>

      <Row label="the list, as the sheet of shortcuts reads it">
        <ShortcutList className="w-full max-w-xl" />
      </Row>
    </>
  )
}
