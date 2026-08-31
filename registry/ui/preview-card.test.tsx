// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
  previewCardPopupVariants,
} from './preview-card'

/*
 * PreviewCard.
 *
 * Two things are worth holding down here, and neither is how it looks.
 *
 * The first is that the trigger stays a real link. The card is a shortcut for
 * people who can see it; the link is what everyone else uses, and a component
 * that quietly turned the anchor into a `<div>` would take that away without
 * anything looking wrong.
 *
 * The second is the same finding as Tooltip: Base UI treats this as a visual
 * enhancement, so the card is not announced. The last test pins that down, and
 * it is the reason the docs page says nothing in the card may be the only
 * place it appears.
 */

function Card() {
  return (
    <PreviewCard>
      <PreviewCardTrigger render={<a href="/people/ada" />}>Ada Lovelace</PreviewCardTrigger>
      <PreviewCardPopup>
        <p>Wrote the first algorithm intended for a machine.</p>
      </PreviewCardPopup>
    </PreviewCard>
  )
}

describe('PreviewCard', () => {
  it('is closed until the link is hovered', () => {
    render(<Card />)
    expect(screen.queryByText('Wrote the first algorithm intended for a machine.')).toBeNull()
  })

  it('keeps the trigger a real link', () => {
    // The part that has to survive. The card reaches sighted mouse and
    // keyboard users only, so the anchor underneath is what everybody else
    // gets: it navigates, it opens in a new tab, and a screen reader announces
    // it as a link rather than as something unnameable.
    render(<Card />)
    const link = screen.getByRole('link', { name: 'Ada Lovelace' })
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toBe('/people/ada')
  })

  it('opens on hover', async () => {
    const user = userEvent.setup()
    render(
      <PreviewCard>
        <PreviewCardTrigger render={<a href="/people/ada" />} delay={0}>
          Ada Lovelace
        </PreviewCardTrigger>
        <PreviewCardPopup>
          <p>Wrote the first algorithm intended for a machine.</p>
        </PreviewCardPopup>
      </PreviewCard>,
    )

    await user.hover(screen.getByRole('link', { name: 'Ada Lovelace' }))
    await waitFor(() =>
      expect(screen.getByText('Wrote the first algorithm intended for a machine.')).toBeDefined(),
    )
  })

  it('opens on focus, so the keyboard can see it too', async () => {
    // A preview reachable only by pointer is a preview half the readers never
    // get. The link is tabbable, so focusing it has to be enough.
    const user = userEvent.setup()
    render(
      <PreviewCard>
        <PreviewCardTrigger render={<a href="/people/ada" />} delay={0}>
          Ada Lovelace
        </PreviewCardTrigger>
        <PreviewCardPopup>
          <p>Wrote the first algorithm intended for a machine.</p>
        </PreviewCardPopup>
      </PreviewCard>,
    )

    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Ada Lovelace' }))
    await waitFor(() =>
      expect(screen.getByText('Wrote the first algorithm intended for a machine.')).toBeDefined(),
    )
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(
      <PreviewCard>
        <PreviewCardTrigger render={<a href="/people/ada" />} delay={0}>
          Ada Lovelace
        </PreviewCardTrigger>
        <PreviewCardPopup>
          <p>Wrote the first algorithm intended for a machine.</p>
        </PreviewCardPopup>
      </PreviewCard>,
    )

    await user.tab()
    await waitFor(() =>
      expect(screen.getByText('Wrote the first algorithm intended for a machine.')).toBeDefined(),
    )
    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByText('Wrote the first algorithm intended for a machine.')).toBeNull(),
    )
  })

  it('holds content that can be clicked into', async () => {
    // The difference from Tooltip. A preview card is hoverable: the pointer
    // travels from the link into the card without it disappearing, so a link
    // inside it is reachable rather than decorative.
    render(
      <PreviewCard open>
        <PreviewCardTrigger render={<a href="/people/ada" />}>Ada Lovelace</PreviewCardTrigger>
        <PreviewCardPopup>
          <a href="/people/ada/notes">Read the notes</a>
        </PreviewCardPopup>
      </PreviewCard>,
    )

    expect(screen.getByRole('link', { name: 'Read the notes' })).toBeDefined()
  })

  it('is a visual enhancement, so it is not announced', async () => {
    // The same finding as Tooltip, and Base UI's own guidance: the card is not
    // reachable on a touch screen and is not in the accessibility tree as a
    // named region. Which is why nothing in it may be the only place it
    // appears - everything here has to be on the page the link goes to.
    //
    // If this starts failing because Base UI wired a role up, that is a change
    // in what the component promises, not a broken test.
    render(
      <PreviewCard open>
        <PreviewCardTrigger render={<a href="/people/ada" />}>Ada Lovelace</PreviewCardTrigger>
        <PreviewCardPopup>
          <p>Wrote the first algorithm intended for a machine.</p>
        </PreviewCardPopup>
      </PreviewCard>,
    )

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('link', { name: 'Ada Lovelace' }).getAttribute('aria-describedby')).toBeNull()
  })

  it('draws every size, and draws each one differently', () => {
    const base = previewCardPopupVariants({ size: 'nonexistent' as never })
    const sizes = ['sm', 'md', 'lg'] as const
    const drawn = new Map(sizes.map((size) => [size, previewCardPopupVariants({ size })]))

    for (const [size, classes] of drawn) {
      expect(classes, `\`${size}\` adds nothing - is it still defined?`).not.toBe(base)
    }
    expect(new Set(drawn.values()).size, 'two sizes draw the same').toBe(sizes.length)
  })

  it('lets the caller win a conflict', () => {
    render(
      <PreviewCard open>
        <PreviewCardTrigger render={<a href="/people/ada" />}>Ada Lovelace</PreviewCardTrigger>
        <PreviewCardPopup className="rounded-full">
          <p>Wrote the first algorithm intended for a machine.</p>
        </PreviewCardPopup>
      </PreviewCard>,
    )

    const popup = screen.getByText('Wrote the first algorithm intended for a machine.')
      .parentElement!
    expect(popup.className).toContain('rounded-full')
  })

  it('carries no colour outside the vocabulary', () => {
    const all = (['sm', 'md', 'lg'] as const)
      .map((size) => previewCardPopupVariants({ size }))
      .join(' ')
    expect(all).not.toMatch(/\bdark:/)
    expect(all).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('passes axe when open', async () => {
    await expectNoA11yViolations(
      <PreviewCard open>
        <PreviewCardTrigger render={<a href="/people/ada" />}>Ada Lovelace</PreviewCardTrigger>
        <PreviewCardPopup>
          <p>Wrote the first algorithm intended for a machine.</p>
          <a href="/people/ada/notes">Read the notes</a>
        </PreviewCardPopup>
      </PreviewCard>,
    )
  })
})
