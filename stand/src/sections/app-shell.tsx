import { useState } from 'react'
import { Row } from '../row'
import { SkeletonText } from '../../../registry/ui/skeleton'
import { Button } from '../../../registry/ui/button'
import { AppShell, Screen } from '../../../registry/ui/app-shell'
import { NavRail } from '../../../registry/ui/nav-rail'
import { PageHeader } from '../../../registry/ui/page-header'
import { Breadcrumbs } from '../../../registry/ui/breadcrumbs'
import { shellScreens } from './shared'

export function AppShellSection() {
  const [screen, setScreen] = useState('catalogue')
  const current = shellScreens.find((item) => item.id === screen)

  return (
    <>
      <Row label="a desktop frame - a bar, a rail, and the screen in the corner they leave">
        {/* A fixed height, because the shell fills what it is given and a
            demonstration has to give it something. */}
        <div className="h-76 w-full overflow-hidden rounded-lg border border-line">
          <AppShell
            top={
              <header className="flex h-full items-center gap-3 border-b border-line bg-bg px-3">
                <span className="text-sm font-semibold">Product</span>
                <Breadcrumbs
                  label="Trail"
                  items={[
                    { id: screen, label: (current?.label as string) ?? 'Screen' },
                    { id: 'work', label: 'Harbour lights' },
                  ]}
                  onSelect={() => undefined}
                />
              </header>
            }
            side={
              <NavRail label="Screens" items={shellScreens} activeId={screen} onSelect={setScreen} />
            }
          >
            <Screen>
              <PageHeader
                title={(current?.label as string) ?? 'Screen'}
                description="The heading belongs to the screen, not to the frame."
                actions={<Button size="sm">New</Button>}
              />
              <SkeletonText lines={6} />
            </Screen>
          </AppShell>
        </div>
      </Row>

      <Row label="the same frame with no rail - the shape a web product usually has">
        <div className="h-52 w-full overflow-hidden rounded-lg border border-line">
          <AppShell
            top={
              <header className="flex h-full items-center gap-4 border-b border-line bg-bg px-3">
                <span className="text-sm font-semibold">Product</span>
                <NavRail
                  layout="row"
                  label="Screens"
                  items={shellScreens}
                  activeId={screen}
                  onSelect={setScreen}
                />
              </header>
            }
          >
            <Screen pad="tight">
              <SkeletonText lines={4} />
            </Screen>
          </AppShell>
        </div>
      </Row>
    </>
  )
}
