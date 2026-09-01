import { useEffect, useState } from 'react'
import { lineProducts, useThemeSwitch } from 'dowel-ui'
import { Badge } from '../../registry/ui/badge'
import { Button } from '../../registry/ui/button'
import { Chip } from '../../registry/ui/chip'
import {
  ConfirmDialog,
  ConfirmDialogActions,
  ConfirmDialogClose,
  ConfirmDialogDescription,
  ConfirmDialogPopup,
  ConfirmDialogTitle,
  ConfirmDialogTrigger,
} from '../../registry/ui/confirm-dialog'
import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChips,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from '../../registry/ui/combobox'
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../../registry/ui/context-menu'
import {
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  CommandPalettePopup,
  CommandPaletteRow,
} from '../../registry/ui/command-palette'
import { Copyable } from '../../registry/ui/copyable'
import {
  Dialog,
  DialogActions,
  DialogClose,
  DialogDescription,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '../../registry/ui/dialog'
import {
  Drawer,
  DrawerActions,
  DrawerClose,
  DrawerDescription,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from '../../registry/ui/drawer'
import { Input } from '../../registry/ui/input'
import { Kbd } from '../../registry/ui/kbd'
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from '../../registry/ui/popover'
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from '../../registry/ui/preview-card'
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuSeparator,
  MenuTrigger,
} from '../../registry/ui/menu'
import { Panel, SectionLabel } from '../../registry/ui/panel'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '../../registry/ui/select'
import { SearchField } from '../../registry/ui/search-field'
import { useShortcut } from '../../registry/ui/shortcut'
import { Spinner } from '../../registry/ui/spinner'
import { Textarea } from '../../registry/ui/textarea'
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from '../../registry/ui/tooltip'
import { Truncate } from '../../registry/ui/truncate'

/*
 * The stand.
 *
 * Every component of the system, live, in the conditions it will actually be
 * used in: the real theme on the page, the real preflight, and a switch for
 * the theme and for the accent of any product of the line.
 *
 * The accent switch is the part worth having. A component looks right in the
 * colour it was drawn in; the question is whether it looks right in gold, and
 * in lime, and in cobalt - and that is a question you answer by clicking, not
 * by reasoning about `color-mix`.
 */

/** The sections of the stand: one per component, in the order a screen is
 * built. Each new component adds an entry here. */
const sections = [
  { id: 'button', title: 'Button', docs: '/dowel/components/button/', render: () => <ButtonSection /> },
  { id: 'input', title: 'Input', docs: '/dowel/components/input/', render: () => <InputSection /> },
  { id: 'textarea', title: 'Textarea', docs: '/dowel/components/textarea/', render: () => <TextareaSection /> },
  { id: 'panel', title: 'Panel', docs: '/dowel/components/panel/', render: () => <PanelSection /> },
  { id: 'badge', title: 'Badge', docs: '/dowel/components/badge/', render: () => <BadgeSection /> },
  { id: 'chip', title: 'Chip', docs: '/dowel/components/chip/', render: () => <ChipSection /> },
  { id: 'kbd', title: 'Kbd', docs: '/dowel/components/kbd/', render: () => <KbdSection /> },
  { id: 'spinner', title: 'Spinner', docs: '/dowel/components/spinner/', render: () => <SpinnerSection /> },
  { id: 'truncate', title: 'Truncate', docs: '/dowel/components/truncate/', render: () => <TruncateSection /> },
  { id: 'copyable', title: 'Copyable', docs: '/dowel/components/copyable/', render: () => <CopyableSection /> },
  { id: 'dialog', title: 'Dialog', docs: '/dowel/components/dialog/', render: () => <DialogSection /> },
  {
    id: 'confirm-dialog',
    title: 'ConfirmDialog',
    docs: '/dowel/components/confirm-dialog/',
    render: () => <ConfirmDialogSection />,
  },
  { id: 'drawer', title: 'Drawer', docs: '/dowel/components/drawer/', render: () => <DrawerSection /> },
  { id: 'popover', title: 'Popover', docs: '/dowel/components/popover/', render: () => <PopoverSection /> },
  {
    id: 'preview-card',
    title: 'PreviewCard',
    docs: '/dowel/components/preview-card/',
    render: () => <PreviewCardSection />,
  },
  { id: 'tooltip', title: 'Tooltip', docs: '/dowel/components/tooltip/', render: () => <TooltipSection /> },
  { id: 'menu', title: 'Menu', docs: '/dowel/components/menu/', render: () => <MenuSection /> },
  {
    id: 'context-menu',
    title: 'ContextMenu',
    docs: '/dowel/components/context-menu/',
    render: () => <ContextMenuSection />,
  },
  { id: 'select', title: 'Select', docs: '/dowel/components/select/', render: () => <SelectSection /> },
  { id: 'combobox', title: 'Combobox', docs: '/dowel/components/combobox/', render: () => <ComboboxSection /> },
  {
    id: 'search-field',
    title: 'SearchField',
    docs: '/dowel/components/search-field/',
    render: () => <SearchFieldSection />,
  },
  {
    id: 'command-palette',
    title: 'CommandPalette',
    docs: '/dowel/components/command-palette/',
    render: () => <CommandPaletteSection />,
  },
  { id: 'shortcut', title: 'Shortcut', docs: '/dowel/components/shortcut/', render: () => <ShortcutSection /> },
]

export function App() {
  const { theme, setTheme } = useThemeSwitch('dowel.stand.theme')
  const [accent, setAccent] = useState('dowel')

  /*
   * The accent goes on the root element, which is where a product sets it too.
   *
   * Setting it on a container looks equivalent and is not: the theme declares
   * `--accent: var(--accent-base)` inside `:root`, and that resolves against
   * the root's own value. A `--accent-base` further down the tree changes
   * nothing above it, so every derived token - the hover shade, the soft fill,
   * the colour of text on an accent fill - keeps the value the root produced.
   * The switch appeared to do nothing at all.
   */
  useEffect(() => {
    const product = lineProducts.find((entry) => entry.name === accent)
    const root = document.documentElement
    if (product) root.style.setProperty('--accent-base', product.accent)
    else root.style.removeProperty('--accent-base')
  }, [accent])

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 border-b border-line bg-bg/90 backdrop-blur" style={{ zIndex: 'var(--z-sticky)' }}>
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-6 py-3">
          <a href="/dowel/" className="text-sm font-semibold text-text no-underline">
            dowel
          </a>
          <span className="text-2xs uppercase tracking-caption text-faint">components</span>
          <a
            href="/dowel/"
            className="text-xs text-dim no-underline hover:text-text"
            title="What everything is and why it is that way"
          >
            documentation ↗
          </a>

          {/*
            * The stand's own switches, drawn with the set's own Select.
            *
            * They were native `<select>` elements until the rule that forbids
            * those was written - and the rule caught them on its first run,
            * here, in the stand of the system that forbids them. Worth
            * recording: a convention nobody checks is a convention the place
            * demonstrating it breaks first.
            */}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-dim">
              <span id="accent-label">accent</span>
              <Select value={accent} onValueChange={(value) => setAccent(value as string)}>
                <SelectTrigger size="sm" aria-labelledby="accent-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {lineProducts.map((entry) => (
                    <SelectItem key={entry.name} value={entry.name}>
                      {entry.name}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-dim">
              <span id="theme-label">theme</span>
              <Select
                value={theme}
                onValueChange={(value) => setTheme(value as typeof theme)}
              >
                <SelectTrigger size="sm" aria-labelledby="theme-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  <SelectItem value="system">system</SelectItem>
                  <SelectItem value="light">light</SelectItem>
                  <SelectItem value="dark">dark</SelectItem>
                </SelectPopup>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <p className="mb-8 max-w-prose text-sm text-dim">
          Every component, in the accent of every product of the line. Change the accent above and
          watch what follows from it: the hover shade, the soft fill, the focus ring, and the colour
          of text on an accent fill — none of which any component states for itself.
        </p>

        {sections.map((section) => (
          <section key={section.id} id={section.id} className="mb-12">
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              {/* The other half of the pair: this shows what the component
                  does, its page says why it does it that way. */}
              <a href={section.docs} className="text-xs text-dim no-underline hover:text-accent">
                docs ↗
              </a>
            </div>
            {section.render()}
          </section>
        ))}
      </main>
    </div>
  )
}

