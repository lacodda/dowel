// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Button, buttonVariants } from './button'

/*
 * Button.
 *
 * What is worth testing in a component whose job is mostly class names: that
 * it is a real button (keyboard, form semantics, disabled state), that the
 * caller can override what it draws, and that it carries no colour of its own
 * outside the vocabulary.
 */

describe('as a button', () => {
  it('renders what it is given', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDefined()
  })

  it('does not submit a form it did not ask to', () => {
    // A bare `<button>` inside a form defaults to `type="submit"`, which
    // surprises everyone exactly once.
    render(<Button>Cancel</Button>)
    expect(screen.getByRole('button')).toHaveProperty('type', 'button')
  })

  it('still submits when asked to', () => {
    render(<Button type="submit">Save</Button>)
    expect(screen.getByRole('button')).toHaveProperty('type', 'submit')
  })

  it('responds to the keyboard, because it is a real button', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)

    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByRole('button'))

    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('ignores clicks while disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    )

    await userEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('is skipped by the keyboard while disabled', async () => {
    render(<Button disabled>Save</Button>)
    await userEvent.tab()
    expect(document.activeElement).not.toBe(screen.getByRole('button'))
  })
})

describe('as something else', () => {
  it('renders the element it is given, keeping the styling', () => {
    // A link that should look like a button is still a link: it navigates, it
    // can be opened in a new tab, and a screen reader announces it correctly.
    render(
      <Button render={<a href="/somewhere" />} variant="primary">
        Go
      </Button>,
    )

    const link = screen.getByRole('link', { name: 'Go' })
    expect(link.getAttribute('href')).toBe('/somewhere')
    expect(link.className).toContain('bg-accent')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('does not force a button type onto something that is not a button', () => {
    // `type` belongs to `<button>`. On an anchor it is a content-type hint
    // about the link target, so putting `button` there is not merely useless -
    // it is a small lie about what is on the other end.
    render(<Button render={<a href="/somewhere" />}>Go</Button>)
    expect(screen.getByRole('link').getAttribute('type')).toBeNull()
  })

  it('takes a function when the caller needs the props first', () => {
    // The other shape `render` accepts. Rare, but it is what makes the prop
    // able to compose with something that wraps its own element.
    render(
      <Button render={(props) => <a {...props} href="/somewhere" data-probe="yes" />}>Go</Button>,
    )
    const link = screen.getByRole('link', { name: 'Go' })
    expect(link.getAttribute('data-probe')).toBe('yes')
    expect(link.className).toContain('rounded-md')
  })
})

describe('styling', () => {
  it('lets the caller win a conflict', () => {
    // `cn` resolves by utility group, so a caller passing `rounded-full` gets
    // it rather than two radii fighting over source order.
    render(<Button className="rounded-full">Save</Button>)
    const className = screen.getByRole('button').className
    expect(className).toContain('rounded-full')
    expect(className).not.toContain('rounded-md')
  })

  it('defaults to the quiet variant', () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole('button').className).toContain('text-dim')
  })

  it('draws every variant and size, and draws each one differently', () => {
    // Two failures to catch, and "produces something" catches neither. `cva`
    // returns *just the base classes* for a variant it does not know, so a
    // deleted variant still yields a truthy string; and two variants defined
    // identically are a copy-paste nobody notices. So: each must add something
    // to the base, and no two may add the same thing.
    const base = buttonVariants({ variant: 'nonexistent' as never, size: 'nonexistent' as never })

    const variants = ['primary', 'ghost', 'soft', 'danger', 'icon'] as const
    const added = new Map(
      variants.map((variant) => [variant, buttonVariants({ variant, size: 'nonexistent' as never })]),
    )
    for (const [variant, drawn] of added) {
      expect(drawn, `\`${variant}\` adds nothing - is it still defined?`).not.toBe(base)
    }
    expect(new Set(added.values()).size, 'two variants draw the same').toBe(variants.length)

    const sizes = ['sm', 'md', 'icon-sm', 'icon-md'] as const
    const sized = new Map(
      sizes.map((size) => [size, buttonVariants({ variant: 'nonexistent' as never, size })]),
    )
    for (const [size, drawn] of sized) {
      expect(drawn, `\`${size}\` adds nothing - is it still defined?`).not.toBe(base)
    }
    expect(new Set(sized.values()).size, 'two sizes draw the same').toBe(sizes.length)
  })

  it('stops the pointer reaching a disabled button', () => {
    // React will not fire the click either way, so a click test passes
    // regardless. What this guards is the rest of it: without
    // `pointer-events-none` a disabled button still takes the cursor and
    // still lights up on hover, which says "press me" to the one person who
    // cannot.
    render(<Button disabled>Save</Button>)
    expect(screen.getByRole('button').className).toContain('disabled:pointer-events-none')
  })

  it('carries no colour outside the vocabulary', () => {
    // The rule the whole system rests on: a primitive never writes a raw
    // colour and never uses a `dark:` utility, because the theme swaps the
    // token underneath instead.
    const everyCombination = (['primary', 'ghost', 'soft', 'danger', 'icon'] as const)
      .flatMap((variant) =>
        (['sm', 'md', 'icon-sm', 'icon-md'] as const).map((size) => buttonVariants({ variant, size })),
      )
      .join(' ')

    expect(everyCombination, 'a `dark:` utility means the theme is not doing its job').not.toMatch(/\bdark:/)
    expect(everyCombination, 'a raw hex colour').not.toMatch(/#[0-9a-f]{3,8}\b/i)
    // Stock Tailwind palette names: the theme drops them, so one here would
    // not even compile.
    expect(everyCombination).not.toMatch(/\b(?:bg|text|border)-(?:zinc|slate|gray|neutral|stone|red|blue)-\d/)
  })

  it('carries no text of its own', () => {
    // A primitive with a string in it cannot be translated.
    const { container } = render(<Button>Save</Button>)
    expect(container.textContent).toBe('Save')
  })
})

describe('Button, for a reader and a keyboard', () => {
  it('passes axe in every variant', async () => {
    for (const variant of ['primary', 'ghost', 'soft', 'danger'] as const) {
      const { unmount } = await expectNoA11yViolations(<Button variant={variant}>Save</Button>)
      unmount()
    }
  })

  it('passes axe as an icon button, given a name', async () => {
    // An icon button without one is the single most common failure in a
    // component library, and axe reports it - which is checked by the helper's
    // own test rather than by weakening this one.
    await expectNoA11yViolations(
      <Button size="icon-sm" aria-label="Close">
        <svg aria-hidden />
      </Button>,
    )
  })

  it('takes focus by Tab and fires on Enter and Space', async () => {
    // The three things a button must do that a styled `<div>` does not.
    const user = userEvent.setup()
    const pressed: string[] = []
    render(<Button onClick={() => pressed.push('click')}>Save</Button>)

    await user.tab()
    expect(document.activeElement).toBe(screen.getByRole('button'))

    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(pressed).toEqual(['click', 'click'])
  })

  it('is skipped by Tab when disabled, and cannot be pressed', async () => {
    const user = userEvent.setup()
    const pressed: string[] = []
    render(
      <Button disabled onClick={() => pressed.push('click')}>
        Save
      </Button>,
    )

    await user.tab()
    expect(document.activeElement).not.toBe(screen.getByRole('button'))
    await user.click(screen.getByRole('button'))
    expect(pressed).toEqual([])
  })

  it('is still a link when rendered as one', async () => {
    // `render` exists so a link can look like a button. If it stopped being a
    // link, it would lose the middle click, the context menu and the
    // announcement - which is the whole reason not to paint a button instead.
    await expectNoA11yViolations(
      <Button render={<a href="/somewhere" />} variant="primary">
        Go
      </Button>,
    )
    expect(screen.getByRole('link')).toBeDefined()
  })
})
