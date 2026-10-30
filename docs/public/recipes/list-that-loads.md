# A list that loads

Source: https://lacodda.github.io/dowel/recipes/list-that-loads

The screen every product builds first, and the one every product gets
slightly wrong in its own way: a spinner where the shape was known, an empty
state that cannot tell "none yet" from "none match", a failure with no way to
try again. Composed from [QueryState](/dowel/components/query-state/),
[SearchField](/dowel/components/search-field/),
[RowButton](/dowel/components/list-row/) and
[Pagination](/dowel/components/pagination/).

```tsx
/*
 * Recipe: a list that loads.
 *
 * The screen every product builds first: rows from somewhere slow, a search
 * over them, pages when there are many - and the three moments that are not
 * the list. Still loading, failed, found nothing. `QueryState` owns those
 * three, in that order of precedence, so the list itself is drawn only when
 * there is something to draw, and a failure always has a way out.
 *
 * Wire `load` to the product's own fetch - TanStack Query's `isPending` and
 * `error` go straight into `QueryState` the same way. Every word a reader sees
 * is here, in one place, for the product's language to replace.
 */
import { useEffect, useState } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { RowButton } from '@/components/ui/list-row'
import { Pagination } from '@/components/ui/pagination'
import { QueryState } from '@/components/ui/query-state'
import { SearchField } from '@/components/ui/search-field'

export interface Row {
  id: string
  title: string
  summary: string
}

const PAGE_SIZE = 10

export function ListThatLoads({
  load,
  onOpen,
}: {
  /** Fetches every row. Called once, and again on "Try again". */
  load: () => Promise<readonly Row[]>
  /** A row was chosen. */
  onOpen: (id: string) => void
}) {
  const [rows, setRows] = useState<readonly Row[] | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    // A slow answer to an old attempt must not land over a newer one.
    let current = true
    setRows(null)
    setError(null)
    load().then(
      (loaded) => current && setRows(loaded),
      (failed: unknown) => current && setError(failed instanceof Error ? failed : new Error(String(failed))),
    )
    return () => {
      current = false
    }
  }, [load, attempt])

  const needle = query.trim().toLowerCase()
  const found = (rows ?? []).filter((row) => row.title.toLowerCase().includes(needle))
  const shown = found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <section aria-labelledby="works-heading" className="flex flex-col gap-3">
      <h2 id="works-heading" className="text-lg font-semibold text-text">
        Works
      </h2>
      <SearchField
        value={query}
        // A new search starts at its first page; page 4 of a different
        // question is usually empty.
        onValueChange={(next) => {
          setQuery(next)
          setPage(1)
        }}
        aria-label="Search works"
        clearLabel="Clear the search"
      />
      <QueryState
        pending={rows === null && error === null}
        error={error}
        empty={found.length === 0}
        errorLabels={{ title: 'The works did not load', body: 'The connection dropped. Nothing was lost.' }}
        onRetry={() => setAttempt((count) => count + 1)}
        retryLabel="Try again"
        // Two kinds of nothing: none exist, or none match. They say different
        // things and are drawn differently.
        emptyState={
          needle ? (
            <EmptyState variant="filtered" title={`Nothing called "${query.trim()}"`} />
          ) : (
            <EmptyState title="No works yet" body="A work you start appears here." />
          )
        }
      >
        <ul className="flex flex-col">
          {shown.map((row) => (
            <li key={row.id}>
              <RowButton description={row.summary} onClick={() => onOpen(row.id)}>
                {row.title}
              </RowButton>
            </li>
          ))}
        </ul>
        {found.length > PAGE_SIZE && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={found.length}
            onPageChange={setPage}
            labels={{ region: 'Pages', previous: 'Previous page', next: 'Next page', page: (n) => `Page ${n}` }}
          />
        )}
      </QueryState>
    </section>
  )
}
```

## What it gets right

**The order of the moments.** `QueryState` shows pending first, then the
error, then empty, then the list - so a reload that already has rows does not
blank the screen, and a failure is never drawn as "nothing here".

**Two kinds of nothing.** No works at all and no works matching the search
are different news; the filtered one is drawn as a filter that caught
nothing, and says what it was looking for.

**A failure has a way out.** `onRetry` puts a button on the error screen. A
product on TanStack Query passes `refetch`.

**A new search starts at page one.** Page four of a different question is
usually empty, which reads as "nothing found".

**A late answer cannot win.** The effect ignores a response to an attempt
that has been replaced - the fault that shows the old list after a retry.
