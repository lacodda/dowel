import { useEffect } from 'react'
import { cn, lineProducts, useThemeSwitch } from 'dowel-ui'
import markUrl from '../../assets/logo-m.svg'
import { linkProps, useRoute } from './router'
import { useStoredState } from './use-stored-state'
import { ContrastReport } from './contrast-report'
import { Panel } from '../../registry/ui/panel'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '../../registry/ui/select'
import { sections } from './catalogue'

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

/** The version this stand was built from, injected by Vite out of the package
 * manifest so the number on the page cannot drift from the one shipped. */
declare const __DOWEL_VERSION__: string

export function App() {
  const { theme, setTheme } = useThemeSwitch('dowel.stand.theme')
  const [accent, setAccent] = useStoredState('dowel.stand.accent', 'dowel')
  const [density, setDensity] = useStoredState('dowel.stand.density', 'default')
  const [contrast, setContrast] = useStoredState('dowel.stand.contrast', 'system')
  const { path, navigate } = useRoute()

  /*
   * An unknown path shows the overview rather than an error.
   *
   * A stand is a place people arrive at from a stale link or a typo, and a
   * 404 of our own would be a worse answer than the front page - there is
   * nothing here that a reader could have destroyed by getting the URL wrong.
   */
  const current = sections.find((section) => section.id === path)

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

  /*
   * More contrast is pinned on the root by class, the way a product offering
   * it would; `system` leaves the root alone, so the operating system's own
   * setting decides.
   */
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('contrast-more', contrast === 'more')
    root.classList.toggle('contrast-normal', contrast === 'normal')
  }, [contrast])

  return (
    <div
      className="min-h-screen bg-bg text-text"
      /* The whole point of density being an attribute: one here reaches
         every control on the stand, including the ones that never heard
         of it. */
      data-density={density === 'default' ? undefined : density}
    >
      {/*
        * The header is a plain block, not `sticky`.
        *
        * It was sticky, and that put it into every visual baseline: the gate
        * photographs a section, the bar floats over the top of the frame, and
        * five separate hypotheses about `addStyleTag` failed to explain why
        * hiding it worked locally and not in CI. With a page per component
        * there is nothing to stay visible above - the navigation is beside the
        * content, not over it - so the cause is gone rather than suppressed.
        */}
      <header className="border-b border-line bg-bg">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
          <a
            {...linkProps('', navigate)}
            className="flex items-center gap-2 text-sm font-semibold text-text no-underline"
          >
            {/* The line's mark, in the accent now in force: the honeycomb is
              * drawn with `currentColor`, so the identity follows the same
              * token every component follows. */}
            <Mark className="size-5" />
            dowel
          </a>
          <span className="rounded-full border border-line px-2 py-0.5 font-mono text-2xs text-dim">
            v{__DOWEL_VERSION__}
          </span>
          <a
            href="/dowel/"
            className="text-xs text-dim no-underline hover:text-text"
            title="What everything is and why it is that way"
          >
            documentation ↗
          </a>

          {/*
            * The stand's own switches, drawn with the set's own Select.
            *
            * They were native `<select>` elements until the rule that forbids
            * those was written - and the rule caught them on its first run,
            * here, in the stand of the system that forbids them. Worth
            * recording: a convention nobody checks is a convention the place
            * demonstrating it breaks first.
            */}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-dim">
              <span id="accent-label">accent</span>
              <Select value={accent} onValueChange={(value) => setAccent(value as string)}>
                <SelectTrigger size="sm" aria-labelledby="accent-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {lineProducts.map((entry) => (
                    <SelectItem key={entry.name} value={entry.name}>
                      {entry.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-dim">
              <span id="theme-label">theme</span>
              <Select
                value={theme}
                onValueChange={(value) => setTheme(value as typeof theme)}
              >
                <SelectTrigger size="sm" aria-labelledby="theme-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="system">system</SelectItem>
                  <SelectItem value="light">light</SelectItem>
                  <SelectItem value="dark">dark</SelectItem>
                </SelectPopup>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-dim">
              <span id="contrast-label">contrast</span>
              <Select value={contrast} onValueChange={(value) => setContrast(value as string)}>
                <SelectTrigger size="sm" aria-labelledby="contrast-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="system">system</SelectItem>
                  <SelectItem value="more">more</SelectItem>
                  <SelectItem value="normal">normal</SelectItem>
                </SelectPopup>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-dim">
              <span id="density-label">density</span>
              <Select value={density} onValueChange={(value) => setDensity(value as string)}>
                <SelectTrigger size="sm" aria-labelledby="density-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="default">default</SelectItem>
                  <SelectItem value="compact">compact</SelectItem>
                  <SelectItem value="comfortable">comfortable</SelectItem>
                </SelectPopup>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
        <nav aria-label="Components" className="hidden w-44 shrink-0 md:block">
          {/* The list is taller than the screen - forty components - so it
            * scrolls on its own rather than with the page. Sticky alone was
            * not enough: the box stayed put and its bottom half stayed out of
            * reach, which made the last dozen components unreachable without
            * scrolling the article beside them. */}
          <div className="sticky top-8 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
            <ul className="m-0 list-none space-y-0.5 p-0">
              {sections
                .filter((section) => section.kind === undefined)
                .map((section) => (
                  <NavLink
                    key={section.id}
                    section={section}
                    active={section.id === current?.id}
                    navigate={navigate}
                  />
                ))}
            </ul>

            {/* Screens made of the components, which a product copies to
              * change rather than to keep. */}
            <h2 className="mt-5 mb-1 px-2 text-2xs uppercase tracking-caption text-dim">Blocks</h2>
            <ul className="m-0 list-none space-y-0.5 p-0">
              {sections
                .filter((section) => section.kind === 'block')
                .map((section) => (
                  <NavLink
                    key={section.id}
                    section={section}
                    active={section.id === current?.id}
                    navigate={navigate}
                  />
                ))}
            </ul>

            {/* Not components, and the list says so rather than leaving a
              * reader to infer it from a lowercase name. */}
            <h2 className="mt-5 mb-1 px-2 text-2xs uppercase tracking-caption text-dim">
              Without markup
            </h2>
            <ul className="m-0 list-none space-y-0.5 p-0">
              {sections
                .filter((section) => section.kind === 'utility')
                .map((section) => (
                  <NavLink
                    key={section.id}
                    section={section}
                    active={section.id === current?.id}
                    navigate={navigate}
                  />
                ))}
            </ul>
          </div>
        </nav>

        <main className="min-w-0 flex-1">
          {/* `data-stand-section` is what the visual gate photographs. A plain
              `main section` locator matched twice the first time a component
              drew a section of its own - the prose demo, which renders the
              `<section class="footnotes">` remark-gfm emits. */}
          {current ? (
            <section key={current.id} data-stand-section>
              <div className="mb-4 flex items-baseline gap-3">
                <h1 className="text-xl font-semibold">{current.title}</h1>
                {/* The other half of the pair: this shows what the component
                    does, its page says why it does it that way. */}
                <a href={current.docs} className="text-xs text-dim no-underline hover:text-accent">
                  docs ↗
                </a>
              </div>
              {current.render()}
            </section>
          ) : (
            <Overview navigate={navigate} />
          )}
        </main>
      </div>
    </div>
  )
}

