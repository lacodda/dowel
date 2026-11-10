import { useState } from 'react'
import { Row } from '../row'
import { Button } from '../../../registry/ui/button'
import {
  Menu,
  MenuCheckboxIndicator,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuSub,
  MenuSubTrigger,
  MenuTrigger,
} from '../../../registry/ui/menu'
import { Dots } from './shared'

export function MenuSection() {
  return (
    <>
      <Row label="click, then drive it with the arrows">
        <Menu>
          <MenuTrigger render={<Button variant="ghost" />}>Actions</MenuTrigger>
          <MenuPopup>
            <MenuItem>Rename</MenuItem>
            <MenuItem>Duplicate</MenuItem>
            <MenuSeparator />
            <MenuItem tone="danger">Delete</MenuItem>
          </MenuPopup>
        </Menu>

        <Menu>
          <MenuTrigger render={<Button variant="icon" size="icon-md" aria-label="More" />}>
            <Dots />
          </MenuTrigger>
          <MenuPopup>
            <MenuGroup>
              <MenuGroupLabel>This version</MenuGroupLabel>
              <MenuItem>Open</MenuItem>
              <MenuItem>Copy the text</MenuItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuGroup>
              <MenuGroupLabel>Danger</MenuGroupLabel>
              <MenuItem tone="danger">Delete the draft</MenuItem>
            </MenuGroup>
          </MenuPopup>
        </Menu>
      </Row>

      <Row label="a tick, a submenu, and an item that cannot be chosen - the arrows reach it, Enter does nothing">
        <ViewMenu />
      </Row>
    </>
  )
}

function ViewMenu() {
  const [grid, setGrid] = useState(true)
  const [zoom, setZoom] = useState('100%')

  return (
    <>
      <Menu>
        <MenuTrigger render={<Button variant="ghost" />}>View</MenuTrigger>
        <MenuPopup>
          <MenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
            <span className="grid size-3.5 place-items-center">
              <MenuCheckboxIndicator>
                <Tick />
              </MenuCheckboxIndicator>
            </span>
            Show the grid
          </MenuCheckboxItem>
          <MenuSub>
            <MenuSubTrigger>Zoom</MenuSubTrigger>
            <MenuPopup>
              <MenuItem onClick={() => setZoom('125%')}>Zoom in</MenuItem>
              <MenuItem onClick={() => setZoom('80%')}>Zoom out</MenuItem>
              <MenuItem onClick={() => setZoom('100%')}>Actual size</MenuItem>
            </MenuPopup>
          </MenuSub>
          <MenuItem disabled>Export the view</MenuItem>
          <MenuItem onClick={() => setZoom('100%')}>Reset the layout</MenuItem>
        </MenuPopup>
      </Menu>
      <span className="text-xs text-dim" data-probe="view-state">
        grid {grid ? 'on' : 'off'}, {zoom}
      </span>
    </>
  )
}

function Tick() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
