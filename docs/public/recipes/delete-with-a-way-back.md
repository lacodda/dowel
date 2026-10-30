# Deleting, with a way back

Source: https://lacodda.github.io/dowel/recipes/delete-with-a-way-back

A list of works where two things can be taken away. One can be put back and
one cannot, and a screen that treats them alike is wrong in one direction or
the other: a dialog before every archive, or an Undo that cannot undo.
Composed from [ConfirmDialog](/dowel/components/confirm-dialog/),
[Toast](/dowel/components/toast/), [Button](/dowel/components/button/) and
[ListRow](/dowel/components/list-row/).

```tsx
/*
 * Recipe: deleting, with a way back.
 *
 * Two destructive actions on a list of works, and they must not feel the same.
 * Archiving can be undone, so it does not ask: it acts at once and a toast
 * offers Undo for a few seconds. Deleting for good cannot be undone, so it is
 * the one that asks - a confirm dialog that names the work, says plainly that
 * there is no way back, and starts with focus on the safe answer.
 *
 * The rule behind it: ask before what cannot be reversed, offer a way back
 * after what can. A dialog in front of every archive teaches people to click
 * through dialogs; an Undo after a permanent delete is a promise that cannot
 * be kept.
 *
 * Wire `archived` and `deleted` to the product's own calls. Archiving here is
 * a set of ids, so a work comes back in the place it left - the list is
 * always drawn from the same ordered array. `ToastProvider` belongs once per
 * screen, high up; it is inside this recipe only so the recipe stands alone.
 * Every word a reader sees is here, for the product's language to replace.
 */
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  ConfirmDialog,
  ConfirmDialogActions,
  ConfirmDialogClose,
  ConfirmDialogDescription,
  ConfirmDialogHeader,
  ConfirmDialogPopup,
  ConfirmDialogTitle,
} from '@/components/ui/confirm-dialog'
import { ListRow } from '@/components/ui/list-row'
import { Toast, ToastAction, ToastClose, ToastProvider, ToastTitle, ToastViewport, useToastManager } from '@/components/ui/toast'

export interface Row {
  id: string
  title: string
  summary: string
}

export interface DeleteWithAWayBackProps {
  /** The works, in the order they are shown. */
  works: readonly Row[]
  /** A work went to the archive. Called again with `false` on Undo. */
  onArchive?: (id: string, archived: boolean) => void
  /** A work was deleted for good. */
  onDelete?: (id: string) => void
}

export function DeleteWithAWayBack(props: DeleteWithAWayBackProps) {
  return (
    <ToastProvider>
      <Works {...props} />
      <ToastViewport aria-label="Notifications">
        <ArchiveToasts />
      </ToastViewport>
    </ToastProvider>
  )
}

function Works({ works: initial, onArchive, onDelete }: DeleteWithAWayBackProps) {
  const toasts = useToastManager()
  const [works, setWorks] = useState(initial)
  // Ids, not a second list: the archived work is still in `works`, only not
  // drawn, so Undo needs to remember nothing about where it was.
  const [archived, setArchived] = useState<ReadonlySet<string>>(new Set())
  const [deleting, setDeleting] = useState<Row | null>(null)
  const cancel = useRef<HTMLButtonElement>(null)

  const archive = (work: Row) => {
    setArchived((ids) => new Set(ids).add(work.id))
    onArchive?.(work.id, true)
    const toastId = toasts.add({
      title: `Archived "${work.title}"`,
      timeout: 6000,
      actionProps: {
        children: 'Undo',
        onClick: () => {
          setArchived((ids) => {
            const next = new Set(ids)
            next.delete(work.id)
            return next
          })
          onArchive?.(work.id, false)
          toasts.close(toastId)
        },
      },
    })
  }

  const remove = (work: Row) => {
    setWorks((rows) => rows.filter((row) => row.id !== work.id))
    onDelete?.(work.id)
  }

  const shown = works.filter((work) => !archived.has(work.id))

  return (
    <section aria-labelledby="works-heading" className="flex flex-col gap-3">
      <h2 id="works-heading" className="text-lg font-semibold text-text">
        Works
      </h2>
      {shown.length === 0 ? (
        <p className="text-sm text-dim">Every work is archived. Undo on the last notice brings it back.</p>
      ) : (
        <ul className="flex flex-col">
          {shown.map((work) => (
            <ListRow
              key={work.id}
              render={<li />}
              description={work.summary}
              end={
                <span className="flex gap-1">
                  {/* The row's name is in the label: a screen reader lists
                      these buttons out of context, and "Archive" five times
                      says nothing. */}
                  <Button size="sm" aria-label={`Archive ${work.title}`} onClick={() => archive(work)}>
                    Archive
                  </Button>
                  <Button size="sm" variant="danger" aria-label={`Delete ${work.title} for good`} onClick={() => setDeleting(work)}>
                    Delete
                  </Button>
                </span>
              }
            >
              {work.title}
            </ListRow>
          ))}
        </ul>
      )}

      {/* Controlled, and kept outside the rows: one dialog for the screen,
          asked about whichever work was chosen. */}
      <ConfirmDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <ConfirmDialogPopup size="sm" initialFocus={cancel}>
          <ConfirmDialogHeader>
            <ConfirmDialogTitle>{`Delete "${deleting?.title ?? ''}" for good?`}</ConfirmDialogTitle>
            <ConfirmDialogDescription>
              This removes the work and all its versions. It cannot be undone.
            </ConfirmDialogDescription>
          </ConfirmDialogHeader>
          <ConfirmDialogActions>
            {/* Focus starts on the safe answer: Enter pressed in a hurry
                cancels. */}
            <Button render={<ConfirmDialogClose ref={cancel} />}>
              Keep it
            </Button>
            <Button variant="danger" render={<ConfirmDialogClose />} onClick={() => deleting && remove(deleting)}>
              Delete for good
            </Button>
          </ConfirmDialogActions>
        </ConfirmDialogPopup>
      </ConfirmDialog>
    </section>
  )
}

/** Maps what the manager holds onto toasts. The action words and handler came
 * with the toast (actionProps), so this is written once for every toast. */
function ArchiveToasts() {
  const { toasts } = useToastManager()
  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast}>
          <ToastTitle />
          <ToastAction />
          <ToastClose aria-label="Dismiss" />
        </Toast>
      ))}
    </>
  )
}
```

## What it gets right

**What can be undone does not ask.** Archive acts at once; the work leaves the
list and a toast says so, with an Undo that stays for a few seconds.

**Undo puts the work back in its place.** The list is always drawn from the
same ordered array and archiving only hides an id, so a work from the middle
returns to the middle.

**What cannot be undone asks, and names the thing.** The dialog title says
which work, and the description says it cannot be undone. Asking changes
nothing: the work is still in the list behind it.

**Focus starts on the safe choice.** `initialFocus` points at "Keep it", so a
hurried Enter cancels.

**Cancel changes nothing; Confirm removes it.** "Delete for good" is the
danger button and the only path that removes the work, and no Undo is offered
afterwards because none could be kept.

**The buttons say which work.** Each row's buttons carry the work's title in
their accessible name, so a list of buttons read out of context is not
"Archive, Archive, Archive".
