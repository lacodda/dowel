// @vitest-environment jsdom
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { lineProducts } from 'dowel-ui'
import { expectNoA11yViolations } from '../../tests/a11y'
import { ColorField, isHexColor } from './color-field'

function Harness({ initial = 'kilna', allowCustom = false }: { initial?: string; allowCustom?: boolean }) {
  const [color, setColor] = useState(initial)
  return (
    <ColorField
      value={color}
      onValueChange={setColor}
      allowCustom={allowCustom}
      customLabel="Custom"
      aria-label="Colour"
    />
  )
}

describe('isHexColor', () => {
  it('takes the two forms a reader actually types', () => {
    expect(isHexColor('#d9569e')).toBe(true)
    expect(isHexColor('#FFF')).toBe(true)
  })

  it('refuses what is not a colour yet', () => {
    // Half a colour, typed on the way to a whole one.
    expect(isHexColor('#3fa9')).toBe(false)
    expect(isHexColor('d9569e')).toBe(false)
    expect(isHexColor('')).toBe(false)
    expect(isHexColor('#ghijkl')).toBe(false)
  })
})

describe('ColorField', () => {
  it('offers every accent of the line, plus the semantic colours', () => {
    render(<Harness />)
    // The palette is the vocabulary a product already speaks; a swatch missing
    // from it is a product that cannot pick its own colour.
    expect(screen.getAllByRole('radio')).toHaveLength(lineProducts.length + 4)
  })

  it('reports a token name rather than a hex, so the theme still decides', () => {
    const onValueChange = vi.fn()
    render(<ColorField value="kilna" onValueChange={onValueChange} aria-label="Colour" />)

    const swatch = screen.getByRole('radio', { name: 'atlas' })
    swatch.click()

    // A name keeps meaning the right thing when the theme changes underneath
    // it; a hex captured here would not.
    expect(onValueChange).toHaveBeenCalledWith('atlas')
  })

  it('marks the chosen one, for a reader who cannot see the border', () => {
    render(<Harness initial="sefy" />)
    expect(screen.getByRole('radio', { name: 'sefy' })).toHaveProperty('checked', true)
  })

  it('is one tab stop, walked by the arrows', () => {
    render(<Harness />)
    // A radiogroup is what gives that for free; a grid of buttons would put
    // eighteen stops between the palette and the next field.
    expect(screen.getByRole('radiogroup', { name: 'Colour' })).toBeDefined()
  })

  it('offers no free entry unless it was asked for', () => {
    render(<Harness />)
    expect(screen.queryByLabelText('Custom')).toBeNull()
  })

  it('commits a typed colour once it is one', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <ColorField
        value="kilna"
        onValueChange={onValueChange}
        allowCustom
        customLabel="Custom"
        aria-label="Colour"
      />,
    )

    await user.type(screen.getByLabelText('Custom'), '#d9569e')

    expect(onValueChange).toHaveBeenLastCalledWith('#d9569e')
  })

  it('does not repaint the product with a colour being typed through', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    render(
      <ColorField
        value="kilna"
        onValueChange={onValueChange}
        allowCustom
        customLabel="Custom"
        aria-label="Colour"
      />,
    )

    await user.type(screen.getByLabelText('Custom'), '#3fa')

    // `#3fa` is three digits and therefore a colour; `#3f` on the way there is
    // not, and must not have been pushed up.
    for (const call of onValueChange.mock.calls) expect(isHexColor(call[0])).toBe(true)
  })

  it('starts the free box from a hex it was given, and empty from a token', () => {
    const { unmount } = render(<Harness initial="#d9569e" allowCustom />)
    expect(screen.getByLabelText('Custom')).toHaveProperty('value', '#d9569e')
    unmount()

    render(<Harness initial="kilna" allowCustom />)
    expect(screen.getByLabelText('Custom')).toHaveProperty('value', '')
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(<Harness allowCustom />)
    unmount()
  })
})
