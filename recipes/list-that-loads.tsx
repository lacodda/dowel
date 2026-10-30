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
        // Back to pending, then load again: the retry is seen to be happening.
        onRetry={() => {
          setRows(null)
          setError(null)
          setAttempt((count) => count + 1)
        }}
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
