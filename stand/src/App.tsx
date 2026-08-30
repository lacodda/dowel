import { useEffect, useState } from 'react'
import { lineProducts, useThemeSwitch } from 'dowel-ui'
import { Button } from '../../registry/ui/button'

/*
 * The stand.
 *
 * Every component of the system, live, in the conditions it will actually be
 * used in: the real theme on the page, the real preflight, and a switch for
 * the theme and for the accent of any product of the line.
 *
 * The accent switch is the part worth having. A component looks right in the
 * colour it was drawn in; the question is whether it looks right in gold, and
 * in lime, and in cobalt - and that is a question you answer by clicking, not
 * by reasoning about `color-mix`.
 */

/** The sections of the stand: one per component, in the order a screen is
 * built. Each new component adds an entry here. */
const sections = [
  { id: 'button', title: 'Button', docs: '/dowel/components/button/', render: () => <ButtonSection /> },
]

export function App() {
  const { theme, setTheme } = useThemeSwitch('dowel.stand.theme')
  const [accent, setAccent] = useState('dowel')

  /*
   * The accent goes on the root element, which is where a product sets it too.
   *
   * Setting it on a container looks equivalent and is not: the theme declares
   * `--accent: var(--accent-base)` inside `:root`, and that resolves against
   * the root's own value. A `--accent-base` further down the tree changes
   * nothing above it, so every derived token - the hover shade, the soft fill,
   * the colour of text on an accent fill - keeps the value the root produced.
   * The switch appeared to do nothing at all.
   */
  useEffect(() => {
    const product = lineProducts.find((entry) => entry.name === accent)
    const root = document.documentElement
    if (product) root.style.setProperty('--accent-base', product.accent)
    else root.style.removeProperty('--accent-base')
  }, [accent])

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 border-b border-line bg-bg/90 backdrop-blur" style={{ zIndex: 'var(--z-sticky)' }}>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-6 py-3">
          <a href="/dowel/" className="text-sm font-semibold text-text no-underline">
            dowel
          </a>
          <span className="text-2xs uppercase tracking-caption text-faint">components</span>
          <a
            href="/dowel/"
            className="text-xs text-dim no-underline hover:text-text"
            title="What everything is and why it is that way"
          >
            documentation ↗
          </a>

          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-dim">
              accent
              <select
                value={accent}
                onChange={(event) => setAccent(event.target.value)}
                className="rounded-md border border-line bg-raise px-2 py-1 text-xs text-text"
              >
                {lineProducts.map((entry) => (
                  <option key={entry.name} value={entry.name}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-dim">
              theme
              <select
                value={theme}
                onChange={(event) => setTheme(event.target.value as typeof theme)}
                className="rounded-md border border-line bg-raise px-2 py-1 text-xs text-text"
              >
                <option value="system">system</option>
                <option value="light">light</option>
                <option value="dark">dark</option>
              </select>
            </label>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <p className="mb-8 max-w-prose text-sm text-dim">
          Every component, in the accent of every product of the line. Change the accent above and
          watch what follows from it: the hover shade, the soft fill, the focus ring, and the colour
          of text on an accent fill — none of which any component states for itself.
        </p>

        {sections.map((section) => (
          <section key={section.id} id={section.id} className="mb-12">
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              {/* The other half of the pair: this shows what the component
                  does, its page says why it does it that way. */}
              <a href={section.docs} className="text-xs text-dim no-underline hover:text-accent">
                docs ↗
              </a>
            </div>
            {section.render()}
          </section>
        ))}
      </main>
    </div>
  )
}

/** A row of examples with a label above it. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-2xs uppercase tracking-caption text-faint">{label}</div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-raise p-4">
        {children}
      </div>
    </div>
  )
}

function ButtonSection() {
  return (
    <>
      <Row label="variants">
        <Button variant="primary">Save</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="soft">Selected</Button>
        <Button variant="danger">Delete</Button>
        <Button variant="icon" size="icon-md" aria-label="More">
          <Dots />
        </Button>
      </Row>

      <Row label="sizes">
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary" size="md">
          Medium
        </Button>
        <Button variant="icon" size="icon-sm" aria-label="Add">
          <Plus />
        </Button>
        <Button variant="icon" size="icon-md" aria-label="Add">
          <Plus />
        </Button>
      </Row>

      <Row label="states">
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button variant="ghost" disabled>
          Disabled
        </Button>
        <Button asChild variant="primary">
          <a href="#button">As a link</a>
        </Button>
      </Row>

      <Row label="with an icon">
        <Button variant="primary">
          <Plus />
          New
        </Button>
        <Button variant="ghost">
          <Dots />
          More
        </Button>
      </Row>
    </>
  )
}

function Plus() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M8 3.5v9M3.5 8h9" strokeLinecap="round" />
    </svg>
  )
}

function Dots() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden>
      <circle cx="3" cy="8" r="1.4" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="13" cy="8" r="1.4" />
    </svg>
  )
}