/** A row of examples with a label above it. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-2xs uppercase tracking-caption text-faint">{label}</div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-raise p-4">
        {children}
      </div>
    </div>
  )
}

function ButtonSection() {
  return (
    <>
      <Row label="variants">
        <Button variant="primary">Save</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="soft">Selected</Button>
        <Button variant="danger">Delete</Button>
        <Button variant="icon" size="icon-md" aria-label="More">
          <Dots />
        </Button>
      </Row>

      <Row label="sizes">
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary" size="md">
          Medium
        </Button>
        <Button variant="icon" size="icon-sm" aria-label="Add">
          <Plus />
        </Button>
        <Button variant="icon" size="icon-md" aria-label="Add">
          <Plus />
        </Button>
      </Row>

      <Row label="states">
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button variant="ghost" disabled>
          Disabled
        </Button>
        <Button render={<a href="#button" />} variant="primary">
          As a link
        </Button>
      </Row>

      <Row label="with an icon">
        <Button variant="primary">
          <Plus />
          New
        </Button>
        <Button variant="ghost">
          <Dots />
          More
        </Button>
      </Row>
    </>
  )
}

function InputSection() {
  return (
    <>
      <Row label="states">
        <Input placeholder="Empty" />
        <Input defaultValue="With a value" />
        <Input disabled defaultValue="Disabled" />
        <Input aria-invalid defaultValue="Invalid" />
      </Row>

      <Row label="types">
        <Input type="email" placeholder="you@example.com" />
        <Input type="password" defaultValue="secret" />
        <Input type="number" defaultValue={42} />
      </Row>
    </>
  )
}

function TextareaSection() {
  return (
    <>
      <Row label="fixed">
        <Textarea placeholder="Resizable by hand" rows={2} />
      </Row>

      <Row label="grows with the content, up to six rows">
        <Textarea
          autoResize
          maxRows={6}
          placeholder="Type several lines and watch it grow, then keep going and watch it stop."
        />
      </Row>
    </>
  )
}

function PanelSection() {
  return (
    <Row label="surfaces">
      <Panel className="w-48 p-3">
        <SectionLabel className="mb-2">Raised</SectionLabel>
        <p className="text-xs text-dim">Sits on the page.</p>
      </Panel>

      <Panel variant="floating" className="w-48 p-3">
        <SectionLabel className="mb-2">Floating</SectionLabel>
        <p className="text-xs text-dim">Has left it.</p>
      </Panel>

      <Panel className="w-48 p-3">
        <SectionLabel className="mb-2">With an inset</SectionLabel>
        <Panel variant="inset" className="p-2">
          <p className="text-xs text-dim">Inside another.</p>
        </Panel>
      </Panel>
    </Row>
  )
}

function BadgeSection() {
  return (
    <>
      <Row label="variants">
        <Badge>Draft</Badge>
        <Badge variant="soft">Queued</Badge>
        <Badge variant="accent">Selected</Badge>
      </Row>

      <Row label="status - always with a word, never colour alone">
        <Badge variant="good">Passed</Badge>
        <Badge variant="warn">Slow</Badge>
        <Badge variant="bad">Failed</Badge>
        <Badge variant="info">Skipped</Badge>
      </Row>
    </>
  )
}

function ChipSection() {
  return (
    <>
      <Row label="variants">
        <Chip>plain</Chip>
        <Chip variant="soft">soft</Chip>
        <Chip variant="accent">accent</Chip>
      </Row>

      <Row label="with a count, and removable">
        <Chip count={12}>tags</Chip>
        <Chip onRemove={() => {}} removeLabel="Remove tag">
          removable
        </Chip>
        <Chip variant="accent" count={3} onRemove={() => {}} removeLabel="Remove tag">
          both
        </Chip>
      </Row>
    </>
  )
}

function KbdSection() {
  return (
    <>
      <Row label="shortcuts, written the way this platform writes them">
        <Kbd keys={['Mod', 'K']} />
        <Kbd keys={['Mod', 'Shift', 'P']} />
        <Kbd keys={['Escape']} />
      </Row>

      <Row label="single keys">
        <Kbd>K</Kbd>
        <Kbd keys={['Enter']} />
        <Kbd keys={['ArrowUp']} />
        <Kbd keys={['ArrowDown']} />
      </Row>
    </>
  )
}

function SpinnerSection() {
  return (
    <>
      <Row label="sizes">
        <Spinner size="sm" label="Loading" />
        <Spinner size="md" label="Loading" />
        <Spinner size="lg" label="Loading" />
      </Row>

      <Row label="tones, and beside something">
        <Spinner tone="dim" label="Loading" />
        <Spinner tone="accent" label="Loading" />
        <Button variant="ghost" disabled>
          <Spinner size="sm" label="Saving" />
          Saving
        </Button>
      </Row>
    </>
  )
}

function TruncateSection() {
  return (
    <>
      <Row label="one line - hover to see the rest">
        <div className="w-64">
          <Truncate>
            A path that is far too long to fit in the space it has been given, as paths tend to be
          </Truncate>
        </div>
      </Row>

      <Row label="two lines">
        <div className="w-64">
          <Truncate lines={2}>
            A description long enough to need two lines and then some more, which is where the
            clamp comes in and quietly stops it
          </Truncate>
        </div>
      </Row>
    </>
  )
}

function CopyableSection() {
  return (
    <>
      <Row label="click to copy">
        <Copyable label="Copy" copiedLabel="Copied">7f3c9a2</Copyable>
        <Copyable value="/very/long/path/to/the/actual/file.txt" label="Copy" copiedLabel="Copied">/very/long/…/file.txt</Copyable>
      </Row>

      <Row label="in a row of its own, as an id usually is">
        <Panel className="w-full p-3">
          <SectionLabel className="mb-2">Session</SectionLabel>
          <Copyable label="Copy" copiedLabel="Copied">0177BynFdagmBzF7jKoH3wxx</Copyable>
        </Panel>
      </Row>
    </>
  )
}

function Plus() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M8 3.5v9M3.5 8h9" strokeLinecap="round" />
    </svg>
  )
}

function Dots() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden>
      <circle cx="3" cy="8" r="1.4" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="13" cy="8" r="1.4" />
    </svg>
  )
}

/*
 * The overlays.
 *
 * These are shown the way they are used - closed, behind a trigger - and not
 * held open. Holding one open was the first attempt and it was wrong twice
 * over: a scrim is `position: fixed`, so one open dialog dims every section of
 * the stand below it, and a popup positioned against the viewport does not
 * stay inside a container just because it was portalled into one.
 *
 * What a picture of an overlay would prove is small anyway - a box with a
 * border and a shadow. What actually matters about them is behaviour, and
 * behaviour is what the tests hold: the focus trap, the return of focus,
 * Escape, the name a screen reader reads. Clicking a trigger here shows the
 * real thing, in the real place, with the real scrim.
 */

