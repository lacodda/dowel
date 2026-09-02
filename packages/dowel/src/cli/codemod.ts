import { stockNames, stockTokens } from './stock.js'

/*
 * Rewriting the stock vocabulary into dowel's.
 *
 * This is the only tool here that touches someone else's code, and it is built
 * around one assumption: it will get something wrong. A rename that is right
 * nine hundred times and wrong twice is still a rename that has to be read, so
 * the design is not "be clever enough to be trusted" - it is "be simple enough
 * to be reviewed". Hence:
 *
 *   - it reports before it writes, and writing is opt-in;
 *   - it makes exactly the substitutions the table describes, never inferring
 *     one from context;
 *   - it refuses the names that have no honest equivalent instead of guessing,
 *     because a wrong colour that compiles is worse than a name that does not.
 *
 * What it does not do is reformat, reorder, or touch a line it has no
 * replacement for. The diff a consumer reads should contain nothing but the
 * renames, so that reviewing it is a matter of agreeing with the table.
 */

/** One substitution made in one place. */
export interface Change {
  readonly line: number
  readonly from: string
  readonly to: string
}

/** What the codemod did to one file, and what it declined to do. */
export interface Rewrite {
  readonly source: string
  readonly changes: Change[]
  /** Stock names left alone because the table has no equivalent. These are
   * the reason a run can be "successful" and still not finished. */
  readonly skipped: { readonly line: number; readonly name: string; readonly note: string }[]
}

/** The 1-based line an offset falls on. */
function lineAt(source: string, index: number): number {
  let line = 1
  for (let i = 0; i < index; i += 1) {
    if (source.charCodeAt(i) === 10 /* \n */) line += 1
  }
  return line
}

/*
 * The two shapes a stock name takes, as one pass.
 *
 * They are matched together rather than in two passes for a reason that cost
 * an hour elsewhere in this repository: a second pass reads the output of the
 * first, so a rename whose result contains another stock name gets renamed
 * twice. `--accent` is exactly that case - stock `--accent` becomes `--soft`,
 * and dowel's own `--accent` is a name the table also knows. One pass over the
 * original text cannot double-apply.
 *
 * Alternation order is `stockNames`, which is longest-first, so `--sidebar-border`
 * is matched whole rather than as `--sidebar` with a tail left behind.
 */
const UTILITY_PREFIXES =
  'bg|text|border|fill|stroke|ring|outline|divide|shadow|from|via|to|accent|caret|decoration'

function pattern(): RegExp {
  const names = stockNames.join('|')
  return new RegExp(
    // A custom property: `--muted-foreground`, in a stylesheet or in `var()`.
    `--(?<property>${names})\\b` +
      '|' +
      // A utility: `bg-muted`, `hover:text-muted-foreground`. The opener is
      // consumed so that `custom-bg-muted` does not match, and put back.
      `(?<opener>^|[\\s"'\`:\\[({])(?<prefix>${UTILITY_PREFIXES})-(?<utility>${names})\\b`,
    'gm',
  )
}

/** Rewrite one file's text. Returns the new source and an account of what
 * happened - the caller decides whether to write it. */
export function rewriteSource(source: string): Rewrite {
  const changes: Change[] = []
  const skipped: Rewrite['skipped'] = []

  const next = source.replace(pattern(), (match, ...args) => {
    // The named groups arrive last; the offset is two from the end, before the
    // whole string and the groups object.
    const groups = args[args.length - 1] as Record<string, string | undefined>
    const offset = args[args.length - 3] as number
    const line = lineAt(source, offset)

    const property = groups.property
    if (property) {
      const replacement = stockTokens[property]!
      if (replacement.kind !== 'token') {
        skipped.push({ line, name: `--${property}`, note: replacement.note })
        return match
      }
      changes.push({ line, from: `--${property}`, to: `--${replacement.token}` })
      return `--${replacement.token}`
    }

    const utility = groups.utility!
    const prefix = groups.prefix!
    const opener = groups.opener ?? ''
    const replacement = stockTokens[utility]!
    if (replacement.kind !== 'token') {
      skipped.push({ line, name: `${prefix}-${utility}`, note: replacement.note })
      return match
    }
    changes.push({ line, from: `${prefix}-${utility}`, to: `${prefix}-${replacement.token}` })
    return `${opener}${prefix}-${replacement.token}`
  })

  return { source: next, changes, skipped }
}
