import type { Rule } from 'eslint'

/*
 * `no-implicit-locale` - a date or a number formatted without saying in which
 * language.
 *
 * `toLocaleDateString()` with no argument, or with `[]`, or `new
 * Intl.DateTimeFormat(undefined)`, asks for the *browser's* language. The
 * interface is written in the application's. When the two differ - an English
 * product in a browser set to Russian - the screen shows English headings over
 * Russian weekdays, and nothing anywhere is wrong enough to fail: that is how
 * kasl-server shipped it.
 *
 * The fix is one place that answers: `useLocale()` from `dowel-ui`, which reads
 * the nearest `LocaleProvider` or the page's `<html lang>`. This rule reports
 * every call that skips it. A variable passed as the locale is not reported -
 * the rule cannot know where it came from, and naming one is the decision the
 * rule is asking for.
 */

/** Methods whose first argument is the locale. */
const METHODS = new Set(['toLocaleString', 'toLocaleDateString', 'toLocaleTimeString'])

/** `Intl` constructors whose first argument is the locale. */
const FORMATTERS = new Set([
  'DateTimeFormat',
  'NumberFormat',
  'RelativeTimeFormat',
  'ListFormat',
  'PluralRules',
  'Collator',
  'DisplayNames',
  'Segmenter',
  'DurationFormat',
])

const MESSAGE =
  'This formats in the browser\'s language, not the application\'s. Pass the locale from ' +
  '`useLocale()` (dowel-ui), so a date or a number reads in the language the interface is written in.'

interface Node {
  type: string
  name?: string
  value?: unknown
  elements?: unknown[]
  property?: Node
  object?: Node
  callee?: Node
  arguments?: Node[]
  computed?: boolean
}

/** Whether an argument leaves the choice to the browser. */
function implicit(argument: Node | undefined): boolean {
  if (argument === undefined) return true
  if (argument.type === 'Identifier' && argument.name === 'undefined') return true
  if (argument.type === 'ArrayExpression' && (argument.elements?.length ?? 0) === 0) return true
  return false
}

export const noImplicitLocale: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Forbid formatting a date or a number without naming the locale.',
      url: 'https://lacodda.github.io/dowel/guides/linting/',
    },
    schema: [],
    messages: { implicit: MESSAGE },
  },
  create(context) {
    return {
      CallExpression(node: Rule.Node) {
        const call = node as unknown as Node
        const callee = call.callee
        if (callee?.type !== 'MemberExpression' || callee.computed) return
        if (!METHODS.has(callee.property?.name ?? '')) return
        // `n.toLocaleString()` on a number or a date. A string has no
        // `toLocaleString` that formats anything, so the name is enough.
        if (implicit(call.arguments?.[0])) context.report({ node, messageId: 'implicit' })
      },
      NewExpression(node: Rule.Node) {
        const call = node as unknown as Node
        const callee = call.callee
        if (callee?.type !== 'MemberExpression' || callee.computed) return
        if (callee.object?.type !== 'Identifier' || callee.object.name !== 'Intl') return
        if (!FORMATTERS.has(callee.property?.name ?? '')) return
        if (implicit(call.arguments?.[0])) context.report({ node, messageId: 'implicit' })
      },
    } as Rule.RuleListener
  },
}
