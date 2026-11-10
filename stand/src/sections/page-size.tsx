import { useState } from 'react'
import { Row } from '../row'
import { PageSize } from '../../../registry/ui/page-size'

export function PageSizeSection() {
  const [pageSize, setPageSize] = useState(25)

  return (
    <>
      <Row label="a Select, never a native one - and it hands back a number">
        <PageSize pageSize={pageSize} onPageSizeChange={setPageSize} label="Rows per page">
          Rows per page
        </PageSize>
      </Row>
      <Row label="the choices are the product's">
        <PageSize
          pageSize={200}
          options={[50, 200, 1000]}
          onPageSizeChange={() => {}}
          label="Rows to load"
        >
          Load at a time
        </PageSize>
      </Row>
    </>
  )
}
