// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { overlayScrollbars } from './scrollbars'

/*
 * What it decides and when. jsdom has no layout, so the engine's half is stubbed
 * here; what the engine does with it is measured in `tests/scrollbars.test.ts`,
 * in a browser with the bars shown.
 */

type Computed = { overflowX: string; overflowY: string; scrollbarWidth: string }

let frames: Map<number, FrameRequestCallback>
let nextFrame: number
let computed: Map<Element, Partial<Computed>>
let cleanups: Array<() => void>
const added: Element[] = []

/** Runs the frames that are waiting now, not the ones they ask for. */
function frame(): void {
  const waiting = [...frames.values()]
  frames.clear()
  for (const callback of waiting) callback(0)
}

/** The bar the engine draws, read through the probe: `width` is what it takes. */
function engineDraws(width: number): { probes: HTMLElement[] } {
  const probes: HTMLElement[] = []
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
    probes.push(this)
    return 100 + width
  })
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(100)
  return { probes }
}

function start(): () => void {
  const stop = overlayScrollbars()
  cleanups.push(stop)
  return stop
}

function scroller(
  rect: { right?: number; bottom?: number } = {},
  sizes: Partial<Record<'scrollHeight' | 'clientHeight' | 'scrollWidth' | 'clientWidth', number>> = {},
  style: Partial<Computed> = { overflowY: 'auto' },
): HTMLElement {
  const element = document.createElement('div')
  const all = { scrollHeight: 800, clientHeight: 100, scrollWidth: 200, clientWidth: 200, ...sizes }
  for (const [name, value] of Object.entries(all)) {
    Object.defineProperty(element, name, { configurable: true, value })
  }
  element.getBoundingClientRect = () => ({ right: 200, bottom: 100, ...rect }) as DOMRect
  computed.set(element, style)
  document.body.append(element)
  added.push(element)
  return element
}

function move(
  target: EventTarget,
  x: number,
  y: number,
  { at = 0, buttons = 0, pointerType = 'mouse' }: { at?: number; buttons?: number; pointerType?: string } = {},
): void {
  const event = new MouseEvent('pointermove', { bubbles: true, clientX: x, clientY: y, buttons })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  Object.defineProperty(event, 'timeStamp', { value: at })
  target.dispatchEvent(event)
}

/** Moved to the edge and given the frame in which a wake would start. */
function arrive(element: Element, x = 190, y = 50, at = 0): void {
  move(element, x, y, { at })
  frame()
}

const hidden = (element: HTMLElement) => element.style.overflowY === 'hidden'

beforeEach(() => {
  frames = new Map()
  nextFrame = 1
  computed = new Map()
  cleanups = []
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    const id = nextFrame++
    frames.set(id, callback)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    frames.delete(id)
  })
  vi.stubGlobal(
    'getComputedStyle',
    vi.fn((element: Element) => ({
      overflowX: 'visible',
      overflowY: 'visible',
      scrollbarWidth: 'auto',
      ...computed.get(element),
    })),
  )
})

afterEach(() => {
  for (const stop of cleanups) stop()
  for (const element of added.splice(0)) element.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('reading what the engine draws', () => {
  it('marks the root where the bar takes no width', () => {
    engineDraws(0)
    start()
    expect(document.documentElement.dataset.scrollbars).toBe('overlay')
  })

  it('leaves the theme’s strip where the bar takes any', () => {
    // The flag gone in a runtime update: the theme's rules have to stay, or the
    // product is left with a stock bar and its arrows.
    engineDraws(1)
    start()
    expect(document.documentElement.dataset.scrollbars).toBeUndefined()
  })

  it('reads a scrolling box in a shadow root, where the theme’s rules cannot reach', () => {
    const { probes } = engineDraws(0)
    start()
    expect(probes).toHaveLength(1)
    const probe = probes[0]!
    expect(probe.getRootNode()).toBeInstanceOf(ShadowRoot)
    expect(probe.style.overflow, 'a box that does not scroll has no bar to read').toBe('scroll')
    expect(probe.style.visibility).toBe('hidden')
    expect(probe.style.position, 'a box in the flow would move the page for that moment').toBe('fixed')
    expect(probe.style.width).toBe('100px')
    expect(probe.style.height).toBe('100px')
  })

  it('reads it in the document, and takes it away again', () => {
    let connected = false
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      connected = this.isConnected
      return 100
    })
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(100)
    const before = document.documentElement.childElementCount
    start()
    expect(connected, 'a box out of the document measures nothing').toBe(true)
    expect(document.documentElement.childElementCount).toBe(before)
  })
})

