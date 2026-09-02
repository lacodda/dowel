# ConfirmDialog

Source: https://lacodda.github.io/dowel/components/confirm-dialog

FENCE0 

The component lands in `components/ui/confirm-dialog.tsx` and is yours to edit.

See it live on the stand: https://lacodda.github.io/dowel/stand/#confirm-dialog

The three sizes, with a destructive action - in either theme, and in the accent of any product of the line.

## When this and not a Dialog

Almost everything about the two is the same, and that is the point: the
difference is not clothes, it is what the popup is allowed to do.

Reach for **Dialog** when the content is a place the user went — a form, a
detail view, a picker. Wandering out of it by clicking away is the right
behaviour, because nothing is lost.

Reach for **ConfirmDialog** when the popup is a question about something
irreversible: deleting, discarding, revoking, overwriting. A stray click beside
it must not count as an answer.

The test is not how important the content feels. It is whether dismissing it by
accident would be a loss.

## Usage

```tsx
<ConfirmDialog>
  <ConfirmDialogTrigger render={<Button variant="danger" />}>
    Delete project
  </ConfirmDialogTrigger>
  <ConfirmDialogPopup>
    <ConfirmDialogTitle>Delete the project?</ConfirmDialogTitle>
    <ConfirmDialogDescription>
      Everything in it goes too. This cannot be undone.
    </ConfirmDialogDescription>
    <ConfirmDialogActions>
      <Button render={<ConfirmDialogClose />}>Cancel</Button>
      <Button variant="danger" onClick={remove}>Delete</Button>
    </ConfirmDialogActions>
  </ConfirmDialogPopup>
</ConfirmDialog>
```

The parts are exposed rather than wrapped in one component with `title` and
`footer` props — a dialog that owns its own close button owns a word for it,
and that is a word the product cannot translate.

## Props

### `ConfirmDialog` — the root

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `open` | `boolean` | | Controlled, with `onOpenChange` |
| `defaultOpen` | `boolean` | `false` | Uncontrolled |
| `onOpenChange` | `(open, details) => void` | | |

`modal` and `disablePointerDismissal` are not accepted here. Base UI forces
both on for an alert dialog, which is the whole difference from Dialog.

### `ConfirmDialogPopup`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md \| lg` | `md` | A confirm dialog is a question, so the sizes run one step narrower than Dialog's |
| `className` | `string` | | Merged so the caller wins a conflict |

It renders its own portal and its own backdrop, so there is nothing to arrange
around it.

### The rest

| Part | | |
| --- | --- | --- |
| `ConfirmDialogTrigger` | | What opens it. `render` to use your own button |
| `ConfirmDialogTitle` | | The question. The popup's `aria-labelledby` points at it |
| `ConfirmDialogDescription` | | What the answer costs. The popup's `aria-describedby` |
| `ConfirmDialogActions` | | Right-aligned row for the two answers |
| `ConfirmDialogClose` | | Closes it. `render` to use your own button |

## Notes

**It announces itself as `alertdialog`.** That is the semantic half of the
difference, and the only one a screen reader can hear: it tells the reader the
popup is interrupting rather than presenting, and that the description should
be read out without being asked for.

**A press outside does nothing.** Not a preference, not a prop — Base UI's
`AlertDialog.Root` omits `disablePointerDismissal` from Dialog's props and
forces it true.

**`Escape` still closes it.** This surprises people who expect "not
dismissible" to mean both, and it is the right call: a popup with no keyboard
way out is a trap. The distinction that survives is between a deliberate
keypress and an absentminded click.

**So give it a close.** Since only something inside can dismiss it by pointer,
a `ConfirmDialogPopup` with no `ConfirmDialogClose` in it is a dead end for
anyone on a touch screen.

**No colour of its own.** Every class is written in tokens, so the same list is
correct in both themes and in every product's accent — no `dark:` utilities
anywhere in it.
