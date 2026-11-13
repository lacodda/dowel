// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { ReaderScreen, SLOPE, SWIPE, paragraphAt, swipeVerdict, type ReaderScreenProps } from './reader-screen'

/*
 * ReaderScreen.
 *
 * The two rules a reader stands on are plain functions - which paragraph is
 * being read, and what a finger's movement means - and are held as such. The
 * screen is held to using them: following the page, restoring the place once,
 * and listening for a sweep only from a finger.
 */

const TEXT = [
  'The tide came in at four.',
  'Nobody on the harbour wall had seen it come so fast.',
  'By five the boats were level with the road.',
  'By six the road was gone.',
]

function Reader(props: Partial<ReaderScreenProps>) {
  return (
    <ReaderScreen
      title="Tide tables"
      byline="Ines Duarte"
      count={TEXT.length}
      renderParagraph={(index) => TEXT[index]}
      words={{ progress: (at, count) => `Paragraph ${at} of ${count}` }}
      {...props}
    />
  )
}

const paragraph = (index: number) => document.querySelector<HTMLElement>(`[data-paragraph="${index}"]`)!

describe('which paragraph is being read', () => {
  it('is the last whose top has passed the middle of the window', () => {
    expect(paragraphAt([-300, -20, 180, 520], 400)).toBe(2)
    expect(paragraphAt([10, 399, 400, 900], 400)).toBe(1)
  })

  it('is the first when none has, and skips a paragraph not on the page', () => {
    expect(paragraphAt([500, 900], 400)).toBe(0)
    expect(paragraphAt([], 400)).toBe(0)
    expect(paragraphAt([100, null, 300], 400)).toBe(2)
    expect(paragraphAt([100, 200, null], 400)).toBe(1)
  })
})

describe('what a finger means', () => {
  const from = { x: 100, y: 100 }

  it('is a sweep once it has gone far enough to the right', () => {
    expect(swipeVerdict(from, 100 + SWIPE, 100)).toBe('swept')
    expect(swipeVerdict(from, 100 + SWIPE - 1, 100)).toBe('watching')
    expect(swipeVerdict(from, 100 + SWIPE, 100 + SLOPE)).toBe('swept')
  })

  it('is a scroll, and nothing, the moment it runs down the page', () => {
    expect(swipeVerdict(from, 100 + SWIPE * 3, 100 + SLOPE + 1)).toBe('abandon')
    expect(swipeVerdict(from, 100, 100 - SLOPE - 1)).toBe('abandon')
  })

  it('is nothing going back to the left', () => {
    expect(swipeVerdict(from, 100 - SLOPE - 1, 100)).toBe('abandon')
    expect(swipeVerdict(from, 100 - SLOPE, 100)).toBe('watching')
  })
})

