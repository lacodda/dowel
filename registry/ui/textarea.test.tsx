// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Textarea } from './textarea'

/*
 * The auto-height is the only interesting part, and jsdom does no layout - it
 * reports `scrollHeight` as 0. So the measurement is driven by a stub.
 *
 * The stub has to behave the way a browser does, or it quietly removes the
 * behaviour under test. A real `scrollHeight` is the content height *or the
 * element's own height, whichever is larger* - which is precisely why the
 * component resets the height to `auto` before measuring. A stub returning a
 * constant reports the content height even for a box that has grown, so the
 * reset becomes unnecessary and deleting it goes unnoticed. It did: this stub
 * was a constant, and the mutation survived.
 */
function pretendContentHeight(px: number) {
  Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLTextAreaElement) {
      const own = Number.parseFloat(this.style.height)
      return Number.isNaN(own) ? px : Math.max(px, own)
    },
  })
}

beforeEach(() => {
  // Line height and padding, so the ceiling can be computed from `maxRows`.
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    lineHeight: '20px',
    paddingTop: '6px',
    paddingBottom: '6px',
    borderTopWidth: '1px',
    borderBottomWidth: '1px',
  } as unknown as CSSStyleDeclaration)
})

describe('Textarea', () => {
  it('is a real textarea', async () => {
    render(<Textarea placeholder="Notes" />)
    await userEvent.type(screen.getByPlaceholderText('Notes'), 'hello')
    expect((screen.getByPlaceholderText('Notes') as HTMLTextAreaElement).value).toBe('hello')
  })

  it('leaves the height alone unless asked', () => {
    pretendContentHeight(200)
    render(<Textarea placeholder="x" />)
    expect(screen.getByPlaceholderText('x').style.height).toBe('')
  })

  it('grows to fit the content', () => {
    pretendContentHeight(120)
    render(<Textarea autoResize placeholder="x" />)
    expect(screen.getByPlaceholderText('x').style.height).toBe('120px')
  })

  it('stops growing at maxRows and scrolls instead', () => {
    // Three rows: 3 * 20 + 6 + 6 + 1 + 1 = 74.
    pretendContentHeight(500)
    render(<Textarea autoResize maxRows={3} placeholder="x" />)

    const field = screen.getByPlaceholderText('x')
    expect(field.style.height).toBe('74px')
    expect(field.style.overflowY, 'a field at its ceiling has to scroll').toBe('auto')
  })

  it('does not scroll while it still fits', () => {
    pretendContentHeight(40)
    render(<Textarea autoResize maxRows={10} placeholder="x" />)
    expect(screen.getByPlaceholderText('x').style.overflowY).toBe('hidden')
  })

  it('shrinks again when the content shrinks', async () => {
    // The bug this guards: measuring without resetting the height first means
    // a box that has grown reports its own height and never comes back down.
    pretendContentHeight(200)
    const { rerender } = render(<Textarea autoResize value="lots" onChange={() => {}} placeholder="x" />)
    expect(screen.getByPlaceholderText('x').style.height).toBe('200px')

    pretendContentHeight(40)
    rerender(<Textarea autoResize value="a" onChange={() => {}} placeholder="x" />)
    expect(screen.getByPlaceholderText('x').style.height).toBe('40px')
  })

  it('still calls the caller"s onChange', async () => {
    pretendContentHeight(40)
    const onChange = vi.fn()
    render(<Textarea autoResize onChange={onChange} placeholder="x" />)
    await userEvent.type(screen.getByPlaceholderText('x'), 'a')
    expect(onChange).toHaveBeenCalled()
  })
})
