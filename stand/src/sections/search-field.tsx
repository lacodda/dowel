import { useState } from 'react'
import { Row } from '../row'
import { SearchField } from '../../../registry/ui/search-field'

export function SearchFieldSection() {
  const [plain, setPlain] = useState('')
  const [clearable, setClearable] = useState('a half-remembered line')
  const [withShortcut, setWithShortcut] = useState('')

  return (
    <>
      <Row label="plain">
        <SearchField
          className="max-w-72"
          aria-label="Search"
          placeholder="Search"
          value={plain}
          onValueChange={setPlain}
        />
      </Row>

      <Row label="clearable - the button appears with the query">
        <SearchField
          className="max-w-72"
          aria-label="Search"
          placeholder="Search"
          clearLabel="Clear"
          value={clearable}
          onValueChange={setClearable}
        />
      </Row>

      <Row label="with its shortcut - press it and watch the focus">
        <SearchField
          className="max-w-72"
          aria-label="Search everything"
          placeholder="Search"
          clearLabel="Clear"
          shortcut={{ id: 'search', label: 'Search everything', keys: 'Mod+/' }}
          value={withShortcut}
          onValueChange={setWithShortcut}
        />
      </Row>
    </>
  )
}
