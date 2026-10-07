import { Button } from '../../../registry/ui/button'
import { runCommand, useCommands } from '../../../registry/ui/commands'
import { Kbd } from '../../../registry/ui/kbd'
import { SHORTCUTS_COMMAND, ShortcutsDialog } from '../../../registry/ui/shortcuts-dialog'
import { Row } from '../row'

/*
 * The sheet of a small application.
 *
 * The section declares what a shell would - search, undo, the jumps, Escape
 * answered by the dialog itself - and mounts the sheet once. It has no rows
 * of its own: everything in it is what is declared here.
 */

export function ShortcutsDialogSection() {
  useCommands([
    { id: 'search', label: 'Search', group: 'Everywhere', keys: 'Mod+K', run: () => {} },
    { id: 'undo', label: 'Undo', group: 'Everywhere', keys: 'Mod+Z', run: () => {} },
    { id: 'back', label: 'Back', group: 'Everywhere', keys: 'Alt+ArrowLeft', run: () => {} },
    { id: 'close', label: 'Close a dialog', group: 'Everywhere', keys: 'Escape' },
    { id: 'go-dashboard', label: 'Dashboard', group: 'Going places', keys: 'G D', run: () => {} },
    { id: 'go-calendar', label: 'Calendar', group: 'Going places', keys: 'G C', run: () => {} },
    { id: 'go-settings', label: 'Settings', group: 'Going places', keys: ['G S', 'Mod+,'], run: () => {} },
  ])

  return (
    <Row label="press ?, or click">
      <Button variant="ghost" onClick={() => runCommand(SHORTCUTS_COMMAND)}>
        Show the shortcuts
      </Button>
      <Kbd keys="?" />
      <ShortcutsDialog
        title="Keyboard shortcuts"
        closeLabel="Close"
        description="Letters wait while you type in a field."
        group="Everywhere"
      />
    </Row>
  )
}
