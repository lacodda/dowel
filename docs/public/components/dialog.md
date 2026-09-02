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
  <DialogPopup size="sm">
    <DialogTitle>{t('deleteDraft')}</DialogTitle>
    <DialogDescription>{t('deleteDraftHint')}</DialogDescription>
    <DialogActions>
      <DialogClose render={<Button>{t('cancel')}</Button>} />
      <Button variant="danger" onClick={remove}>
        {t('delete')}
      </Button>
    </DialogActions>
  </DialogPopup>
</Dialog>
```

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
capped at the viewport height and scrolls inside itself, and that scroll does
not reach the page behind. Found on a release editor in a consuming product,
which is the shape that does it: half a dozen fields and a row of actions.

**Give it a title.** `DialogTitle` is what names the dialog to a screen
reader; without one the popup is announced as an unlabelled region. If the
design has no visible heading, the title is still the right element to render
visually hidden.

## Props

`DialogPopup`:

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `size` | `sm` \| `md` \| `lg` | `md` | Width; the height is capped at the viewport in every one |
| `backdrop` | `boolean` | `true` | The popup draws the scrim itself. Turn it off only where the dialog is shown alongside other things on purpose - a gallery, a screenshot |
| `container` | `Element` | `document.body` | Where to portal to |
| `className` | `string` | | Merged so the caller wins a conflict |

`Dialog`, `DialogTrigger`, `DialogClose`, `DialogTitle`, `DialogDescription`
and `DialogActions` take the props their Base UI parts take; `render` composes
each with your own element. `DialogBackdrop` is exported for the rare case of
drawing the scrim yourself, and is not needed otherwise.
