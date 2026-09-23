import { useState } from 'react'
import { Tabs, TabsList, TabsPanel, TabsTab } from '../../../registry/ui/tabs'
import { Row } from '../row'

const documents = [
  { id: 'harbour', name: 'Harbour lights.md', dirty: false },
  { id: 'tides', name: 'Tide tables, autumn.md', dirty: true },
  { id: 'crew', name: 'Crew list.md', dirty: false },
]

export function TabsSection() {
  const [open, setOpen] = useState(documents)
  const [active, setActive] = useState<string>('tides')

  const close = (id: string) => {
    const rest = open.filter((doc) => doc.id !== id)
    setOpen(rest.length > 0 ? rest : documents)
    if (id === active) setActive((rest[0] ?? documents[0]!).id)
  }

  return (
    <>
      <Row label="line - words over a panel, the rule slides to the chosen one">
        <Tabs defaultValue="general" className="w-full">
          <TabsList aria-label="Settings">
            <TabsTab value="general">General</TabsTab>
            <TabsTab value="storage">Storage</TabsTab>
            <TabsTab value="shortcuts">Shortcuts</TabsTab>
            <TabsTab value="about" disabled>
              About
            </TabsTab>
          </TabsList>
          <TabsPanel value="general" className="p-3 text-sm text-dim">
            Where new documents go, and what the window opens with.
          </TabsPanel>
          <TabsPanel value="storage" className="p-3 text-sm text-dim">
            The folder the workspace lives in, and how much of it is used.
          </TabsPanel>
          <TabsPanel value="shortcuts" className="p-3 text-sm text-dim">
            Every key the app answers to, in one list.
          </TabsPanel>
        </Tabs>
      </Row>

      <Row label="vertical - the same list along the side of a panel">
        <Tabs defaultValue="profile" orientation="vertical" className="w-full">
          <TabsList aria-label="Account">
            <TabsTab value="profile">Profile</TabsTab>
            <TabsTab value="devices">Devices</TabsTab>
            <TabsTab value="export">Export</TabsTab>
          </TabsList>
          <TabsPanel value="profile" className="p-3 text-sm text-dim">
            The name other people see.
          </TabsPanel>
          <TabsPanel value="devices" className="p-3 text-sm text-dim">
            The machines this account is signed in on.
          </TabsPanel>
          <TabsPanel value="export" className="p-3 text-sm text-dim">
            Everything, as files you keep.
          </TabsPanel>
        </Tabs>
      </Row>

      <Row label="bar - open documents, one unsaved; close with the cross, a middle click or Delete">
        <div className="w-full overflow-hidden rounded-lg border border-line">
          <div className="flex h-titlebar items-stretch border-b border-line bg-raise">
            <Tabs value={active} onValueChange={(value) => setActive(value as string)}>
              <TabsList variant="bar" aria-label="Open documents">
                {open.map((doc) =>
                  doc.dirty ? (
                    <TabsTab
                      key={doc.id}
                      value={doc.id}
                      modified
                      modifiedLabel="unsaved changes"
                      onClose={() => close(doc.id)}
                      closeLabel={`Close ${doc.name}`}
                    >
                      {doc.name}
                    </TabsTab>
                  ) : (
                    <TabsTab key={doc.id} value={doc.id} onClose={() => close(doc.id)} closeLabel={`Close ${doc.name}`}>
                      {doc.name}
                    </TabsTab>
                  ),
                )}
              </TabsList>
            </Tabs>
          </div>
          <p className="m-0 bg-bg p-4 text-sm text-dim">
            The active tab takes the page's ground, so it reads as joined to the document below.
          </p>
        </div>
      </Row>
    </>
  )
}
