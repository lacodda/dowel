import { useState } from 'react'
import { cn } from 'dowel-ui'
import { Row } from '../row'
import { Button } from '../../../registry/ui/button'
import { NavGroup, NavRail, NavSpacer, type NavRailItem } from '../../../registry/ui/nav-rail'
import { shellScreens } from './shared'

const shellRoadmap: NavRailItem[] = [
  {
    id: 'notes',
    label: 'Notes',
    soon: true,
    end: '0.59',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M4 2.5h5L12.5 6v7.5h-8.5z" />
        <path d="M9 2.5V6h3.5" />
      </svg>
    ),
  },
]

export function NavRailSection() {
  const [column, setColumn] = useState('catalogue')
  const [row, setRow] = useState('dashboard')
  const [bar, setBar] = useState('calendar')
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      <Row label="column - the desktop rail, and the same rail with a group and a foot">
        <div className="h-64 w-56 overflow-hidden rounded-lg border border-line">
          <NavRail label="Screens" items={shellScreens} activeId={column} onSelect={setColumn} />
        </div>
        {/* A group and a foot are things the product puts around the list:
            NavRail takes the destinations, and where they sit is the rail the
            product assembles. */}
        <div className="flex h-64 w-56 flex-col overflow-hidden rounded-lg border-r border-line">
          <NavRail
            label="Screens"
            items={shellScreens}
            activeId={column}
            onSelect={setColumn}
            className="h-auto border-r-0 pb-0"
          />
          <NavGroup>Library</NavGroup>
          <NavRail label="Library" items={shellRoadmap} className="h-auto border-r-0 pt-0 pb-0" />
          <NavSpacer>
            <NavRail
              label="Settings"
              items={[{ id: 'settings', label: 'Settings' }]}
              className="h-auto border-r-0 pt-0"
            />
          </NavSpacer>
        </div>
      </Row>

      <Row label="row - tabs in a header, beside the name of the product">
        <div className="flex w-full items-center gap-4 rounded-lg border border-line bg-bg px-3 py-2">
          <span className="text-sm font-semibold">Product</span>
          <NavRail layout="row" label="Screens" items={shellScreens} activeId={row} onSelect={setRow} />
        </div>
      </Row>

      <Row label="bar - along the bottom of a phone, where the thumb already is">
        <div className="w-full max-w-88 overflow-hidden rounded-lg border border-line bg-bg">
          <div className="h-16" />
          <NavRail layout="bar" label="Screens" items={shellScreens} activeId={bar} onSelect={setBar} />
        </div>
      </Row>

      <Row label="collapsed - icons only, each name in a tooltip beside it">
        <div className="h-64 w-rail-compact flex flex-col overflow-hidden rounded-lg border-r border-line">
          <NavRail
            label="Screens"
            items={shellScreens}
            activeId={column}
            onSelect={setColumn}
            collapsed
            className="h-auto border-r-0 pb-0"
          />
          <NavGroup collapsed>Library</NavGroup>
          <NavRail label="Library" items={shellRoadmap} collapsed className="h-auto border-r-0 pt-0 pb-0" />
          <NavSpacer>
            <NavRail
              label="Settings"
              items={[{ id: 'settings', label: 'Settings' }]}
              collapsed
              className="h-auto border-r-0 pt-0"
            />
          </NavSpacer>
        </div>
      </Row>

      <Row label="collapse in place - the width switches between w-56 and w-rail-compact">
        <div
          className={cn(
            'h-64 overflow-hidden rounded-lg border border-line transition-all',
            collapsed ? 'w-rail-compact' : 'w-56',
          )}
        >
          <NavRail
            label="Screens"
            items={shellScreens}
            activeId={column}
            onSelect={setColumn}
            collapsed={collapsed}
          />
        </div>
        <Button variant="ghost" size="sm" onClick={() => setCollapsed((value) => !value)}>
          {collapsed ? 'Expand' : 'Collapse'}
        </Button>
      </Row>
    </>
  )
}