function DialogSection() {
  return (
    <Row label="click to open">
      <Dialog>
        <DialogTrigger render={<Button variant="primary" />}>Delete the draft</DialogTrigger>
        <DialogPopup>
          <DialogTitle>Delete the draft?</DialogTitle>
          <DialogDescription>
            The version stays in the history. Only this draft goes.
          </DialogDescription>
          <DialogActions>
            <Button render={<DialogClose />}>Cancel</Button>
            <Button variant="danger" render={<DialogClose />}>
              Delete
            </Button>
          </DialogActions>
        </DialogPopup>
      </Dialog>
    </Row>
  )
}

function ConfirmDialogSection() {
  return (
    <Row label="click to open - clicking away will not dismiss it">
      <ConfirmDialog>
        <ConfirmDialogTrigger render={<Button variant="danger" />}>Revoke the key</ConfirmDialogTrigger>
        <ConfirmDialogPopup>
          <ConfirmDialogTitle>Revoke the key?</ConfirmDialogTitle>
          <ConfirmDialogDescription>
            Every machine using it loses access at once. This cannot be undone.
          </ConfirmDialogDescription>
          <ConfirmDialogActions>
            <Button render={<ConfirmDialogClose />}>Keep it</Button>
            <Button variant="danger" render={<ConfirmDialogClose />}>
              Revoke
            </Button>
          </ConfirmDialogActions>
        </ConfirmDialogPopup>
      </ConfirmDialog>
    </Row>
  )
}