describe('ReaderScreen', () => {
  beforeEach(() => {
    // A frame at once. Its handle is 0, as though it had already run: the
    // screen waits for no frame that never comes.
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 0
    })
  })
  afterEach(() => vi.restoreAllMocks())

  it('draws every paragraph the product draws, under a titled article', () => {
    render(<Reader />)
    const article = screen.getByRole('article', { name: 'Tide tables' })
    expect(article.querySelectorAll('p[data-paragraph]')).toHaveLength(4)
    expect(paragraph(2).textContent).toBe(TEXT[2])
    expect(screen.getByText('Ines Duarte')).toBeDefined()
  })

  it('sets the text at the reading measure', () => {
    render(<Reader />)
    const classes = paragraph(0).className.split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(['text-xl', 'leading-[1.75]', 'sm:text-lg', 'sm:leading-[1.8]', 'text-pretty']))
    // Room above a paragraph scrolled to.
    expect(classes).toContain('scroll-mt-18')
  })

  it('goes back to where the reader stopped, once', () => {
    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    const { rerender } = render(<Reader start={2} />)
    expect(scrolled).toHaveBeenCalledOnce()
    expect(scrolled.mock.contexts[0]).toBe(paragraph(2))
    expect(scrolled).toHaveBeenCalledWith({ block: 'start' })
    rerender(<Reader start={3} />)
    expect(scrolled).toHaveBeenCalledOnce()
  })

  it('stays at the top for a text opened at its start', () => {
    const scrolled = vi.fn()
    Element.prototype.scrollIntoView = scrolled
    render(<Reader start={0} />)
    render(<Reader start={null} />)
    render(<Reader />)
    expect(scrolled).not.toHaveBeenCalled()
  })

  it('follows the page and tells the product the paragraph being read, when it changes', () => {
    const onParagraphChange = vi.fn()
    render(<Reader onParagraphChange={onParagraphChange} />)
    const place = (tops: number[]) => {
      tops.forEach((top, index) => {
        vi.spyOn(paragraph(index), 'getBoundingClientRect').mockReturnValue({ top } as DOMRect)
      })
      act(() => {
        fireEvent.scroll(window)
      })
    }
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
    place([-200, 100, 500, 900])
    expect(onParagraphChange).toHaveBeenLastCalledWith(1)
    // The same paragraph again tells nothing.
    place([-250, 50, 450, 850])
    expect(onParagraphChange).toHaveBeenCalledTimes(1)
    place([-900, -600, 300, 700])
    expect(onParagraphChange).toHaveBeenLastCalledWith(2)
    // The bar says where the reader is.
    expect(screen.getByRole('progressbar', { name: 'Paragraph 3 of 4' })).toBeDefined()
  })

  it('follows the box it scrolls in, when that is not the window', () => {
    const onParagraphChange = vi.fn()
    render(
      <div data-testid="pane" style={{ overflowY: 'auto' }}>
        <Reader onParagraphChange={onParagraphChange} />
      </div>,
    )
    const pane = screen.getByTestId('pane')
    vi.spyOn(pane, 'getBoundingClientRect').mockReturnValue({ top: 100, height: 400 } as DOMRect)
    // The window's middle would be further down, past the third paragraph too.
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
    ;[50, 200, 290, 450].forEach((top, index) => {
      vi.spyOn(paragraph(index), 'getBoundingClientRect').mockReturnValue({ top } as DOMRect)
    })
    // The window's scroll is not the pane's.
    act(() => {
      fireEvent.scroll(window)
    })
    expect(onParagraphChange).not.toHaveBeenCalled()
    act(() => {
      fireEvent.scroll(pane)
    })
    // The pane's middle is 300 on the screen: the third paragraph's top is past it.
    expect(onParagraphChange).toHaveBeenLastCalledWith(2)
  })

  it('asks for one frame however many scrolls arrive before it, and lets go of everything when it goes', () => {
    vi.restoreAllMocks()
    const frames: FrameRequestCallback[] = []
    const request = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback)
      return frames.length
    })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    const onParagraphChange = vi.fn()
    const { unmount } = render(<Reader onParagraphChange={onParagraphChange} />)
    fireEvent.scroll(window)
    fireEvent.scroll(window)
    fireEvent.scroll(window)
    expect(request).toHaveBeenCalledTimes(1)
    // A frame still waiting when the screen goes is cancelled, and the
    // window's scroll is no longer listened to.
    unmount()
    expect(cancel).toHaveBeenCalledWith(1)
    fireEvent.scroll(window)
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('draws a byline and a lead only when given them', () => {
    const { unmount } = render(<Reader byline={undefined} />)
    expect(screen.getByRole('article').querySelector('header')!.children).toHaveLength(1)
    unmount()
    render(<Reader lead={<span>Read it aloud.</span>} />)
    const header = screen.getByRole('article').querySelector('header')!
    expect(header.children).toHaveLength(3)
    expect(header.lastElementChild!.textContent).toBe('Read it aloud.')
  })

  it('shows a text of no paragraphs as nothing read, on a bar that still has a scale', () => {
    render(<Reader count={0} />)
    const bar = screen.getByRole('progressbar', { name: 'Paragraph 1 of 0' })
    expect(bar.getAttribute('aria-valuenow')).toBe('0')
    expect(bar.getAttribute('aria-valuemax')).toBe('1')
  })

  it('counts the paragraph reached from one, out of all of them', () => {
    Element.prototype.scrollIntoView = vi.fn()
    render(<Reader start={2} />)
    const bar = screen.getByRole('progressbar')
    expect(bar.getAttribute('aria-valuenow')).toBe('3')
    expect(bar.getAttribute('aria-valuemax')).toBe('4')
  })

  it('starts the bar at the paragraph it was opened on', () => {
    Element.prototype.scrollIntoView = vi.fn()
    render(<Reader start={1} />)
    expect(screen.getByRole('progressbar', { name: 'Paragraph 2 of 4' })).toBeDefined()
  })

  it('hears a finger swept to the right across a paragraph', () => {
    const onSwipe = vi.fn()
    render(<Reader onSwipe={onSwipe} />)
    fireEvent.pointerDown(paragraph(2), { pointerType: 'touch', clientX: 20, clientY: 300 })
    fireEvent.pointerMove(paragraph(2), { pointerType: 'touch', clientX: 60, clientY: 305 })
    expect(onSwipe).not.toHaveBeenCalled()
    fireEvent.pointerMove(paragraph(2), { pointerType: 'touch', clientX: 20 + SWIPE, clientY: 305 })
    expect(onSwipe).toHaveBeenCalledWith(2)
    // Once per sweep.
    fireEvent.pointerMove(paragraph(2), { pointerType: 'touch', clientX: 20 + SWIPE * 2, clientY: 305 })
    expect(onSwipe).toHaveBeenCalledOnce()
    expect(paragraph(2).className).toContain('touch-pan-y')
  })

  it('hears no mouse, no scroll and no sweep that was let go', () => {
    const onSwipe = vi.fn()
    render(<Reader onSwipe={onSwipe} />)
    fireEvent.pointerDown(paragraph(1), { pointerType: 'mouse', clientX: 20, clientY: 300 })
    fireEvent.pointerMove(paragraph(1), { pointerType: 'mouse', clientX: 200, clientY: 300 })
    fireEvent.pointerDown(paragraph(1), { pointerType: 'touch', clientX: 20, clientY: 300 })
    fireEvent.pointerMove(paragraph(1), { pointerType: 'touch', clientX: 40, clientY: 400 })
    fireEvent.pointerMove(paragraph(1), { pointerType: 'touch', clientX: 200, clientY: 400 })
    fireEvent.pointerDown(paragraph(1), { pointerType: 'touch', clientX: 20, clientY: 300 })
    fireEvent.pointerUp(paragraph(1), { pointerType: 'touch', clientX: 30, clientY: 300 })
    fireEvent.pointerMove(paragraph(1), { pointerType: 'touch', clientX: 200, clientY: 300 })
    fireEvent.pointerDown(paragraph(1), { pointerType: 'touch', clientX: 20, clientY: 300 })
    fireEvent.pointerCancel(paragraph(1))
    fireEvent.pointerMove(paragraph(1), { pointerType: 'touch', clientX: 200, clientY: 300 })
    expect(onSwipe).not.toHaveBeenCalled()
  })

  it('leaves the page its sideways pan when nothing listens for a sweep', () => {
    render(<Reader />)
    expect(paragraph(0).className).not.toContain('touch-pan-y')
  })

  it('marks the paragraph it is told to', () => {
    render(<Reader marked={1} />)
    expect(paragraph(1).className).toContain('bg-accent-soft')
    expect(paragraph(0).className).not.toContain('bg-accent-soft')
  })

  it('stands its bar at the foot, with what the product keeps there', () => {
    render(<Reader foot={<button type="button">I know the rest</button>} after={<button type="button">I have read it</button>} />)
    const bar = screen.getByRole('progressbar').closest('.sticky')!
    expect(bar.className.split(/\s+/)).toEqual(expect.arrayContaining(['sticky', 'bottom-0', 'bg-bg']))
    expect(bar.textContent).toContain('I know the rest')
    expect(screen.getByRole('button', { name: 'I have read it' }).closest('.sticky')).toBeNull()
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Reader marked={0} foot={<span>3%</span>} />)
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe', async () => {
    await expectNoA11yViolations(<Reader lead={<p>Swipe a paragraph to the right when you know the rest of it.</p>} marked={2} />)
  })
})
