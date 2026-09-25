import type { Rule } from 'eslint'

/*
 * `no-arbitrary-scale` - sizes come from the scale, or they are argued for.
 *
 * The colour vocabulary holds because a raw colour does not compile. Size has
 * no such wall: `text-[13px]` compiles perfectly, looks deliberate, and is how
 * a product drifts into nine sizes inside four pixels. kilna had 160 of them
 * in its screens, and half were literally a step of the scale written the
 * long way - `text-[12px]` for `text-sm` - which no reader of the code could
 * tell from the other half, the ones that really were off the scale.
 *
 * So the rule reads every class string, finds the fixed lengths chosen by eye,
 * and says which step they are:
 *
 * - **the same length as a named step** is fixed automatically - `text-[12px]`
 *   becomes `text-sm`, `rounded-[9px]` becomes `rounded-md`, `h-[22px]`
 *   becomes `h-5.5` - because nothing is decided by writing it the long way;
 * - **a length off the scale** is reported with the steps either side of it,
 *   and the fix is a decision: take a step, or disable the line with the
 *   reason no step can carry it.
 *
 * What it leaves alone is anything computed or proportional - `calc()`,
 * `min()`, `var()`, percentages, viewport units, `ch` and `fr` - because those
 * are relationships, not measurements: `w-[min(22rem,100%)]` says "as wide as
 * it wants but never off the screen", which no step can say.
 */

/** Utilities that measure on the spacing scale: a step is a quarter of a rem,
 * so 4px is `1` and 22px is `5.5`. */
const SPACING = [
  'size',
  'w',
  'h',
  'min-w',
  'min-h',
  'max-w',
  'max-h',
  'p',
  'px',
  'py',
  'pt',
  'pb',
  'pl',
  'pr',
  'ps',
  'pe',
  'm',
  'mx',
  'my',
  'mt',
  'mb',
  'ml',
  'mr',
  'ms',
  'me',
  'gap',
  'gap-x',
  'gap-y',
  'space-x',
  'space-y',
  'top',
  'bottom',
  'left',
  'right',
  'inset',
  'inset-x',
  'inset-y',
  'start',
  'end',
  'translate-x',
  'translate-y',
  'basis',
  'leading',
  'scroll-m',
  'scroll-p',
]

const RADIUS = [
  'rounded',
  'rounded-t',
  'rounded-b',
  'rounded-l',
  'rounded-r',
  'rounded-s',
  'rounded-e',
  'rounded-tl',
  'rounded-tr',
  'rounded-bl',
  'rounded-br',
  'rounded-ss',
  'rounded-se',
  'rounded-es',
  'rounded-ee',
]

/** The type scale, in pixels, by the step that names it. Mirrors the theme;
 * `scale.test.ts` holds the two to each other. */
export const TYPE_STEPS: Record<number, string> = {
  10: '2xs',
  11: 'xs',
  12: 'sm',
  14: 'base',
  16: 'lg',
  18: 'xl',
  21: '2xl',
}

/** The radii, in pixels, by the step that names them. */
export const RADIUS_STEPS: Record<number, string> = {
  4: 'xs',
  6: 'sm',
  9: 'md',
  12: 'lg',
  16: 'xl',
  20: '2xl',
}

/** The tracking steps, in em. */
const TRACKING_STEPS: Record<string, string> = {
  '0.085': 'caption',
  '-0.01': 'tight',
}

