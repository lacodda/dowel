/*
 * What has this project done to a component since it was copied in?
 *
 * The registry's whole promise is that a component becomes your file. That is
 * a real freedom and it has a real cost: nothing upstream reaches back in, and
 * nothing tells you what you changed. A year later, a component is different
 * from the one that shipped and there is no record of whether that is your
 * deliberate edit or a fix you never received.
 *
 * `diff` answers exactly that, from the catalogue inside the installed
 * package: here is the file the registry serves, here is yours, here is where
 * they part. It does not merge, and it will not offer to - the copy is the
 * consumer's, and a tool that silently reconciled it would be taking back the
 * thing the registry gave.
 *
 * The algorithm is a plain longest-common-subsequence over lines. A component
 * is a few hundred lines; the quadratic cost is invisible, and the output is
 * the one every reader already knows how to read.
 */

/** One line of a diff. */
export interface DiffLine {
  readonly kind: 'same' | 'added' | 'removed'
  readonly text: string
}

/** A run of changed lines with a little context, as a diff is normally read. */
export interface Hunk {
  /** 1-based line number in the registry's copy where this hunk starts. */
  readonly fromLine: number
  /** 1-based line number in the project's copy where this hunk starts. */
  readonly toLine: number
  readonly lines: readonly DiffLine[]
}

/** Line endings are normalised before comparing.
 *
 * A checkout on Windows hands back CRLF for a file the registry serves with
 * LF, and without this every single line of every component would differ - a
 * report that is technically true and completely useless. The registry builder
 * normalises for the same reason at the other end. */
function lines(text: string): string[] {
  return text.replace(/\r\n/g, '\n').split('\n')
}

/** The classic table. `common[i][j]` is the length of the longest common
 * subsequence of the first `i` lines of `a` and the first `j` of `b`. */
function commonTable(a: readonly string[], b: readonly string[]): number[][] {
  const table: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i]![j] = a[i] === b[j] ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!)
    }
  }
  return table
}

/** Every line of both files, marked. */
export function diffLines(from: string, to: string): DiffLine[] {
  const a = lines(from)
  const b = lines(to)
  const table = commonTable(a, b)

  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ kind: 'same', text: a[i]! })
      i += 1
      j += 1
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) {
      out.push({ kind: 'removed', text: a[i]! })
      i += 1
    } else {
      out.push({ kind: 'added', text: b[j]! })
      j += 1
    }
  }
  while (i < a.length) {
    out.push({ kind: 'removed', text: a[i]! })
    i += 1
  }
  while (j < b.length) {
    out.push({ kind: 'added', text: b[j]! })
    j += 1
  }
  return out
}

/** Group the marked lines into hunks with `context` unchanged lines around
 * each run of changes. A component that differs in two places should print two
 * short passages, not four hundred lines with a mark in the margin. */
export function hunks(marked: readonly DiffLine[], context = 3): Hunk[] {
  const changed = marked
    .map((line, index) => (line.kind === 'same' ? -1 : index))
    .filter((index) => index >= 0)
  if (changed.length === 0) return []

  /* Runs of change, merged when they are close enough that the context
   * between them would overlap - otherwise the same lines print twice. */
  const ranges: { start: number; end: number }[] = []
  for (const index of changed) {
    const last = ranges[ranges.length - 1]
    if (last && index - last.end <= context * 2) {
      last.end = index
      continue
    }
    ranges.push({ start: index, end: index })
  }

  /* Line numbers are counted by walking the marked list: a removed line
   * advances only the "from" side, an added line only the "to" side. */
  const fromNumbers: number[] = []
  const toNumbers: number[] = []
  let fromLine = 1
  let toLine = 1
  for (const line of marked) {
    fromNumbers.push(fromLine)
    toNumbers.push(toLine)
    if (line.kind !== 'added') fromLine += 1
    if (line.kind !== 'removed') toLine += 1
  }

  return ranges.map((range) => {
    const start = Math.max(0, range.start - context)
    const end = Math.min(marked.length - 1, range.end + context)
    return {
      fromLine: fromNumbers[start]!,
      toLine: toNumbers[start]!,
      lines: marked.slice(start, end + 1),
    }
  })
}

/** Whether two files differ at all, ignoring line endings. Cheaper than
 * diffing, and it is the question asked first. */
export function differs(from: string, to: string): boolean {
  return from.replace(/\r\n/g, '\n') !== to.replace(/\r\n/g, '\n')
}
