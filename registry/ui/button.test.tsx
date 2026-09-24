// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { compileClasses, utilityRules } from '../../tests/compile'
import { Button, buttonVariants } from './button'

const SIZES = ['xs', 'sm', 'md', 'icon-xs', 'icon-sm', 'icon-md'] as const

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

    const sizes = SIZES
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
        SIZES.map((size) => buttonVariants({ variant, size })),
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

describe('the icon inside', () => {
  /*
   * What each size draws an icon at, in pixels. The failure this exists for
   * is the one the whole line shipped: a text button that sized nothing, so a
   * lucide icon inside it drew at its own 24px - taller than the text it sat
   * beside - and every call site either remembered `size-4` or did not.
   */
  const ICON: Record<(typeof SIZES)[number], number> = {
    xs: 12,
    sm: 14,
    md: 16,
    'icon-xs': 12,
    'icon-sm': 14,
    'icon-md': 16,
  }

  /** The one compiled rule that sizes an svg inside a button of this size. */
  async function iconRule(size: (typeof SIZES)[number]) {
    const css = await compileClasses(buttonVariants({ size }).split(/\s+/))
    return utilityRules(css).filter((rule) => /\bsvg\b/.test(rule.selector) && /\bwidth:/.test(rule.body))
  }

  const svg = (className?: string) => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    if (className) element.setAttribute('class', className)
    return element
  }

  it.each(SIZES)('%s sizes an icon that has no size of its own', async (size) => {
    const rules = await iconRule(size)
    expect(rules, `\`${size}\` sizes no svg - an icon inside draws at its own 24px`).toHaveLength(1)
    const step = Number(rules[0]!.body.match(/width:\s*calc\(var\(--spacing\)\s*\*\s*([\d.]+)\)/)?.[1])
    // A spacing step is 0.25rem; at the browser's 16px that is 4px.
    expect(step * 4).toBe(ICON[size])
  })

  it.each(SIZES)('%s leaves an icon with its own size alone', async (size) => {
    // A descendant selector outranks the single class written on the icon,
    // so without the guard `size-5` at the call site is silently overruled.
    // The selector the compiler wrote is matched against two real svgs: one
    // it must reach, and one it must not.
    const [rule] = await iconRule(size)
    const target = rule!.selector.slice(rule!.selector.lastIndexOf(' ') + 1)
    expect(svg('lucide lucide-plus').matches(target), `\`${size}\` does not reach a bare icon`).toBe(true)
    expect(svg('lucide lucide-plus size-5').matches(target), `\`${size}\` overrules an icon's own size`).toBe(false)
  })

  it('stands md and sm on the control rows, so density reaches them', async () => {
    // A literal `h-9` compiles to 36px and nothing on a container can move
    // it; the row is a custom property an ancestor redefines.
    for (const [size, row] of [
      ['md', '--row-control'],
      ['sm', '--row-control-sm'],
    ] as const) {
      const css = await compileClasses(buttonVariants({ size }).split(/\s+/))
      // The button's own height, not the icon's.
      const heights = utilityRules(css).filter(
        (rule) => !/\bsvg\b/.test(rule.selector) && /(?:^|;)\s*height:/.test(rule.body),
      )
      expect(heights.map((rule) => rule.body), `\`${size}\` is not on its control row`).toEqual([
        `height: var(${row});`,
      ])
    }
  })

  it('grows the hit area of the sizes below the pointer floor', () => {
    // 24px is the floor (WCAG 2.5.8). `xs` is 24 tall and may be narrower;
    // `icon-xs` is 20 square. Both keep the glyph and grow the target.
    expect(buttonVariants({ size: 'xs' }).split(/\s+/)).toContain('target-min')
    expect(buttonVariants({ size: 'icon-xs' }).split(/\s+/)).toContain('target-min')
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
