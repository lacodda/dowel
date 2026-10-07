# Commands

Source: https://lacodda.github.io/dowel/components/commands

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#commands

Commands declared by a shell and a screen: pressed, listed, rebound and in conflict.

## Notes

Not a component — a list and the hooks into it. It is the reason a key is
written once.

### Why a list

Every product that grew a palette wrote each key three times: in the listener
that answers it, in the palette row that hints at it, and in the help sheet
that lists it. The three drift. The sheet promises a key the listener stopped
answering, the palette hints a key that was rebound, and nothing says so —
the failure mode of every hand-written sheet of shortcuts is being a version
behind what the application actually answers to.

So a command is declared once, by the component that owns what it does, and
for as long as that component is mounted:

```tsx
import { useCommands } from '@/components/ui/commands'

useCommands([
  { id: 'search', label: t('search'), group: t('everywhere'), keys: 'Mod+K', run: openPalette },
  { id: 'go-dashboard', label: t('dashboard'), group: t('going'), keys: 'G D', run: () => navigate('/') },
  { id: 'undo', label: t('undo'), group: t('everywhere'), keys: 'Mod+Z', enabled: canUndo, run: undo },
])
```

The keyboard answers it, [`CommandPalette`](/dowel/components/command-palette/)
lists it, [`ShortcutsDialog`](/dowel/components/shortcuts-dialog/) lists its
keys — all from the same entry. A screen that declares its own commands adds
them while it is open, and they are gone from all three when it is not.

The handlers may be written inline. Each render hands over the newest ones, so
a command never runs against stale state, and nothing is re-declared — and no
list re-renders — unless something a list shows has changed.

### One list per window

There is no provider. There is one keyboard per window, and two lists would be
two listeners on the same keys — which is exactly the conflict this exists to
catch. The list is the module, and a command can be declared from anywhere.

### Sequences

`G D` is G, then D within a second and a half. A key that does not continue
the sequence ends it **and does nothing else**: a `g` pressed by mistake must
not turn the next keystroke into a jump, and the next keystroke must not act
on its own either. A key held down while a sequence waits is the same key, not
the next step.

### Where a key is answered

This is the half every product gets wrong once.

- **Not in a field someone is typing in.** `Mod+K` in a text editor means
  "delete to end of line"; a palette opening on top of it looks like the
  application misheard. `whileTyping: true` lets a command into fields, and it
  is refused when declared on a key a field types with — a `?` that fires
  while typing would be taken from every field in the application. What is
  left is a key with Mod, Ctrl or Alt, Escape, and the function keys: saving,
  the palette.
- **Not a plain key inside a dialog, a menu, a listbox or a tree.** A plain key
  is one without Mod, Ctrl or Alt. A dialog is a place of its own, and a menu,
  a listbox or a tree types ahead — `g` there means the row starting with G.
  A key with a command modifier types nothing and is still answered.
- **Not Enter or Space on whatever has the focus,** which they press. With
  nothing focused, they are the application's.
- **`within` an element, only while the focus is inside it** — and there, before
  the rest of the application. A list's `J` and `K`, a panel's Escape. This is
  also how a command answers plain keys inside a dialog: declared within it.

### Conflicts

Two commands on the same keys in the same place cannot both work, and neither
can one on a prefix of another's sequence — `G` fires the moment it is
pressed, so `G D` could never finish.

**The one declared first keeps the keys.** Mounted earlier, or earlier in the
tree when they mount together, so a shell's own commands outrank a screen's.
The other loses them everywhere at once — in the keyboard, in the palette's
hint and in the sheet — so nothing promises a key that runs something else.
The console says which, once per conflict:

```text
`link` cannot answer to `Mod+K`: `search` already answers to `Mod+K` in the same place, and was declared first.
```

A command declared `within` an element and one declared for the whole window
on the same keys are not a conflict: the inner one is meant to win where it
is. Off an Apple platform `Ctrl+K` and `Mod+K` are one keystroke, and they
conflict there.