describe('with the theme’s strip staying', () => {
  it('does not listen for the pointer', () => {
    engineDraws(1)
    const listening = vi.spyOn(document, 'addEventListener')
    start()
    expect(listening).not.toHaveBeenCalled()
  })

  it('gives back something that does nothing', () => {
    engineDraws(1)
    const removing = vi.spyOn(document, 'removeEventListener')
    document.documentElement.dataset.scrollbars = 'set by something else'
    start()()
    expect(removing).not.toHaveBeenCalled()
    expect(document.documentElement.dataset.scrollbars).toBe('set by something else')
    delete document.documentElement.dataset.scrollbars
  })
})

describe('waking a sleeping bar', () => {
  beforeEach(() => {
    engineDraws(0)
  })

  it('takes the overflow away for one frame when a mouse comes to the edge', () => {
    start()
    const box = scroller()
    arrive(box)
    expect(hidden(box)).toBe(true)
    frame()
    expect(hidden(box)).toBe(false)
  })

  it('does it in a frame, not as the pointer moves', () => {
    start()
    const box = scroller()
    move(box, 190, 50)
    expect(hidden(box), 'layout read in an event handler is layout read on every move').toBe(false)
  })

  it('gives back what the element said itself', () => {
    start()
    const box = scroller()
    box.style.overflowY = 'scroll'
    arrive(box)
    frame()
    expect(box.style.overflowY).toBe('scroll')
  })

  it('reads the last place in a frame, once', () => {
    start()
    const box = scroller()
    const asking = vi.spyOn(globalThis, 'requestAnimationFrame')
    move(box, 10, 50)
    move(box, 190, 50)
    expect(asking).toHaveBeenCalledTimes(1)
    frame()
    expect(hidden(box)).toBe(true)
  })

  it('asks for a new frame after the last one ran', () => {
    start()
    const box = scroller()
    move(box, 10, 50)
    frame()
    expect(hidden(box)).toBe(false)
    move(box, 190, 50)
    frame()
    expect(hidden(box)).toBe(true)
  })

  it.each([
    ['at the right edge', 200, true],
    ['at the reach', 152, true],
    ['just beyond the reach', 151, false],
    ['past the edge', 201, false],
  ])('for a pointer %s', (_, x, wakes) => {
    start()
    const box = scroller()
    arrive(box, x, 50)
    expect(hidden(box)).toBe(wakes)
  })

  it.each([
    ['a finger', { pointerType: 'touch' }],
    ['a button held', { buttons: 1 }],
  ])('leaves it for %s', (_, options) => {
    // Under a held button this is the bar in the hand, and a new one would drop it.
    start()
    const box = scroller()
    move(box, 190, 50, options)
    frame()
    expect(hidden(box)).toBe(false)
  })

  it.each([
    ['nothing to scroll', { scrollHeight: 100 }, { overflowY: 'auto' }],
    ['overflow hidden', {}, { overflowY: 'hidden' }],
    ['overflow visible', {}, { overflowY: 'visible' }],
    ['the bar taken away', {}, { overflowY: 'auto', scrollbarWidth: 'none' }],
  ])('leaves a box with %s', (_, sizes, style) => {
    start()
    const box = scroller({}, sizes, style)
    arrive(box)
    expect(hidden(box)).toBe(false)
  })

  it('takes `overflow: scroll` for a scroller too', () => {
    start()
    const box = scroller({}, {}, { overflowY: 'scroll' })
    arrive(box)
    expect(hidden(box)).toBe(true)
  })

  it('wakes the horizontal bar by its own axis, at the bottom edge', () => {
    start()
    const box = scroller({ right: 1000, bottom: 100 }, { scrollWidth: 900 }, { overflowX: 'auto', overflowY: 'hidden' })
    arrive(box, 50, 95)
    expect(box.style.overflowX).toBe('hidden')
    expect(hidden(box)).toBe(false)
    frame()
    expect(box.style.overflowX).toBe('')
  })

  it('stops at the reach of the bottom edge as it does at the right', () => {
    start()
    const box = scroller({ right: 1000, bottom: 100 }, { scrollWidth: 900 }, { overflowX: 'auto' })
    arrive(box, 50, 51)
    expect(box.style.overflowX).toBe('')
    arrive(box, 50, 52)
    expect(box.style.overflowX).toBe('hidden')
    frame()
    arrive(box, 50, 101, 2000)
    expect(box.style.overflowX, 'past the bottom edge').toBe('')
  })

  it('takes the very bottom edge', () => {
    start()
    const box = scroller({ right: 1000, bottom: 100 }, { scrollWidth: 900 }, { overflowX: 'auto' })
    arrive(box, 50, 100)
    expect(box.style.overflowX).toBe('hidden')
  })

  it('leaves the horizontal bar of a box the pointer is by on the right', () => {
    start()
    const box = scroller({ right: 200, bottom: 1000 }, { scrollWidth: 900 }, { overflowX: 'auto', overflowY: 'hidden' })
    arrive(box, 190, 50)
    expect(box.style.overflowX).toBe('')
  })

  it('reads no style for a box the pointer is not by', () => {
    // It runs on every frame a mouse moves: the walk up the tree stays cheap only
    // while a box far from the pointer costs one rectangle.
    start()
    const box = scroller()
    const reading = vi.mocked(getComputedStyle)
    reading.mockClear()
    arrive(box, 10, 10)
    expect(reading).not.toHaveBeenCalled()
  })

  it('leaves an svg, which is no scroller whatever it reports', () => {
    start()
    const box = scroller()
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    icon.getBoundingClientRect = () => ({ right: 200, bottom: 100 }) as DOMRect
    Object.defineProperty(icon, 'scrollHeight', { value: 800 })
    Object.defineProperty(icon, 'clientHeight', { value: 100 })
    computed.set(icon, { overflowY: 'auto' })
    box.append(icon)
    arrive(icon)
    expect(icon.style.overflowY).toBe('')
    expect(hidden(box)).toBe(true)
  })

  it('leaves a horizontal scroller with nothing to scroll that way', () => {
    start()
    const box = scroller({ right: 1000 }, { scrollWidth: 200 }, { overflowX: 'auto' })
    arrive(box, 50, 95)
    expect(box.style.overflowX).toBe('')
  })

  it('leaves the bottom edge of a box that only scrolls down', () => {
    start()
    const box = scroller({ right: 1000 })
    arrive(box, 50, 95)
    expect(hidden(box)).toBe(false)
  })

  it('finds the scroller from anything inside it, across an svg', () => {
    start()
    const box = scroller()
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    icon.append(shape)
    box.append(icon)
    arrive(shape)
    expect(hidden(box)).toBe(true)
  })

  it('goes on past a box that does not scroll', () => {
    start()
    const outer = scroller()
    const inner = scroller({}, {}, { overflowY: 'visible' })
    outer.append(inner)
    arrive(inner)
    expect(hidden(outer)).toBe(true)
    expect(hidden(inner)).toBe(false)
  })

  it('takes the nearest of two scrollers and no more', () => {
    start()
    const outer = scroller()
    const inner = scroller()
    outer.append(inner)
    arrive(inner)
    expect(hidden(inner)).toBe(true)
    expect(hidden(outer)).toBe(false)
  })

  it('finds nothing on a pointer over the document itself', () => {
    start()
    expect(() => {
      move(document, 190, 50)
      frame()
    }).not.toThrow()
  })

  describe('the page’s own scroller', () => {
    const page = () => document.documentElement

    beforeEach(() => {
      Object.defineProperty(document, 'scrollingElement', { configurable: true, value: page() })
      Object.defineProperty(page(), 'scrollHeight', { configurable: true, value: 4000 })
      Object.defineProperty(page(), 'clientHeight', { configurable: true, value: 768 })
      vi.stubGlobal('innerWidth', 1000)
      vi.stubGlobal('innerHeight', 768)
    })

    afterEach(() => {
      Reflect.deleteProperty(document, 'scrollingElement')
      Reflect.deleteProperty(page(), 'scrollHeight')
      Reflect.deleteProperty(page(), 'clientHeight')
      page().style.overflowY = ''
    })

    it('measures from the window, and scrolls while its overflow is visible', () => {
      // Its element is as wide as the document, wherever that ends.
      page().getBoundingClientRect = () => ({ right: 5000, bottom: 5000 }) as DOMRect
      start()
      arrive(document.body, 990, 50)
      expect(page().style.overflowY).toBe('hidden')
    })

    it('stays at the window’s bottom edge for its horizontal bar', () => {
      page().getBoundingClientRect = () => ({ right: 5000, bottom: 5000 }) as DOMRect
      Object.defineProperty(page(), 'scrollWidth', { configurable: true, value: 3000 })
      computed.set(page(), { overflowY: 'hidden' })
      start()
      arrive(document.body, 50, 760)
      expect(page().style.overflowX).toBe('hidden')
      frame()
      page().style.overflowX = ''
      Reflect.deleteProperty(page(), 'scrollWidth')
    })

    it('leaves a page that says it does not scroll', () => {
      page().getBoundingClientRect = () => ({ right: 5000, bottom: 5000 }) as DOMRect
      computed.set(page(), { overflowY: 'hidden' })
      start()
      arrive(document.body, 990, 50)
      expect(page().style.overflowY).toBe('')
    })

    it('does not count a box with visible overflow as the page', () => {
      start()
      const box = scroller({}, {}, { overflowY: 'visible', overflowX: 'visible' })
      arrive(box)
      expect(hidden(box)).toBe(false)
    })
  })

  describe('after the first wake', () => {
    /** Inside the reach, and on the bar, for a box whose right edge is 200. */
    const FAR = 170
    const ON = 190

    it('needs nothing more once the pointer is on the bar in time', () => {
      start()
      const box = scroller()
      arrive(box, FAR, 50, 0)
      frame()
      arrive(box, ON, 50, 500)
      expect(hidden(box), 'exactly as long as it can be taken').toBe(false)
      arrive(box, ON, 60, 5000)
      expect(hidden(box), 'the engine is keeping this one up').toBe(false)
    })

    it('takes the bar at 14 pixels as being on it, and not at 15', () => {
      start()
      const box = scroller()
      arrive(box, FAR, 50, 0)
      frame()
      arrive(box, 186, 50, 100)
      arrive(box, 186, 50, 5000)
      expect(hidden(box), '14: held, so nothing to do').toBe(false)

      const other = scroller()
      arrive(other, FAR, 50, 6000)
      frame()
      arrive(other, 185, 50, 6100)
      arrive(other, 185, 50, 7001)
      expect(hidden(other), '15: not held, so it faded and comes up again').toBe(true)
    })

    it('makes it new for a pointer reaching it too late to take it', () => {
      start()
      const box = scroller()
      arrive(box, FAR, 50, 0)
      frame()
      arrive(box, ON, 50, 501)
      expect(hidden(box)).toBe(true)
    })

    it('holds it after that, for the next move', () => {
      start()
      const box = scroller()
      arrive(box, ON, 50, 0)
      frame()
      arrive(box, ON, 60, 100)
      arrive(box, ON, 70, 5000)
      expect(hidden(box)).toBe(false)
    })

    it('leaves it while a pointer moves off the bar, until it has faded from sight', () => {
      start()
      const box = scroller()
      arrive(box, FAR, 50, 0)
      frame()
      arrive(box, FAR, 60, 1000)
      expect(hidden(box), 'exactly as long as it takes to go').toBe(false)
      arrive(box, FAR, 70, 1001)
      expect(hidden(box)).toBe(true)
    })

    it('starts the fade when the pointer leaves the bar it held', () => {
      start()
      const box = scroller()
      arrive(box, FAR, 50, 0)
      frame()
      arrive(box, ON, 50, 100)
      arrive(box, FAR, 50, 5000)
      expect(hidden(box), 'it is only now starting to go').toBe(false)
      arrive(box, FAR, 60, 6000)
      expect(hidden(box)).toBe(false)
      arrive(box, FAR, 70, 6001)
      expect(hidden(box)).toBe(true)
    })

    it('starts the fade when the pointer leaves the scroller altogether', () => {
      start()
      const box = scroller()
      arrive(box, FAR, 50, 0)
      frame()
      arrive(box, ON, 50, 100)
      arrive(box, 10, 50, 5000)
      arrive(box, ON, 50, 5400)
      expect(hidden(box), 'back in time to take it').toBe(false)
    })

    it('holds a horizontal bar by its distance from the bottom edge', () => {
      start()
      const box = scroller({ right: 1000, bottom: 100 }, { scrollWidth: 900 }, { overflowX: 'auto' })
      arrive(box, 50, 70, 0)
      frame()
      arrive(box, 50, 95, 100)
      arrive(box, 50, 95, 5000)
      expect(box.style.overflowX).toBe('')
    })

    it('wakes the next scroller the pointer comes to', () => {
      start()
      const one = scroller()
      const two = scroller()
      arrive(one, FAR, 50, 0)
      frame()
      arrive(one, ON, 50, 100)
      arrive(two, FAR, 50, 200)
      expect(hidden(two)).toBe(true)
    })

    it('lets go of one bar when the pointer is on another', () => {
      start()
      const one = scroller()
      const two = scroller()
      arrive(one, FAR, 50, 0)
      frame()
      arrive(one, ON, 50, 100)
      arrive(two, ON, 50, 200)
      expect(hidden(two), 'a sleeping bar, under a pointer on it').toBe(true)
      frame()
      arrive(one, FAR, 50, 300)
      expect(hidden(one), 'it began to fade at 200, and that is not over').toBe(false)
    })

    it('does not make a new bar when a drag is let go', () => {
      start()
      const box = scroller()
      arrive(box, FAR, 50, 0)
      frame()
      arrive(box, ON, 50, 100)
      move(box, ON, 80, { at: 2000, buttons: 1 })
      frame()
      arrive(box, ON, 80, 2100)
      expect(hidden(box)).toBe(false)
    })
  })

  describe('a bar a scroll has brought up', () => {
    const scroll = (target: EventTarget, at: number) => {
      const event = new Event('scroll')
      Object.defineProperty(event, 'timeStamp', { value: at })
      target.dispatchEvent(event)
    }

    it('is left alone, because a new one would blink', () => {
      start()
      const box = scroller()
      scroll(box, 100)
      arrive(box, 170, 50, 200)
      expect(hidden(box)).toBe(false)
    })

    it('can be held from there', () => {
      start()
      const box = scroller()
      scroll(box, 100)
      arrive(box, 190, 50, 200)
      arrive(box, 190, 50, 5000)
      expect(hidden(box)).toBe(false)
    })

    it('comes up again once it has gone', () => {
      start()
      const box = scroller()
      scroll(box, 100)
      arrive(box, 170, 50, 1101)
      expect(hidden(box)).toBe(true)
    })

    it('is heard from a scroller, which a scroll does not bubble out of', () => {
      const listening = vi.spyOn(document, 'addEventListener')
      start()
      expect(listening).toHaveBeenCalledWith('scroll', expect.any(Function), { capture: true, passive: true })
    })

    it('counts for the page’s own bar when the document is what scrolled', () => {
      Object.defineProperty(document, 'scrollingElement', { configurable: true, value: document.documentElement })
      Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 4000 })
      Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: 768 })
      vi.stubGlobal('innerWidth', 1000)
      vi.stubGlobal('innerHeight', 768)
      document.documentElement.getBoundingClientRect = () => ({ right: 5000, bottom: 5000 }) as DOMRect
      start()
      scroll(document, 100)
      arrive(document.body, 990, 50, 200)
      expect(document.documentElement.style.overflowY).toBe('')
      Reflect.deleteProperty(document, 'scrollingElement')
      Reflect.deleteProperty(document.documentElement, 'scrollHeight')
      Reflect.deleteProperty(document.documentElement, 'clientHeight')
    })
  })

  describe('taking it back', () => {
    it('takes the mark off and stops listening', () => {
      const stop = start()
      const box = scroller()
      stop()
      expect(document.documentElement.dataset.scrollbars).toBeUndefined()
      move(box, 190, 50)
      expect(frames.size).toBe(0)
      frame()
      expect(hidden(box)).toBe(false)
    })

    it('drops a frame already asked for', () => {
      const stop = start()
      const box = scroller()
      move(box, 190, 50)
      stop()
      frame()
      expect(hidden(box)).toBe(false)
    })

    it('stops hearing scrolls too', () => {
      const stop = start()
      const box = scroller()
      const removing = vi.spyOn(document, 'removeEventListener')
      stop()
      expect(removing).toHaveBeenCalledWith('scroll', expect.any(Function), { capture: true, passive: true })
      expect(box.isConnected).toBe(true)
    })

    it('listens passively and first, so a scroller’s own handler cannot hide the move', () => {
      const listening = vi.spyOn(document, 'addEventListener')
      start()
      expect(listening).toHaveBeenCalledWith('pointermove', expect.any(Function), { capture: true, passive: true })
    })
  })
})
