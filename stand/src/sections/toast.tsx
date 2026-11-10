import { Row } from '../row'
import { Button } from '../../../registry/ui/button'
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToastManager,
} from '../../../registry/ui/toast'

export function ToastSection() {
  return (
    <ToastProvider>
      <ToastRaiser />
      <ToastViewport>
        <ToastList />
      </ToastViewport>
    </ToastProvider>
  )
}

function ToastRaiser() {
  const manager = useToastManager()

  return (
    <>
      <Row label="raise one - it stacks in the corner and leaves on its own">
        <Button
          variant="ghost"
          onClick={() => manager.add({ title: 'Saved', description: 'The draft is stored.' })}
        >
          Neutral
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            manager.add({ type: 'success', title: 'Released', description: 'Two songs went out.' })
          }
        >
          Good
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            manager.add({ type: 'error', title: 'Could not save', description: 'The disk is full.' })
          }
        >
          Bad
        </Button>
      </Row>

      <Row label="with the one thing you can do about it">
        <Button
          variant="ghost"
          onClick={() =>
            manager.add({
              title: 'Draft deleted',
              data: { undo: true },
            })
          }
        >
          Undoable
        </Button>
      </Row>
    </>
  )
}

/** The list. Kept beside the raiser so both live in the same provider. */
function ToastList() {
  const { toasts } = useToastManager()
  return toasts.map((toast) => (
    <Toast key={toast.id} toast={toast}>
      <ToastTitle />
      <ToastDescription />
      {(toast.data as { undo?: boolean } | undefined)?.undo === true && (
        <ToastAction>Undo</ToastAction>
      )}
      <ToastClose aria-label="Dismiss" />
    </Toast>
  ))
}
