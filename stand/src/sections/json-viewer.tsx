import { useState } from 'react'
import { Row } from '../row'
import { JsonViewer } from '../../../registry/ui/json-viewer'
import { branchPaths, visibleRows as jsonRows } from '../../../registry/ui/json-rows'

/* A payload with the shapes a viewer has to survive: a large array nobody
 * opened, a number that arrived as a string, a present null, an empty object. */
const payload = {
  event: 'release.published',
  version: '0.25.0',
  retries: 0,
  'user name': 'a stand',
  draft: false,
  published_at: null,
  meta: {},
  totals: { primitives: '76', tests: 2361 },
  assets: Array.from({ length: 1204 }, (_, at) => ({
    name: `asset-${at}.svg`,
    bytes: 1024 + at,
  })),
}

export function JsonViewerSection() {
  const [touched, setTouched] = useState('nothing yet')

  return (
    <>
      <Row label="a payload - what fits arrives open, and a 1204-entry array costs one row until asked">
        <JsonViewer
          value={payload}
          label="A webhook payload"
          className="max-h-96 w-136"
          onActivate={(row) => setTouched(row.path)}
        />
      </Row>

      <Row label="the path of the last row touched - what 'copy this path' hangs on">
        <span className="font-mono text-xs text-dim">{touched}</span>
      </Row>

      <Row label="a number that arrived as a string, beside a real one, and a present null">
        <JsonViewer
          value={{ totals: { primitives: '76', tests: 2361 }, published_at: null }}
          label="Quoted and unquoted"
          className="w-136"
        />
      </Row>

      <Row label="nothing but a value - a viewer of one leaf is still a viewer">
        <JsonViewer value={null} label="A null" className="w-136" />
      </Row>
    </>
  )
}

export function JsonRowsSection() {
  const open = branchPaths(payload, { depth: 2 })
  const rows = jsonRows(payload, open)

  return (
    <>
      <Row label="the rows a document flattens into - path, depth, and what it is">
        <div className="max-h-96 w-208 overflow-auto font-mono text-xs leading-relaxed text-dim">
          {rows.map((row) => (
            <div key={row.path}>
              <span className="text-faint">{String(row.depth)} </span>
              <span>{row.path.padEnd(28)}</span>
              <span className="text-faint">{row.kind.padEnd(9)}</span>
              <span className="text-faint">{row.size === undefined ? '' : `(${row.size})`}</span>
            </div>
          ))}
        </div>
      </Row>

      <Row label="a key dot notation would break, written so the path still resolves">
        <div className="w-208 font-mono text-xs text-dim">
          {jsonRows({ 'user name': 1, 'a.b': 2 }, new Set(['$'])).map((row) => (
            <div key={row.path}>{row.path}</div>
          ))}
        </div>
      </Row>

      <Row label="how many branches 'expand all' would open, at each bound">
        <span className="font-mono text-xs text-dim">
          {[1, 2, 3, 9]
            .map((depth) => `depth ${depth}: ${branchPaths(payload, { depth }).size}`)
            .join('  ·  ')}
        </span>
      </Row>
    </>
  )
}
