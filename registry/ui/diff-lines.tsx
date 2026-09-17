/*
 * The comparison behind DiffView, with no React in it.
 *
 * Split out like `line-scale` and `table-sort`: a product that wants to know
 * how much moved between two drafts - to put a number in a list, to decide
 * whether to offer the comparison at all - should not have to render a
 * component to find out.
 *
 * Lines rather than words, and that is a choice about the subject. The text
 * being compared here is prose someone wrote and revised - a draft, a note, a
 * configuration file - and prose is revised BY THE LINE. A word-level diff of
 * a rewritten paragraph is confetti: technically accurate, and it answers a
 * question nobody asked. Where the subject really is word-level - a title, a
 * single sentence - a product compares the two strings itself.
 *
 * Plain longest-common-subsequence. The bodies are a page or two, so the exact
 * O(n·m) answer costs nothing and there is no reason to reach for a heuristic.
 *
 * Taken from kilna, which had it first, with the arithmetic unchanged and the
 * pairing added: `rows` is the part the donor did not have, and its absence is
 * what made the donor's two columns drift out of step.
 */

/** One step through the comparison. */
export type Change =
  | { kind: 'same'; text: string }
  | { kind: 'added'; text: string }
  | { kind: 'removed'; text: string }

/**
 * One row of a side-by-side comparison: what stands on each side of it.
 *
 * `null` is a side with nothing there - the gap opposite an inserted line -
 * and it is deliberately not an empty string. An empty string is a line
 * somebody wrote that happens to have no characters on it, and a comparison
 * that cannot tell those apart draws a blank line as a deletion.
 */
export interface DiffRow {
  before: string | null
  after: string | null
  kind: Change['kind']
  /** Line numbers in each text, 1-based, for a gutter. `null` on the side that
   * has nothing. */
  beforeLine: number | null
  afterLine: number | null
}

/** How many lines each side may have before the comparison gives up. A table
 * of 2000×2000 is four million cells; past that the honest answer is "too long
 * to compare", not a frozen window. */
export const LIMIT = 2000

export function diffLines(before: string, after: string): Change[] {
  const a = before.split('\n')
  const b = after.split('\n')

  if (a.length > LIMIT || b.length > LIMIT) {
    return [
      { kind: 'removed', text: before },
      { kind: 'added', text: after },
    ]
  }

  // lcs[i][j] - the length of the longest common subsequence of a[i..] and
  // b[j..]. Filled backwards so the walk forwards can be greedy.
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0),
  )

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      lcs[i]![j] = a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!)
    }
  }

  const changes: Change[] = []
  let i = 0
  let j = 0

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      changes.push({ kind: 'same', text: a[i]! })
      i += 1
      j += 1
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      changes.push({ kind: 'removed', text: a[i]! })
      i += 1
    } else {
      changes.push({ kind: 'added', text: b[j]! })
      j += 1
    }
  }

  while (i < a.length) {
    changes.push({ kind: 'removed', text: a[i]! })
    i += 1
  }
  while (j < b.length) {
    changes.push({ kind: 'added', text: b[j]! })
    j += 1
  }

  return changes
}

/**
 * The changes as rows of two columns - the thing that makes side-by-side mean
 * anything.
 *
 * The obvious way to draw two columns is to filter the change list twice: keep
 * everything that is not `added` on the left, everything that is not `removed`
 * on the right. Both columns come out individually correct and they stop
 * lining up at the first insertion, because from there on they hold different
 * numbers of rows. The reader then compares line 4 against line 3 for the rest
 * of the screen, and nothing about the drawing looks wrong - which is why the
 * defect survived in the product this was taken from.
 *
 * Pairing instead makes the alignment structural: a row is one object with two
 * sides, so the columns are the same height by construction rather than by two
 * filters happening to agree.
 *
 * A removal immediately followed by an insertion is paired into ONE row rather
 * than two. That is the common shape of an edit - a line was rewritten - and
 * showing the old and the new opposite each other is the whole point of the
 * comparison. Left as separate rows, a rewritten line reads as a deletion
 * followed by an unrelated addition, with a gap opposite each.
 */
export function rows(changes: readonly Change[]): DiffRow[] {
  const out: DiffRow[] = []
  let beforeLine = 1
  let afterLine = 1

  for (let at = 0; at < changes.length; at += 1) {
    const change = changes[at]!

    if (change.kind === 'same') {
      out.push({
        before: change.text,
        after: change.text,
        kind: 'same',
        beforeLine: beforeLine++,
        afterLine: afterLine++,
      })
      continue
    }

    if (change.kind === 'removed') {
      // A removal with an insertion right behind it is a rewrite: pair them,
      // so the reader sees what the line became rather than two separate
      // events with a gap opposite each.
      const next = changes[at + 1]
      if (next?.kind === 'added') {
        out.push({
          before: change.text,
          after: next.text,
          kind: 'removed',
          beforeLine: beforeLine++,
          afterLine: afterLine++,
        })
        at += 1
        continue
      }
      out.push({
        before: change.text,
        after: null,
        kind: 'removed',
        beforeLine: beforeLine++,
        afterLine: null,
      })
      continue
    }

    out.push({
      before: null,
      after: change.text,
      kind: 'added',
      beforeLine: null,
      afterLine: afterLine++,
    })
  }

  return out
}

/** How much moved, for the one line above a comparison - or for a list that
 * wants to say "12 lines changed" without drawing anything. */
export function countChanges(changes: readonly Change[]): { added: number; removed: number } {
  let added = 0
  let removed = 0
  for (const change of changes) {
    if (change.kind === 'added') added += 1
    else if (change.kind === 'removed') removed += 1
  }
  return { added, removed }
}