function DrawerSection() {
  return (
    <Row label="from an edge">
      <Drawer>
        <DrawerTrigger render={<Button variant="ghost" />}>From the right</DrawerTrigger>
        <DrawerPopup side="right">
          <DrawerTitle>Settings</DrawerTitle>
          <DrawerDescription>What this profile calls things.</DrawerDescription>
          <DrawerActions>
            <Button render={<DrawerClose />}>Close</Button>
            <Button variant="primary" render={<DrawerClose />}>
              Save
            </Button>
          </DrawerActions>
        </DrawerPopup>
      </Drawer>

      <Drawer>
        <DrawerTrigger render={<Button variant="ghost" />}>From the bottom</DrawerTrigger>
        <DrawerPopup side="bottom">
          <DrawerTitle>Add a version</DrawerTitle>
          <DrawerDescription>Paste the text, or drop a file.</DrawerDescription>
          <DrawerActions>
            <Button render={<DrawerClose />}>Close</Button>
          </DrawerActions>
        </DrawerPopup>
      </Drawer>
    </Row>
  )
}

function PopoverSection() {
  return (
    <Row label="click to open - the page stays usable behind it">
      <Popover>
        <PopoverTrigger render={<Button variant="ghost" />}>Filters</PopoverTrigger>
        <PopoverPopup>
          <PopoverTitle>Filters</PopoverTitle>
          <PopoverDescription>Narrow the list without leaving it.</PopoverDescription>
          <div className="mt-3 flex gap-2">
            <Chip variant="accent">drafts</Chip>
            <Chip>scored</Chip>
          </div>
        </PopoverPopup>
      </Popover>
    </Row>
  )
}

