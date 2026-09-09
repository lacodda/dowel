# TreeView

Source: https://lacodda.github.io/dowel/components/tree-view

FENCE0 

See it live on the stand: https://lacodda.github.io/dowel/stand/#tree-view

A file tree with a selection, and a folder with nothing in it.

## Notes

**A tree is one control with a cursor in it**, not a nest of lists with click
handlers. That difference is the whole component, and it shows in two places
that are invisible until someone uses a keyboard.

**One tab stop, not one per node.** A tree of four hundred files with a
`tabIndex` on each is four hundred stops between the sidebar and the editor.
The container is what the keyboard reaches, and the arrows move a cursor inside
it — the arrangement [RadioGroup](/dowel/components/radio-group/) has, for the
same reason.

**Right and Left do different things depending on where you are:**

| Key | On a closed folder | On an open folder | On a leaf |
| --- | --- | --- | --- |
| `→` | opens it | steps into the first child | nothing |
| `←` | jumps to the parent | closes it | jumps to the parent |

The parent jump is the part hand-rolled trees leave out, and it is the one that
matters most: without it the only way back out of a deep folder is through
every sibling below it.

```tsx
<TreeView
  nodes={nodes}
  selected={openFile}
  onSelect={setOpenFile}
  label="Files"
/>
```

**The cursor and the selection are different things.** The cursor is where the
keyboard is; the selection is the file being edited. A reader walks the tree
with arrows without opening anything until Enter — so the cursor starts on the
selected row rather than at the top, which is halfway up a long sidebar.

**An empty folder is a folder.** `children: []` is not enough to say so —
absence of children is what a leaf looks like — so an empty folder is marked
with `empty`, opens, and shows nothing.

**The nodes are given, not discovered.** A tree that loads its children when a
folder opens is a different component with a different problem: a spinner per
node, a request per open, an error state inside a row.

**The sums live next door**, in
[tree-rows](/dowel/components/tree-rows/), with no React in them — the same
split [table-sort](/dowel/components/table-sort/) is. `visibleRows` is also the
answer to "how many rows is this tree", which is what a product needs to put a
tree inside a [VirtualList](/dowel/components/virtual-list/).

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `nodes` | `readonly TreeNode[]` | | `{ id, label, children?, empty? }` |
| `open` | `ReadonlySet<string>` | | Uncontrolled if omitted |
| `onOpenChange` | `(open: Set<string>) => void` | | |
| `selected` | `string` | | The chosen row, not the cursor |
| `onSelect` | `(id: string) => void` | | Fired on a leaf |
| `label` | `string` | | Required. What a reader calls the tree |

`TreeNode` and `visibleRows` come from
[tree-rows](/dowel/components/tree-rows/), which the registry installs
alongside.
