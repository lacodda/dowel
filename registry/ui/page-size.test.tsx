// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PageSize } from './page-size'

/*
 * PageSize.
 *
 * Two properties, and both are about the seam rather than the widget: it must
 * not be a native `<select>`, and it must hand back a number.
 */

describe('how many rows to a page', () => {
  it('renders no native select, which is the line-wide rule', () => {
    // The control most likely to reintroduce one: three numbers in a box,
    // which looks like the case where it would not matter.
    const { container } = render(
      <PageSize pageSize={25} onPageSizeChange={vi.fn()} label="Rows per page" />,
    )
    expect(container.querySelector('select')).toBeNull()
  })

  it('hands back a number, not the text of one', async () => {
    // The trigger's value is a string because that is what a Select carries;
    // a caller receiving `"50"` would put it in `OFFSET n * pageSize` and get
    // string concatenation.
    const onPageSizeChange = vi.fn()
    render(<PageSize pageSize={25} onPageSizeChange={onPageSizeChange} label="Rows per page" />)

    await userEvent.click(screen.getByRole('combobox', { name: 'Rows per page' }))
    await userEvent.click(await screen.findByRole('option', { name: '50' }))

    expect(onPageSizeChange).toHaveBeenCalledWith(50)
  })
})
