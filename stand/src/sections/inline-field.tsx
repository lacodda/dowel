import { useState } from 'react'
import { InlineField, numberCodec, timecodeCodec } from '../../../registry/ui/inline-field'
import { Row } from '../row'

interface Overview {
  bpm: number | null
  key: string | null
  length: number | null
  language: string | null
  notes: string | null
}

const initialOverview: Overview = {
  bpm: 122,
  key: 'D minor',
  length: 234,
  language: 'English',
  notes: null,
}

export function InlineFieldSection() {
  const [overview, setOverview] = useState<Overview>(initialOverview)

  const commit =
    <K extends keyof Overview>(key: K) =>
    (value: Overview[K]) => {
      setOverview((current) => ({ ...current, [key]: value }))
    }

  return (
    <>
      <Row label="a work's overview - click a value and type; Enter or leaving keeps it, Escape takes it back; text Enter cannot read stays in the box, marked">
        <div className="grid w-96 grid-cols-2 gap-3">
          <InlineField label="BPM" value={overview.bpm} codec={numberCodec} onCommit={commit('bpm')} />
          <InlineField label="Key" value={overview.key} onCommit={commit('key')} />
          <InlineField label="Length" value={overview.length} codec={timecodeCodec} onCommit={commit('length')} />
          <InlineField label="Language" value={overview.language} onCommit={commit('language')} />
          <InlineField label="Notes" value={overview.notes} placeholder="—" onCommit={commit('notes')} />
        </div>
      </Row>

      <Row label="labelHidden - a column header already names the cell">
        <table className="w-full max-w-96 border-collapse text-sm">
          <thead>
            <tr className="text-left text-2xs uppercase tracking-caption text-dim">
              <th className="pb-1 pr-3 font-normal">Title</th>
              <th className="pb-1 pr-3 font-normal">BPM</th>
              <th className="pb-1 font-normal">Key</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-1 pr-3 text-text">Harbour lights</td>
              <td className="py-1 pr-3">
                <InlineField label="BPM" labelHidden value={122} codec={numberCodec} onCommit={() => undefined} />
              </td>
              <td className="py-1">
                <InlineField label="Key" labelHidden value="D minor" onCommit={() => undefined} />
              </td>
            </tr>
          </tbody>
        </table>
      </Row>
    </>
  )
}
