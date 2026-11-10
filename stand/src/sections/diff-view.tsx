import { Row } from '../row'
import { DiffView } from '../../../registry/ui/diff-view'
import { countChanges, diffLines, rows as diffRows } from '../../../registry/ui/diff-lines'

/* Two drafts of the same verse: one line rewritten, one inserted, one removed.
 * Short enough to read at a glance and long enough to show the alignment. */
const draftBefore = `The wire hums where the road gives out,
a kettle somewhere, a door.
Nobody counts the hours here.
We keep what we can carry.`

const draftAfter = `The wire hums where the road gives out,
a kettle somewhere, a door ajar.
The light stays on in the hallway.
Nobody counts the hours here.
We keep what we can carry.`

export function DiffViewSection() {
  return (
    <>
      <Row label="two drafts - one line rewritten (~), one inserted (+), and the rest standing still">
        <div className="w-208">
          <DiffView
            before={draftBefore}
            after={draftAfter}
            beforeLabel="Draft 3"
            afterLabel="Draft 4"
            summary={({ added, removed }) => `${added} lines in, ${removed} out`}
            copyLabel={(side) => `Copy ${side}`}
            copiedLabel="Copied"
          />
        </div>
      </Row>

      <Row label="the same comparison in a side panel - the after line under the before one, never dropped">
        <div className="w-88">
          <DiffView
            before={draftBefore}
            after={draftAfter}
            beforeLabel="Draft 3"
            afterLabel="Draft 4"
            size="sm"
          />
        </div>
      </Row>

      <Row label="nothing moved - no markers, no tint, and the summary says so">
        <div className="w-208">
          <DiffView
            before={draftBefore}
            after={draftBefore}
            beforeLabel="Draft 3"
            afterLabel="Draft 3, again"
            summary={({ added, removed }) =>
              added === 0 && removed === 0 ? 'identical' : `${added} in, ${removed} out`
            }
          />
        </div>
      </Row>
    </>
  )
}

export function DiffLinesSection() {
  const changes = diffLines(draftBefore, draftAfter)
  const paired = diffRows(changes)
  const counts = countChanges(changes)

  return (
    <>
      <Row label="the changes, in order - what the comparison is built from">
        <div className="w-208 font-mono text-xs leading-relaxed text-dim">
          {changes.map((change, at) => (
            <div key={at}>
              <span className="text-faint">{change.kind.padEnd(8)}</span>
              {change.text === '' ? '\u00a0' : change.text}
            </div>
          ))}
        </div>
      </Row>

      <Row label="paired into rows - one object with two sides, which is what keeps two columns in step">
        <div className="w-208 font-mono text-xs leading-relaxed text-dim">
          {paired.map((row, at) => (
            <div key={at}>
              <span className="text-faint">
                {String(row.beforeLine ?? '-').padStart(2)} {String(row.afterLine ?? '-').padStart(2)}{' '}
              </span>
              <span className={row.before === null ? 'text-faint' : undefined}>
                {(row.before ?? '(nothing)').slice(0, 22).padEnd(24)}
              </span>
              <span className={row.after === null ? 'text-faint' : undefined}>
                {(row.after ?? '(nothing)').slice(0, 22)}
              </span>
            </div>
          ))}
        </div>
      </Row>

      <Row label="the counts, for a product that wants the number without the comparison">
        <span className="font-mono text-xs text-dim">
          {counts.added} added, {counts.removed} removed
        </span>
      </Row>
    </>
  )
}