export interface ScaleFinding {
  /** Where the class starts in the string. */
  index: number
  /** The class as written, `hover:` and all. */
  text: string
  message: string
  /** The class to write instead, when there is exactly one. */
  fix?: string
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/*
 * One class: optional variants (`hover:`, `data-[open]:`, `[&_svg]:`), an
 * optional minus, a utility, and a bracketed value. The utility names are
 * tried longest first, so `min-w` is not read as `w` and `rounded-tl` is not
 * read as `rounded`.
 */
const UTILITIES = [...SPACING, ...RADIUS, 'text', 'tracking'].sort((a, b) => b.length - a.length)
const VARIANT = String.raw`(?:[\w-]+(?:\[[^\]]*\])?|\[[^\]]*\]):`
const CLASS = new RegExp(
  String.raw`(?<=^|[\s"'\x60])((?:${VARIANT})*)(-?)(${UTILITIES.map(escape).join('|')})-\[([^\]\s]+)\](?=$|[\s"'\x60])`,
  'g',
)

/** A plain length in pixels, or `undefined` for anything else. */
function pixels(value: string): number | undefined {
  const match = /^(-?\d*\.?\d+)(px|rem)$/.exec(value)
  if (!match) return undefined
  const amount = Number(match[1])
  return match[2] === 'rem' ? amount * 16 : amount
}

/** The two named steps either side of a length, for the message. */
function neighbours(px: number, steps: Record<number, string>, prefix: string): string {
  const sizes = Object.keys(steps).map(Number).sort((a, b) => a - b)
  const below = [...sizes].reverse().find((size) => size < px)
  const above = sizes.find((size) => size > px)
  return [below, above]
    .filter((size): size is number => size !== undefined)
    .map((size) => `\`${prefix}-${steps[size]}\` (${size}px)`)
    .join(' or ')
}

/** The spacing step for a length: exact at half a step (2px) or finer as a
 * named step; `hair` for the one named in-between. */
function spacingStep(px: number): string | undefined {
  if (Math.abs(px) === 3) return 'hair'
  if (px % 2 !== 0) return undefined
  return String(Math.abs(px) / 4)
}

/** What is off the scale in this string. Exported for the gate that holds the
 * set itself to the same rule, and for the test: the matching is the rule. */
export function findArbitraryScale(text: string): ScaleFinding[] {
  const findings: ScaleFinding[] = []

  for (const match of text.matchAll(CLASS)) {
    const [whole, variants = '', minus, utility, value] = match as unknown as [string, string, string, string, string]
    const at = match.index ?? 0

    if (utility === 'tracking') {
      if (/var\(|calc\(/.test(value)) continue
      const step = TRACKING_STEPS[value.replace(/em$/, '')]
      findings.push({
        index: at,
        text: whole,
        message: step
          ? `\`${whole}\` is \`tracking-${step}\` written the long way.`
          : `\`${whole}\` is tracking chosen by eye. The scale has \`tracking-caption\` for uppercase captions and \`tracking-tight\` for large type; use one, or say on this line why neither fits.`,
        fix: step ? `${variants}tracking-${step}` : undefined,
      })
      continue
    }

    const px = pixels(value)
    // Computed, relative or proportional: a relationship, not a length.
    if (px === undefined) continue

    if (utility === 'text') {
      const step = TYPE_STEPS[px]
      findings.push({
        index: at,
        text: whole,
        message: step
          ? `\`${whole}\` is \`text-${step}\` written the long way.`
          : `\`${whole}\` is off the type scale. The nearest steps are ${neighbours(px, TYPE_STEPS, 'text')}; take one, or say on this line why neither can carry it.`,
        fix: step ? `${variants}text-${step}` : undefined,
      })
      continue
    }

    if (RADIUS.includes(utility)) {
      const step = RADIUS_STEPS[px]
      findings.push({
        index: at,
        text: whole,
        message: step
          ? `\`${whole}\` is \`${utility}-${step}\` written the long way.`
          : `\`${whole}\` is off the radius scale. The nearest steps are ${neighbours(px, RADIUS_STEPS, utility)}; take one, or say on this line why neither fits.`,
        fix: step ? `${variants}${utility}-${step}` : undefined,
      })
      continue
    }

    const step = spacingStep(px)
    // `-mt-[2px]` and `mt-[-2px]` are both a pull of two pixels; both minus
    // signs together are a push. The step is written with one sign, outside.
    const sign = (minus === '-') !== px < 0 ? '-' : ''
    findings.push({
      index: at,
      text: whole,
      message: step
        ? `\`${whole}\` is \`${sign}${utility}-${step}\` written the long way.`
        : `\`${whole}\` is a length chosen by eye, between two steps of the scale. Take a step, or say on this line why none can carry it.`,
      fix: step ? `${variants}${sign}${utility}-${step}` : undefined,
    })
  }

  return findings
}

export const noArbitraryScale: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Forbid fixed lengths chosen by eye in class names; sizes come from the type, radius and spacing scales.',
      url: 'https://lacodda.github.io/dowel/guides/linting/',
    },
    schema: [],
  },
  create(context) {
    const source = context.sourceCode

    return {
      Literal(node) {
        if (typeof node.value !== 'string') return
        const raw = source.getText(node)
        // A fix is written into the source, so it is offered only where the
        // source is the value between two quotes - an escape inside the
        // literal would shift every offset after it.
        const fixable = raw.slice(1, -1) === node.value
        const start = node.range![0] + 1
        for (const finding of findArbitraryScale(node.value)) {
          context.report({
            node,
            message: finding.message,
            fix:
              fixable && finding.fix !== undefined
                ? (fixer) =>
                    fixer.replaceTextRange([start + finding.index, start + finding.index + finding.text.length], finding.fix!)
                : null,
          })
        }
      },
      TemplateElement(node) {
        // Reported, not fixed: a template element's range includes the
        // delimiters around it, which differ by position in the template.
        const text = node.value.cooked ?? node.value.raw
        for (const finding of findArbitraryScale(text)) {
          context.report({ node: node as Rule.Node, message: finding.message })
        }
      },
    }
  },
}
