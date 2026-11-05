/*
 * Overlay scrollbars, where the engine draws them.
 *
 * A stylesheet cannot ask for a bar that takes no width: Chromium removed
 * `overflow: overlay` in version 114, and a bar styled through
 * `::-webkit-scrollbar` always takes the width it is given. The engine can draw
 * one itself - a phone, a Mac, a desktop window started with
 * `--enable-features=OverlayScrollbar` - but only while nothing styles it, and
 * the theme styles every bar. So the theme has to stand aside, and it stands
 * aside on what is measured here rather than on what a product says: a runtime
 * update that drops the flag leaves the theme's strip, not a stock bar with
 * arrows.
 *
 * A sleeping overlay bar answers neither hover nor press: a press at the edge
 * lands on the content, however the pointer arrives. A new bar comes up shown,
 * and one frame of `overflow: hidden` makes a new one - with no scroll event,
 * and with the position and the content's width unchanged, since the bar took
 * no width to begin with.
 *
 * It comes up early because of how it stays up: the engine keeps a shown bar for
 * a pointer that moves onto it afterwards, and a pointer that was already there
 * and stops does not count. So it has to be up before the hand arrives.
 */

/** How far from a scroller's edge a mouse sets the bar off, in CSS pixels: well
 * before it gets there, for the reason above. */
const REACH = 48

/** How near the edge a move keeps a shown bar up: the engine counts a pointer
 * over the bar's own 15 pixels, measured, and no further. */
const ON_THE_BAR = 14

/** How long a bar can be taken with nobody on it, in milliseconds. */
const TAKEABLE = 500

/** How long before it has faded from sight, so that showing it again is not seen
 * as a blink. */
const GONE = 1000

type Axis = 'overflowX' | 'overflowY'

function takesNoWidth(): boolean {
  const host = document.createElement('div')
  const probe = document.createElement('div')
  // Through the CSSOM, because a strict policy refuses a style attribute.
  Object.assign(probe.style, {
    position: 'fixed',
    width: '100px',
    height: '100px',
    overflow: 'scroll',
    visibility: 'hidden',
  })
  // The theme's rules do not reach into a shadow root, so this is the bar the
  // engine draws and not the theme's strip.
  host.attachShadow({ mode: 'open' }).append(probe)
  document.documentElement.append(host)
  const width = probe.offsetWidth - probe.clientWidth
  host.remove()
  return width === 0
}

/** The nearest scroller whose bar is by the pointer: its axis, and how far off. */
function barAt(from: Element, x: number, y: number): [HTMLElement, Axis, number] | undefined {
  for (let element: Element | null = from; element; element = element.parentElement) {
    if (!(element instanceof HTMLElement)) continue
    // The page's scroller is the window, whatever size its element is.
    const isPage = element === document.scrollingElement
    const box = element.getBoundingClientRect()
    const right = isPage ? window.innerWidth : box.right
    const bottom = isPage ? window.innerHeight : box.bottom
    const nearRight = x <= right && right - x <= REACH
    const nearBottom = y <= bottom && bottom - y <= REACH
    if (!nearRight && !nearBottom) continue

    const style = getComputedStyle(element)
    if (style.scrollbarWidth === 'none') continue
    const scrolls = (overflow: string) =>
      overflow === 'auto' || overflow === 'scroll' || (isPage && overflow === 'visible')
    if (nearRight && scrolls(style.overflowY) && element.scrollHeight > element.clientHeight) {
      return [element, 'overflowY', right - x]
    }
    if (nearBottom && scrolls(style.overflowX) && element.scrollWidth > element.clientWidth) {
      return [element, 'overflowX', bottom - y]
    }
  }
  return undefined
}

/** Runs inside a frame, so that frame lays the scroller out without its bar. */
function wake(element: HTMLElement, axis: Axis): void {
  const inline = element.style[axis]
  element.style[axis] = 'hidden'
  requestAnimationFrame(() => {
    element.style[axis] = inline
  })
}

/**
 * Lets the engine's own overlay bars through, where it draws them.
 *
 * Call it once, as the product starts. Where the engine draws a bar that takes
 * no width, this sets `data-scrollbars="overlay"` on the root, which takes the
 * theme's strip away and colours the engine's bar from the palette, and shows a
 * sleeping bar when a mouse comes to its edge. Anywhere else it does nothing and
 * the theme's strip stays.
 *
 * @returns Takes it all back: for a test, or a page that is leaving.
 */
export function overlayScrollbars(): () => void {
  if (typeof document === 'undefined' || !takesNoWidth()) return () => {}

  const root = document.documentElement
  root.dataset.scrollbars = 'overlay'

  let latest!: PointerEvent
  let frame = 0
  /** When each bar last came up on its own, by wake or by a scroll. */
  const shownAt = new WeakMap<EventTarget, number>()
  /** The bar the pointer is keeping up, which needs nothing from here. */
  let holding: HTMLElement | undefined

  const settle = () => {
    frame = 0
    const { target, clientX, clientY, timeStamp: now } = latest
    const bar = barAt(target as Element, clientX, clientY)

    // Up until this moment. If the pointer is still on it, that makes it new
    // enough to hold below; if not, it starts to fade from here.
    if (holding) shownAt.set(holding, now)
    holding = undefined
    if (!bar) return

    const [element, axis, distance] = bar
    const onIt = distance <= ON_THE_BAR
    const age = now - (shownAt.get(element) ?? -Infinity)
    if (onIt && age <= TAKEABLE) {
      holding = element
    } else if (onIt || age > GONE) {
      shownAt.set(element, now)
      wake(element, axis)
    }
  }

  const onMove = (event: PointerEvent) => {
    // A button held is the bar being dragged, or a selection. Making a new bar
    // would drop the one in the hand.
    if (event.pointerType !== 'mouse' || event.buttons !== 0) return
    latest = event
    if (!frame) frame = requestAnimationFrame(settle)
  }

  // A scroll brings a bar up by itself, and making a new one then would blink it.
  const onScroll = (event: Event) => {
    shownAt.set(event.target === document ? root : (event.target as EventTarget), event.timeStamp)
  }

  const listening = { capture: true, passive: true }
  document.addEventListener('pointermove', onMove, listening)
  document.addEventListener('scroll', onScroll, listening)
  return () => {
    document.removeEventListener('pointermove', onMove, listening)
    document.removeEventListener('scroll', onScroll, listening)
    cancelAnimationFrame(frame)
    delete root.dataset.scrollbars
  }
}
