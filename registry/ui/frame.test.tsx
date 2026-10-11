// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { compileClasses, utilityRules } from '../../tests/compile'
import { Frame, ListDetail, ListDetailBack, Pane, useListDetailTurn } from './frame'

/*
 * Frame, Pane and ListDetail are class names arranged around three promises:
 * the column never scrolls, a pane's bars stand while its body scrolls, and
 * where there is no room for a list and its detail, exactly one of them is on
 * screen. jsdom lays nothing out, so the promises are asserted on the classes
 * that keep them - and the container queries on what Tailwind compiles them
 * to, because a variant spelled wrong compiles to nothing and looks fine.
 */

const classOf = (element: Element | null) => element?.getAttribute('class') ?? ''

describe('Frame', () => {
  it('draws the head, the body and the foot in order', () => {
    render(
      <Frame head={<span>head</span>} foot={<span>foot</span>}>
        <span>body</span>
      </Frame>,
    )
    const text = document.body.textContent
    expect(text).toBe('headbodyfoot')
  })

  it('scrolls nowhere, and lets its body shrink', () => {
    const { container } = render(
      <Frame head={<span>head</span>}>
        <span>body</span>
      </Frame>,
    )
    const frame = container.querySelector('[data-frame]')!
    // A column that scrolled took its head up with the content.
    expect(classOf(frame)).not.toMatch(/overflow-(y-)?(auto|scroll)/)
    expect(classOf(frame)).toContain('min-h-0')
    const body = screen.getByText('body').parentElement!
    expect(classOf(body), 'a body that cannot shrink pushes the foot off the window').toContain('min-h-0')
    expect(classOf(body)).toContain('flex-1')
  })

  it('draws no empty bars', () => {
    const { container } = render(
      <Frame>
        <span>body</span>
      </Frame>,
    )
    expect(container.querySelector('[data-frame]')!.children).toHaveLength(1)
  })

  it('lets the caller win a conflict', () => {
    const { container } = render(
      <Frame className="gap-4">
        <span>body</span>
      </Frame>,
    )
    expect(classOf(container.querySelector('[data-frame]'))).toContain('gap-4')
    expect(classOf(container.querySelector('[data-frame]'))).not.toContain('gap-2.5')
  })
})

describe('Pane', () => {
  it('names its scrolling body', () => {
    render(
      <Pane label="Works">
        <p>row</p>
      </Pane>,
    )
    expect(screen.getByRole('group', { name: 'Works' })).toBeDefined()
  })

  it('stands its bars outside the part that scrolls', () => {
    render(
      <Pane label="Works" head={<span>head</span>} foot={<span>foot</span>}>
        <p>row</p>
      </Pane>,
    )
    const body = screen.getByRole('group', { name: 'Works' })
    expect(body.contains(screen.getByText('row'))).toBe(true)
    expect(body.contains(screen.getByText('head'))).toBe(false)
    expect(body.contains(screen.getByText('foot'))).toBe(false)
  })

  it('scrolls down and never across', () => {
    // A row that should truncate to the column widened it instead, until the
    // axis was held.
    render(
      <Pane label="Works">
        <p>row</p>
      </Pane>,
    )
    expect((screen.getByRole('group', { name: 'Works' }) as HTMLElement).style.overflowX).toBe('hidden')
  })

  it('pads the body as asked', () => {
    render(
      <Pane label="Note" bodyClassName="p-4">
        <p>text</p>
      </Pane>,
    )
    expect(classOf(screen.getByText('text').parentElement)).toContain('p-4')
  })

  it('has no accessibility violations', async () => {
    await expectNoA11yViolations(
      <Pane label="Works" head={<span>Works</span>} foot={<span>3 works</span>}>
        <p>row</p>
      </Pane>,
    )
  })
})

