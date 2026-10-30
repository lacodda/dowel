# ShortcutsDialog

Source: https://lacodda.github.io/dowel/components/shortcuts-dialog

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#shortcuts-dialog

The sheet of a small application, opened by ?, with a screen's own keys in it.

## Notes

**It has no rows of its own.** It lists what is declared through
[`commands`](/dowel/components/commands/) now, under the headings the commands
give themselves, with the keys they answer to after a rebinding and without any
lost to a conflict. A command declared by the open screen appears while that
screen is open, and is gone when it is not. A hand-written sheet is a version
behind what the application answers to from the day after it is written; this
one cannot be.

**It wires itself.** It declares its own command — under the `title` the
product gives it, on `?` unless told otherwise — so `?` opens it with nothing
else written, the palette offers it, and it lists itself.

```tsx
import { ShortcutsDialog } from '@/components/ui/shortcuts-dialog'

<ShortcutsDialog
  title={t('keys.title')}
  closeLabel={t('close')}
  description={t('keys.typing')}
  group={t('keys.everywhere')}
/>
```

Mount it once, in the shell.

**It opens on the list, not on the close button.** A dialog puts the focus on
the first thing that can take it, which here is the cross — so the Enter that
someone presses to see what happens would close the sheet, and the arrows that
should scroll it would do nothing. A sheet is read, not answered. The focus
goes to the list; Escape and the button close it.

**`?` is a plain key**, so it is not answered while someone types, nor inside
another dialog or a menu — see
[where a key is answered](/dowel/components/commands/#where-a-key-is-answered).
`description` is the place to say so in the product's words.

**What keys cannot say goes after the list**, as children: a gesture with the
pointer, a note about a mode.

```tsx
<ShortcutsDialog title={t('keys.title')} closeLabel={t('close')}>
  <p className="mt-4 text-xs text-faint">{t('keys.stressGesture')}</p>
</ShortcutsDialog>
```

### Keys answered elsewhere

Escape closes a dialog, and that is Base UI's doing, not a command's. Declare
it without a `run` and the sheet lists it like any other — and a command bound
to Escape in the same place is told, by the console, that it never will be:

```tsx
useCommand({ id: 'close', label: t('keys.close'), group: t('keys.everywhere'), keys: 'Escape' })
```

### On a settings page

`ShortcutList` is the list on its own, without the dialog: the same groups and
rows, for a page that shows the keys in place. A command with no keys has
nothing to show in either and is left out.

**`SHORTCUTS_COMMAND` is the id of the command the dialog declares** - for `setKeymap({ [SHORTCUTS_COMMAND]: 'F1' })`, or `runCommand(SHORTCUTS_COMMAND)` from a help menu. `ShortcutList` takes a `<div>`'s props and lays the groups out in two columns from `sm` up; a group never breaks across them.

## Props

### `ShortcutList`

The list on its own, for a settings page that shows the keys in place. A command with no keys has nothing to show and is left out.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `3` | Where the group headings stand in the outline: `3` by default - under the sheet's title, or a settings page's section. |

And every prop of `HTMLAttributes<HTMLDivElement>`, passed on.

### `ShortcutsDialog`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `title` (required) | `string` |  | The heading, and the name of the command that opens it: in the palette and in the list itself. |
| `closeLabel` (required) | `string` |  | What the close button is called, for a screen reader. No default: a word the component invents is a word the product cannot translate. |
| `description` | `ReactNode` |  | The line under the heading. |
| `keys` | `string` | `'?'` | The keys that open it. |
| `group` | `string` |  | The heading its own line is listed under. |
| `open` | `boolean` |  | Controlled, for a product that opens it from somewhere else as well. |
| `onOpenChange` | `(open: boolean) => void` |  | Called with the new state whenever it opens or closes, whether by the keys, `runCommand` or the close button. |
| `children` | `ReactNode` |  | After the list: what keys cannot say - a gesture with the pointer, a note that letters wait while someone is typing. |
