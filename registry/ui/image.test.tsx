// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { AspectRatio, Image, aspectRatioVariants, imageVariants } from './image'

describe('AspectRatio', () => {
  it('reserves its box on a named ratio', () => {
    // The whole point of the component is that the box exists before
    // anything is inside it - a class that fails to change is a ratio that
    // does nothing.
    expect(aspectRatioVariants({ ratio: 'square' })).toContain('aspect-square')
    expect(aspectRatioVariants({ ratio: 'video' })).toContain('aspect-video')
  })

  it('takes a raw number as a style rather than a class', () => {
    // Tailwind cannot generate `aspect-[4/3]` from a number it never saw at
    // build time, so a numeric ratio has to reach the element as `style`.
    render(<AspectRatio ratio={4 / 3} data-testid="box" />)
    // jsdom normalises a bare number into a `width / height` string; either
    // spelling proves the same thing, that it landed in `style` and not a class.
    expect(screen.getByTestId('box').style.aspectRatio).toContain(String(4 / 3))
  })

  it('lets a child fill it', () => {
    render(
      <AspectRatio ratio="square" data-testid="box">
        <div data-testid="child" className="size-full" />
      </AspectRatio>,
    )
    expect(screen.getByTestId('box').contains(screen.getByTestId('child'))).toBe(true)
  })

  it('lets the caller win a conflict', () => {
    render(<AspectRatio ratio="square" className="bg-accent" data-testid="box" />)
    expect(screen.getByTestId('box').className).toContain('bg-accent')
  })
})

describe('Image', () => {
  it('shows a placeholder until the picture loads', () => {
    // jsdom never actually loads `src`, so the only way it leaves the
    // loading state is the event this test fires by hand - if the component
    // stopped listening for `load`, this placeholder would stay forever.
    const { container } = render(<Image src="pic.png" alt="A mountain" />)
    expect(container.querySelector('.animate-pulse')).not.toBeNull()
  })

  it('hides the placeholder and shows the picture once load fires', () => {
    const { container } = render(<Image src="pic.png" alt="A mountain" />)
    const img = screen.getByRole('img', { hidden: true })
    fireEvent.load(img)
    expect(container.querySelector('.animate-pulse')).toBeNull()
    expect(img.className).toContain('opacity-100')
    expect(img.getAttribute('aria-hidden')).toBe('false')
  })

  it('shows the fallback instead of the browser glyph on error', () => {
    render(<Image src="broken.png" alt="A mountain" fallback="Could not load" />)
    const img = screen.getByRole('img', { hidden: true })
    fireEvent.error(img)
    // The `<img>` itself is removed rather than left to show the browser's
    // own broken-image icon.
    expect(screen.queryByRole('img', { hidden: true })).toBeNull()
    expect(screen.getByText('Could not load')).toBeDefined()
  })

  it('skips the placeholder when the picture is already complete on mount', () => {
    // The cached-image case: no `load` event ever fires because there is
    // nothing left to load, so the component has to notice `img.complete`
    // itself in an effect rather than wait for an event that already
    // happened.
    const originalComplete = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'complete')
    const originalWidth = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'naturalWidth')
    Object.defineProperty(HTMLImageElement.prototype, 'complete', { configurable: true, get: () => true })
    Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', { configurable: true, get: () => 200 })

    try {
      const { container } = render(<Image src="cached.png" alt="A mountain" />)
      expect(container.querySelector('.animate-pulse')).toBeNull()
      expect(screen.getByRole('img', { hidden: true }).className).toContain('opacity-100')
    } finally {
      if (originalComplete) Object.defineProperty(HTMLImageElement.prototype, 'complete', originalComplete)
      if (originalWidth) Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', originalWidth)
    }
  })

  it('passes alt through, required and all', () => {
    render(<Image src="pic.png" alt="A red bicycle" />)
    expect(screen.getByRole('img', { hidden: true }).getAttribute('alt')).toBe('A red bicycle')
  })

  it('accepts an empty alt for a decorative picture', () => {
    // An `<img alt="">` has no accessible `img` role of its own - that is the
    // point of an empty `alt` - so it is found by tag rather than by role.
    const { container } = render(<Image src="pic.png" alt="" />)
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('')
  })

  it('draws cover and contain differently', () => {
    expect(imageVariants({ fit: 'cover' })).toContain('object-cover')
    expect(imageVariants({ fit: 'contain' })).toContain('object-contain')
  })

  it('covers by default', () => {
    expect(imageVariants({})).toBe(imageVariants({ fit: 'cover' }))
  })

  it('lets the caller win a conflict', () => {
    render(<Image src="pic.png" alt="A mountain" className="bg-accent" />)
    expect(screen.getByRole('img', { hidden: true }).className).toContain('bg-accent')
  })
})

describe('Image and AspectRatio, for a reader', () => {
  it('passes axe loading and failed', async () => {
    for (const element of [
      <Image key="loading" src="pic.png" alt="A mountain" />,
      <Image key="failed" src="broken.png" alt="A mountain" fallback="Could not load" />,
    ]) {
      const { unmount } = await expectNoA11yViolations(element)
      unmount()
    }
  })

  it('passes axe once loaded', async () => {
    const { unmount } = await expectNoA11yViolations(<Image src="pic.png" alt="A mountain" />)
    fireEvent.load(screen.getByRole('img', { hidden: true }))
    unmount()
  })

  it('passes axe inside a ratio box', async () => {
    await expectNoA11yViolations(
      <AspectRatio ratio="video">
        <Image src="pic.png" alt="A mountain" className="absolute inset-0" />
      </AspectRatio>,
    )
  })
})
