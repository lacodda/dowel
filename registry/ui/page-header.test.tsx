// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { Container, PageHeader, containerVariants } from './page-header'

describe('PageHeader', () => {
  it('says what the screen is', () => {
    render(<PageHeader title="Catalogue" description="Everything you have written." />)
    expect(screen.getByText('Catalogue')).toBeDefined()
    expect(screen.getByText('Everything you have written.')).toBeDefined()
  })

  it('sets the title as the top of the content outline', () => {
    // The shell's bar names the application and the rail names the
    // destinations; this is the one heading a screen is entitled to, and it
    // is where a reader jumping by heading lands.
    render(<PageHeader title="Catalogue" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Catalogue' })).toBeDefined()
  })

  it('leaves the line out rather than drawing an empty one', () => {
    const { container } = render(<PageHeader title="Catalogue" />)
    expect(container.querySelector('p')).toBeNull()
  })

  it('puts the screen actions at the far end of the title row', () => {
    render(<PageHeader title="Catalogue" actions={<button type="button">New</button>} />)
    const row = screen.getByRole('button', { name: 'New' }).parentElement!.parentElement!
    expect(row.className).toContain('justify-between')
  })

  it('drops the actions to their own line rather than truncating the title', () => {
    // A title is what the screen is; a button can wait a row.
    render(<PageHeader title="Catalogue" actions={<button type="button">New</button>} />)
    const row = screen.getByRole('button', { name: 'New' }).parentElement!.parentElement!
    expect(row.className).toContain('flex-wrap')
    expect(row.className, 'the actions would centre against a two-line title').toContain('items-start')
  })

  it('takes a trail or a tab strip under the row', () => {
    render(
      <PageHeader title="Harbour lights">
        <nav aria-label="Breadcrumb">trail</nav>
      </PageHeader>,
    )
    expect(screen.getByText('trail')).toBeDefined()
  })

  it('lets the caller win a conflict', () => {
    const { container } = render(<PageHeader title="x" className="mb-0" />)
    expect(container.firstElementChild!.className).toContain('mb-0')
    expect(container.firstElementChild!.className).not.toContain('mb-4')
  })
})

describe('Container', () => {
  it('draws every measure, and draws each one differently', () => {
    const widths = ['prose', 'default', 'wide', 'full'] as const
    const drawn = new Map(widths.map((width) => [width, containerVariants({ width })]))
    expect(new Set(drawn.values()).size, 'two measures draw the same').toBe(widths.length)
  })

  it('sets a reading measure in characters, not in pixels', () => {
    // Text past about ninety characters a line loses the reader on the way
    // back to the left margin, and that is a property of the type, not of the
    // screen.
    expect(containerVariants({ width: 'prose' })).toContain('ch]')
  })

  it('takes the ceiling off entirely for a screen that is the window', () => {
    expect(containerVariants({ width: 'full' })).not.toContain('max-w-')
  })

  it('leaves the padding to the screen', () => {
    // `Screen` knows whether it is scrolling and therefore whether a
    // scrollbar is about to take ten pixels off the right; a container that
    // also padded would double it.
    for (const width of ['prose', 'default', 'wide', 'full'] as const) {
      expect(containerVariants({ width }), `\`${width}\` pads as well as measures`).not.toMatch(
        /\bp[xytblr]?-/,
      )
    }
  })

  it('centres itself and can still shrink', () => {
    render(<Container>content</Container>)
    const box = screen.getByText('content')
    expect(box.className).toContain('mx-auto')
    expect(box.className, 'a flex or grid child will not shrink without it').toContain('min-w-0')
  })
})

describe('PageHeader, for a reader', () => {
  it('passes axe with a title, a line, actions and a trail', async () => {
    await expectNoA11yViolations(
      <PageHeader
        title="Catalogue"
        description="Everything you have written."
        actions={<button type="button">New</button>}
      >
        <nav aria-label="Breadcrumb">trail</nav>
      </PageHeader>,
    )
  })

  it('passes axe in every container measure', async () => {
    for (const width of ['prose', 'default', 'wide', 'full'] as const) {
      const { unmount } = await expectNoA11yViolations(
        <Container width={width}>
          <p>Body text.</p>
        </Container>,
      )
      unmount()
    }
  })
})