function PreviewCardSection() {
  return (
    <Row label="hover the link">
      <p className="text-sm text-dim">
        The score came from{' '}
        <PreviewCard>
          <PreviewCardTrigger render={<a href="#preview-card" className="text-accent" />}>
            the seven axes
          </PreviewCardTrigger>
          <PreviewCardPopup>
            <div className="text-sm font-semibold text-text">The seven axes</div>
            <p className="mt-1 text-xs text-dim">
              Hook, lyric, arrangement, mix, voice, novelty, fit. Each is scored on its own,
              and the tier follows from all seven.
            </p>
          </PreviewCardPopup>
        </PreviewCard>
        , not from a single number.
      </p>
    </Row>
  )
}

function TooltipSection() {
  return (
    <TooltipProvider>
      <Row label="hover or focus - the trigger carries its own label">
        <Tooltip>
          <TooltipTrigger render={<Button variant="icon" size="icon-md" aria-label="Delete" />}>
            <Dots />
          </TooltipTrigger>
          <TooltipPopup>Delete</TooltipPopup>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger render={<Button variant="icon" size="icon-md" aria-label="Add" />}>
            <Plus />
          </TooltipTrigger>
          <TooltipPopup>Add a version</TooltipPopup>
        </Tooltip>
      </Row>
    </TooltipProvider>
  )
}

/*
 * Menus and choosing.
 *
 * Shown closed, behind their triggers, for the same reason the overlays are:
 * what matters about a menu is the keyboard, and a picture cannot show that.
 * The tests hold the behaviour; these are here to be clicked.
 */

const FRUIT = ['Apple', 'Apricot', 'Blackberry', 'Blueberry', 'Cherry', 'Peach', 'Pear', 'Plum']

function MenuSection() {
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
    </>
  )
}

