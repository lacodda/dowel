import { describe, expect, it } from 'vitest'
import { isBranch, visibleRows, type TreeNode } from './tree-rows'

/*
 * tree-rows.
 *
 * The sums a tree runs on, with no React in them - so they are checked as
 * plain functions, the way `table-sort` and `calendar-math` are. A product
 * windowing a large tree imports these and never the component.
 */

const nodes: TreeNode[] = [
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
        ],
      },
    ],
  },
  { id: 'readme', label: 'README.md' },
  { id: 'empty', label: 'empty', empty: true },
]

describe('which rows the tree shows', () => {
  it('shows only what is open', () => {
    const closed = visibleRows(nodes, new Set())
    expect(closed.map((r) => r.node.id)).toEqual(['src', 'readme', 'empty'])
  })

  it('flattens the open branches in the order the eye travels', () => {
    // Flat is what makes Down "the next row" rather than a recursive question
    // answered differently at each depth.
    const open = visibleRows(nodes, new Set(['src', 'ui']))
    expect(open.map((r) => r.node.id)).toEqual([
      'src',
      'app',
      'ui',
      'button',
      'input',
      'readme',
      'empty',
    ])
  })

  it('records the depth and the parent of every row', () => {
    const open = visibleRows(nodes, new Set(['src', 'ui']))
    const button = open.find((r) => r.node.id === 'button')
    expect(button?.depth).toBe(2)
    // The parent is what Left uses to get out of a deep branch.
    expect(button?.parent).toBe('ui')
  })

  it('counts an empty folder as a folder', () => {
    // An empty array of children is not the same as no children: a folder with
    // nothing in it still opens, and saying so needs a real value.
    expect(isBranch({ id: 'e', label: 'e', empty: true })).toBe(true)
    expect(isBranch({ id: 'l', label: 'l' })).toBe(false)
    expect(isBranch({ id: 'f', label: 'f', children: [{ id: 'c', label: 'c' }] })).toBe(true)
  })
})
