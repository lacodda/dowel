// @vitest-environment jsdom
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { TagInput } from './tag-input'

/** The field is controlled, and half of what it does is only visible across a
 * commit - so the tests drive the real thing rather than a stub that cannot
 * refuse a duplicate. */
function Harness({ initial = [], max }: { initial?: string[]; max?: number }) {
  const [tags, setTags] = useState<string[]>(initial)
  return (
    <TagInput
      value={tags}
      onValueChange={setTags}
      max={max}
      aria-label="Tags"
      placeholder="Add a tag"
      removeLabel={(tag) => `Remove ${tag}`}
    />
  )
}

describe('TagInput', () => {
  it('turns what was typed into a tag on Enter', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByLabelText('Tags'), 'documentation{Enter}')

    expect(screen.getByText('documentation')).toBeDefined()
    // And the box is ready for the next word rather than still holding it.
    expect(screen.getByLabelText('Tags')).toHaveProperty('value', '')
  })

  it('commits what is left in the box when focus leaves', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByLabelText('Tags'), 'draft')
    await user.tab()

    // A word typed and not committed is a word the reader believes they
    // entered; losing it on the way to Save is the commonest complaint about
    // fields of this shape.
    expect(screen.getByText('draft')).toBeDefined()
  })

  it('removes the last tag when Backspace is pressed in an empty box', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['one', 'two']} />)

    await user.click(screen.getByLabelText('Tags'))
    await user.keyboard('{Backspace}')

    expect(screen.queryByText('two')).toBeNull()
    expect(screen.getByText('one')).toBeDefined()
  })

  it('leaves the tags alone when Backspace is deleting typed text', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['one']} />)

    await user.type(screen.getByLabelText('Tags'), 'ab{Backspace}')

    // The tag survives: Backspace belongs to the text until there is none.
    expect(screen.getByText('one')).toBeDefined()
    expect(screen.getByLabelText('Tags')).toHaveProperty('value', 'a')
  })

  it('refuses a duplicate rather than stacking it', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['one']} />)

    await user.type(screen.getByLabelText('Tags'), 'one{Enter}')

    expect(screen.getAllByText('one')).toHaveLength(1)
  })

  it('trims what it is given, and adds nothing for a blank', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const box = screen.getByLabelText('Tags')

    await user.type(box, '  spaced  {Enter}')

    /* Compared as an attribute, not through a query.
     *
     * Every text matcher in testing-library normalises whitespace first, so
     * both `getByText('spaced')` and `getByRole('button', { name: … })` are
     * just as happy with an untrimmed `"  spaced  "` - and they were: removing
     * `.trim()` from the component left all ten tests green twice over. The
     * remove label is built from the tag itself, so reading the raw attribute
     * is where the difference is actually visible. */
    expect(screen.getAllByRole('button')[0]?.getAttribute('aria-label')).toBe('Remove spaced')

    await user.type(box, '   {Enter}')
    // Only the first one: whitespace is not a tag.
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('stops accepting tags at the cap', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['one']} max={1} />)

    await user.type(screen.getByLabelText('Tags'), 'two{Enter}')

    expect(screen.queryByText('two')).toBeNull()
  })

  it('lets Enter reach the form when there is nothing to commit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <form onSubmit={onSubmit}>
        <Harness />
      </form>,
    )

    await user.click(screen.getByLabelText('Tags'))
    await user.keyboard('{Enter}')

    // Swallowing Enter unconditionally would break submitting by keyboard,
    // which is how a form is finished without a mouse.
    expect(onSubmit).toHaveBeenCalled()
  })

  it('names each remove button with the word the product gave', async () => {
    render(<Harness initial={['docs']} />)
    expect(screen.getByRole('button', { name: 'Remove docs' })).toBeDefined()
  })

  it('changes the height of the box a reader sees, not just its floor', () => {
    /* The container has `min-h-*` and the input inside it has a height of its
     * own; the second is what a reader actually sees. A size that moved only
     * the container moved nothing - measured on the stand, `sm` and `md` both
     * came out 38px because the input was `h-7` in all three, and
     * `tailwind-merge` does not help: `h-7` and `min-h-8` are different
     * properties, so both survive and the fixed one wins. */
    const heightOf = (size: 'sm' | 'md' | 'lg') => {
      // Unmounted between renders: testing-library mounts into one document,
      // and a second `render` leaves the first still in it.
      const view = render(
        <TagInput size={size} value={[]} onValueChange={() => {}} aria-label={size} removeLabel={(t) => t} />,
      )
      const found = view.container.querySelector('input')?.className.match(/h-\d+/)?.[0]
      view.unmount()
      return found
    }

    const small = heightOf('sm')
    const medium = heightOf('md')
    const large = heightOf('lg')

    expect(small, 'the input should carry a height').toBeDefined()
    expect(new Set([small, medium, large]).size, 'each size should give its own height').toBe(3)
  })

  it('has no accessibility violations', async () => {
    const { unmount } = await expectNoA11yViolations(<Harness initial={['one', 'two']} />)
    unmount()
  })
})
