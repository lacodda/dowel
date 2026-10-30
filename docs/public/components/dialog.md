# Dialog

Source: https://lacodda.github.io/dowel/components/dialog

FENCE0 

The component lands in `components/ui/dialog.tsx` and is yours to edit.

See it live on the stand: https://lacodda.github.io/dowel/stand/#dialog

Every size, with a title, a description and a row of actions - in either theme, and in the accent of any product of the line.

## When this and not an Alert, a Toast or a Drawer

Reach for **Dialog** when the reader has to *answer* something before the
thing they started can continue: delete this or not, which profile to switch
to, what to call the version being saved. It takes the whole screen out of
reach, which is only fair when nothing else can proceed.

Reach for **[Alert](/dowel/components/alert/)** when there is nothing to
answer — a condition that is still true, sitting beside what it is about.

Reach for **[Toast](/dowel/components/toast/)** when something already
happened and needs no decision at all.

Reach for **[Drawer](/dowel/components/drawer/)** when the panel is a place to
work rather than a question: a chat, a form with its own life, anything the
reader returns to. A drawer can be left open; a dialog is answered and gone.

## Usage

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogPopup size="xl">
    <DialogHeader
      action={
        <DialogClose render={<Button variant="icon" size="icon-sm" aria-label={t('close')} />}>
          <X />
        </DialogClose>
      }
    >
      <DialogTitle>{t('editStyle')}</DialogTitle>
      <DialogDescription>{t('editStyleHint')}</DialogDescription>
    </DialogHeader>
    <DialogBody>{/* the form */}</DialogBody>
    <DialogActions start={<Button variant="danger" onClick={remove}>{t('delete')}</Button>}>
      <DialogClose render={<Button>{t('cancel')}</Button>} />
      <Button variant="primary" onClick={save}>
        {t('save')}
      </Button>
    </DialogActions>
  </DialogPopup>
</Dialog>
```

## Anatomy

The popup is a column of three parts, and **only the body scrolls**:

| Part | What it does |
| --- | --- |
| `DialogHeader` | The title and the line under it, with an `action` beside them — a close button, a menu. It stays at the top. |
| `DialogBody` | Takes the height the other two leave, and scrolls inside it when there is more than fits. |
| `DialogActions` | Pinned to the bottom. The answer sits on the right; `start` holds the action that is not the answer — "Delete" on an editor whose question is "Save?" — at the other end of the row. |

The popup scrolled as a whole before, and a dialog with more in it than the
window is tall took its own buttons with it: on a 1280×720 window, the "Save"
of kilna's style editor stood 137px below the bottom edge. Now the column is
capped at the window, the header and the actions do not shrink, and the body
alone gives way.

The popup has no padding of its own — each part carries it — so the body's
scroll runs edge to edge. A dialog without a header or without actions still
has its edges: a body that is first or last in the popup takes the padding the
missing part would have given.

## Popups inside it

A select, a menu, a date picker or a tooltip opened inside the dialog opens
**above** it, and is not clipped by the body's scroll. The content sits in a
[layer](/dowel/components/layer/): the popup portals into a host raised one
rung above the modal, inside the dialog's own portal, so the focus trap counts
it as the dialog's and a screen reader can reach it. Nothing to do at the call
site — every popup of the set takes the layer it was opened in.

## Notes

**The parts are exposed rather than wrapped.** A single component taking
`title` and `footer` props is a slot with extra steps, and a dialog that owns
its own close button owns a word for it — a word the product cannot translate.

**The behaviour is Base UI's**: the focus trap, returning focus to whatever
opened it, `Escape`, the scroll lock, and the `aria-labelledby` tying the
popup to its own title. What is ours is the clothes and the motion.

**It never grows taller than the window.** A dialog with more in it than the
window is tall would otherwise centre itself and hang off both ends — the
title out of reach above the viewport, the buttons below it. The popup is
capped at the viewport height at every size, the body scrolls inside it, and
that scroll does not reach the page behind.

**Give it a title.** `DialogTitle` is what names the dialog to a screen
reader; without one the popup is announced as an unlabelled region. If the
design has no visible heading, the title is still the right element to render
visually hidden.

**Sizes.** `sm`, `md`, `lg` and `xl` are 24, 28, 40 and 48rem wide, and `full` is the window less a margin. The height is capped at the viewport in every one; `full` sets it, so the body fills the window while its content loads.

**Turn the scrim off only on purpose.** The popup draws its own backdrop; `backdrop={false}` is for a dialog shown alongside other things deliberately - a gallery, a screenshot. `DialogBackdrop` is exported for the rare case of drawing the scrim yourself, and is not needed otherwise.

## Props

### `Dialog`

The root. Controlled with `open` and `onOpenChange`, or left to manage itself around a `Dialog.Trigger`.

Base UI's `Dialog.Root`, unchanged under dowel's name.

### `DialogTrigger`

What opens it. Give it `render` to use your own button.

Base UI's `Dialog.Trigger`, unchanged under dowel's name.

### `DialogClose`

What closes it - the same, for a cancel button or an X.

Base UI's `Dialog.Close`, unchanged under dowel's name.

### `DialogBackdrop`

The scrim. Dark because a modal is a modal: what is behind it is out of reach, and saying so with contrast is the only thing that reads at a glance.

Every prop of Base UI's `Dialog.Backdrop`, passed on.

### `DialogPopup`

The dialog itself. Portalled, so it is not clipped by whatever it was opened from. Put a `DialogHeader`, a `DialogBody` and `DialogActions` inside it.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm \| md \| lg \| xl \| full` | `'md'` |  |
| `container` | `HTMLElement \| ShadowRoot \| RefObject<HTMLElement \| ShadowRoot \| null> \| null` |  | Where to portal to. Defaults to the document body, which is what keeps the popup from being clipped by whatever it was opened from. Pass an element to put it somewhere else - inside a dialog that is already open, or into a container being screenshotted. |
| `backdrop` | `boolean` | `true` | Whether to draw the scrim. On by default, and it should stay on for anything a person actually uses: the dim is what says the page behind is out of reach. Turn it off where the popup is shown alongside other things on purpose - a component gallery, a screenshot - because a scrim is `position: fixed` and covers everything, not only its own container. |

And every prop of Base UI's `Dialog.Popup`, passed on.

### `DialogHeader`

The top of the popup: the title, the line under it, and an action beside them. It stays put while the body scrolls.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `action` | `ReactNode` |  | Beside the title, at the end of the line: a close button, a menu. The title and description wrap under themselves rather than under it. |

And every prop of `HTMLAttributes<HTMLDivElement>`, passed on.

### `DialogBody`

The part that scrolls. It takes the height the header and the actions leave, and only it moves when there is more than fits. It takes a ref, for a dialog that opens with the focus on what it says rather than on a button.

Every prop of `ComponentProps<'div'>`, passed on.

### `DialogActions`

Where the actions go, pinned to the bottom. Right-aligned, because the primary action of a dialog belongs where the eye leaves the sentence.

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `start` | `ReactNode` |  | At the other end of the row from the answer: the action that is not the answer to the dialog's question - "Delete" on an editor whose question is "Save?". Kept apart so it is not pressed on the way to "Save". |

And every prop of `HTMLAttributes<HTMLDivElement>`, passed on.

### `DialogTitle`

The heading. Base UI points the popup's `aria-labelledby` at it, so a dialog with one is named for a screen reader without anyone arranging it.

Every prop of Base UI's `Dialog.Title`, passed on.

### `DialogDescription`

The line under the heading, and the popup's `aria-describedby`.

Every prop of Base UI's `Dialog.Description`, passed on.
