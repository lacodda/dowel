/*
 * The accessibility report: its shape, the debt it is held to, and how a
 * rule's tags name the WCAG criteria it checks.
 *
 * Here rather than beside the documentation that draws it: the unit gate and
 * the browser run import it too, and a file under `docs/` is compiled against
 * the docs site's own toolchain, which a test job does not install.
 *
 * Written by `tests/visual/a11y.spec.ts`, one file per item of the stand, from
 * a run of axe over its section in both themes; read by the documentation -
 * the reference page and the foot of every component page. One module for
 * both ends, so the writer and the reader cannot disagree about the shape.
 */

/** Where the reports are committed, from the root of the repository. */
export const REPORT_DIR = 'docs/src/data/accessibility'

/** What axe is asked to check: WCAG 2.0, 2.1 and 2.2 at A and AA, and axe's
 * own best practices. */
export const STANDARD = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] as const

export interface Result {
  /** Rules that applied and passed. */
  passes: string[]
  /** Rules axe could not decide - a person has to look. */
  incomplete: string[]
  violations: { rule: string; nodes: string[] }[]
}

/** One item of the stand, in both themes. */
export interface ItemReport {
  /** The version of axe-core that ran. */
  axe: string
  /** Every rule that applied: what it asks, and the WCAG criteria it checks -
   * none for a best practice. */
  rules: Record<string, { help: string; criteria: string[] }>
  dark: Result
  light: Result
}

/** `wcag143` is 1.4.3, `wcag1410` is 1.4.10: a principle, a guideline, and
 * the rest is the criterion. The level tags (`wcag2aa`) are not criteria. */
export function criteriaOf(tags: readonly string[]): string[] {
  return tags
    .map((tag) => /^wcag(\d)(\d)(\d+)$/.exec(tag))
    .filter((match) => match !== null)
    .map((match) => `${match[1]}.${match[2]}.${match[3]}`)
}

/*
 * Rules that judge a page, off on the stand - each with the reason.
 *
 * The stand draws several examples of one component on one page, inside its
 * own frame; a product draws one, inside its own. What these rules ask of -
 * a name for every landmark of a kind, one main, headings in order - is the
 * page's outline, and the page is the product's. The same reasoning turns off
 * `region` and `landmark-one-main` in the unit tests.
 */
export const PAGE_RULES: Record<string, string> = {
  'landmark-unique':
    'Two examples of a breadcrumb trail on one page are two landmarks with one name; a product shows one.',
  'landmark-no-duplicate-main':
    'An app shell and a sign-in screen are the page and bring its main; on the stand they sit inside the stand’s own.',
  'landmark-main-is-top-level':
    'For the same reason: the block’s main is the product’s top level, and the stand’s frame is around it.',
  'heading-order':
    'Where a heading sits in the outline is the page’s to say, and the stand’s headings are not a product’s.',
}

/** Violations found and not yet fixed: the rule, the items it fails on, and
 * why. A gate holds this list to the reports both ways - a violation not here
 * fails, and an entry no report still shows fails too - so it can only shrink. */
export interface Debt {
  rule: string
  items: string[]
  reason: string
}

export const KNOWN: Debt[] = [
  {
    rule: 'color-contrast',
    items: [
      'activity-heatmap',
      'activity-legend',
      'activity-weeks',
      'alert',
      'badge',
      'banner',
      'bar-chart',
      'big-calendar',
      'calendar',
      'chip',
      'code-block',
      'context-menu',
      'diff-lines',
      'diff-view',
      'empty-state',
      'field-draft',
      'json-rows',
      'json-viewer',
      'key-value',
      'line-chart',
      'line-scale',
      'number-format',
      'query-state',
      'relative-time',
      'save-state',
      'skeleton-of',
      'splash',
      'status-dot',
      'stepper',
      'tag-input',
      'tier',
      'timeline',
      'track',
      'track-segments',
      'tree-rows',
      'wizard',
    ],
    reason:
      'Text in `faint`, and text on the soft status fills, at the small type steps - 10 to 12px - measures below the 4.5:1 AA asks, in one theme or both. ' +
      'The tokens are held to AA at body size, not at every step they are set in; the work that holds them per step moves these, as it already moved ' +
      'the caption, the notes of a list row and the empty face of the date pickers. Some of it is the stand’s own notes beside the examples.',
  },
]