describe('ListDetail', () => {
  const draw = (open: boolean, props: Partial<Parameters<typeof ListDetail>[0]> = {}) =>
    render(<ListDetail list={<span>list</span>} detail={<span>detail</span>} open={open} {...props} />)

  it('puts the list first, or last when asked', () => {
    draw(true)
    expect(document.body.textContent).toBe('listdetail')
    document.body.innerHTML = ''
    draw(true, { side: 'end' })
    expect(document.body.textContent).toBe('detaillist')
  })

  it('measures its own width, not the window', () => {
    const { container } = draw(false)
    expect(classOf(container.querySelector('[data-list-detail]'))).toContain('@container/list-detail')
  })

  /*
   * The narrow rule, both ways round. Each pair is the case it exists for:
   * nothing open shows the list, something open shows the detail - and never
   * both hidden, which would be a blank screen on a phone.
   */
  it('shows the list on a narrow screen while nothing is open', () => {
    const { container } = draw(false)
    expect(classOf(container.querySelector('[data-list]'))).not.toContain('@max-2xl/list-detail:hidden')
    expect(classOf(container.querySelector('[data-detail]'))).toContain('@max-2xl/list-detail:hidden')
    // And takes the whole width: a 264px column alone on a phone leaves a
    // third of the screen empty beside it.
    expect(classOf(container.querySelector('[data-list]'))).toContain('@max-2xl/list-detail:w-full')
  })

  it('shows the open thing alone on a narrow screen', () => {
    const { container } = draw(true)
    expect(classOf(container.querySelector('[data-list]'))).toContain('@max-2xl/list-detail:hidden')
    expect(classOf(container.querySelector('[data-detail]'))).not.toContain('@max-2xl/list-detail:hidden')
  })

  it('stands the list at one of two widths', () => {
    const { container } = draw(false)
    expect(classOf(container.querySelector('[data-list]'))).toContain('w-list')
    document.body.innerHTML = ''
    const rail = draw(false, { width: 'rail' })
    expect(classOf(rail.container.querySelector('[data-list]'))).toContain('w-rail')
  })

  it('says what is open, for a stylesheet or a test', () => {
    const { container, rerender } = draw(false)
    expect(container.querySelector('[data-list-detail]')!.hasAttribute('data-open')).toBe(false)
    rerender(<ListDetail list={<span>list</span>} detail={<span>detail</span>} open />)
    expect(container.querySelector('[data-list-detail]')!.hasAttribute('data-open')).toBe(true)
  })

  it('compiles the narrow rule to a container query on its own container', async () => {
    const css = await compileClasses([
      '@container/list-detail',
      '@max-2xl/list-detail:hidden',
      '@2xl/list-detail:hidden',
      'w-list',
    ])
    expect(css).toMatch(/container-name: list-detail/)
    expect(css).toMatch(/container-type: inline-size/)
    // 42rem: the width at which a 264px list and a readable detail stop
    // fitting side by side.
    expect(css).toMatch(/@container list-detail \(width < 42rem\)/)
    expect(css).toMatch(/@container list-detail \(width >= 42rem\)/)
    // The width off the theme's token - a `w-` off the wrong namespace would
    // compile to nothing and the column would take its content's width.
    const list = utilityRules(css).find((rule) => rule.selector === '.w-list')
    expect(list?.body).toMatch(/width: (var\(--spacing-list\)|264px)/)
  })

  it('has no accessibility violations', async () => {
    await expectNoA11yViolations(
      <ListDetail
        open
        list={
          <Pane label="Works">
            <p>row</p>
          </Pane>
        }
        detail={
          <Pane label="The open work">
            <p>detail</p>
          </Pane>
        }
      />,
    )
  })
})

describe('ListDetailBack', () => {
  it('goes back when pressed', async () => {
    const back = vi.fn()
    render(<ListDetailBack label="All works" onClick={back} />)
    await userEvent.click(screen.getByRole('button', { name: 'All works' }))
    expect(back).toHaveBeenCalledOnce()
  })

  it('is drawn only where the list is not on screen', () => {
    render(<ListDetailBack label="All works" onClick={() => {}} />)
    expect(classOf(screen.getByRole('button'))).toContain('@2xl/list-detail:hidden')
  })

  it('has no accessibility violations', async () => {
    await expectNoA11yViolations(<ListDetailBack label="All works" onClick={() => {}} />)
  })
})

