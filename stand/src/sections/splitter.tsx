import { useState } from 'react'
import { Splitter, SplitterHandle, SplitterPane } from '../../../registry/ui/splitter'
import { Row } from '../row'

const FILES = ['README.md', 'package.json', 'src/index.ts', 'src/theme.css', 'tests/a11y.tsx']

function Pane({ title, children }: { title: string; children: string }) {
  return (
    <div className="flex h-full flex-col gap-1 p-3">
      <div className="text-2xs uppercase tracking-caption text-dim">{title}</div>
      <p className="text-sm text-dim">{children}</p>
    </div>
  )
}

export function SplitterSection() {
  // What a product would persist: told once per gesture, not per move.
  const [saved, setSaved] = useState<number[]>([28, 72])

  return (
    <>
      <Row label="side by side - drag, or focus the line and use the arrows; Enter collapses the sidebar">
        <div className="w-full">
          <div className="h-56 w-full overflow-hidden rounded-lg border border-line bg-bg">
            <Splitter defaultSizes={saved} onSizesChange={setSaved}>
              <SplitterPane min={15} max={45} collapsible>
                <ul className="p-2 text-sm">
                  {FILES.map((file) => (
                    <li key={file}>
                      <a href={`#${file}`} className="block truncate rounded px-2 py-1 text-dim hover:bg-soft">
                        {file}
                      </a>
                    </li>
                  ))}
                </ul>
              </SplitterPane>
              <SplitterHandle label="Resize the file list" />
              <SplitterPane min={30}>
                <Pane title="Editor">The pane that takes what the sidebar gives up.</Pane>
              </SplitterPane>
            </Splitter>
          </div>
          <p className="mt-2 font-mono text-xs text-dim">onSizesChange: [{saved.join(', ')}]</p>
        </div>
      </Row>

      <Row label="stacked - Up and Down move the line; Shift moves five steps">
        <div className="h-64 w-full max-w-md overflow-hidden rounded-lg border border-line bg-bg">
          <Splitter orientation="vertical" defaultSizes={[60, 40]}>
            <SplitterPane min={25}>
              <Pane title="Query">Select the rows to inspect.</Pane>
            </SplitterPane>
            <SplitterHandle label="Resize the results" />
            <SplitterPane min={20} collapsible>
              <Pane title="Results">Forty-two rows, sorted by date.</Pane>
            </SplitterPane>
          </Splitter>
        </div>
      </Row>

      <Row label="three panes - each handle moves only the two panes beside it">
        <div className="h-48 w-full overflow-hidden rounded-lg border border-line bg-bg">
          <Splitter defaultSizes={[20, 50, 30]}>
            <SplitterPane min={10} collapsible>
              <Pane title="Outline">Headings of the open file.</Pane>
            </SplitterPane>
            <SplitterHandle label="Resize the outline" />
            <SplitterPane min={30}>
              <Pane title="Source">The text being edited.</Pane>
            </SplitterPane>
            <SplitterHandle label="Resize the preview" />
            <SplitterPane min={15} collapsible>
              <Pane title="Preview">What the text renders to.</Pane>
            </SplitterPane>
          </Splitter>
        </div>
      </Row>
    </>
  )
}