`useCommandConflicts()` returns the conflicts in the window now — for a
settings screen to warn about before saving a rebinding, or for a test that
says there are none:

```tsx
let conflicts: Conflict[] = []
function Watch() {
  conflicts = useCommandConflicts()
  return null
}

render(<Shell><Watch /></Shell>)
expect(conflicts).toEqual([])
```

### Keys something else answers

A command without `run` declares keys that something else already answers —
Escape closing a dialog. It is listed in the sheet and takes part in conflicts,
but it is never run from here and never takes the keystroke from whoever
answers it.

### Rebinding

`setKeymap({ search: 'Mod+P' })` moves keys by command id — which is why an id
has to be stable from one session to the next. It replaces what was set
before; an empty list unbinds a command. The keyboard, the palette's hint and
the sheet all follow.

What it is given is the person's data, not code, so a shortcut in it that does
not parse is reported and skipped rather than thrown: a settings file written
by an older version should not take the application down. A command declared
to fire while typing, rebound to a plain letter, still does not fire into
fields.

A settings screen records a new binding with
[`keysOf(event)`](/dowel/components/shortcut/), in its own `keydown` handler.
It calls `preventDefault`, and a key something nearer already handled is never
answered here — so the key being recorded is not also run.

### In the palette

`useCommandList()` lists every command in the order declared; the ones with a
`run` are the ones a palette can offer — something to run, enabled, and not
tied to where the focus is. `matchCommands(query, commands)` ranks them the
way kilna's palette always has: a label beginning with the query first, one
where every term begins a word next, one merely containing the letters last.
Every term is found in any order, in any alphabet.

```tsx
const runnable = useCommandList().filter((command) => command.run)
const found = matchCommands(query, runnable)
const groups = groupCommands(found)
```

## API

### `useCommands(commands)` and `useCommand(command)`

Declare for as long as the calling component is mounted.

| Field | Type | | |
| --- | --- | --- | --- |
| `id` | `string` | **required** | Stable from one session to the next: a rebinding is stored against it |
| `label` | `string` | **required** | What the palette shows and the sheet lists, in the product's words |
| `group` | `string` | | The heading it is listed under |
| `icon` | `ReactNode` | | Drawn at the start of its palette row |
| `keys` | `string \| string[]` | | As `Mod+K` or `G D`. Several are alternatives. See [the notation](/dowel/components/shortcut/) |
| `run` | `() => void` | | Leave out for keys something else answers |
| `enabled` | `boolean` | `true` | `false` stops it answering; the sheet still lists its keys |
| `whileTyping` | `boolean` | `false` | Fire into fields too. Refused on a key a field types with |
| `within` | `RefObject<Element>` | | Answer only while the focus is inside it |

A shortcut that does not parse, and `whileTyping` on a key a field types with,
throw when declared: a typo in a shortcut is otherwise a key that silently
never fires.

### `useCommandList(): ListedCommand[]`

Every declared command, in the order declared, one line per id — two mounted
copies of one component declaring the same command in two places are one
line. Each has `id`, `label`, `group`, `icon`, `keys` (as it answers now,
after a rebinding and without any lost to a conflict) and `run` (present when
it can be run from a list).

### `useCommandKeys(id): string[]`

The keys one command answers to now — for the hint beside a button that does
the same, or its [`aria-keyshortcuts`](/dowel/components/shortcut/).

### `useCommandConflicts(): Conflict[]`

`{ keys, lost, against, kept }` for each conflict in the window now.

### `runCommand(id): boolean`

Runs a command by id — from a menu item that does the same. `false` when
nothing by that id can be run.

### `setKeymap(rebound)`

`Record<id, string | string[]>`. Replaces the previous keymap.

### `matchCommands(query, commands)` and `groupCommands(commands)`

The palette's ranking, and the headings in the order they first appear. Both
are pure and work over any `{ label }` and `{ group }`.