/** One row of the navigation. Shared by both groups, so a change to how a
 * link looks cannot land in one list and miss the other. */
function NavLink({
  section,
  active,
  navigate,
}: {
  section: { id: string; title: string }
  active: boolean
  navigate: (to: string) => void
}) {
  return (
    <li>
      <a
        {...linkProps(section.id, navigate)}
        // The current page is named as such for a screen reader, which cannot
        // see that it is the tinted one.
        aria-current={active ? 'page' : undefined}
        className={cn(
          'block rounded-md px-2 py-1 text-sm no-underline transition-colors',
          active ? 'bg-accent-soft font-medium text-accent' : 'text-dim hover:bg-raise hover:text-text',
        )}
      >
        {section.title}
      </a>
    </li>
  )
}

/*
 * The line's mark.
 *
 * The file itself, not a copy of it in JSX. It was hand-drawn here first and
 * was simply the wrong sign - an empty outline where the real mark is a filled
 * cell with the `dw` monogram inside - and transcribing the right one would
 * only have set up the next drift, where `assets/logo-m.svg` moves and the
 * stand keeps showing what it used to be.
 *
 * `logo-m.svg` is the middle master, which is the one a site header takes.
 * Its amber is fixed rather than following the accent switch: the switch
 * shows what a *product's* colour does to the components, while the mark
 * belongs to dowel itself, and a sign that repaints when someone previews
 * another accent has stopped being a sign.
 */
function Mark({ className }: { className?: string }) {
  return <img src={markUrl} alt="" aria-hidden className={className} />
}

/** The front page: what the stand is for, and a way into it. */
function Overview({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div>
      <h1 className="mb-3 text-2xl font-semibold">Every component, in every accent</h1>
      <p className="mb-6 max-w-prose text-sm text-dim">
        Change the accent in the header and watch what follows from it: the hover shade, the soft
        fill, the focus ring, and the colour of text on an accent fill — none of which any component
        states for itself. Change the theme and watch the same components hold in both.
      </p>
      {/* On a wide screen this list is the same list as the navigation beside
        * it, and two copies of forty links is not a front page. It shows below
        * the breakpoint that hides the sidebar, where it is the only way in. */}
      <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 md:hidden">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              {...linkProps(section.id, navigate)}
              className="block rounded-lg border border-line bg-raise px-3 py-2 text-sm text-text no-underline transition-colors hover:border-accent hover:text-accent"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>

      <div className="hidden gap-3 md:grid md:grid-cols-3">
        <Panel className="p-4">
          <h2 className="mb-1 text-sm font-semibold">
            {sections.filter((section) => section.kind !== 'block').length} components,{' '}
            {sections.filter((section) => section.kind === 'block').length} blocks
          </h2>
          <p className="m-0 text-xs text-dim">
            Pick one from the list. Each has a page of its own, so the address bar names what you
            are looking at and the link can be sent to someone.
          </p>
        </Panel>
        <Panel className="p-4">
          <h2 className="mb-1 text-sm font-semibold">Two themes</h2>
          <p className="m-0 text-xs text-dim">
            Every component is drawn in both, from the same tokens. Nothing here carries a
            <code className="px-1 font-mono text-2xs">dark:</code> utility of its own.
          </p>
        </Panel>
        <Panel className="p-4">
          <h2 className="mb-1 text-sm font-semibold">{lineProducts.length} accents</h2>
          <p className="m-0 text-xs text-dim">
            One per product of the line. The choice is remembered, so the stand opens where you
            left it.
          </p>
        </Panel>
      </div>
      <ContrastReport />
    </div>
  )
}
