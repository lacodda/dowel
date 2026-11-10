import { Row } from '../row'
import { Button } from '../../../registry/ui/button'
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../../registry/ui/context-menu'

export function ContextMenuSection() {
  return (
    <Row label="right-click a row - or focus one and press Shift+F10 or the Menu key">
      {/* Rows that take focus, because the keyboard opens a context menu from
          whatever has focus inside the area: an area nothing in can be
          focused is one only a pointer can open. */}
      <ContextMenu>
        <ContextMenuTrigger
          render={<div className="flex w-full flex-col gap-0.5 rounded-md border border-dashed border-line-2 p-1" />}
        >
          {['Harbour lights', 'Paper boats', 'Low tide'].map((title) => (
            <Button key={title} variant="ghost" size="sm" className="justify-start">
              {title}
            </Button>
          ))}
        </ContextMenuTrigger>
        <ContextMenuPopup>
          <ContextMenuItem>Open</ContextMenuItem>
          <ContextMenuItem>Rename</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem tone="danger">Delete</ContextMenuItem>
        </ContextMenuPopup>
      </ContextMenu>
    </Row>
  )
}
