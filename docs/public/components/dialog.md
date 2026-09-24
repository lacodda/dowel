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

## Props

`DialogPopup`:

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm` \| `md` \| `lg` \| `xl` \| `full` | `md` | Width: 24, 28, 40 and 48rem, and the window less a margin. The height is capped at the viewport in every one; `full` sets it, so the body fills the window while its content loads |
| `backdrop` | `boolean` | `true` | The popup draws the scrim itself. Turn it off only where the dialog is shown alongside other things on purpose - a gallery, a screenshot |
| `container` | `Element` | `document.body` | Where to portal to |
| `className` | `string` | | Merged so the caller wins a conflict |

`DialogHeader` takes `action`, and `DialogActions` takes `start` - both a
`ReactNode`; with `DialogBody` they are plain elements and take a `div`'s props.
`Dialog`, `DialogTrigger`, `DialogClose`, `DialogTitle` and `DialogDescription`
take the props their Base UI parts take; `render` composes each with your own
element. `DialogBackdrop` is exported for the rare case of
drawing the scrim yourself, and is not needed otherwise.