function ContextMenuSection() {
  return (
    <Row label="right-click the area">
      <ContextMenu>
        <ContextMenuTrigger
          render={
            <div className="grid h-24 w-full place-items-center rounded-md border border-dashed border-line-2 text-xs text-faint" />
          }
        >
          right-click anywhere here
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

function SelectSection() {
  const [one, setOne] = useState<string | null>('Pear')
  const [many, setMany] = useState<string[]>(['Apple', 'Plum'])

  return (
    <>
      <Row label="one of a short list">
        <Select value={one} onValueChange={(value) => setOne(value as string)}>
          <SelectTrigger className="w-48" aria-label="Fruit">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {FRUIT.map((fruit) => (
              <SelectItem key={fruit} value={fruit}>
                {fruit}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </Row>

      <Row label="several - the same component, one prop">
        <Select multiple value={many} onValueChange={(value) => setMany(value as string[])}>
          <SelectTrigger className="w-48" aria-label="Fruits">
            <SelectValue />
          </SelectTrigger>
          <SelectPopup>
            {FRUIT.map((fruit) => (
              <SelectItem key={fruit} value={fruit}>
                {fruit}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </Row>
    </>
  )
}

function ComboboxSection() {
  const [one, setOne] = useState<string | null>(null)
  const [many, setMany] = useState<string[]>(['Cherry'])

  return (
    <>
      <Row label="type to narrow the list">
        <Combobox items={FRUIT} value={one} onValueChange={(value) => setOne(value as string)}>
          <ComboboxInput className="w-56" placeholder="Fruit" aria-label="Fruit" />
          <ComboboxPopup>
            <ComboboxEmpty>Nothing matches</ComboboxEmpty>
            <ComboboxList>
              {(fruit: string) => (
                <ComboboxItem key={fruit} value={fruit}>
                  {fruit}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </Combobox>
      </Row>

      <Row label="several, as chips">
        <Combobox
          multiple
          items={FRUIT}
          value={many}
          onValueChange={(value) => setMany(value as string[])}
        >
          <ComboboxChips className="w-72">
            {/* `Value` is what knows the chosen items, so the chips are drawn
                from it rather than from the state next to it. */}
            <ComboboxValue>
              {(chosen: string[]) =>
                chosen.map((fruit) => (
                  <ComboboxChip key={fruit}>
                    {fruit}
                    <ComboboxChipRemove aria-label="Remove" />
                  </ComboboxChip>
                ))
              }
            </ComboboxValue>
            <ComboboxInput placeholder="Fruit" aria-label="Fruits" />
          </ComboboxChips>
          <ComboboxPopup>
            <ComboboxEmpty>Nothing matches</ComboboxEmpty>
            <ComboboxList>
              {(fruit: string) => (
                <ComboboxItem key={fruit} value={fruit}>
                  {fruit}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxPopup>
        </Combobox>
      </Row>
    </>
  )
}

/*
 * Searching, and the shortcut that gets you there.
 *
 * These are the three that only exist properly when a key is pressed, so the
 * stand is where they can be. The palette opens on Ctrl+K (Cmd+K on a Mac)
 * from anywhere on this page that is not already a field - which is itself the
 * behaviour worth trying, since it is the half most implementations get wrong.
 */

const COMMANDS = [
  'Open the catalogue',
  'New version',
  'New note',
  'Go to the calendar',
  'Settings',
  'Switch profile',
]

function SearchFieldSection() {
  const [plain, setPlain] = useState('')
  const [clearable, setClearable] = useState('a half-remembered line')
  const [withShortcut, setWithShortcut] = useState('')

  return (
    <>
      <Row label="plain">
        <SearchField
          className="max-w-72"
          aria-label="Search"
          placeholder="Search"
          value={plain}
          onValueChange={setPlain}
        />
      </Row>

      <Row label="clearable - the button appears with the query">
        <SearchField
          className="max-w-72"
          aria-label="Search"
          placeholder="Search"
          clearLabel="Clear"
          value={clearable}
          onValueChange={setClearable}
        />
      </Row>

      <Row label="with its shortcut - press it and watch the focus">
        <SearchField
          className="max-w-72"
          aria-label="Search everything"
          placeholder="Search"
          clearLabel="Clear"
          shortcut={['Mod', '/']}
          value={withShortcut}
          onValueChange={setWithShortcut}
        />
      </Row>
    </>
  )
}

function CommandPaletteSection() {
  const [open, setOpen] = useState(false)
  const [ran, setRan] = useState<string | null>(null)

  useShortcut(['Mod', 'K'], () => setOpen(true))

  return (
    <Row label="press Ctrl+K, or click">
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Open the palette
      </Button>
      {ran !== null && <Badge variant="accent">{ran}</Badge>}

      <CommandPalette
        items={COMMANDS}
        open={open}
        onOpenChange={setOpen}
        onValueChange={(value) => {
          setRan(String(value))
          setOpen(false)
        }}
      >
        <CommandPalettePopup aria-label="Commands">
          <CommandPaletteInput
            aria-label="Command"
            placeholder="Type a command"
            hint={['Esc']}
          />
          <CommandPaletteEmpty className="px-3 py-6 text-center text-sm text-dim">
            Nothing matched
          </CommandPaletteEmpty>
          <CommandPaletteList className="overflow-y-auto p-1">
            {(command: string) => (
              <CommandPaletteItem key={command} value={command}>
                <CommandPaletteRow hint="command">{command}</CommandPaletteRow>
              </CommandPaletteItem>
            )}
          </CommandPaletteList>
        </CommandPalettePopup>
      </CommandPalette>
    </Row>
  )
}

function ShortcutSection() {
  const [pressed, setPressed] = useState(0)
  const [inField, setInField] = useState('')

  useShortcut(['Mod', 'J'], () => setPressed((count) => count + 1))

  return (
    <>
      <Row label="press Ctrl+J anywhere on this page">
        <Kbd keys={['Mod', 'J']} />
        <Badge variant={pressed > 0 ? 'accent' : 'outline'}>{pressed}</Badge>
      </Row>

      <Row label="now press it inside this field - nothing happens, on purpose">
        <Input
          className="max-w-72"
          aria-label="A field that owns its own keys"
          placeholder="Type here, then press Ctrl+J"
          value={inField}
          onChange={(event) => setInField(event.target.value)}
        />
      </Row>
    </>
  )
}
