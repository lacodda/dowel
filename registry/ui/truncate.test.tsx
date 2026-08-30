// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Truncate } from './truncate'

describe('Truncate', () => {
  it('still shows the whole text somewhere', () => {
    // The part every hand-written version forgets: cutting text without a way
    // to read it is losing it.
    render(<Truncate>a very long path that will not fit</Truncate>)
    expect(screen.getByText(/a very long path/).getAttribute('title')).toBe(
      'a very long path that will not fit',
    )
  })

  it('lets the caller silence the tooltip', () => {
    // Where the full text is already on screen, the tooltip is noise.
    render(<Truncate title="">something</Truncate>)
    expect(screen.getByText('something').getAttribute('title')).toBe('')
  })

  it('cuts one line by default', () => {
    render(<Truncate>text</Truncate>)
    expect(screen.getByText('text').className).toContain('truncate')
  })

  it('clamps to several lines when asked', () => {
    // A different mechanism, not a different value: `truncate` is one line by
    // construction.
    render(<Truncate lines={3}>text</Truncate>)
    const element = screen.getByText('text')
    expect(element.className).not.toContain('truncate')
    expect(element.style.webkitLineClamp).toBe('3')
  })
})
