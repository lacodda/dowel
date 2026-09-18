// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { compile } from 'tailwindcss'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Splash } from './splash'

/*
 * What has to be true of a splash.
 *
 * It is on screen for a second or two, so the failures that matter are the
 * ones that outlast it: a bar that sweeps for someone who asked for no motion,
 * a status nobody is told, a line drawn empty when the product had nothing to
 * say. Each is a picture that looks finished and is not.
 */

const mark = <svg viewBox="0 0 32 32" data-testid="mark" />

describe('Splash', () => {
  it('is a status region, so what it says is announced', () => {
    render(<Splash name="kilna" status="Opening the workspace" />)
    const region = screen.getByRole('status')
    expect(region.getAttribute('aria-live')).toBe('polite')
    expect(region.textContent).toContain('Opening the workspace')
  })

  it('shows the mark, the name, the promise and the version', () => {
    render(<Splash mark={mark} name="kilna" tagline="From raw idea to shipped work." version="v0.74.0" />)
    expect(screen.getByTestId('mark')).toBeDefined()
    expect(screen.getByText('kilna')).toBeDefined()
    expect(screen.getByText('From raw idea to shipped work.')).toBeDefined()
    expect(screen.getByText('v0.74.0')).toBeDefined()
  })

  it('draws no line it was not given', () => {
    // An empty `<p>` still takes its height, and the picture the page painted
    // before the bundle has no such line - the name would jump up by it.
    const { container } = render(<Splash name="kilna" />)
    expect(container.querySelectorAll('p').length).toBe(0)
  })

  it('shows the status and the tip when given', () => {
    render(<Splash name="kilna" status="Opening" tip="Ctrl+K finds anything." />)
    expect(screen.getByText('Opening')).toBeDefined()
    expect(screen.getByText('Ctrl+K finds anything.')).toBeDefined()
  })

  it('sweeps while busy, and defines the sweep it uses', () => {
    const { container } = render(<Splash name="kilna" />)
    const bar = container.querySelector('[data-sweep]')!
    expect(bar.getAttribute('data-sweep')).toBe('on')
    expect(bar.className).toContain('animate-[dowel-splash-sweep_')
    // The keyframes travel with the component: the theme does not carry them.
    expect(container.querySelector('style')?.textContent).toContain('@keyframes dowel-splash-sweep')
  })

  it('asks Tailwind for a sweep it can actually compile', async () => {
    /* The class was first assembled from a template literal, and Tailwind -
     * which finds its classes by scanning the source text - never generated
     * it: the bar had the right class name and no CSS behind it, and the
     * stand showed an empty track while this file stayed green. So the class
     * the component renders is handed to the real compiler, and the CSS it
     * produces has to name the keyframes the component defines. */
    const { container } = render(<Splash name="kilna" />)
    const classes = container.querySelector('[data-sweep]')!.className.split(/\s+/)
    const keyframes = container.querySelector('style')!.textContent!.match(/@keyframes ([\w-]+)/)![1]!

    const tailwind = resolve(import.meta.dirname, '../../node_modules/tailwindcss')
    const compiler = await compile("@import 'tailwindcss';", {
      base: tailwind,
      loadStylesheet: async (id, base) => {
        const file = id === 'tailwindcss' ? 'index.css' : id.replace(/^tailwindcss\//, '')
        return { base, content: readFileSync(resolve(tailwind, file), 'utf8'), path: resolve(tailwind, file) }
      },
    })
    const css = compiler.build(classes)
    expect(css, 'the sweep class compiles to nothing').toContain(`animation: ${keyframes} 1.1s`)
    // Two fifths, as the compiler writes it before minification - the exact
    // arithmetic is the compiler's, and the negative is the point.
    expect(css, 'the bar does not start off the track').toMatch(/\.-left-2\\\/5 \{\s*left: calc\(calc\(2 \/ 5 \* 100%\) \* -1\)/)
    expect(css, 'the bar has no width').toMatch(/\.w-2\\\/5 \{\s*width: calc\(2 \/ 5 \* 100%\)/)
  })

  it('stands still and full under reduced motion', () => {
    // The theme stops every animation dead under `prefers-reduced-motion`,
    // which would leave the sweep parked off the end of its track. The bar is
    // drawn full and still instead.
    const { container } = render(<Splash name="kilna" />)
    const className = container.querySelector('[data-sweep]')!.className
    expect(className).toContain('motion-reduce:animate-none')
    expect(className).toContain('motion-reduce:w-full')
    expect(className).toContain('motion-reduce:left-0')
  })

  it('stands still and full when not busy', () => {
    const { container } = render(<Splash name="kilna" busy={false} />)
    const bar = container.querySelector('[data-sweep]')!
    expect(bar.getAttribute('data-sweep')).toBe('off')
    expect(bar.className).not.toContain('animate-[')
    expect(bar.className).toContain('w-full')
  })

  it('lets the caller win a conflict', () => {
    // The stand draws it inside a box rather than over the window.
    const { container } = render(<Splash name="kilna" className="absolute" />)
    const className = container.firstElementChild!.className
    expect(className).toContain('absolute')
    expect(className).not.toContain('fixed')
  })

  it('carries no colour outside the vocabulary', () => {
    const { container } = render(<Splash mark={mark} name="kilna" version="v1" status="x" tip="y" />)
    expect(container.innerHTML).not.toMatch(/\bdark:/)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(
      <Splash mark={mark} name="kilna" tagline="From raw idea to shipped work." version="v0.74.0" status="Opening" tip="Tip" />,
    )
    unmount()
  })
})
