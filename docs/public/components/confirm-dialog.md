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
    <ConfirmDialogHeader>
      <ConfirmDialogTitle>Delete the project?</ConfirmDialogTitle>
      <ConfirmDialogDescription>
        Everything in it goes too. This cannot be undone.
      </ConfirmDialogDescription>
    </ConfirmDialogHeader>
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

The anatomy is [Dialog's](/dowel/components/dialog/#anatomy), taken from it:
`ConfirmDialogHeader` for the question, `ConfirmDialogBody` when what the
answer takes with it runs long enough to scroll, and `ConfirmDialogActions`
pinned to the bottom. The popup is capped at the window, which it did not
promise before — a long list of what a deletion takes pushed both answers off
the bottom edge.

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

**Its sizes run one step narrower than Dialog's**, and it has none of Dialog's large ones: a question that needs an editor's width is an editor, and belongs in a Dialog. It renders its own portal and its own backdrop, so there is nothing to arrange around it.

**`modal` is not accepted.** Base UI forces it on for an alert dialog, which is the whole difference from Dialog.

## Props

### `ConfirmDialog`

The root. Controlled with `open` and `onOpenChange`, or left to manage itself around a `ConfirmDialogTrigger`.

Base UI's `AlertDialog.Root`, unchanged under dowel's name.

### `ConfirmDialogTrigger`

What opens it. Give it `render` to use your own button.

Base UI's `AlertDialog.Trigger`, unchanged under dowel's name.

### `ConfirmDialogClose`

What closes it - and the only thing that does, which is why a confirm dialog with no `ConfirmDialogClose` inside it is a trap.

Base UI's `AlertDialog.Close`, unchanged under dowel's name.

### `ConfirmDialogBackdrop`

The scrim. Darker than the Dialog's, because what is behind it is not just out of reach for a moment - it is waiting on an answer.

Every prop of Base UI's `AlertDialog.Backdrop`, passed on.

### `ConfirmDialogPopup`

The dialog itself, announced as `alertdialog`. Portalled, so it is not clipped by whatever it was opened from.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md \| lg` | `'md'` |  |
| `container` | `HTMLElement \| ShadowRoot \| RefObject<HTMLElement \| ShadowRoot \| null> \| null` |  | Where to portal to. Defaults to the document body, which is what keeps the popup from being clipped by an ancestor. Pass an element to put it somewhere else - inside an overlay that is already open, or into a container being screenshotted. |
| `backdrop` | `boolean` | `true` | Whether to draw the scrim. On by default, and it should stay on for anything a person actually uses: the dim is what says the page behind is out of reach. Turn it off where the popup is shown alongside other things on purpose - a component gallery, a screenshot - because a scrim is `position: fixed` and covers everything, not only its own container. |

And every prop of Base UI's `AlertDialog.Popup`, passed on.

### `ConfirmDialogTitle`

The question. Base UI points the popup's `aria-labelledby` at it, so this is what a screen reader reads out when the dialog interrupts.

Every prop of Base UI's `AlertDialog.Title`, passed on.

### `ConfirmDialogDescription`

What the answer costs, and the popup's `aria-describedby`. On this dialog it is close to required: the title asks, the description says what happens.

Every prop of Base UI's `AlertDialog.Description`, passed on.

### `ConfirmDialogHeader`

The top: the question and what it costs. The dialog's part, under this one's name.

`DialogHeader`, unchanged under dowel's name.

### `ConfirmDialogBody`

The part that scrolls, for consequences too long to fit. The dialog's part, under this one's name.

`DialogBody`, unchanged under dowel's name.

### `ConfirmDialogActions`

Where the two answers go, pinned to the bottom and right-aligned, because the choice belongs where the eye leaves the sentence. The dialog's part, under this one's name.

`DialogActions`, unchanged under dowel's name.
