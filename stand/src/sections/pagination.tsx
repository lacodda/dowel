import { useState } from 'react'
import { Row } from '../row'
import { Pagination, pageRange } from '../../../registry/ui/pagination'
import { NumberFormat } from '../../../registry/ui/number-format'

const paginationLabels = {
  region: 'Pages',
  previous: 'Previous page',
  next: 'Next page',
  page: (page: number) => `Page ${page}`,
}

export function PaginationSection() {
  const [page, setPage] = useState(1)
  const pageSize = 25
  const total = 973
  const [from, to] = pageRange(page, pageSize, total)

  return (
    <>
      <Row label="page through it - the row keeps its width wherever you are">
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-dim tabular-nums">
            {from}-{to} of <NumberFormat value={total} />
          </span>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            labels={paginationLabels}
          />
        </div>
      </Row>

      <Row label="a short list draws every page, and a wider neighbourhood is a prop">
        <Pagination
          page={2}
          pageSize={10}
          total={40}
          onPageChange={() => {}}
          labels={paginationLabels}
        />
        <Pagination
          page={20}
          pageSize={10}
          total={400}
          around={2}
          onPageChange={() => {}}
          labels={paginationLabels}
        />
      </Row>
    </>
  )
}
