/*
 * Recipe: details in a drawer.
 *
 * A list where choosing a row shows that row's details without leaving the
 * list: a panel slides in from the right edge, the list stays exactly where
 * it was under the scrim, and closing the panel puts the reader back on the
 * row they came from. Easy to build and easy to get subtly wrong - an unnamed
 * panel, a focus that falls to the top of the page on close, a blank cell
 * where "no score" should be said.
 *
 * `Drawer` is controlled here (`open` / `onOpenChange`) because a row, not a
 * trigger, opens it. Base UI remembers what had focus when the drawer opened
 * and gives it back on close, so the row needs nothing extra. The drawer is
 * named by its `DrawerTitle`. `side="right"` goes with `swipeDirection="right"`
 * on the root, or the panel would open from one edge and be flicked away
 * towards another.
 *
 * Wire `works` and `people` to the product's own data. Every word a reader
 * sees is here, in one place, for the product's language to replace.
 */
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerActions,
  DrawerBody,
  DrawerClose,
  DrawerDescription,
  DrawerHeader,
  DrawerPopup,
  DrawerTitle,
} from '@/components/ui/drawer'
import { KeyValue, KeyValueRow } from '@/components/ui/key-value'
import { RowButton } from '@/components/ui/list-row'
import { RelativeTime } from '@/components/ui/relative-time'

export interface Version {
  id: string
  label: string
  at: string
  note: string
}

export interface Work {
  id: string
  title: string
  kind: string
  stage: 'idea' | 'draft' | 'ready' | 'released'
  /** A person's `id`. */
  owner: string
  updated: string
  /** Out of ten, or null while nobody has judged it. */
  score: number | null
  summary: string
  versions: readonly Version[]
}

export interface Person {
  id: string
  name: string
}

// One place decides how a stage looks, so the list and the drawer agree.
const STAGE_VARIANT = { idea: 'outline', draft: 'soft', ready: 'info', released: 'good' } as const

export function DetailInADrawer({
  works,
  people,
  now,
  onOpenWork,
}: {
  works: readonly Work[]
  people: readonly Person[]
  /** What counts as now for every relative date. Omit it for the clock. */
  now?: Date | number
  /** The drawer's main action: take me to the work itself. */
  onOpenWork: (id: string) => void
}) {
  // The chosen work and whether its drawer is open are two facts. Closing only
  // flips `open`, so the content stays drawn while the panel slides away
  // instead of emptying first.
  const [chosen, setChosen] = useState<Work | null>(null)
  const [open, setOpen] = useState(false)

  const owner = chosen && (people.find((person) => person.id === chosen.owner)?.name ?? 'Unknown')

  return (
    <section aria-labelledby="works-heading" className="flex flex-col gap-3">
      <h2 id="works-heading" className="text-lg font-semibold text-text">
        Works
      </h2>
      <ul className="flex flex-col">
        {works.map((work) => (
          <li key={work.id}>
            <RowButton
              description={work.summary}
              // The row that opened the drawer stays marked while it is open,
              // so the list behind the scrim still says where the reader is.
              selected={open && chosen?.id === work.id}
              end={<Badge variant={STAGE_VARIANT[work.stage]}>{work.stage}</Badge>}
              onClick={() => {
                setChosen(work)
                setOpen(true)
              }}
            >
              {work.title}
            </RowButton>
          </li>
        ))}
      </ul>

      <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
        <DrawerPopup side="right" size="md">
          {chosen && (
            <>
              <DrawerHeader>
                <DrawerTitle>{chosen.title}</DrawerTitle>
                <DrawerDescription>{chosen.summary}</DrawerDescription>
              </DrawerHeader>
              <DrawerBody className="flex flex-col gap-5">
                <KeyValue>
                  <KeyValueRow label="Kind">{chosen.kind}</KeyValueRow>
                  <KeyValueRow label="Stage">
                    <Badge variant={STAGE_VARIANT[chosen.stage]}>{chosen.stage}</Badge>
                  </KeyValueRow>
                  <KeyValueRow label="Owner">{owner}</KeyValueRow>
                  <KeyValueRow label="Updated">
                    {/* The phrase is the convenience; the exact date rides in
                        its title for a reader who needs to say when. */}
                    <RelativeTime value={chosen.updated} now={now} />
                  </KeyValueRow>
                  <KeyValueRow label="Score">
                    {/* Said in words: an empty cell reads as a fault. */}
                    {chosen.score === null ? <span className="text-dim">Not scored yet</span> : `${chosen.score} / 10`}
                  </KeyValueRow>
                </KeyValue>

                <section aria-labelledby="versions-heading" className="flex flex-col gap-2">
                  <h3 id="versions-heading" className="text-sm font-semibold text-text">
                    Versions
                  </h3>
                  {chosen.versions.length === 0 ? (
                    <p className="text-sm text-dim">No versions yet.</p>
                  ) : (
                    <ul className="flex flex-col gap-2 text-sm">
                      {chosen.versions.map((version) => (
                        <li key={version.id} className="flex flex-col">
                          <span className="text-text">
                            {version.label} - <RelativeTime value={version.at} now={now} className="text-dim" />
                          </span>
                          <span className="text-dim">{version.note}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </DrawerBody>
              {/* Pinned to the bottom edge however short the body is. */}
              <DrawerActions>
                <DrawerClose render={<Button variant="ghost" />}>Close</DrawerClose>
                <Button variant="primary" onClick={() => onOpenWork(chosen.id)}>
                  Open work
                </Button>
              </DrawerActions>
            </>
          )}
        </DrawerPopup>
      </Drawer>
    </section>
  )
}
