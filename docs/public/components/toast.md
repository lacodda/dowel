# Toast

Source: https://lacodda.github.io/dowel/components/toast

FENCE0 

The component lands in `components/ui/toast.tsx` and is yours to edit.

See it live on the stand: https://lacodda.github.io/dowel/stand/#toast

Every tone, with a title, a sentence, an action and a dismiss - in either theme, and in the accent of any product of the line.

## When this and not an Alert, a Banner or a Dialog

The three messages look similar and mean different things, so the choice is
about *what the message is*, not how much room it needs.

Reach for **Toast** when something already happened, needs no decision from
the reader, and stops being interesting almost immediately: saved, sent,
copied, deleted with an undo. **If dismissing it would lose information, it is
not a toast** — a toast is guaranteed to go away on its own, and anything the
reader might need to come back to has gone with it.

Reach for **[Alert](/dowel/components/alert/)** when the message is a
condition that is *still true* — and will still be true after a reload —
about the thing it sits beside: this field could not be saved, this profile
has no axes yet.

Reach for **[Banner](/dowel/components/banner/)** when the condition is about
the whole application rather than one part of it, and is true on every screen:
you are offline, this build is a preview.

Reach for **[Dialog](/dowel/components/dialog/)** when the reader has to
*answer* something. A toast that asks a question is a question the reader can
miss by looking away.

## Why Base UI's toast and not Sonner

Sonner is the usual answer, and it is a good library. It is not the right one
here: `@base-ui/react` is already a dependency of half of these components, and
its toast brings a manager that does more than `toast()` — `add`, `update`,
`close`, `promise`, priorities, a queue with a limit, pause on hover and focus,
and swipe to dismiss. A product installing dowel would be installing a second
toast library to get less.

So what is in this file is the clothes and the tone vocabulary. The queue, the
live region, the timers and the gestures are Base UI's.

## Usage

Three pieces: a provider around the part of the application that can raise
one, a viewport where they stack, and the manager wherever something happens.

```tsx
<ToastProvider>
  <App />
  <ToastViewport>
    <Toasts />
  </ToastViewport>
</ToastProvider>
```

```tsx
function Toasts() {
  const { toasts } = useToastManager()
  return toasts.map((toast) => (
    <Toast key={toast.id} toast={toast}>
      <ToastTitle />
      <ToastDescription />
      <ToastClose aria-label={t('dismiss')} />
    </Toast>
  ))
}
```

```tsx
const manager = useToastManager()

manager.add({ type: 'success', title: t('saved') })

manager.add({
  type: 'info',
  title: t('deleted'),
  description: t('deletedWhat', { name }),
  actionProps: { onClick: undo },
})

manager.promise(save(), {
  loading: t('saving'),
  success: t('saved'),
  error: t('couldNotSave'),
})
```

One provider per screen. Nesting them gives a product two queues that do not
know about each other, and a toast raised into the wrong one is a toast nobody
sees.

To raise a toast from outside React — a store, an event handler, a worker —
build the manager with `createToastManager()` and pass it to `ToastProvider`'s
`toastManager` prop.

## Tone follows the type

`type` is Base UI's word for what happened; `tone` is dowel's word for how it
looks. The component maps one onto the other, so a product that says what
happened does not also have to say which colour that is:

| `type` | `tone` |
| --- | --- |
| `success` | `good` |
| `warning` | `warn` |
| `error` | `bad` |
| `info`, `loading` | `info` |
| anything else | `neutral` |

Passing `tone` explicitly wins over the map, for the case where a product
knows better.

**Colour is emphasis, never the message.** The stripe down the side says the
same thing the sentence says, so a reader who does not separate green from red
gets the whole of it.

## Accessibility

`Toast` is a `role="dialog"` inside the viewport's `role="region"`, which is
what makes it announced without stealing focus. Base UI drives the live region,
the timers, the pause on hover and focus, and the swipe.

`ToastClose` needs a label — it draws a cross and nothing else, and a bare
cross is announced as nothing. It is deliberately `aria-hidden` while the
stack is collapsed and neither hovered nor focused: a collapsed stack is one
announcement, not one announcement plus a dismiss button per toast.

## Props

### `Toast`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `toast` | `ToastObject` | | The object from `useToastManager().toasts` |
| `tone` | `neutral \| good \| warn \| bad \| info` | from `toast.type` | Explicit wins over the map |
| `swipeDirection` | `up \| down \| left \| right` or an array | `['down', 'right']` | |
| `className` | `string` | | Merged so the caller wins a conflict |

### `ToastViewport`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `container` | `Element \| null \| Ref` | the document body | Where to portal to |
| `className` | `string` | | Bottom right by default — the corner that covers neither a form nor a menu |

### The parts

| Part | |
| --- | --- |
| `ToastTitle` | The heading; the toast's `aria-labelledby` |
| `ToastDescription` | The sentence under it; the toast's `aria-describedby` |
| `ToastAction` | The one thing the reader can do about it — undo, or go and look |
| `ToastClose` | The dismiss button. Give it a label |

### The manager

| | |
| --- | --- |
| `useToastManager()` | `toasts`, `add`, `update`, `close`, `promise` |
| `createToastManager()` | A manager for raising toasts outside React |
