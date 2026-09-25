# WindowFrame

Source: https://lacodda.github.io/dowel/components/window-frame

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#window-frame

A title bar holding its open documents, and the eight resize strips, drawn inside a frame - the stand runs in a browser, so they render and stay inert.

## Notes

A desktop product of the line draws its own title bar. With Tauri's
`decorations: false` the system draws nothing, so everything it used to do is
the page's: dragging the window by its bar, double-click to maximise, the
three buttons, and the edges you grab to resize. Each is small. The reason to
take them on at all is that a system title bar over an application title bar
costs a strip of every laptop screen for nothing — scheda made the trade
first, kilna copied it, and this is the copy.

`TitleBar` is the bar, assembled; `ResizeEdges` goes once at the root beside
it.

```tsx
import { ResizeEdges, TitleBar } from '@/components/ui/window-frame'
import { Tabs, TabsList, TabsTab } from '@/components/ui/tabs'

function Shell() {
  return (
    <>
      <ResizeEdges />
      <TitleBar labels={t('window', { returnObjects: true })} mark={<ProductMark />} actions={<Bell />}>
        <Tabs value={active} onValueChange={select}>
          <TabsList variant="bar" aria-label={t('openDocuments')}>
            {documents.map((doc) => (
              <TabsTab key={doc.id} value={doc.id} onClose={() => close(doc.id)} closeLabel={t('close', { name: doc.name })}>
                {doc.name}
              </TabsTab>
            ))}
          </TabsList>
        </Tabs>
      </TitleBar>
      <Outlet />
    </>
  )
}
```

The bar holds, left to right: the product's mark, where the system put the
icon; whatever the window shows at the top — its open documents as
[`Tabs`](/dowel/components/tabs/) with `variant="bar"`, a trail, or a title;
a stretch that exists only to be grabbed; the product's own actions; and the
three buttons. Inside [`AppShell`](/dowel/components/app-shell/) it goes in
the `titlebar` slot, whose row is `--spacing-titlebar` tall.

**The stretch never closes.** A window with twenty documents open would
otherwise have no bar left to drag by, so the handle keeps a minimum width
and the tabs scroll instead.

**A centre is held at the window's centre.** `center` takes what belongs to
the whole window rather than to either end — the search box, most often. A
search placed between the two ends of a row moves every time a tab opens, and a
thing the hand reaches for without looking has to stay where it was. So with a
centre the bar is three columns, two equal sides around the middle, and each
side keeps a handle of its own. Without one it stays a single row and the
documents keep the whole width.

```tsx
<TitleBar labels={labels} mark={<ProductMark />} center={<SearchField aria-label={t('search')} value={query} onValueChange={setQuery} shortcut={['Mod', 'K']} />}>
  …
</TitleBar>
```

For a bar the assembled one does not fit, the parts are exported:
`WindowButtons`, `useTitleBarGestures()` to spread on your own bar, and
`useMaximized()` for anything else that changes shape with the window.

**Everything in the bar that is not a control is a handle.** The gestures
ignore a press that lands on a button, a link, a field, a menu, a tab or a
dialog — the control has already handled it — and treat the rest of the bar
as the thing you move the window by.

**A drag starts on the first movement, not on the press.** `startDragging`
hands the window to the system, which is what keeps snap layouts and
drag-to-edge working, but from that moment the webview stops seeing the
mouse. Calling it on `pointerdown` ate the second click of every double click,
and maximising never happened. So the press waits for four pixels of movement,
and `dblclick`, which the browser is the one qualified to detect, maximises.

**The maximise button follows the window, not the last click.** A window can
be maximised without our buttons — a drag to the top edge, the keyboard, a
snap layout — so `useMaximized()` asks the window and listens for resizes.
The button's label switches to `restore` from the same answer, and
`ResizeEdges` draws nothing while it is true: a maximised window has no edges
to drag, and a strip left along the top would take the clicks meant for the
title bar.

**The edges are geometry, not design.** Eight strips of five pixels (ten at
the corners), positioned by inline style, invisible, above everything. They
are `fixed` to the viewport, which is where a window's edges are; pass
`className="absolute"` to put them on a box instead, as the stand does.

**Close asks; it does not destroy.** Tauri's `close()` emits
`closeRequested` before anything happens, so an unsaved-work guard listening
for that request sees the button exactly as it sees the system's own close.
There is no `onClose` to override it with, on purpose: a second way to close
is a second place for the guard to be missed.

**Outside Tauri it renders and does nothing.** Every call goes through a check
for the Tauri bridge (`window.__TAURI_INTERNALS__`), so a browser, a test or
a storybook gets the chrome without a thrown error on the first click. The
labels are the only thing it needs from you, and all four are required so
they can be translated.

## Props

### `TitleBar`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `labels` | `{ minimize, maximize, restore, close }` | | Required; passed to `WindowButtons` |
| `mark` | `ReactNode` | | The product's mark, at the left edge |
| `children` | `ReactNode` | | Tabs, a trail or a title |
| `actions` | `ReactNode` | | The product's controls, before the window buttons |
| `center` | `ReactNode` | | Held at the window's centre — the search box, most often |
| `className` | `string` | | Merged so the caller wins a conflict |

### `WindowButtons`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `labels` | `{ minimize, maximize, restore, close }` | | Required — `restore` replaces `maximize` while maximised |
| `className` | `string` | | Merged so the caller wins a conflict |

### `useTitleBarGestures()`

Returns `{ onPointerDown, onDoubleClick }` to spread on the bar.

### `ResizeEdges`

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `className` | `string` | | Merged into every strip; `absolute` moves them onto the nearest positioned box |

### `useMaximized()`

Returns `boolean`, kept current as the window resizes. `false` outside Tauri.
