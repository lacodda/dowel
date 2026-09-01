// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Banner, bannerVariants } from './banner'

/*
 * Banner.
 *
 * The same shape as Alert - a strip with a slot at each end - so the same
 * things are worth pinning: the slots appear only when given, every tone
 * draws, the caller wins a conflict.
 *
 * Two things differ, and both are choices rather than looks.
 *
 * `role="status"` is a default here where Alert refuses to have one, because
 * a banner is nearly always already on the screen when it loads. `status` is
 * announced when it changes and stays quiet when it does not; `alert` would
 * interrupt the reader on every page load to tell them the build is a
 * preview. It is a default rather than a fixture because a product that
 * raises a banner in response to something - the connection just dropped -
 * has the other case, so the prop passes through.
 *
 * `sticky` is the one thing jsdom cannot see: `position: sticky` needs a
 * scroll container with a measured height, and jsdom measures every element
 * as zero. So what is asserted is the class list, which is the whole of what
 * the component decides; whether the strip actually stays put is the
 * browser's business and the stand's.
 */

const TONES = ['neutral', 'accent', 'good', 'warn', 'bad', 'info'] as const

describe('Banner', () => {
  it('renders what it is given', () => {
    render(<Banner>You are offline.</Banner>)
    expect(screen.getByText('You are offline.')).toBeDefined()
  })

  it('draws the slots it is given', () => {
    render(
      <Banner icon={<span data-testid="icon" />} action={<button type="button">Reload</button>}>
        A new version is ready.
      </Banner>,
    )
    expect(screen.getByTestId('icon')).toBeDefined()
    expect(screen.getByText('A new version is ready.')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Reload' })).toBeDefined()
  })

  it('draws no empty box for a slot it was not given', () => {
    // A banner with no action must not leave a `shrink-0` div behind it: the
    // strip is one line tall and an empty flex child steals the gap.
    const { container } = render(<Banner>You are offline.</Banner>)
    const root = container.firstElementChild!
    expect(root.children).toHaveLength(1)
    expect(root.textContent).toBe('You are offline.')
  })

  it('is a status region by default, so it is announced without interrupting', () => {
    render(<Banner>This build is a preview.</Banner>)
    expect(screen.getByRole('status').textContent).toBe('This build is a preview.')
  })

  it('takes the role the caller gives it', () => {
    // The product that raises a banner because something just happened needs
    // the urgent one, and the default must not be in its way.
    render(<Banner role="alert">The connection dropped.</Banner>)
    expect(screen.getByRole('alert').textContent).toBe('The connection dropped.')
  })

  it('pins itself when it is told to, and does not when it is not', () => {
    // Class list only - see the note at the top. `sticky: false` is an empty
    // string in the variants, so the check is the difference between the two,
    // not the presence of a word in one of them.
    const loose = bannerVariants({ sticky: false })
    const pinned = bannerVariants({ sticky: true })
    expect(pinned).not.toBe(loose)
    expect(pinned).toContain('sticky')
    expect(loose).not.toContain('sticky')

    const { container } = render(<Banner sticky>You are offline.</Banner>)
    expect(container.firstElementChild?.className).toContain('sticky')
  })

  it('draws every tone, and draws each one differently', () => {
    const base = bannerVariants({ tone: 'nonexistent' as never })
    const drawn = new Map(TONES.map((tone) => [tone, bannerVariants({ tone })]))

    for (const [tone, classes] of drawn) {
      expect(classes, `\`${tone}\` adds nothing - is it still defined?`).not.toBe(base)
    }
    expect(new Set(drawn.values()).size, 'two tones draw the same').toBe(TONES.length)
  })

  it('carries no colour outside the vocabulary', () => {
    const all = TONES.map((tone) => bannerVariants({ tone })).join(' ')
    expect(all).not.toMatch(/\bdark:/)
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('lets the caller win a conflict', () => {
    const { container } = render(<Banner className="border-b-0">You are offline.</Banner>)
    expect(container.firstElementChild?.className).toContain('border-b-0')
  })
})

describe('Banner, for a reader', () => {
  it('passes axe in every tone, with everything in it', async () => {
    for (const tone of TONES) {
      const { unmount } = await expectNoA11yViolations(
        <Banner tone={tone} icon={<span aria-hidden />} action={<button type="button">Reload</button>}>
          A new version is ready.
        </Banner>,
      )
      unmount()
    }
  })
})