describe('the frame', () => {
  it('carries no colour outside the vocabulary', () => {
    const { container } = render(
      <ListDetail
        open={false}
        list={
          <Pane label="Works" head={<span>Works</span>}>
            <p>row</p>
          </Pane>
        }
        detail={
          <Frame head={<ListDetailBack label="Back" onClick={() => {}} />}>
            <p>detail</p>
          </Frame>
        }
      />,
    )
    for (const element of container.querySelectorAll('*')) {
      expect(classOf(element)).not.toMatch(/\bdark:/)
      expect(classOf(element)).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    }
  })
})

/*
 * The turn, on its own. jsdom lays nothing out, so the narrow width is
 * stubbed the way a browser reports it: a column that has stepped aside is
 * not visible, and neither is anything inside it.
 */
describe('useListDetailTurn', () => {
  afterEach(() => {
    delete (HTMLElement.prototype as { checkVisibility?: unknown }).checkVisibility
  })

  function narrow() {
    ;(HTMLElement.prototype as { checkVisibility?: () => boolean }).checkVisibility = function (this: HTMLElement) {
      const root = this.closest('[data-list-detail]')
      if (root === null) return true
      const open = root.hasAttribute('data-open')
      if (this.closest('[data-list]')) return !open
      if (this.closest('[data-detail]')) return open
      return true
    }
  }

  const KEYS = ['a', 'b']

  function Harness({ initial = null, rowsGone = false }: { initial?: string | null; rowsGone?: boolean }) {
    const [selected, setSelected] = useState<string | null>(initial)
    const title = useRef<HTMLHeadingElement>(null)
    const list = useRef<HTMLDivElement>(null)
    const search = useRef<HTMLInputElement>(null)
    const turn = useListDetailTurn({
      selected,
      title,
      rowOf: (key) => (rowsGone ? null : (list.current?.querySelector<HTMLElement>(`[data-key="${key}"]`) ?? null)),
      fallback: search,
    })
    const choose = (key: string | null) => {
      turn(key)
      setSelected(key)
    }
    return (
      <ListDetail
        open={selected !== null}
        list={
          <div ref={list}>
            <input ref={search} aria-label="Find" />
            <button type="button" onClick={() => setSelected('a')}>
              open a from outside
            </button>
            {KEYS.map((key) => (
              <button key={key} type="button" data-key={key} onClick={() => choose(key)}>
                {key}
              </button>
            ))}
          </div>
        }
        detail={
          selected === null ? null : (
            <div>
              <ListDetailBack label="Back" onClick={() => choose(null)} />
              <h2 ref={title} tabIndex={-1}>
                {selected}
              </h2>
            </div>
          )
        }
      />
    )
  }

  it('hands the focus to the heading once the list steps aside', async () => {
    narrow()
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'b' }))
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'b' }))
  })

  it('hands it back to the row that was open', async () => {
    narrow()
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'b' }))
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'b' }))
  })

  it('falls back when the row that was open is gone', async () => {
    // Filtered out while it was open, say: the list's search takes the focus.
    narrow()
    render(<Harness rowsGone />)
    await userEvent.click(screen.getByRole('button', { name: 'b' }))
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Find' }))
  })

  it('moves nothing for a turn the reader did not make', async () => {
    // Opened from somewhere else - an address, a notification. The reader's
    // focus is theirs.
    narrow()
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'open a from outside' }))
    expect(document.activeElement).not.toBe(screen.getByRole('heading', { name: 'a' }))
  })

  it('leaves the focus where it is when nothing was hidden', async () => {
    ;(HTMLElement.prototype as { checkVisibility?: () => boolean }).checkVisibility = () => true
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'b' }))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'b' }))
  })
})
