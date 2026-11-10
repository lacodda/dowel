import { useState } from 'react'
import { Row } from '../row'
import { TreeView } from '../../../registry/ui/tree-view'
import { visibleRows, type TreeNode } from '../../../registry/ui/tree-rows'

const tree: TreeNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      { id: 'app', label: 'App.tsx' },
      {
        id: 'ui',
        label: 'ui',
        children: [
          { id: 'button', label: 'Button.tsx' },
          { id: 'input', label: 'Input.tsx' },
          { id: 'table', label: 'Table.tsx' },
        ],
      },
      { id: 'styles', label: 'styles.css' },
    ],
  },
  {
    id: 'docs',
    label: 'docs',
    children: [{ id: 'readme', label: 'README.md' }],
  },
  { id: 'drafts', label: 'drafts', empty: true },
  { id: 'license', label: 'LICENSE' },
]

export function TreeViewSection() {
  const [selected, setSelected] = useState('button')
  /* Open to begin with, and that is not decoration: closed, the stand shows a
   * list of four folders and none of what the component is - the indent, the
   * cursor, the selected row, the levels a reader is told about. A picture of
   * a tree should be a picture of a tree. */
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(['src', 'ui', 'docs']))

  return (
    <>
      <Row label="tab into it once, then arrows - right opens, left gets you back out">
        <TreeView
          nodes={tree}
          open={open}
          onOpenChange={setOpen}
          selected={selected}
          onSelect={setSelected}
          label="Files"
          className="w-72 rounded-md border border-line p-1"
        />
      </Row>

      <Row label="an empty folder still opens, and shows nothing - a fact about the folder">
        <TreeView
          nodes={[{ id: 'drafts', label: 'drafts', empty: true }]}
          open={new Set(['drafts'])}
          label="Empty folder"
          className="w-72 rounded-md border border-line p-1"
        />
      </Row>
    </>
  )
}

export function TreeRowsSection() {
  /* The same tree, flattened twice: the sums that decide what a TreeView draws
   * and what a VirtualList would have to window. Shown as text, because there
   * is no markup here - the module is the arithmetic. */
  const closed = visibleRows(tree, new Set())
  const open = visibleRows(tree, new Set(['src', 'ui', 'docs']))

  return (
    <>
      {[
        ['closed', closed],
        ["open: src, ui, docs", open],
      ].map(([label, rows]) => (
        <Row key={label as string} label={`${label} - ${(rows as unknown[]).length} rows`}>
          <div className="flex flex-col gap-1 font-mono text-xs">
            {(rows as ReturnType<typeof visibleRows>).map(({ node, depth, parent }) => (
              <div key={node.id} className="flex items-baseline gap-2">
                <span className="text-dim" style={{ paddingLeft: `${depth * 12}px` }}>
                  {String(node.label)}
                </span>
                <span className="text-faint">
                  depth {depth}
                  {parent ? ` · in ${parent}` : ' · at the root'}
                </span>
              </div>
            ))}
          </div>
        </Row>
      ))}
    </>
  )
}
