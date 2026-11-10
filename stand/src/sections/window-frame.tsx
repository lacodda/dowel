import { useState } from 'react'
import { Row } from '../row'
import { SearchField } from '../../../registry/ui/search-field'
import { NotificationBell } from '../../../registry/ui/notification-bell'
import { ResizeEdges, TitleBar } from '../../../registry/ui/window-frame'
import { Tabs, TabsList, TabsTab } from '../../../registry/ui/tabs'
import { bellLabels, splashMark } from './shared'

const windowLabels = { minimize: 'Minimize', maximize: 'Maximize', restore: 'Restore', close: 'Close' }

/* The stand runs in a browser, where there is no Tauri window to drive: the
 * component checks for the bridge before every call and stays inert without
 * it, so nothing here is mocked. */
export function WindowFrameSection() {
  const [query, setQuery] = useState('')

  return (
    <>
      <Row label="a frameless window's chrome, inside a frame - the strips along the edges are tinted here so they can be seen">
        <div className="relative h-56 w-full overflow-hidden rounded-lg border border-line bg-bg">
          <ResizeEdges className="absolute bg-accent/40" />
          <TitleBar
            labels={windowLabels}
            mark={<span className="size-4 [&>svg]:size-full">{splashMark}</span>}
            actions={<NotificationBell count={2} {...bellLabels} />}
          >
            <Tabs defaultValue="draft">
              <TabsList variant="bar" aria-label="Open documents">
                <TabsTab value="draft" modified modifiedLabel="unsaved changes" onClose={() => undefined} closeLabel="Close Draft">
                  Draft
                </TabsTab>
                <TabsTab value="notes" onClose={() => undefined} closeLabel="Close Notes">
                  Notes
                </TabsTab>
              </TabsList>
            </Tabs>
          </TitleBar>
          <p className="m-0 p-4 text-sm text-dim">
            Everything in the bar that is not a control is a handle - the stretch after the tabs is
            there only for that. Drag it to move the window; double-click to maximise.
          </p>
        </div>
      </Row>

      <Row label="a centre slot, held at the window's middle - a search box, with tabs still on the left">
        <div className="relative h-56 w-full overflow-hidden rounded-lg border border-line bg-bg">
          <TitleBar
            labels={windowLabels}
            mark={<span className="size-4 [&>svg]:size-full">{splashMark}</span>}
            center={
              <SearchField
                value={query}
                onValueChange={setQuery}
                clearLabel="Clear search"
                placeholder="Search"
                aria-label="Search"
                className="w-72"
              />
            }
          >
            <Tabs defaultValue="overview">
              <TabsList variant="bar" aria-label="Open documents">
                <TabsTab value="overview" onClose={() => undefined} closeLabel="Close Overview">
                  Overview
                </TabsTab>
                <TabsTab value="history" onClose={() => undefined} closeLabel="Close History">
                  History
                </TabsTab>
              </TabsList>
            </Tabs>
          </TitleBar>
          <p className="m-0 p-4 text-sm text-dim">
            The centre keeps its place: opening or closing a tab on the left does not move it, and
            each side keeps a handle of its own to drag by.
          </p>
        </div>
      </Row>
    </>
  )
}
