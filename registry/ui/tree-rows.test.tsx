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

  it('walks a folder of a quarter of a million files without running out of stack', () => {
    // furca: 200 000 files in one open folder threw "Maximum call stack size
    // exceeded", because each folder's rows were spread into its parent's as
    // arguments. 250 000 is past where that broke.
    const files = Array.from({ length: 250_000 }, (_, index) => ({ id: `f${index}`, label: `f${index}` }))
    const rows = visibleRows([{ id: 'big', label: 'big', children: files }], new Set(['big']))
    expect(rows).toHaveLength(250_001)
    expect(rows[1]).toEqual({ node: files[0], depth: 1, parent: 'big', position: 0, siblings: 250_000 })
    expect(rows.at(-1)!.node.id).toBe('f249999')
  })

  it('walks a branch thousands of folders deep, in order', () => {
    // No call per level either: a chain this deep would exhaust a recursive walk.
    let chain: TreeNode = { id: 'leaf', label: 'leaf' }
    const open = new Set<string>()
    for (let level = 20_000; level > 0; level -= 1) {
      chain = { id: `d${level}`, label: `d${level}`, children: [chain] }
      open.add(`d${level}`)
    }
    const rows = visibleRows([chain, { id: 'after', label: 'after' }], open)
    expect(rows).toHaveLength(20_002)
    expect(rows.at(-2)).toMatchObject({ node: { id: 'leaf' }, depth: 20_000, parent: 'd20000' })
    // The sibling of the top folder comes after everything inside it.
    expect(rows.at(-1)).toMatchObject({ node: { id: 'after' }, depth: 0, parent: undefined })
  })

  it('starts at the depth and under the parent it is given', () => {
    const rows = visibleRows([{ id: 'x', label: 'x', children: [{ id: 'y', label: 'y' }] }], new Set(['x']), 3, 'p')
    expect(rows).toEqual([
      { node: expect.objectContaining({ id: 'x' }), depth: 3, parent: 'p', position: 0, siblings: 1 },
      { node: expect.objectContaining({ id: 'y' }), depth: 4, parent: 'x', position: 0, siblings: 1 },
    ])
  })

  it('says where each row stands among the nodes of its folder', () => {
    const open = visibleRows(nodes, new Set(['src', 'ui']))
    const place = (id: string) => {
      const row = open.find((r) => r.node.id === id)!
      return [row.position, row.siblings]
    }
    expect(place('src')).toEqual([0, 3])
    expect(place('app')).toEqual([0, 2])
    expect(place('ui')).toEqual([1, 2])
    expect(place('input')).toEqual([1, 2])
    expect(place('empty')).toEqual([2, 3])
  })

  it('counts an empty folder as a folder', () => {
    // An empty array of children is not the same as no children: a folder with
    // nothing in it still opens, and saying so needs a real value.
    expect(isBranch({ id: 'e', label: 'e', empty: true })).toBe(true)
    expect(isBranch({ id: 'l', label: 'l' })).toBe(false)
    expect(isBranch({ id: 'f', label: 'f', children: [{ id: 'c', label: 'c' }] })).toBe(true)
  })
})
