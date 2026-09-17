import { useEffect, useRef, useState } from 'react'
import { cn, lineProducts, useThemeSwitch } from 'dowel-ui'
import markUrl from '../../assets/logo-m.svg'
import { linkProps, useRoute } from './router'
import { useStoredState } from './use-stored-state'
import { Alert } from '../../registry/ui/alert'
import { Badge } from '../../registry/ui/badge'
import { Banner } from '../../registry/ui/banner'
import { TagInput } from '../../registry/ui/tag-input'
import { FileDrop, type FileRejection } from '../../registry/ui/file-drop'
import { ColorField } from '../../registry/ui/color-field'
import {
  ActionBar,
  ActionBarButton,
  ActionBarGroup,
  ActionBarSeparator,
  ActionBarSpacer,
} from '../../registry/ui/action-bar'
import { SaveState, type SaveStatus } from '../../registry/ui/save-state'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
  TableScroll,
  TableSortHeader,
} from '../../registry/ui/table'
import { sortRows, toggleSort, type Sort, type SortValue } from '../../registry/ui/table-sort'
import { Pagination, pageRange } from '../../registry/ui/pagination'
import { PageSize } from '../../registry/ui/page-size'
import { NumberFormat } from '../../registry/ui/number-format'
import { RelativeTime } from '../../registry/ui/relative-time'
import { VirtualList } from '../../registry/ui/virtual-list'
import { TreeView } from '../../registry/ui/tree-view'
import { visibleRows, type TreeNode } from '../../registry/ui/tree-rows'
import { KeyValue, KeyValueRow } from '../../registry/ui/key-value'
import { StatRow, StatTile } from '../../registry/ui/stat-tile'
import { Sparkline } from '../../registry/ui/sparkline'
import { Track, TrackScale } from '../../registry/ui/track'
import { markerAt, place } from '../../registry/ui/track-segments'
import { ActivityHeatmap } from '../../registry/ui/activity-heatmap'
import { ActivityLegend } from '../../registry/ui/activity-legend'
import { stepFor, weeks } from '../../registry/ui/activity-weeks'
import { Baseline, BarChart, ChartFrame } from '../../registry/ui/bar-chart'
import { LineChart } from '../../registry/ui/line-chart'
import { boundsOf, runs, ticksFor } from '../../registry/ui/line-scale'
import { CodeBlock } from '../../registry/ui/code-block'
import { CopyButton } from '../../registry/ui/copy-button'
import { DiffView } from '../../registry/ui/diff-view'
import { countChanges, diffLines, rows as diffRows } from '../../registry/ui/diff-lines'
import { JsonViewer } from '../../registry/ui/json-viewer'
import { branchPaths, visibleRows as jsonRows } from '../../registry/ui/json-rows'
import { Skeleton, SkeletonGrid, SkeletonList, SkeletonText } from '../../registry/ui/skeleton'
import { EmptyState } from '../../registry/ui/empty-state'
import { Progress } from '../../registry/ui/progress'
import { ErrorBoundary } from '../../registry/ui/error-boundary'
import { QueryState } from '../../registry/ui/query-state'
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
import { Calendar } from '../../registry/ui/calendar'
import { addDays, addMonths, daysInMonth, isIsoDate, today } from '../../registry/ui/calendar-math'
import { Checkbox, CheckboxGroup } from '../../registry/ui/checkbox'
import { DatePicker } from '../../registry/ui/date-picker'
import { DateRangePicker, type DateRange } from '../../registry/ui/date-range-picker'
import { DurationField } from '../../registry/ui/duration-field'
import { Field } from '../../registry/ui/field'
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
import { NumberField } from '../../registry/ui/number-field'
import { Panel, SectionLabel } from '../../registry/ui/panel'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '../../registry/ui/select'
import { PasswordField } from '../../registry/ui/password-field'
import { Radio, RadioGroup } from '../../registry/ui/radio-group'
import { RatingScale } from '../../registry/ui/rating-scale'
import { SearchField } from '../../registry/ui/search-field'
import { useShortcut } from '../../registry/ui/shortcut'
import { Spinner } from '../../registry/ui/spinner'
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  useToastManager,
} from '../../registry/ui/toast'
import { Slider } from '../../registry/ui/slider'
import { Switch } from '../../registry/ui/switch'
import { TimeField } from '../../registry/ui/time-field'
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

/* The sections of the stand: one per component, in the order a screen is
 * built. Each new component adds an entry here.
 *
 * Two of them are not components at all - `calendar-math` is pure date
 * arithmetic with no React in it, and `useShortcut` is a hook - and they are
 * marked `utility` so the navigation can say so. They were previously mixed
 * into the same list under names in two different styles, which left a reader
 * to guess why one entry was lowercase; the answer was never "for no reason",
 * but the list gave no way to tell. */
const sections = [
  { id: 'button', title: 'Button', docs: '/dowel/components/button/', render: () => <ButtonSection /> },
  { id: 'input', title: 'Input', docs: '/dowel/components/input/', render: () => <InputSection /> },
  { id: 'textarea', title: 'Textarea', docs: '/dowel/components/textarea/', render: () => <TextareaSection /> },
  { id: 'field', title: 'Field', docs: '/dowel/components/field/', render: () => <FieldSection /> },
  { id: 'checkbox', title: 'Checkbox', docs: '/dowel/components/checkbox/', render: () => <CheckboxSection /> },
  {
    id: 'radio-group',
    title: 'RadioGroup',
    docs: '/dowel/components/radio-group/',
    render: () => <RadioGroupSection />,
  },
  { id: 'switch', title: 'Switch', docs: '/dowel/components/switch/', render: () => <SwitchSection /> },
  {
    id: 'number-field',
    title: 'NumberField',
    docs: '/dowel/components/number-field/',
    render: () => <NumberFieldSection />,
  },
  { id: 'slider', title: 'Slider', docs: '/dowel/components/slider/', render: () => <SliderSection /> },
  {
    id: 'rating-scale',
    title: 'RatingScale',
    docs: '/dowel/components/rating-scale/',
    render: () => <RatingScaleSection />,
  },
  {
    id: 'duration-field',
    title: 'DurationField',
    docs: '/dowel/components/duration-field/',
    render: () => <DurationFieldSection />,
  },
  {
    id: 'password-field',
    title: 'PasswordField',
    docs: '/dowel/components/password-field/',
    render: () => <PasswordFieldSection />,
  },
  {
    id: 'calendar-math',
    title: 'calendar-math',
    kind: 'utility',
    docs: '/dowel/components/calendar-math/',
    render: () => <CalendarMathSection />,
  },
  {
    id: 'calendar',
    title: 'Calendar',
    docs: '/dowel/components/calendar/',
    render: () => <CalendarSection />,
  },
  {
    id: 'date-picker',
    title: 'DatePicker',
    docs: '/dowel/components/date-picker/',
    render: () => <DatePickerSection />,
  },
  {
    id: 'date-range-picker',
    title: 'DateRangePicker',
    docs: '/dowel/components/date-range-picker/',
    render: () => <DateRangePickerSection />,
  },
  {
    id: 'time-field',
    title: 'TimeField',
    docs: '/dowel/components/time-field/',
    render: () => <TimeFieldSection />,
  },
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
  {
    id: 'shortcut',
    title: 'useShortcut',
    kind: 'utility',
    docs: '/dowel/components/shortcut/',
    render: () => <ShortcutSection />,
  },
  { id: 'toast', title: 'Toast', docs: '/dowel/components/toast/', render: () => <ToastSection /> },
  { id: 'alert', title: 'Alert', docs: '/dowel/components/alert/', render: () => <AlertSection /> },
  { id: 'banner', title: 'Banner', docs: '/dowel/components/banner/', render: () => <BannerSection /> },
  { id: 'tag-input', title: 'TagInput', docs: '/dowel/components/tag-input/', render: () => <TagInputSection /> },
  { id: 'file-drop', title: 'FileDrop', docs: '/dowel/components/file-drop/', render: () => <FileDropSection /> },
  { id: 'color-field', title: 'ColorField', docs: '/dowel/components/color-field/', render: () => <ColorFieldSection /> },
  { id: 'action-bar', title: 'ActionBar', docs: '/dowel/components/action-bar/', render: () => <ActionBarSection /> },
  { id: 'save-state', title: 'SaveState', docs: '/dowel/components/save-state/', render: () => <SaveStateSection /> },
  {
    id: 'table-sort',
    title: 'table-sort',
    kind: 'utility',
    docs: '/dowel/components/table-sort/',
    render: () => <TableSortSection />,
  },
  { id: 'table', title: 'Table', docs: '/dowel/components/table/', render: () => <TableSection /> },
  {
    id: 'pagination',
    title: 'Pagination',
    docs: '/dowel/components/pagination/',
    render: () => <PaginationSection />,
  },
  {
    id: 'page-size',
    title: 'PageSize',
    docs: '/dowel/components/page-size/',
    render: () => <PageSizeSection />,
  },
  {
    id: 'number-format',
    title: 'NumberFormat',
    docs: '/dowel/components/number-format/',
    render: () => <NumberFormatSection />,
  },
  {
    id: 'relative-time',
    title: 'RelativeTime',
    docs: '/dowel/components/relative-time/',
    render: () => <RelativeTimeSection />,
  },
  {
    id: 'virtual-list',
    title: 'VirtualList',
    docs: '/dowel/components/virtual-list/',
    render: () => <VirtualListSection />,
  },
  {
    id: 'tree-rows',
    title: 'tree-rows',
    kind: 'utility',
    docs: '/dowel/components/tree-rows/',
    render: () => <TreeRowsSection />,
  },
  {
    id: 'tree-view',
    title: 'TreeView',
    docs: '/dowel/components/tree-view/',
    render: () => <TreeViewSection />,
  },
  {
    id: 'key-value',
    title: 'KeyValue',
    docs: '/dowel/components/key-value/',
    render: () => <KeyValueSection />,
  },
  {
    id: 'stat-tile',
    title: 'StatTile',
    docs: '/dowel/components/stat-tile/',
    render: () => <StatTileSection />,
  },
  {
    id: 'sparkline',
    title: 'Sparkline',
    docs: '/dowel/components/sparkline/',
    render: () => <SparklineSection />,
  },
  {
    id: 'track-segments',
    title: 'track-segments',
    kind: 'utility',
    docs: '/dowel/components/track-segments/',
    render: () => <TrackSegmentsSection />,
  },
  {
    id: 'track',
    title: 'Track',
    docs: '/dowel/components/track/',
    render: () => <TrackSection />,
  },
  {
    id: 'activity-weeks',
    title: 'activity-weeks',
    kind: 'utility',
    docs: '/dowel/components/activity-weeks/',
    render: () => <ActivityWeeksSection />,
  },
  {
    id: 'activity-heatmap',
    title: 'ActivityHeatmap',
    docs: '/dowel/components/activity-heatmap/',
    render: () => <ActivityHeatmapSection />,
  },
  {
    id: 'activity-legend',
    title: 'ActivityLegend',
    docs: '/dowel/components/activity-legend/',
    render: () => <ActivityLegendSection />,
  },
  {
    id: 'bar-chart',
    title: 'BarChart',
    docs: '/dowel/components/bar-chart/',
    render: () => <BarChartSection />,
  },
  {
    id: 'line-scale',
    title: 'line-scale',
    kind: 'utility',
    docs: '/dowel/components/line-scale/',
    render: () => <LineScaleSection />,
  },
  {
    id: 'line-chart',
    title: 'LineChart',
    docs: '/dowel/components/line-chart/',
    render: () => <LineChartSection />,
  },
  {
    id: 'prose',
    title: 'prose',
    kind: 'utility',
    docs: '/dowel/components/prose/',
    render: () => <ProseSection />,
  },
  {
    id: 'code-block',
    title: 'CodeBlock',
    docs: '/dowel/components/code-block/',
    render: () => <CodeBlockSection />,
  },
  {
    id: 'copy-button',
    title: 'CopyButton',
    docs: '/dowel/components/copy-button/',
    render: () => <CopyButtonSection />,
  },
  {
    id: 'diff-lines',
    title: 'diff-lines',
    kind: 'utility',
    docs: '/dowel/components/diff-lines/',
    render: () => <DiffLinesSection />,
  },
  {
    id: 'diff-view',
    title: 'DiffView',
    docs: '/dowel/components/diff-view/',
    render: () => <DiffViewSection />,
  },
  {
    id: 'json-rows',
    title: 'json-rows',
    kind: 'utility',
    docs: '/dowel/components/json-rows/',
    render: () => <JsonRowsSection />,
  },
  {
    id: 'json-viewer',
    title: 'JsonViewer',
    docs: '/dowel/components/json-viewer/',
    render: () => <JsonViewerSection />,
  },
  {
    id: 'skeleton',
    title: 'Skeleton',
    docs: '/dowel/components/skeleton/',
    render: () => <SkeletonSection />,
  },
  {
    id: 'empty-state',
    title: 'EmptyState',
    docs: '/dowel/components/empty-state/',
    render: () => <EmptyStateSection />,
  },
  {
    id: 'progress',
    title: 'Progress',
    docs: '/dowel/components/progress/',
    render: () => <ProgressSection />,
  },
  {
    id: 'query-state',
    title: 'QueryState',
    docs: '/dowel/components/query-state/',
    render: () => <QueryStateSection />,
  },
  {
    id: 'error-boundary',
    title: 'ErrorBoundary',
    docs: '/dowel/components/error-boundary/',
    render: () => <ErrorBoundarySection />,
  },
]

/** The version this stand was built from, injected by Vite out of the package
 * manifest so the number on the page cannot drift from the one shipped. */
declare const __DOWEL_VERSION__: string

export function App() {
  const { theme, setTheme } = useThemeSwitch('dowel.stand.theme')
  const [accent, setAccent] = useStoredState('dowel.stand.accent', 'dowel')
  const { path, navigate } = useRoute()

  /*
   * An unknown path shows the overview rather than an error.
   *
   * A stand is a place people arrive at from a stale link or a typo, and a
   * 404 of our own would be a worse answer than the front page - there is
   * nothing here that a reader could have destroyed by getting the URL wrong.
   */
  const current = sections.find((section) => section.id === path)

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
      {/*
        * The header is a plain block, not `sticky`.
        *
        * It was sticky, and that put it into every visual baseline: the gate
        * photographs a section, the bar floats over the top of the frame, and
        * five separate hypotheses about `addStyleTag` failed to explain why
        * hiding it worked locally and not in CI. With a page per component
        * there is nothing to stay visible above - the navigation is beside the
        * content, not over it - so the cause is gone rather than suppressed.
        */}
      <header className="border-b border-line bg-bg">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-3">
          <a
            {...linkProps('', navigate)}
            className="flex items-center gap-2 text-sm font-semibold text-text no-underline"
          >
            {/* The line's mark, in the accent now in force: the honeycomb is
              * drawn with `currentColor`, so the identity follows the same
              * token every component follows. */}
            <Mark className="size-5" />
            dowel
          </a>
          <span className="rounded-full border border-line px-2 py-0.5 font-mono text-2xs text-dim">
            v{__DOWEL_VERSION__}
          </span>
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

      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
        <nav aria-label="Components" className="hidden w-44 shrink-0 md:block">
          {/* The list is taller than the screen - forty components - so it
            * scrolls on its own rather than with the page. Sticky alone was
            * not enough: the box stayed put and its bottom half stayed out of
            * reach, which made the last dozen components unreachable without
            * scrolling the article beside them. */}
          <div className="sticky top-8 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
            <ul className="m-0 list-none space-y-0.5 p-0">
              {sections
                .filter((section) => section.kind !== 'utility')
                .map((section) => (
                  <NavLink
                    key={section.id}
                    section={section}
                    active={section.id === current?.id}
                    navigate={navigate}
                  />
                ))}
            </ul>

            {/* Not components, and the list says so rather than leaving a
              * reader to infer it from a lowercase name. */}
            <h2 className="mt-5 mb-1 px-2 text-2xs uppercase tracking-caption text-faint">
              Without markup
            </h2>
            <ul className="m-0 list-none space-y-0.5 p-0">
              {sections
                .filter((section) => section.kind === 'utility')
                .map((section) => (
                  <NavLink
                    key={section.id}
                    section={section}
                    active={section.id === current?.id}
                    navigate={navigate}
                  />
                ))}
            </ul>
          </div>
        </nav>

        <main className="min-w-0 flex-1">
          {/* `data-stand-section` is what the visual gate photographs. A plain
              `main section` locator matched twice the first time a component
              drew a section of its own - the prose demo, which renders the
              `<section class="footnotes">` remark-gfm emits. */}
          {current ? (
            <section key={current.id} data-stand-section>
              <div className="mb-4 flex items-baseline gap-3">
                <h1 className="text-xl font-semibold">{current.title}</h1>
                {/* The other half of the pair: this shows what the component
                    does, its page says why it does it that way. */}
                <a href={current.docs} className="text-xs text-dim no-underline hover:text-accent">
                  docs ↗
                </a>
              </div>
              {current.render()}
            </section>
          ) : (
            <Overview navigate={navigate} />
          )}
        </main>
      </div>
    </div>
  )
}

/** One row of the navigation. Shared by both groups, so a change to how a
 * link looks cannot land in one list and miss the other. */
function NavLink({
  section,
  active,
  navigate,
}: {
  section: { id: string; title: string }
  active: boolean
  navigate: (to: string) => void
}) {
  return (
    <li>
      <a
        {...linkProps(section.id, navigate)}
        // The current page is named as such for a screen reader, which cannot
        // see that it is the tinted one.
        aria-current={active ? 'page' : undefined}
        className={cn(
          'block rounded-md px-2 py-1 text-sm no-underline transition-colors',
          active ? 'bg-accent-soft font-medium text-accent' : 'text-dim hover:bg-raise hover:text-text',
        )}
      >
        {section.title}
      </a>
    </li>
  )
}

/*
 * The line's mark.
 *
 * The file itself, not a copy of it in JSX. It was hand-drawn here first and
 * was simply the wrong sign - an empty outline where the real mark is a filled
 * cell with the `dw` monogram inside - and transcribing the right one would
 * only have set up the next drift, where `assets/logo-m.svg` moves and the
 * stand keeps showing what it used to be.
 *
 * `logo-m.svg` is the middle master, which is the one a site header takes.
 * Its amber is fixed rather than following the accent switch: the switch
 * shows what a *product's* colour does to the components, while the mark
 * belongs to dowel itself, and a sign that repaints when someone previews
 * another accent has stopped being a sign.
 */
function Mark({ className }: { className?: string }) {
  return <img src={markUrl} alt="" aria-hidden className={className} />
}

/** The front page: what the stand is for, and a way into it. */
function Overview({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div>
      <h1 className="mb-3 text-2xl font-semibold">Every component, in every accent</h1>
      <p className="mb-6 max-w-prose text-sm text-dim">
        Change the accent in the header and watch what follows from it: the hover shade, the soft
        fill, the focus ring, and the colour of text on an accent fill — none of which any component
        states for itself. Change the theme and watch the same components hold in both.
      </p>
      {/* On a wide screen this list is the same list as the navigation beside
        * it, and two copies of forty links is not a front page. It shows below
        * the breakpoint that hides the sidebar, where it is the only way in. */}
      <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 md:hidden">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              {...linkProps(section.id, navigate)}
              className="block rounded-lg border border-line bg-raise px-3 py-2 text-sm text-text no-underline transition-colors hover:border-accent hover:text-accent"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>

      <div className="hidden gap-3 md:grid md:grid-cols-3">
        <Panel className="p-4">
          <h2 className="mb-1 text-sm font-semibold">{sections.length} components</h2>
          <p className="m-0 text-xs text-dim">
            Pick one from the list. Each has a page of its own, so the address bar names what you
            are looking at and the link can be sent to someone.
          </p>
        </Panel>
        <Panel className="p-4">
          <h2 className="mb-1 text-sm font-semibold">Two themes</h2>
          <p className="m-0 text-xs text-dim">
            Every component is drawn in both, from the same tokens. Nothing here carries a
            <code className="px-1 font-mono text-2xs">dark:</code> utility of its own.
          </p>
        </Panel>
        <Panel className="p-4">
          <h2 className="mb-1 text-sm font-semibold">{lineProducts.length} accents</h2>
          <p className="m-0 text-xs text-dim">
            One per product of the line. The choice is remembered, so the stand opens where you
            left it.
          </p>
        </Panel>
      </div>
    </div>
  )
}

/** A row of examples with a label above it. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-2xs uppercase tracking-caption text-faint">{label}</div>
      {/* `items-end`, not `items-center`.
        *
        * A row mixes controls of different heights - a bare Input beside a
        * Field, which carries a label above and a hint below. Centred, their
        * boxes float at different heights and the row reads as misaligned;
        * aligned to the bottom, the controls themselves line up and the label
        * simply sits above its own. That is what a form does. */}
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-line bg-raise p-4">
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

      <Row label="sizes, text and icon">
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

function FieldSection() {
  return (
    <>
      <Row label="with a hint">
        <Field label="Email" help="We only use it to sign you in." className="w-64">
          <Input type="email" placeholder="you@example.com" />
        </Field>
      </Row>

      <Row label="with an error - the hint gives up its line">
        <Field
          label="Email"
          help="We only use it to sign you in."
          error="That address is not valid."
          className="w-64"
        >
          <Input type="email" defaultValue="not-an-address" />
        </Field>
      </Row>

      <Row label="required, and a label only a screen reader hears">
        <Field label="Name" required className="w-64">
          <Input placeholder="Ada Lovelace" />
        </Field>
        <Field label="Search" labelHidden className="w-64">
          <Input type="search" placeholder="Search" />
        </Field>
      </Row>

      <Row label="around anything, not only an Input">
        <Field label="Notes" help="Grows as you type." className="w-64">
          <Textarea autoResize maxRows={5} placeholder="Say what happened" />
        </Field>
      </Row>
    </>
  )
}

function CheckboxSection() {
  return (
    <>
      <Row label="states">
        <Checkbox>Unchecked</Checkbox>
        <Checkbox defaultChecked>Checked</Checkbox>
        <Checkbox indeterminate>Some of them</Checkbox>
        <Checkbox disabled>Disabled</Checkbox>
        <Checkbox defaultChecked disabled>
          Both
        </Checkbox>
      </Row>

      <Row label="a group with a parent box - click it and watch the dash resolve">
        <CheckboxGroup allValues={['apple', 'pear', 'plum']} defaultValue={['apple']}>
          <Checkbox parent aria-label="All fruit">
            All fruit
          </Checkbox>
          <div className="ml-6 flex flex-col gap-2">
            <Checkbox name="apple" value="apple">
              Apple
            </Checkbox>
            <Checkbox name="pear" value="pear">
              Pear
            </Checkbox>
            <Checkbox name="plum" value="plum">
              Plum
            </Checkbox>
          </div>
        </CheckboxGroup>
      </Row>

      <Row label="without words, for a table cell">
        <Checkbox aria-label="Select row" />
        <Checkbox aria-label="Select row" defaultChecked />
      </Row>
    </>
  )
}

function RadioGroupSection() {
  return (
    <>
      <Row label="a column, which is the default">
        <RadioGroup aria-label="Ripeness" defaultValue="ripe">
          <Radio value="green">Green</Radio>
          <Radio value="ripe">Ripe</Radio>
          <Radio value="soft">Past it</Radio>
        </RadioGroup>
      </Row>

      <Row label="a row, for two or three short options">
        <RadioGroup aria-label="Size" defaultValue="md" orientation="horizontal">
          <Radio value="sm">Small</Radio>
          <Radio value="md">Medium</Radio>
          <Radio value="lg">Large</Radio>
        </RadioGroup>
      </Row>

      <Row label="inside a Field, which names the group">
        <Field label="Ripeness" help="How you like them." className="w-64">
          <RadioGroup defaultValue="ripe">
            <Radio value="green">Green</Radio>
            <Radio value="ripe">Ripe</Radio>
          </RadioGroup>
        </Field>
      </Row>

      <Row label="disabled">
        <RadioGroup aria-label="Disabled" defaultValue="a" disabled>
          <Radio value="a">One</Radio>
          <Radio value="b">Two</Radio>
        </RadioGroup>
      </Row>
    </>
  )
}

function SwitchSection() {
  return (
    <>
      <Row label="states">
        <Switch>Off</Switch>
        <Switch defaultChecked>On</Switch>
        <Switch disabled>Disabled</Switch>
        <Switch defaultChecked disabled>
          Both
        </Switch>
      </Row>

      <Row label="a column of settings, which is what it is for">
        <div className="flex w-64 flex-col gap-3">
          <Switch defaultChecked>Notify me about replies</Switch>
          <Switch>Notify me about everything</Switch>
          <Switch defaultChecked>Keep me signed in</Switch>
        </div>
      </Row>

      <Row label="without words">
        <Switch aria-label="Notify me" />
        <Switch aria-label="Notify me" defaultChecked />
      </Row>
    </>
  )
}

function NumberFieldSection() {
  const [width, setWidth] = useState<number | null>(16)
  const [price, setPrice] = useState<number | null>(1234.5)

  return (
    <>
      <Row label="with a stepper, and with a unit beside it">
        <NumberField value={width} onValueChange={setWidth} min={0} aria-label="Width" />
        <NumberField
          value={width}
          onValueChange={setWidth}
          min={0}
          unit="px"
          aria-label="Width in pixels"
        />
      </Row>

      <Row label="without the stepper, for a wide range">
        <NumberField value={price} onValueChange={setPrice} hideStepper aria-label="Amount" />
      </Row>

      <Row label="formatted - the number reads the way it is written">
        <NumberField
          value={price}
          onValueChange={setPrice}
          format={{ style: 'currency', currency: 'EUR' }}
          hideStepper
          aria-label="Price"
        />
      </Row>

      <Row label="disabled">
        <NumberField value={16} disabled aria-label="Disabled" />
      </Row>
    </>
  )
}

function SliderSection() {
  const [volume, setVolume] = useState(60)
  const [range, setRange] = useState<number[]>([20, 70])

  return (
    <>
      <Row label="one value">
        <div className="w-64">
          <Slider
            value={volume}
            onValueChange={(next) => setVolume(next as number)}
            aria-label="Volume"
          />
        </div>
      </Row>

      <Row label="with its value shown">
        <div className="w-64">
          <Slider
            value={volume}
            onValueChange={(next) => setVolume(next as number)}
            showValue
            aria-label="Volume"
          />
        </div>
      </Row>

      <Row label="a range - two thumbs, each with its own name">
        <div className="w-64">
          <Slider
            value={range}
            onValueChange={(next) => setRange(next as number[])}
            showValue
            aria-label="Price"
            getThumbLabel={(index) => (index === 0 ? 'Lowest price' : 'Highest price')}
          />
        </div>
      </Row>

      <Row label="disabled">
        <div className="w-64">
          <Slider defaultValue={40} disabled aria-label="Disabled" />
        </div>
      </Row>

      <Row label="vertical - its own row, because it is a head taller than a field">
        <Slider defaultValue={40} orientation="vertical" aria-label="Vertical" />
      </Row>
    </>
  )
}

function RatingScaleSection() {
  const [score, setScore] = useState<number | undefined>(3)
  const [unjudged, setUnjudged] = useState<number | undefined>(undefined)

  return (
    <>
      <Row label="scored - click the filled mark again to clear it">
        <div className="w-64">
          <RatingScale
            scale={5}
            value={score}
            onValueChange={setScore}
            label="Difficulty"
            emptyLabel="Not judged"
          />
        </div>
      </Row>

      <Row label="not judged yet, which is a state and not a zero">
        <div className="w-64">
          <RatingScale
            scale={5}
            value={unjudged}
            onValueChange={setUnjudged}
            label="Polish"
            emptyLabel="Not judged"
          />
        </div>
      </Row>

      <Row label="a longer scale, and one that cannot be changed">
        <div className="w-64">
          <RatingScale
            scale={10}
            value={7}
            onValueChange={() => {}}
            label="Ten"
            emptyLabel="Not judged"
          />
        </div>
        <div className="w-40">
          <RatingScale
            scale={5}
            value={2}
            onValueChange={() => {}}
            label="Disabled"
            emptyLabel="Not judged"
            disabled
          />
        </div>
      </Row>
    </>
  )
}

function DurationFieldSection() {
  const [estimate, setEstimate] = useState<number | null>(90)
  const [empty, setEmpty] = useState<number | null>(null)

  return (
    <>
      <Row label="type 90, or 1.5h, or 1:30 - all of them mean the same">
        <div className="w-40">
          <DurationField value={estimate} onValueChange={setEstimate} aria-label="Estimate" />
        </div>
        <span className="text-xs tabular-nums text-dim">
          {estimate === null ? 'null' : `${estimate} min`}
        </span>
      </Row>

      <Row label="empty, which is not zero">
        <div className="w-40">
          <DurationField
            value={empty}
            onValueChange={setEmpty}
            placeholder="1h 30m"
            aria-label="Unset"
          />
        </div>
        <span className="text-xs tabular-nums text-dim">
          {empty === null ? 'null' : `${empty} min`}
        </span>
      </Row>

      <Row label="inside a Field">
        <Field label="Estimate" help="How long you think it takes." className="w-56">
          <DurationField value={estimate} onValueChange={setEstimate} placeholder="1h 30m" />
        </Field>
      </Row>
    </>
  )
}

function PasswordFieldSection() {
  const [password, setPassword] = useState('correct horse battery staple')

  return (
    <>
      <Row label="always starts masked - revealing is the reader's own action">
        <div className="w-72">
          <PasswordField
            value={password}
            onValueChange={setPassword}
            showLabel="Show password"
            hideLabel="Hide password"
            autoComplete="current-password"
            aria-label="Password"
          />
        </div>
      </Row>

      <Row label="inside a Field, with an error">
        <Field
          label="New password"
          error="Too short - use at least twelve characters."
          className="w-72"
        >
          <PasswordField
            defaultValue="short"
            showLabel="Show password"
            hideLabel="Hide password"
            autoComplete="new-password"
          />
        </Field>
      </Row>

      <Row label="disabled">
        <div className="w-72">
          <PasswordField
            defaultValue="hunter2"
            disabled
            showLabel="Show password"
            hideLabel="Hide password"
            aria-label="Disabled"
          />
        </div>
      </Row>
    </>
  )
}

function CalendarMathSection() {
  /* The cases that break naive date code, answered live. Each row shows the
   * call and what it returns, so the stand demonstrates the module the way
   * the Shortcut section demonstrates a hook - by running it. */
  const cases: [string, string][] = [
    ['today()', today()],
    ["addMonths('2026-03-31', -1)", addMonths('2026-03-31', -1)],
    ["addMonths('2024-03-31', -1)", addMonths('2024-03-31', -1)],
    ["addDays('2026-12-31', 1)", addDays('2026-12-31', 1)],
    ["addDays('2024-02-28', 1)", addDays('2024-02-28', 1)],
    ["daysInMonth(1900, 2)", String(daysInMonth(1900, 2))],
    ["daysInMonth(2000, 2)", String(daysInMonth(2000, 2))],
    ["isIsoDate('2026-02-31')", String(isIsoDate('2026-02-31'))],
    ["isIsoDate('2024-02-29')", String(isIsoDate('2024-02-29'))],
  ]

  return (
    <Row label="no markup - the sums the Calendar runs on, answering live">
      <div className="flex flex-col gap-1">
        {cases.map(([call, answer]) => (
          <div key={call} className="flex items-baseline gap-2 font-mono text-xs">
            <span className="text-dim">{call}</span>
            <span className="text-faint">-&gt;</span>
            <span className="text-accent tabular-nums">{answer}</span>
          </div>
        ))}
      </div>
    </Row>
  )
}

function CalendarSection() {
  const [day, setDay] = useState('2026-09-14')

  return (
    <>
      <Row label="a month - arrows move a cursor, Enter chooses">
        <Calendar
          value={day}
          onValueChange={setDay}
          locale="en-GB"
          aria-label="A day"
          previousMonthLabel="Previous month"
          nextMonthLabel="Next month"
        />
      </Row>

      <Row label="bounded - the days outside cannot be chosen">
        <Calendar
          value="2026-09-14"
          min="2026-09-08"
          max="2026-09-20"
          locale="en-GB"
          aria-label="A bounded day"
          previousMonthLabel="Previous month"
          nextMonthLabel="Next month"
        />
      </Row>

      <Row label="a range, shaded between its ends">
        <Calendar
          value="2026-09-08"
          rangeEnd="2026-09-19"
          locale="en-GB"
          aria-label="A range"
          previousMonthLabel="Previous month"
          nextMonthLabel="Next month"
        />
      </Row>
    </>
  )
}

function DatePickerSection() {
  const [date, setDate] = useState<string | undefined>('2026-09-14')
  const [empty, setEmpty] = useState<string | undefined>(undefined)

  return (
    <>
      <Row label="chosen, and empty">
        <div className="w-56">
          <DatePicker
            value={date}
            onValueChange={setDate}
            locale="en-GB"
            placeholder="Pick a date"
            aria-label="Release date"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </div>
        <div className="w-56">
          <DatePicker
            value={empty}
            onValueChange={setEmpty}
            locale="en-GB"
            placeholder="Pick a date"
            aria-label="Another date"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </div>
      </Row>

      <Row label="inside a Field, and disabled">
        <Field label="Released on" help="When it goes out." className="w-56">
          <DatePicker
            value={date}
            onValueChange={setDate}
            locale="en-GB"
            placeholder="Pick a date"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </Field>
        <div className="w-56">
          <DatePicker
            value="2026-09-14"
            disabled
            locale="en-GB"
            placeholder="Pick a date"
            aria-label="Disabled"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </div>
      </Row>
    </>
  )
}

function DateRangePickerSection() {
  const [period, setPeriod] = useState<DateRange>({ start: '2026-09-08', end: '2026-09-19' })
  const [half, setHalf] = useState<DateRange>({ start: '2026-09-08' })

  return (
    <>
      <Row label="whole, and half made - the middle of the interaction is a state">
        <div className="w-64">
          <DateRangePicker
            value={period}
            onValueChange={setPeriod}
            locale="en-GB"
            placeholder="Pick a range"
            aria-label="Period"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </div>
        <div className="w-64">
          <DateRangePicker
            value={half}
            onValueChange={setHalf}
            locale="en-GB"
            placeholder="Pick a range"
            aria-label="Half made"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </div>
      </Row>

      <Row label="empty, and inside a Field">
        <div className="w-64">
          <DateRangePicker
            value={{}}
            onValueChange={() => {}}
            locale="en-GB"
            placeholder="Pick a range"
            aria-label="Empty"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </div>
        <Field label="Reporting period" className="w-64">
          <DateRangePicker
            value={period}
            onValueChange={setPeriod}
            locale="en-GB"
            placeholder="Pick a range"
            previousMonthLabel="Previous month"
            nextMonthLabel="Next month"
          />
        </Field>
      </Row>
    </>
  )
}

function TimeFieldSection() {
  const [start, setStart] = useState<string | null>('09:30')
  const [empty, setEmpty] = useState<string | null>(null)

  return (
    <>
      <Row label="type 930, or 9.30, or 9:30 pm - all of them are read">
        <div className="w-32">
          <TimeField value={start} onValueChange={setStart} locale="en-GB" aria-label="Starts at" />
        </div>
        <span className="text-xs tabular-nums text-dim">{start ?? 'null'}</span>
      </Row>

      <Row label="empty, which is not midnight">
        <div className="w-32">
          <TimeField
            value={empty}
            onValueChange={setEmpty}
            locale="en-GB"
            placeholder="09:30"
            aria-label="Unset"
          />
        </div>
        <span className="text-xs tabular-nums text-dim">{empty ?? 'null'}</span>
      </Row>

      <Row label="inside a Field">
        <Field label="Starts at" help="Local time." className="w-40">
          <TimeField value={start} onValueChange={setStart} locale="en-GB" />
        </Field>
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
  const chipsRef = useRef<HTMLDivElement>(null)

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
          <ComboboxChips ref={chipsRef} className="w-72">
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
            {/* `bare` because the chips container is the field here: the
                input drops its own border and sits on the same line as the
                last chip. */}
            <ComboboxInput bare placeholder="Fruit" aria-label="Fruits" />
          </ComboboxChips>
          {/* Anchored to the chips box, not the input inside it: an empty
              input is narrower than the field, and the list would hang short
              of the box a reader is looking at. */}
          <ComboboxPopup anchor={chipsRef}>
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

/*
 * Saying that something happened.
 *
 * Three components that products keep confusing, so the stand puts them next
 * to each other: a toast goes away, an alert is still true after a reload, and
 * a banner is true on every screen. Anything that needs an answer is a Dialog.
 */

function ToastSection() {
  return (
    <ToastProvider>
      <ToastRaiser />
      <ToastViewport>
        <ToastList />
      </ToastViewport>
    </ToastProvider>
  )
}

function ToastRaiser() {
  const manager = useToastManager()

  return (
    <>
      <Row label="raise one - it stacks in the corner and leaves on its own">
        <Button
          variant="ghost"
          onClick={() => manager.add({ title: 'Saved', description: 'The draft is stored.' })}
        >
          Neutral
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            manager.add({ type: 'success', title: 'Released', description: 'Two songs went out.' })
          }
        >
          Good
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            manager.add({ type: 'error', title: 'Could not save', description: 'The disk is full.' })
          }
        >
          Bad
        </Button>
      </Row>

      <Row label="with the one thing you can do about it">
        <Button
          variant="ghost"
          onClick={() =>
            manager.add({
              title: 'Draft deleted',
              data: { undo: true },
            })
          }
        >
          Undoable
        </Button>
      </Row>
    </>
  )
}

/** The list. Kept beside the raiser so both live in the same provider. */
function ToastList() {
  const { toasts } = useToastManager()
  return toasts.map((toast) => (
    <Toast key={toast.id} toast={toast}>
      <ToastTitle />
      <ToastDescription />
      {(toast.data as { undo?: boolean } | undefined)?.undo === true && (
        <ToastAction>Undo</ToastAction>
      )}
      <ToastClose aria-label="Dismiss" />
    </Toast>
  ))
}

function AlertSection() {
  return (
    <>
      <Row label="tones">
        <div className="flex w-full flex-col gap-2">
          <Alert>This profile has no axes yet, so nothing can be scored.</Alert>
          <Alert tone="good">Every version of this work has been reviewed.</Alert>
          <Alert tone="warn">Two releases are scheduled for the same slot.</Alert>
          <Alert tone="bad" role="alert">
            The last export failed and has not been retried.
          </Alert>
          <Alert tone="info">Scores from before August use the old six axes.</Alert>
        </div>
      </Row>

      <Row label="with a heading and something to do about it">
        <div className="w-full">
          <Alert
            tone="warn"
            title="This calendar is out of date"
            action={
              <Button size="sm" variant="ghost">
                Rebuild
              </Button>
            }
          >
            Four releases have moved since it was last built.
          </Alert>
        </div>
      </Row>
    </>
  )
}

function BannerSection() {
  return (
    <>
      <Row label="across the top, about the whole application">
        <div className="w-full overflow-hidden rounded-md border border-line">
          <Banner>You are offline. Changes are kept and will sync when you are back.</Banner>
        </div>
      </Row>

      <Row label="tones, and something to do about it">
        <div className="flex w-full flex-col gap-2">
          <div className="overflow-hidden rounded-md border border-line">
            <Banner
              tone="accent"
              action={
                <Button size="sm" variant="soft">
                  Install
                </Button>
              }
            >
              Version 0.42 is ready to install.
            </Banner>
          </div>
          <div className="overflow-hidden rounded-md border border-line">
            <Banner tone="warn">This is a preview build. Do not keep anything in it.</Banner>
          </div>
          <div className="overflow-hidden rounded-md border border-line">
            <Banner tone="bad">The backup has not run for nine days.</Banner>
          </div>
        </div>
      </Row>
    </>
  )
}

function TagInputSection() {
  const [tags, setTags] = useState<string[]>(['documentation', 'registry'])
  const [few, setFew] = useState<string[]>([])

  return (
    <>
      <Row label="type a word, press Enter">
        <TagInput
          value={tags}
          onValueChange={setTags}
          aria-label="Tags"
          placeholder="Add a tag"
          removeLabel={(tag) => `Remove ${tag}`}
          className="w-80"
        />
      </Row>

      <Row label="capped, and saying so">
        <TagInput
          value={few}
          onValueChange={setFew}
          max={3}
          aria-label="Up to three"
          placeholder={few.length < 3 ? 'Add a tag' : undefined}
          removeLabel={(tag) => `Remove ${tag}`}
          className="w-80"
        >
          <span className="px-1 text-2xs text-faint tabular-nums">{few.length}/3</span>
        </TagInput>
      </Row>

      <Row label="sizes">
        <TagInput
          size="sm"
          value={['small']}
          onValueChange={() => {}}
          aria-label="Small"
          removeLabel={(tag) => `Remove ${tag}`}
          className="w-56"
        />
        <TagInput
          size="lg"
          value={['large']}
          onValueChange={() => {}}
          aria-label="Large"
          removeLabel={(tag) => `Remove ${tag}`}
          className="w-56"
        />
      </Row>
    </>
  )
}

function FileDropSection() {
  const [taken, setTaken] = useState<string[]>([])
  const [refused, setRefused] = useState<FileRejection[]>([])

  return (
    <>
      <Row label="drag files onto it, or press it">
        <div className="w-full">
          <FileDrop
            aria-label="Attachments"
            multiple
            onFiles={(files) => setTaken(files.map((file) => file.name))}
            className="w-full"
          >
            <span className="text-sm text-dim">
              Drop files here, or <span className="text-accent underline">choose them</span>
            </span>
          </FileDrop>
          {taken.length > 0 && (
            <ul className="m-0 mt-2 list-none p-0 text-xs text-dim">
              {taken.map((name) => (
                <li key={name} className="font-mono">
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Row>

      <Row label="filtered, and saying what it refused">
        <div className="w-full">
          <FileDrop
            aria-label="Images only, under 1 KB"
            accept="image/*"
            maxSize={1024}
            multiple
            onFiles={() => setRefused([])}
            onReject={setRefused}
            className="w-full"
          >
            <span className="text-sm text-dim">Images, under 1 KB</span>
          </FileDrop>
          {refused.length > 0 && (
            <ul className="m-0 mt-2 list-none p-0 text-xs text-bad">
              {refused.map((rejection) => (
                <li key={rejection.file.name}>
                  {rejection.file.name} - {rejection.reason === 'type' ? 'not an image' : 'too large'}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Row>

      <Row label="disabled">
        <FileDrop aria-label="Closed" disabled onFiles={() => {}} className="w-full">
          <span className="text-sm text-dim">Not taking files right now</span>
        </FileDrop>
      </Row>
    </>
  )
}

function ColorFieldSection() {
  const [token, setToken] = useState('kilna')
  const [anything, setAnything] = useState(lineProducts[7]!.accent)

  return (
    <>
      <Row label="the vocabulary a product already speaks">
        <div className="flex flex-col gap-2">
          <ColorField value={token} onValueChange={setToken} aria-label="Colour" />
          <span className="text-xs text-dim">
            chosen: <code className="font-mono text-text">{token}</code>
          </span>
        </div>
      </Row>

      <Row label="or a colour the reader picked">
        <div className="flex flex-col gap-2">
          <ColorField
            value={anything}
            onValueChange={setAnything}
            allowCustom
            customLabel="Custom"
            aria-label="Any colour"
          />
          <span className="text-xs text-dim">
            chosen: <code className="font-mono text-text">{anything}</code>
          </span>
        </div>
      </Row>
    </>
  )
}

function ActionBarSection() {
  return (
    <>
      <Row label="at the foot of a form">
        <div className="w-full rounded-md border border-line">
          <div className="p-4 text-sm text-dim">A form, and its actions below it.</div>
          <ActionBar
            position="static"
            aria-label="Form actions"
            className="border-t border-line px-4 py-3"
          >
            <ActionBarButton render={<Button variant="primary">Save</Button>} />
            <ActionBarButton render={<Button variant="ghost">Cancel</Button>} />
            <ActionBarSpacer />
            <ActionBarButton render={<Button variant="danger">Delete</Button>} />
          </ActionBar>
        </div>
      </Row>

      <Row label="groups, separated">
        <div className="w-full rounded-md border border-line px-4 py-3">
          <ActionBar aria-label="Editor">
            <ActionBarGroup>
              <ActionBarButton
                render={
                  <Button variant="ghost" size="sm">
                    Bold
                  </Button>
                }
              />
              <ActionBarButton
                render={
                  <Button variant="ghost" size="sm">
                    Italic
                  </Button>
                }
              />
            </ActionBarGroup>
            <ActionBarSeparator />
            <ActionBarGroup>
              <ActionBarButton
                render={
                  <Button variant="ghost" size="sm">
                    Link
                  </Button>
                }
              />
              <ActionBarButton
                render={
                  <Button variant="ghost" size="sm">
                    Quote
                  </Button>
                }
              />
            </ActionBarGroup>
          </ActionBar>
        </div>
      </Row>
    </>
  )
}

function SaveStateSection() {
  const [status, setStatus] = useState<SaveStatus>('idle')

  return (
    <>
      <Row label="what a form without a Save button says">
        <div className="flex items-center gap-3">
          <Input aria-label="Title" defaultValue="A field that saves itself" className="w-64" />
          <SaveState status={status} savingLabel="Saving..." savedLabel="Saved" />
        </div>
      </Row>

      <Row label="the three states">
        <div className="flex items-center gap-4">
          <SaveState status="saving" savingLabel="Saving..." savedLabel="Saved" />
          <SaveState status="saved" savingLabel="Saving..." savedLabel="Saved" />
          <span className="rounded border border-dashed border-line px-2 py-1">
            <SaveState status="idle" savingLabel="Saving..." savedLabel="Saved" />
          </span>
        </div>
      </Row>

      <Row label="watch it run">
        <Button
          variant="soft"
          onClick={() => {
            setStatus('saving')
            setTimeout(() => setStatus('saved'), 900)
            setTimeout(() => setStatus('idle'), 2900)
          }}
        >
          Save something
        </Button>
      </Row>
    </>
  )
}

/* The demo data for the table sections. Invented people doing invented work:
 * a stand is public, and the line's rule is that nothing of the owner's ever
 * reaches a fixture. The gaps are the point - two rows with no score and one
 * with no reviewer, which is what the sorting is here to show. */
interface Work {
  id: string
  title: string
  owner: string
  score: number | null
  words: number
  updated: string
}

const works: Work[] = [
  { id: 'w1', title: 'Harbour lights', owner: 'Ines', score: 8, words: 4120, updated: '2026-09-09T09:40:00Z' },
  { id: 'w2', title: 'The quiet mile', owner: 'Ravi', score: null, words: 990, updated: '2026-09-08T17:05:00Z' },
  { id: 'w3', title: 'Ash and after', owner: 'Ines', score: 10, words: 12040, updated: '2026-09-02T11:20:00Z' },
  { id: 'w4', title: 'Nine of cups', owner: 'Tomas', score: 3, words: 640, updated: '2026-08-30T08:00:00Z' },
  { id: 'w5', title: 'Undertow', owner: 'Ravi', score: null, words: 7300, updated: '2026-08-11T21:15:00Z' },
  { id: 'w6', title: 'Ember street', owner: 'Kit', score: 6, words: 2280, updated: '2026-06-19T13:30:00Z' },
]

const readWork = (row: Work, column: string): SortValue => row[column as keyof Work]

/* A fixed moment, so the relative phrases on the stand do not drift as the
 * page is left open - and so the visual snapshots do not change every run. */
const standNow = new Date('2026-09-09T12:00:00Z')

function TableSortSection() {
  /* The rule, shown rather than described: the same rows, the same column,
   * both directions - and the two with no score stay at the bottom of each. */
  const rows = works.map((work) => `${work.title} ${work.score ?? '—'}`)
  const ascending = sortRows(works, { column: 'score', direction: 'asc' }, readWork).map(
    (work) => `${work.title}: ${work.score ?? '—'}`,
  )
  const descending = sortRows(works, { column: 'score', direction: 'desc' }, readWork).map(
    (work) => `${work.title}: ${work.score ?? '—'}`,
  )

  return (
    <>
      <Row label="no markup - the same six rows, sorted by score both ways">
        <div className="flex flex-wrap gap-8">
          {[
            ['ascending', ascending],
            ['descending', descending],
          ].map(([label, list]) => (
            <div key={label as string} className="flex flex-col gap-1">
              <div className="text-2xs uppercase tracking-caption text-faint">{label}</div>
              {(list as string[]).map((line) => (
                <div key={line} className="font-mono text-xs text-dim">
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Row>
      <Row label="the two with no score are last in both - that is the whole rule">
        <p className="max-w-prose text-xs text-dim">
          Rank absence with the rest and flip the sign, and a descending sort floats every empty
          row to the top: the reader asks for the highest score and is handed the rows that have
          none. {rows.length} rows, two of them unjudged.
        </p>
      </Row>
    </>
  )
}

function TableSection() {
  const [sort, setSort] = useState<Sort>({ column: 'title', direction: 'asc' })
  const [picked, setPicked] = useState<string>('w3')
  const sorted = sortRows(works, sort, readWork, { tiebreak: (work) => work.id })

  return (
    <>
      <Row label="click a heading to reorder - the unjudged rows stay last either way">
        <TableScroll className="w-full">
          <Table>
            <TableHead>
              <TableRow>
                <TableSortHeader
                  column="title"
                  sort={sort}
                  onSortChange={(column) => setSort(toggleSort(sort, column))}
                >
                  Title
                </TableSortHeader>
                <TableSortHeader
                  column="owner"
                  sort={sort}
                  onSortChange={(column) => setSort(toggleSort(sort, column))}
                >
                  Owner
                </TableSortHeader>
                <TableSortHeader
                  column="score"
                  numeric
                  sort={sort}
                  onSortChange={(column) => setSort(toggleSort(sort, column))}
                >
                  Score
                </TableSortHeader>
                <TableSortHeader
                  column="words"
                  numeric
                  sort={sort}
                  onSortChange={(column) => setSort(toggleSort(sort, column))}
                >
                  Words
                </TableSortHeader>
                <TableHeader>Updated</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((work) => (
                <TableRow
                  key={work.id}
                  selected={work.id === picked}
                  onClick={() => setPicked(work.id)}
                  className="cursor-pointer"
                >
                  <TableCell>{work.title}</TableCell>
                  <TableCell>{work.owner}</TableCell>
                  <TableCell numeric>
                    {work.score === null ? (
                      <span className="text-faint">—</span>
                    ) : (
                      <NumberFormat value={work.score} />
                    )}
                  </TableCell>
                  <TableCell numeric>
                    <NumberFormat value={work.words} />
                  </TableCell>
                  <TableCell>
                    <RelativeTime value={work.updated} now={standNow} className="text-dim" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScroll>
      </Row>

      <Row label="dense, for a table that is scanned rather than read">
        <TableScroll className="w-full">
          <Table density="dense">
            <TableHead>
              <TableRow>
                <TableHeader>Title</TableHeader>
                <TableHeader numeric>Words</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {works.slice(0, 4).map((work) => (
                <TableRow key={work.id}>
                  <TableCell>{work.title}</TableCell>
                  <TableCell numeric>
                    <NumberFormat value={work.words} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableScroll>
      </Row>

      <Row label="a sticky heading - scroll the box, the heading stays">
        <div className="h-48 w-64 overflow-y-auto rounded-md border border-line">
          <Table density="dense">
            <TableHead sticky>
              <TableRow>
                <TableHeader>Title</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...works, ...works].map((work, index) => (
                <TableRow key={`${work.id}-${index}`}>
                  <TableCell>{work.title}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Row>

      <Row label="empty - the message spans every column and the heading stays put">
        <div className="w-full rounded-md border border-line">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Title</TableHeader>
                <TableHeader numeric>Words</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableEmpty colSpan={2}>Nothing here yet</TableEmpty>
            </TableBody>
          </Table>
        </div>
      </Row>
    </>
  )
}

const paginationLabels = {
  region: 'Pages',
  previous: 'Previous page',
  next: 'Next page',
  page: (page: number) => `Page ${page}`,
}

function PaginationSection() {
  const [page, setPage] = useState(1)
  const pageSize = 25
  const total = 973
  const [from, to] = pageRange(page, pageSize, total)

  return (
    <>
      <Row label="page through it - the row keeps its width wherever you are">
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-dim tabular-nums">
            {from}-{to} of <NumberFormat value={total} />
          </span>
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            labels={paginationLabels}
          />
        </div>
      </Row>

      <Row label="a short list draws every page, and a wider neighbourhood is a prop">
        <Pagination
          page={2}
          pageSize={10}
          total={40}
          onPageChange={() => {}}
          labels={paginationLabels}
        />
        <Pagination
          page={20}
          pageSize={10}
          total={400}
          around={2}
          onPageChange={() => {}}
          labels={paginationLabels}
        />
      </Row>
    </>
  )
}

function PageSizeSection() {
  const [pageSize, setPageSize] = useState(25)

  return (
    <>
      <Row label="a Select, never a native one - and it hands back a number">
        <PageSize pageSize={pageSize} onPageSizeChange={setPageSize} label="Rows per page">
          Rows per page
        </PageSize>
      </Row>
      <Row label="the choices are the product's">
        <PageSize
          pageSize={200}
          options={[50, 200, 1000]}
          onPageSizeChange={() => {}}
          label="Rows to load"
        >
          Load at a time
        </PageSize>
      </Row>
    </>
  )
}

function NumberFormatSection() {
  return (
    <>
      <Row label="the separators are the reader's - same number, four languages">
        <div className="flex flex-col gap-1">
          {['en-US', 'de-DE', 'fr-FR', 'ru-RU'].map((locale) => (
            <div key={locale} className="flex items-baseline gap-3 font-mono text-xs">
              <span className="w-12 text-faint">{locale}</span>
              <NumberFormat value={1234567.89} locale={locale} maximumFractionDigits={2} />
            </div>
          ))}
        </div>
      </Row>

      <Row label="money, percentages and a compact number - one component, Intl's options">
        <div className="flex flex-col gap-1 font-mono text-xs">
          <NumberFormat value={1299.5} locale="en-US" style="currency" currency="USD" />
          <NumberFormat value={0.427} locale="en-US" style="percent" maximumFractionDigits={1} />
          <NumberFormat value={1200000} locale="en-US" notation="compact" />
          <NumberFormat value={42} locale="en-US" style="unit" unit="megabyte" />
        </div>
      </Row>

      <Row label="the figures line up - in a font whose digits differ in width">
        {/* The rows are 1s against 8s on purpose: those are the two digits
          * whose proportional widths differ most, and a column of mixed
          * numbers hides the effect by averaging it out.
          *
          * `w-fit` matters as much. Inside a stretched column both variants
          * end up the same width and the demonstration shows nothing - which
          * is what the first version of this section did.
          *
          * The two columns look identical wherever the rendering font has
          * uniform digits anyway - the CI container is one such place, and its
          * baseline photograph shows no difference. That is the font, not the
          * component: `tabular-nums` asks, and a font that has nothing to
          * change changes nothing. The rule still earns its place, because the
          * fonts a product actually ships to are the other kind. */}
        <div className="flex gap-8">
          {[
            ['tabular', 'tabular-nums'],
            ['proportional', '[font-variant-numeric:proportional-nums]'],
          ].map(([label, variant]) => (
            <div key={label} className="flex w-fit flex-col items-end">
              <span className="mb-1 text-2xs uppercase tracking-caption text-faint">{label}</span>
              {[1111, 8888, 1818, 8181].map((value) => (
                <span key={value} className={cn('text-sm', variant)}>
                  {value}
                </span>
              ))}
            </div>
          ))}
        </div>
      </Row>
    </>
  )
}

function RelativeTimeSection() {
  const at = (seconds: number) => new Date(standNow.getTime() - seconds * 1000)

  return (
    <>
      <Row label="hover any of them - the exact date is still there, in the title">
        <div className="flex flex-col gap-1 text-sm">
          {[30, 60 * 8, 60 * 60 * 5, 60 * 60 * 24, 60 * 60 * 24 * 9, 60 * 60 * 24 * 200].map(
            (seconds) => (
              <RelativeTime key={seconds} value={at(seconds)} now={standNow} />
            ),
          )}
        </div>
      </Row>

      <Row label="the phrase is the reader's language, including its special words">
        <div className="flex flex-col gap-1">
          {['en-US', 'de-DE', 'fr-FR', 'ru-RU'].map((locale) => (
            <div key={locale} className="flex items-baseline gap-3 text-xs">
              <span className="w-12 font-mono text-faint">{locale}</span>
              <RelativeTime value={at(60 * 60 * 24)} now={standNow} locale={locale} />
            </div>
          ))}
        </div>
      </Row>

      <Row label="'always', for a column where every row should read the same way">
        <div className="flex gap-8 text-sm">
          <RelativeTime value={at(60 * 60 * 24)} now={standNow} locale="en-US" />
          <RelativeTime value={at(60 * 60 * 24)} now={standNow} locale="en-US" numeric="always" />
          <RelativeTime
            value={new Date(standNow.getTime() + 60 * 60 * 26 * 1000)}
            now={standNow}
            locale="en-US"
          />
        </div>
      </Row>
    </>
  )
}


/* A hundred thousand rows, built once. The number is the point of the
 * component, so the stand shows the real thing rather than a polite hundred. */
const manyRows = Array.from({ length: 100_000 }, (_, index) => ({
  id: index,
  name: `Row ${index + 1}`,
}))

function VirtualListSection() {
  return (
    <>
      <Row label="a hundred thousand rows, and about a dozen of them in the DOM at a time">
        <VirtualList
          rows={manyRows}
          rowHeight={32}
          rowKey={(row) => row.id}
          label="A hundred thousand rows"
          className="h-64 w-full rounded-md border border-line"
        >
          {(row, index) => (
            <div className="flex h-full items-center justify-between border-b border-line px-3">
              <span>{row.name}</span>
              <NumberFormat value={index} className="text-xs text-dim" />
            </div>
          )}
        </VirtualList>
      </Row>

      <Row label="the same list, taller rows - the height is given, never measured">
        <VirtualList
          rows={manyRows}
          rowHeight={56}
          rowKey={(row) => row.id}
          label="Taller rows"
          className="h-64 w-full rounded-md border border-line"
        >
          {(row) => (
            <div className="flex h-full flex-col justify-center border-b border-line px-3">
              <span>{row.name}</span>
              <span className="text-xs text-dim">a second line, to fill the height</span>
            </div>
          )}
        </VirtualList>
      </Row>

      <Row label="nothing at all, which is a list of zero rows and not a broken one">
        <VirtualList
          rows={[]}
          rowHeight={32}
          rowKey={(row: { id: number }) => row.id}
          label="Empty"
          className="h-24 w-full rounded-md border border-line"
        >
          {() => null}
        </VirtualList>
      </Row>
    </>
  )
}

const tree: TreeNode[] = [
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
          { id: 'table', label: 'Table.tsx' },
        ],
      },
      { id: 'styles', label: 'styles.css' },
    ],
  },
  {
    id: 'docs',
    label: 'docs',
    children: [{ id: 'readme', label: 'README.md' }],
  },
  { id: 'drafts', label: 'drafts', empty: true },
  { id: 'license', label: 'LICENSE' },
]

function TreeViewSection() {
  const [selected, setSelected] = useState('button')
  /* Open to begin with, and that is not decoration: closed, the stand shows a
   * list of four folders and none of what the component is - the indent, the
   * cursor, the selected row, the levels a reader is told about. A picture of
   * a tree should be a picture of a tree. */
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(['src', 'ui', 'docs']))

  return (
    <>
      <Row label="tab into it once, then arrows - right opens, left gets you back out">
        <TreeView
          nodes={tree}
          open={open}
          onOpenChange={setOpen}
          selected={selected}
          onSelect={setSelected}
          label="Files"
          className="w-72 rounded-md border border-line p-1"
        />
      </Row>

      <Row label="an empty folder still opens, and shows nothing - a fact about the folder">
        <TreeView
          nodes={[{ id: 'drafts', label: 'drafts', empty: true }]}
          open={new Set(['drafts'])}
          label="Empty folder"
          className="w-72 rounded-md border border-line p-1"
        />
      </Row>
    </>
  )
}

function KeyValueSection() {
  return (
    <>
      <Row label="names in a column, values beside them - for a panel of properties">
        <KeyValue className="w-80">
          <KeyValueRow label="Title">Harbour lights</KeyValueRow>
          <KeyValueRow label="Owner">Ines</KeyValueRow>
          <KeyValueRow label="Words">
            <NumberFormat value={4120} />
          </KeyValueRow>
          <KeyValueRow label="Updated">
            <RelativeTime value="2026-09-09T09:40:00Z" now={standNow} />
          </KeyValueRow>
          <KeyValueRow label="Status">
            <Badge variant="info">In review</Badge>
          </KeyValueRow>
        </KeyValue>
      </Row>

      <Row label="name above value - for a card, and for a column too narrow to pair">
        <KeyValue layout="stacked" className="w-48">
          <KeyValueRow label="Title">Harbour lights</KeyValueRow>
          <KeyValueRow label="Owner">Ines</KeyValueRow>
          <KeyValueRow label="Words">
            <NumberFormat value={4120} />
          </KeyValueRow>
        </KeyValue>
      </Row>
    </>
  )
}

/* A history that actually travels. The first draft of this example ran
 * 61 → 82 against a ceiling of 100, which occupies a fifth of the box: it made
 * the point of the row below - "against a stated ceiling, a small change stays
 * small" - twice, and the row above it demonstrated nothing. */
/* A day in minutes from its own start: 3h, a 45m break, 4h15m. */
const workingDay = [
  { key: 'am', start: 0, end: 180, tone: 'accent' as const, label: 'Worked · 3h' },
  { key: 'lunch', start: 180, end: 225, tone: 'idle' as const, label: 'Break · 45m' },
  { key: 'pm', start: 225, end: 465, tone: 'accent' as const, label: 'Worked · 4h' },
  { key: 'tea', start: 465, end: 474, tone: 'idle' as const, label: 'Break · 9m' },
  { key: 'late', start: 474, end: 480, tone: 'accent' as const, label: 'Worked · 6m' },
]

const tiers = [
  { key: 'draft', label: 'Draft', min: 0 },
  { key: 'keep', label: 'Keep', min: 40 },
  { key: 'good', label: 'Good', min: 62 },
  { key: 'clip', label: 'Clip', min: 78 },
]

function tierSegments(score: number) {
  return tiers.map((tier, index) => {
    const next = tiers[index + 1]?.min ?? 100
    const reached = score >= tier.min
    const standing = reached && score < next
    return {
      key: tier.key,
      start: tier.min,
      end: next,
      tone: standing ? ('accent' as const) : reached ? ('past' as const) : ('idle' as const),
      label: `${tier.label} · ${tier.min}+`,
    }
  })
}

/* A demo year, made rather than copied: a working rhythm with weekends off,
 * a fortnight away in July, and a few days still open at the end. */
function demoYear() {
  const entries: { date: string; value: number | null }[] = []
  const start = Date.parse('2025-10-01T00:00:00Z')
  for (let i = 0; i < 360; i++) {
    const time = start + i * 86_400_000
    const date = new Date(time).toISOString().slice(0, 10)
    const weekday = new Date(time).getUTCDay()
    if (weekday === 0 || weekday === 6) {
      // Some weekends, not none: a grid where the weekends are always blank
      // hides whether the component can draw one that is not.
      if (i % 11 !== 0) continue
      entries.push({ date, value: 1800 + ((i * 37) % 3600) })
      continue
    }
    if (date >= '2026-07-06' && date <= '2026-07-19') continue
    if (date >= '2026-09-24') {
      entries.push({ date, value: null })
      continue
    }
    if (i % 17 === 0) continue
    /* Spread across the whole scale on purpose. The first draft ran
     * 12600..34200 against a ceiling of 34200, so no weekday could reach below
     * the second step and three quarters of the year landed on the top three -
     * a grid of one colour, which demonstrates that the steps exist without
     * showing that they can be told apart. */
    entries.push({ date, value: 1_800 + ((i * 911) % 32_400) })
  }
  return entries
}

const year = demoYear()
const busiestSeconds = Math.max(...year.map((entry) => entry.value ?? 0))
const hours = (seconds: number) => `${Math.floor(seconds / 3600)}h ${String(Math.round((seconds % 3600) / 60)).padStart(2, '0')}m`
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function describeCell(cell: { date: string; kind: string; value: number | null }) {
  if (cell.kind === 'value') return `${cell.date} · ${hours(cell.value ?? 0)}`
  if (cell.kind === 'partial') return `${cell.date} · still open`
  if (cell.kind === 'outside') return `${cell.date} · outside the range`
  return `${cell.date} · nothing recorded`
}

function ActivityWeeksSection() {
  const fortnight = weeks(
    [
      { date: '2026-09-07', value: 28_800 },
      { date: '2026-09-08', value: 7_200 },
      { date: '2026-09-09', value: null },
      { date: '2026-09-11', value: 0 },
    ],
    { from: '2026-09-07', to: '2026-09-13', busiest: 28_800 },
  )

  return (
    <>
      <Row label="no markup - one week, and what each of its seven cells is">
        <div className="flex flex-col gap-1">
          {fortnight[0]!.map((cell) => (
            <div key={cell.date} className="font-mono text-xs text-dim">
              {cell.date} {cell.kind.padEnd(8)} step {cell.step ?? '-'}
              {cell.weekend ? '  weekend' : ''}
            </div>
          ))}
        </div>
      </Row>

      <Row label="a measured zero is an answer, an absent day is not - and they differ">
        <div className="flex flex-col gap-1 font-mono text-xs text-dim">
          <div>stepFor(0, 28800) = {stepFor(0, 28_800)}  (zero, measured)</div>
          <div>stepFor(1, 28800) = {stepFor(1, 28_800)}  (one second is still a day)</div>
          <div>stepFor(14400, 28800) = {stepFor(14_400, 28_800)}</div>
          <div>stepFor(28800, 28800) = {stepFor(28_800, 28_800)}</div>
          <div className="text-faint">a day with no entry never reaches this function at all</div>
        </div>
      </Row>
    </>
  )
}

/* Twelve weeks: a working rhythm, a fortnight off in the middle drawn as a
 * gap rather than a short week, and one week that was recorded as zero. */
const twelveWeeks = [
  { key: 'w1', hours: 38.5 },
  { key: 'w2', hours: 41 },
  { key: 'w3', hours: 36 },
  { key: 'w4', hours: 42.5 },
  { key: 'w5', hours: 12 },
  { key: 'w6', hours: null },
  { key: 'w7', hours: null },
  { key: 'w8', hours: 0 },
  { key: 'w9', hours: 34 },
  { key: 'w10', hours: 39.5 },
  { key: 'w11', hours: 0.3 },
  { key: 'w12', hours: 40 },
] as const

/* Day of month alone: twelve columns in a 28rem panel leave about 30px each,
 * and "Aug 17" truncates to "Aug ..." - a label that says less than nothing.
 * The month belongs in the title beside the chart. */
const weekLabels = ['1', '8', '15', '22', '29', '6', '13', '20', '27', '3', '10', '17']

/* A holiday fortnight: real hours, all of them far under a full week. Their
 * own tallest is 9h, a fifth of the 45h ceiling, so the two scalings of it are
 * plainly different rather than technically different. */
const quiet = [4, 6.5, 2, 9, 5.5, 7]

function quietWeeks() {
  return quiet.map((hours, index) => ({
    key: `q${index}`,
    value: hours,
    label: String(index * 7 + 1),
    title: `week ${index + 1} · ${hours}h`,
  }))
}

function weekBars(tone?: 'accent' | 'muted') {
  return twelveWeeks.map((week, index) => ({
    key: week.key,
    value: week.hours,
    label: weekLabels[index]!,
    tone,
    title:
      week.hours === null
        ? `${weekLabels[index]} · nothing recorded`
        : `${weekLabels[index]} · ${week.hours}h`,
  }))
}

const weekCeiling = 45
const weekMedian = 38.5

/* A balance sampled weekly across a quarter: it drifts, dips, recovers, and
 * one week was never snapshotted. The range is narrow on purpose - that is
 * what makes the zero-floor comparison worth looking at. */
const balanceWeeks = [4_900, 4_960, 5_020, 4_880, 4_940, null, 5_060, 5_010, 5_140, 5_090, 5_200, 5_260]
const balancePoints = balanceWeeks.map((value, index) => ({ at: index, value }))
const money = (value: number) => `$${value.toLocaleString('en')}`

function LineScaleSection() {
  const bounds = boundsOf(balancePoints)!
  const stretches = runs(balancePoints, bounds)

  return (
    <>
      <Row label="no markup - a series with a hole becomes two stretches, and nothing moves">
        <div className="flex flex-col gap-1 font-mono text-xs text-dim">
          {stretches.map((run, index) => (
            <div key={run[0]!.at}>
              run {index + 1}: {run.length} points, x {run[0]!.x.toFixed(1)}% to {run.at(-1)!.x.toFixed(1)}%
            </div>
          ))}
          <div className="text-faint">
            the gap is week 6; the stretch after it still starts where week 7 belongs
          </div>
        </div>
      </Row>

      <Row label="ticks land on round numbers, not on the range cut in equal parts">
        <div className="flex flex-col gap-1 font-mono text-xs text-dim">
          <div>range {bounds.min} to {bounds.max}</div>
          <div>ticks: {ticksFor(bounds, 4).join(', ')}</div>
          <div>range 0 to 37 -&gt; {ticksFor({ from: 0, to: 1, min: 0, max: 37 }, 4).join(', ')}</div>
          <div className="text-faint">equal parts would have given 9.25, 18.5, 27.75</div>
        </div>
      </Row>
    </>
  )
}

function LineChartSection() {
  return (
    <>
      <Row label="a balance across a quarter - week six was never snapshotted, so the line breaks">
        <Panel className="w-[28rem] p-5">
          <LineChart
            points={balancePoints}
            label="Balance, $4,900 to $5,260 across twelve weeks, one not measured"
            formatTick={money}
            footer={
              <>
                <span>1 Jul</span>
                <span>16 Sep</span>
              </>
            }
          />
        </Panel>
      </Row>

      <Row label="the same series with a zero floor - what a line loses when the axis starts at nothing">
        <Panel className="flex w-[28rem] flex-col gap-2 p-5">
          <LineChart
            points={balancePoints}
            bounds={{ min: 0 }}
            label="The same balance, on a zero-based axis"
            formatTick={money}
          />
          <span className="text-xs text-dim">
            every movement flattened into one rule - right for a count, wrong for a level
          </span>
        </Panel>
      </Row>

      <Row label="sm, and the tones a caller who knows the direction can ask for">
        <Panel className="flex w-[28rem] flex-col gap-4 p-5">
          <LineChart points={balancePoints} size="sm" tone="good" ticks={3} formatTick={money} label="Rising, in good" />
          <LineChart
            points={balancePoints.map((point) => ({ ...point, value: point.value === null ? null : 10_000 - point.value }))}
            size="sm"
            tone="bad"
            ticks={3}
            formatTick={money}
            label="The mirror of it, in bad"
          />
        </Panel>
      </Row>

      <Row label="nothing measured - a bare plot with its axis, never a flat line at zero">
        <Panel className="flex w-[28rem] flex-col gap-2 p-5">
          <LineChart
            points={[0, 1, 2, 3].map((at) => ({ at, value: null }))}
            label="Nothing recorded this quarter"
          />
          <span className="text-xs text-dim">
            a line at zero would claim the balance was nil; this claims nothing
          </span>
        </Panel>
      </Row>
    </>
  )
}

function BarChartSection() {
  const picked = weekBars('muted').map((bar, index) =>
    index === 11 ? { ...bar, tone: 'accent' as const } : bar,
  )

  return (
    <>
      <Row label="twelve weeks - two of them with nothing recorded, one recorded as zero, one of twenty minutes">
        <Panel className="w-[28rem] p-5">
          <ChartFrame gutter={false}>
            <BarChart bars={weekBars()} max={weekCeiling} label="Twelve weeks of work" />
          </ChartFrame>
        </Panel>
      </Row>

      <Row label="with the median named - a chart without its baseline invites the reader to invent one">
        <Panel className="w-[28rem] p-5">
          <ChartFrame>
            <BarChart bars={weekBars()} max={weekCeiling} label="Twelve weeks of work, median 38.5h" />
            <Baseline value={weekMedian} max={weekCeiling}>
              median 38.5h
            </Baseline>
          </ChartFrame>
        </Panel>
      </Row>

      <Row label="emphasis - one column is the story, the rest are the field it stands in">
        <Panel className="w-[28rem] p-5">
          <ChartFrame gutter={false}>
            <BarChart bars={picked} max={weekCeiling} label="Twelve weeks, this week picked out" />
          </ChartFrame>
        </Panel>
      </Row>

      <Row label="sm, for a chart that sits beside something else">
        <Panel className="w-80 p-4">
          <BarChart bars={weekBars().slice(6)} max={weekCeiling} size="sm" label="Six weeks of work" />
        </Panel>
      </Row>

      <Row label="a quiet stretch against the stated ceiling, and the same weeks scaled to themselves">
        <Panel className="flex w-80 flex-col gap-3 p-4">
          {/* Its own data, and it has to be. The point only lands when the
              stretch's own tallest week is far below the ceiling, and no slice
              of the twelve above qualifies - the quietest run still reaches
              76% of 45, which on a 72px plot is a difference of seventeen
              pixels. Two earlier drafts of this row sliced the twelve and
              proved nothing. */}
          <BarChart bars={quietWeeks()} max={weekCeiling} size="sm" label="A quiet fortnight, against the same ceiling as the charts above" />
          <span className="text-xs text-dim">
            <code>max=45</code> - read against the other charts, this fortnight was short
          </span>
          <BarChart bars={quietWeeks()} size="sm" label="The same fortnight, scaled to itself" />
          <span className="text-xs text-dim">
            no <code>max</code> - the same weeks now fill the plot, and nothing says they were quiet
          </span>
        </Panel>
      </Row>
    </>
  )
}

function ActivityLegendSection() {
  return (
    <>
      <Row label="the full legend - the five steps, the relative ceiling named, and the two meanings that are not numbers">
        <Panel className="p-4">
          <ActivityLegend
            less="Less"
            more="More"
            busiest={`busiest ${hours(busiestSeconds)}`}
            none="Nothing recorded"
            partial="Still open"
          />
        </Panel>
      </Row>

      <Row label="only the ramp, for a grid whose data has no gaps and nothing under way">
        <Panel className="p-4">
          <ActivityLegend less="Less" more="More" busiest={`busiest ${hours(busiestSeconds)}`} />
        </Panel>
      </Row>

      <Row label="without the ceiling - and this is what it costs">
        <Panel className="flex flex-col gap-2 p-4">
          <ActivityLegend less="Less" more="More" />
          <span className="text-xs text-dim">
            the same five shades, now reading as an absolute measure of a full day - which no grid here
            has an opinion about
          </span>
        </Panel>
      </Row>
    </>
  )
}

function ActivityHeatmapSection() {
  return (
    <>
      <Row label="a year, with weekends, a fortnight away in July, and the last week still open">
        <Panel className="flex flex-col gap-3 overflow-x-auto p-5">
          <ActivityHeatmap
            entries={year}
            from="2025-10-01"
            to="2026-09-30"
            busiest={busiestSeconds}
            size="sm"
            label={`A year of work, busiest day ${hours(busiestSeconds)}`}
            describe={describeCell}
            weekdayLabel={(day) => WEEKDAYS[day]}
          />
          <ActivityLegend
            less="Less"
            more="More"
            busiest={`busiest ${hours(busiestSeconds)}`}
            none="Nothing recorded"
            partial="Still open"
          />
        </Panel>
      </Row>

      <Row label="md, for a quarter - where there is room to hover a square">
        <Panel className="flex flex-col gap-3 overflow-x-auto p-5">
          <ActivityHeatmap
            entries={year}
            from="2026-07-01"
            to="2026-09-30"
            busiest={busiestSeconds}
            label={`A quarter of work, busiest day ${hours(busiestSeconds)}`}
            describe={describeCell}
            weekdayLabel={(day) => WEEKDAYS[day]}
          />
          <ActivityLegend less="Less" more="More" busiest={`busiest ${hours(busiestSeconds)}`} />
        </Panel>
      </Row>

      <Row label="the same quarter scaled to itself - every grid gets a darkest square, which is why busiest is stated">
        <Panel className="flex flex-col gap-3 overflow-x-auto p-5">
          <ActivityHeatmap
            entries={year}
            from="2026-07-01"
            to="2026-09-30"
            label="A quarter of work, scaled to itself"
            describe={describeCell}
            weekdayLabel={(day) => WEEKDAYS[day]}
          />
          <span className="text-xs text-dim">
            no <code>busiest</code> - the darkest square is this quarter&rsquo;s own best day, so it cannot
            be compared with the grid above
          </span>
        </Panel>
      </Row>

      <Row label="without a weekday column, because those words are the product's">
        <Panel className="flex flex-col gap-3 overflow-x-auto p-5">
          <ActivityHeatmap
            entries={year}
            from="2026-08-01"
            to="2026-09-30"
            busiest={busiestSeconds}
            label="Two months of work"
            describe={describeCell}
          />
        </Panel>
      </Row>
    </>
  )
}

function TrackSegmentsSection() {
  /* The two things the arithmetic does that are worth seeing as numbers: it
   * widens a sliver to the floor, and it refuses to widen one over the next. */
  const day = [
    { start: 0, end: 239 },
    { start: 239, end: 239.2 },
    { start: 239.2, end: 480 },
  ]
  const toScale = place(day, { from: 0, to: 480, minWidth: 0 })
  const floored = place(day, { from: 0, to: 480 })

  const crowded = [
    { start: 1000, end: 1001 },
    { start: 1003, end: 1004 },
  ]
  const placedCrowded = place(crowded, { from: 0, to: 10_000 })

  const show = (list: ReturnType<typeof place>) =>
    list.map((p) => `left ${p.left.toFixed(2)}%  width ${p.width.toFixed(2)}%${p.widened ? '  widened' : ''}`)

  return (
    <>
      <Row label="no markup - a twelve-second break, to scale and with the floor">
        <div className="flex flex-wrap gap-8">
          {[
            ['exactly to scale', show(toScale)],
            ['with the floor', show(floored)],
          ].map(([label, list]) => (
            <div key={label as string} className="flex flex-col gap-1">
              <div className="text-2xs uppercase tracking-caption text-faint">{label}</div>
              {(list as string[]).map((line) => (
                <div key={line} className="font-mono text-xs text-dim">
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Row>

      <Row label="two slivers three units apart - the floor is held back, so they cannot overlap">
        <div className="flex flex-col gap-1">
          {show(placedCrowded).map((line) => (
            <div key={line} className="font-mono text-xs text-dim">
              {line}
            </div>
          ))}
          <div className="font-mono text-xs text-faint">
            first ends at {(placedCrowded[0]!.left + placedCrowded[0]!.width).toFixed(2)}%, second starts at{' '}
            {placedCrowded[1]!.left.toFixed(2)}%
          </div>
        </div>
      </Row>

      <Row label="a marker outside the track is absent, not pinned to the edge">
        <div className="flex flex-col gap-1 font-mono text-xs text-dim">
          <div>markerAt(78, 0, 100) = {String(markerAt(78, 0, 100))}</div>
          <div>markerAt(240, 0, 480) = {String(markerAt(240, 0, 480))}</div>
          <div>markerAt(120, 0, 100) = {String(markerAt(120, 0, 100))}</div>
        </div>
      </Row>
    </>
  )
}

function TrackSection() {
  return (
    <>
      <Row label="spans - a working day, read against itself">
        <Panel className="flex w-96 flex-col gap-2 p-4">
          <Track segments={workingDay} from={0} to={480} label="Worked 7h 6m, two breaks of 45m and 9m" />
          <span className="font-mono text-[11px] text-faint tabular-nums">08:12 - 16:12</span>
        </Panel>
      </Row>

      <Row label="a twelve-second break: to scale it is 0.04% and invisible, with the floor it is 0.6%">
        <Panel className="flex w-96 flex-col gap-2 p-4 text-sm">
          <Track
            segments={[
              { key: 'am', start: 0, end: 239, tone: 'accent', label: 'Worked' },
              { key: 'blink', start: 239, end: 239.2, tone: 'idle', label: 'Break · 12s' },
              { key: 'pm', start: 239.2, end: 480, tone: 'accent', label: 'Worked' },
            ]}
            from={0}
            to={480}
            minWidth={0}
            label="A twelve-second break, drawn exactly to scale"
          />
          <span className="text-dim">
            to scale - the break is 0.04% of the day, which rounds to no pixels at all
          </span>
          <Track
            segments={[
              { key: 'am', start: 0, end: 239, tone: 'accent', label: 'Worked' },
              { key: 'blink', start: 239, end: 239.2, tone: 'idle', label: 'Break · 12s' },
              { key: 'pm', start: 239.2, end: 480, tone: 'accent', label: 'Worked' },
            ]}
            from={0}
            to={480}
            label="A twelve-second break, widened to stay visible"
          />
          <span className="text-dim">
            with the floor - the sliver is drawn at 0.6% and pushes the rest of the day along; the
            bar still ends exactly at its own edge
          </span>
        </Panel>
      </Row>

      <Row label="thresholds - the tiers, with the score standing among them">
        <Panel className="flex w-96 flex-col gap-4 p-4">
          {[71, 82, 24].map((score) => (
            <span key={score} className="flex flex-col gap-1">
              <span className="flex items-baseline justify-between">
                <span className="font-mono text-sm tabular-nums">{score.toFixed(1)}</span>
                <span className="text-xs text-dim">
                  {score >= 78 ? 'Clip' : score >= 62 ? 'Good' : score >= 40 ? 'Keep' : 'Draft'}
                </span>
              </span>
              <Track
                segments={tierSegments(score)}
                from={0}
                to={100}
                marker={score}
                size="sm"
                divided
                label={`Score ${score}, among four tiers`}
              />
              <TrackScale>
                {tiers.map((tier) => (
                  <span key={tier.key}>{tier.label}</span>
                ))}
              </TrackScale>
            </span>
          ))}
        </Panel>
      </Row>

      <Row label="an empty track is a bar with nothing in it - not an absent bar">
        <Panel className="flex w-96 flex-col gap-2 p-4 text-sm">
          <Track segments={[]} label="Nothing recorded for this day" />
          <span className="text-dim">
            nothing recorded - an absent bar would read as "no such day" rather than "nothing in it"
          </span>
        </Panel>
      </Row>
    </>
  )
}

const scoreHistory = [18, 34, 30, 57, 71, 82]

function SparklineSection() {
  return (
    <>
      <Row label="beside a total - the shape, with the figure it belongs to">
        <Panel className="flex flex-wrap items-center gap-3 p-4">
          <span className="font-mono text-[22px] font-semibold tabular-nums">82.0</span>
          <Badge variant="accent">Clip</Badge>
          <Sparkline values={scoreHistory} max={100} label="Score, 18 to 82 over six versions" />
        </Panel>
      </Row>

      <Row label="sm, beside a row - a line per axis of a rubric">
        <Panel className="flex w-80 flex-col gap-2 p-4 text-sm">
          {[
            { axis: 'Craft', line: [3, 3, 4, 4], scale: 5, now: 4 },
            { axis: 'Voice', line: [2, 3, 3, 5], scale: 5, now: 5 },
            { axis: 'Shape', line: [4, 4, 3, 3], scale: 5, now: 3 },
          ].map(({ axis, line, scale, now }) => (
            <span key={axis} className="flex items-center justify-between gap-3">
              <span className="text-dim">{axis}</span>
              <span className="flex items-center gap-2">
                <Sparkline
                  values={line}
                  max={scale}
                  size="sm"
                  label={`${axis}, ${line[0]} to ${line.at(-1)} over four versions`}
                />
                <span className="w-6 text-right font-mono text-[13px] text-dim tabular-nums">{now}</span>
              </span>
            </span>
          ))}
        </Panel>
      </Row>

      <Row label="the same two values against a stated ceiling, and against their own range">
        <Panel className="flex flex-wrap items-center gap-6 p-4 text-sm">
          <span className="flex items-center gap-3">
            <Sparkline values={[61, 63]} max={100} label="Score, 61 to 63, against a ceiling of 100" />
            <span className="text-dim">
              <code className="text-xs">max=100</code> — the small change it was
            </span>
          </span>
          <span className="flex items-center gap-3">
            <Sparkline values={[61, 63]} label="Score, 61 to 63, scaled to its own range" />
            <span className="text-dim">
              no <code className="text-xs">max</code> — the same two numbers, read as a climb
            </span>
          </span>
        </Panel>
      </Row>

      <Row label="up and down are drawn identically - the line reports, it does not judge">
        <Panel className="flex flex-wrap items-center gap-6 p-4 text-sm">
          <span className="flex items-center gap-3">
            <Sparkline values={[20, 45, 70, 90]} max={100} label="Rising, 20 to 90" />
            <span className="text-dim">rising</span>
          </span>
          <span className="flex items-center gap-3">
            <Sparkline values={[90, 70, 45, 20]} max={100} label="Falling, 90 to 20" />
            <span className="text-dim">falling — and for time-to-answer this is the good news</span>
          </span>
        </Panel>
      </Row>

      <Row label="tone, for a caller who does know what the direction means">
        <Panel className="flex flex-wrap items-center gap-6 p-4 text-sm">
          <span className="flex items-center gap-3">
            <Sparkline values={[40, 55, 52, 78]} max={100} tone="accent" label="Accent, 40 to 78" />
            <span className="text-dim">accent — the line is the subject</span>
          </span>
          <span className="flex items-center gap-3">
            <Sparkline values={[40, 55, 52, 78]} max={100} tone="good" label="Good, 40 to 78" />
            <span className="text-dim">good</span>
          </span>
          <span className="flex items-center gap-3">
            <Sparkline values={[78, 52, 55, 40]} max={100} tone="bad" label="Bad, 78 to 40" />
            <span className="text-dim">bad</span>
          </span>
        </Panel>
      </Row>

      <Row label="fewer than two points draws nothing - there is no history to show">
        <Panel className="flex items-center gap-3 p-4 text-sm">
          <Sparkline values={[82]} max={100} label="One version only" />
          <span className="text-dim">one value, and nothing is drawn beside this text</span>
        </Panel>
      </Row>
    </>
  )
}

function StatTileSection() {
  return (
    <>
      <Row label="a row of figures, one of them the panel's own">
        <Panel className="p-5">
          <StatRow>
            <StatTile label="Worked" value="32h 10m" tone="accent" />
            <StatTile label="Paused" value="3h 04m" />
            <StatTile label="Days recorded" value="5" />
          </StatRow>
        </Panel>
      </Row>

      <Row label="movement underneath, and its tone said rather than read off the sign">
        <Panel className="p-5">
          <StatRow>
            <StatTile
              label="Worked"
              value="32h 10m"
              tone="accent"
              delta="+2h 40m vs last week"
              deltaTone="good"
            />
            {/* Down is the good direction here, which no component could guess. */}
            <StatTile
              label="Time to answer"
              value="2m 10s"
              delta="-30s vs last week"
              deltaTone="good"
            />
            <StatTile label="Silent" value="3" tone="warn" delta="1 more than yesterday" deltaTone="bad" />
          </StatRow>
        </Panel>
      </Row>

      <Row label="a figure that is itself the problem - warn, then bad">
        <Panel className="p-5">
          <StatRow>
            <StatTile label="Queue" value="128" tone="warn" />
            <StatTile label="Failed" value="4" tone="bad" />
          </StatRow>
        </Panel>
      </Row>

      <Row label="lg, for a figure that leads a page rather than sitting in a row of six">
        <Panel className="p-5">
          <StatTile label="Recorded this month" value="147h 26m" tone="accent" size="lg" delta="+9h vs August" deltaTone="good" />
        </Panel>
      </Row>

      <Row label="a delta of zero is drawn - it says the figure was measured and did not move">
        <Panel className="p-5">
          <StatRow>
            {/* The point of the example is that `0` survives: a truthiness
                guard would swallow it and the line would vanish, which reads
                as "not measured" rather than "did not move". So the delta has
                to say that in words - a bare `0` under the figure demonstrates
                nothing, and looks like a stray digit. */}
            <StatTile label="Open days" value="0" delta="0 change from last week" />
            {/* And the bare numeric zero, which is what the guard in the
                component is actually about: `{delta && …}` would drop this
                line entirely. */}
            <StatTile label="Reopened" value="2" delta={0} />
            {/* Nothing to compare against, so nothing is said at all. Put
                beside it, because the pair is the demonstration: one tile has
                a second line, the other has none. */}
            <StatTile label="People" value="14" />
          </StatRow>
        </Panel>
      </Row>
    </>
  )
}

function TreeRowsSection() {
  /* The same tree, flattened twice: the sums that decide what a TreeView draws
   * and what a VirtualList would have to window. Shown as text, because there
   * is no markup here - the module is the arithmetic. */
  const closed = visibleRows(tree, new Set())
  const open = visibleRows(tree, new Set(['src', 'ui', 'docs']))

  return (
    <>
      {[
        ['closed', closed],
        ["open: src, ui, docs", open],
      ].map(([label, rows]) => (
        <Row key={label as string} label={`${label} - ${(rows as unknown[]).length} rows`}>
          <div className="flex flex-col gap-1 font-mono text-xs">
            {(rows as ReturnType<typeof visibleRows>).map(({ node, depth, parent }) => (
              <div key={node.id} className="flex items-baseline gap-2">
                <span className="text-dim" style={{ paddingLeft: `${depth * 12}px` }}>
                  {String(node.label)}
                </span>
                <span className="text-faint">
                  depth {depth}
                  {parent ? ` · in ${parent}` : ' · at the root'}
                </span>
              </div>
            ))}
          </div>
        </Row>
      ))}
    </>
  )
}


/*
 * Demo data for the text-and-code block.
 *
 * Synthetic throughout, like everything on the stand: a path here that came
 * off this machine would ship to the docs site.
 */
const sampleConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The stand is its own app, not a page of the docs site.
export default defineConfig({
  base: '/dowel/stand/',
  plugins: [react()],
  build: {
    outDir: '../docs/public/stand',
    emptyOutDir: true,
  },
})
`

/* What a highlighter hands back, written out by hand: one array per line, each
 * a list of `{ text, kind }`. Twelve lines is enough to show all eight kinds
 * without pretending this file ships a parser. */
const highlighted = [
  [
    { text: 'export', kind: 'keyword' as const },
    { text: ' ' },
    { text: 'function', kind: 'keyword' as const },
    { text: ' ' },
    { text: 'boundsOf', kind: 'name' as const },
    { text: '(', kind: 'punctuation' as const },
    { text: 'points', kind: 'name' as const },
    { text: ': ', kind: 'punctuation' as const },
    { text: 'Point', kind: 'type' as const },
    { text: '[])', kind: 'punctuation' as const },
    { text: ' {', kind: 'punctuation' as const },
  ],
  [
    { text: '  ' },
    { text: '// A level is not a sum: the floor is not zero.', kind: 'comment' as const },
  ],
  [
    { text: '  ' },
    { text: 'const', kind: 'keyword' as const },
    { text: ' ' },
    { text: 'seen', kind: 'name' as const },
    { text: ' = ', kind: 'punctuation' as const },
    { text: 'points', kind: 'name' as const },
    { text: '.', kind: 'punctuation' as const },
    { text: 'filter', kind: 'name' as const },
    { text: '(', kind: 'punctuation' as const },
    { text: 'taken', kind: 'name' as const },
    { text: ')', kind: 'punctuation' as const },
  ],
  [
    { text: '  ' },
    { text: 'if', kind: 'keyword' as const },
    { text: ' (', kind: 'punctuation' as const },
    { text: 'seen', kind: 'name' as const },
    { text: '.', kind: 'punctuation' as const },
    { text: 'length', kind: 'name' as const },
    { text: ' === ', kind: 'punctuation' as const },
    { text: '0', kind: 'number' as const },
    { text: ') ', kind: 'punctuation' as const },
    { text: 'return', kind: 'keyword' as const },
    { text: ' ' },
    { text: 'null', kind: 'keyword' as const },
  ],
  [],
  [
    { text: '  ' },
    { text: '@measured', kind: 'meta' as const },
  ],
  [
    { text: '  ' },
    { text: 'return', kind: 'keyword' as const },
    { text: ' { ', kind: 'punctuation' as const },
    { text: 'label', kind: 'name' as const },
    { text: ': ', kind: 'punctuation' as const },
    { text: "'balance'", kind: 'string' as const },
    { text: ', ', kind: 'punctuation' as const },
    { text: 'min', kind: 'name' as const },
    { text: ': ', kind: 'punctuation' as const },
    { text: '4900', kind: 'number' as const },
    { text: ' }', kind: 'punctuation' as const },
  ],
  [{ text: '}', kind: 'punctuation' as const }],
]

/*
 * Rendered markdown, as HTML rather than as JSX.
 *
 * Written as a string and handed to `dangerouslySetInnerHTML` on purpose: the
 * whole point of `prose.css` is the case where a product does NOT author the
 * markup - it comes out of `marked`, out of a CMS, out of a model - and JSX
 * here would be the one shape the stylesheet never has to face.
 *
 * Every tag a markdown renderer emits is in it, so a selector that stopped
 * matching shows up as one element drawn in the browser's default rather than
 * as nothing at all.
 */
const renderedMarkdown = `
<h1>A quantity over time</h1>
<p>A <strong>line chart</strong> says the value <em>existed the whole time</em>
and was sampled - a balance, a price, a temperature. Drawing a sum as a line
claims readings nobody took. See <a href="#line-chart">LineChart</a>, or the
<code>boundsOf</code> helper beside it.</p>
<h2>What a hole means</h2>
<blockquote>Interpolating across a gap invents a reading; closing it up moves
every later point. Both are quieter than the truth.</blockquote>
<ul>
  <li>A run of one point is still a measurement.</li>
  <li>The floor is not zero unless the caller says so.
    <ul><li>For a count, state <code>min: 0</code>.</li></ul>
  </li>
</ul>
<h3>Ticks</h3>
<ol>
  <li>Round numbers, not the range cut into equal parts.</li>
  <li>A range too narrow gets none rather than invented ones.</li>
</ol>
<pre><code>const bounds = boundsOf(points, { min: 0 })
runs(points, bounds)      // the drawable stretches
ticksFor(bounds, 4)       // [0, 10, 20, 30]</code></pre>
<table>
  <thead><tr><th>Token</th><th>What it carries</th></tr></thead>
  <tbody>
    <tr><td><code>--series-*</code></td><td>Identity: which line is which</td></tr>
    <tr><td><code>--heat-*</code></td><td>Magnitude, in five steps</td></tr>
    <tr><td><code>--syntax-*</code></td><td>The eight kinds in a piece of code</td></tr>
  </tbody>
</table>
<h4>A heading below the scale</h4>
<p>Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to open the palette. A value that is
<s>no longer true</s> is struck through, and <mark>this is marked</mark>.</p>
<hr>
<dl>
  <dt>Sequential</dt><dd>A continuous magnitude, read as more and less.</dd>
  <dt>Ordinal</dt><dd>Steps told apart at a glance and counted against a legend.</dd>
</dl>
<p>A footnote hangs here.<sup><a href="#fn1">1</a></sup></p>
<section class="footnotes"><p id="fn1">1. Smaller and dimmer, because a
footnote at the weight of the text interrupts the sentence carrying it.</p></section>
`

function ProseSection() {
  return (
    <>
      <Row label="rendered markdown - every tag a renderer emits, through one class">
        <div className="rounded-lg border border-line bg-raise p-5">
          <div className="prose" dangerouslySetInnerHTML={{ __html: renderedMarkdown }} />
        </div>
      </Row>

      <Row label="prose-tight in a bubble - the same rules, rhythm compressed, measure given up">
        <div className="w-[22rem] rounded-lg border border-line bg-raise p-3">
          <div
            className="prose prose-tight"
            dangerouslySetInnerHTML={{
              __html: `<h2>What changed</h2><p>The floor is <strong>not zero</strong>
              unless you say so - see <code>bounds</code>.</p>
              <ul><li>A hole breaks the line.</li><li>Ticks land on round numbers.</li></ul>`,
            }}
          />
        </div>
      </Row>

      <Row label="the measure - prose is capped in characters, whatever the container gives it">
        <div className="w-full rounded-lg border border-line bg-raise p-5">
          <div
            className="prose"
            dangerouslySetInnerHTML={{
              __html: `<p>This paragraph sits in a container as wide as the stand,
              and stops at 68 characters anyway. Prose across a wide window is
              unreadable: the eye loses the line it is returning from, and the
              limit is stated in the unit it is actually about.</p>`,
            }}
          />
        </div>
      </Row>
    </>
  )
}

function CodeBlockSection() {
  return (
    <>
      <Row label="a command - no colour at all, which is the default and is usually right">
        <CodeBlock
          className="w-[34rem]"
          code="npx shadcn@latest add https://lacodda.github.io/dowel/r/code-block.json"
          wrap
          copyLabel="Copy the command"
          copiedLabel="Copied"
        />
      </Row>

      <Row label="a file: a caption, numbers from where it was lifted, and two lines marked">
        <CodeBlock
          className="w-[34rem]"
          code={sampleConfig}
          caption="vite.config.ts"
          numbered
          firstLine={1}
          highlight={[4, 5]}
          copyLabel="Copy the file"
          copiedLabel="Copied"
        />
      </Row>

      <Row label="coloured by a highlighter - the eight kinds, drawn in the syntax tokens">
        <CodeBlock
          className="w-[34rem]"
          code={'export function boundsOf(points: Point[]) {\n  // ...\n}'}
          tokens={highlighted}
          caption="line-scale.ts"
          numbered
          copyLabel="Copy the source"
          copiedLabel="Copied"
        />
      </Row>

      <Row label="sm, and a long value told to wrap rather than scroll for ever">
        <CodeBlock
          className="w-[34rem]"
          size="sm"
          wrap
          caption="the token, which is not really code"
          code="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vIiwibmFtZSI6IkEgU3RhbmQiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        />
      </Row>
    </>
  )
}

function CopyButtonSection() {
  const [last, setLast] = useState<string>('nothing yet')

  return (
    <>
      <Row label="in the corner of a block - hover the panel, not the button, and Tab reaches it too">
        <div className="group relative w-[22rem] rounded-md border border-line bg-soft p-3">
          <p className="pr-8 font-mono text-xs text-dim">
            a4f19c2e-77b0-4c31-9a2e-1f0b3d5c8e44
          </p>
          <CopyButton
            value="a4f19c2e-77b0-4c31-9a2e-1f0b3d5c8e44"
            label="Copy the identifier"
            copiedLabel="Copied"
            onCopy={(ok) => setLast(ok ? 'the clipboard took it' : 'the clipboard refused')}
            className="absolute right-2 top-2"
          />
        </div>
      </Row>

      <Row label="what the product is told - a refusal is reported rather than swallowed">
        <span className="text-xs text-dim">{last}</span>
      </Row>
    </>
  )
}

/* Two drafts of the same verse: one line rewritten, one inserted, one removed.
 * Short enough to read at a glance and long enough to show the alignment. */
const draftBefore = `The wire hums where the road gives out,
a kettle somewhere, a door.
Nobody counts the hours here.
We keep what we can carry.`

const draftAfter = `The wire hums where the road gives out,
a kettle somewhere, a door ajar.
The light stays on in the hallway.
Nobody counts the hours here.
We keep what we can carry.`

function DiffViewSection() {
  return (
    <>
      <Row label="two drafts - one line rewritten (~), one inserted (+), and the rest standing still">
        <div className="w-[52rem]">
          <DiffView
            before={draftBefore}
            after={draftAfter}
            beforeLabel="Draft 3"
            afterLabel="Draft 4"
            summary={({ added, removed }) => `${added} lines in, ${removed} out`}
            copyLabel={(side) => `Copy ${side}`}
            copiedLabel="Copied"
          />
        </div>
      </Row>

      <Row label="the same comparison in a side panel - the after line under the before one, never dropped">
        <div className="w-[22rem]">
          <DiffView
            before={draftBefore}
            after={draftAfter}
            beforeLabel="Draft 3"
            afterLabel="Draft 4"
            size="sm"
          />
        </div>
      </Row>

      <Row label="nothing moved - no markers, no tint, and the summary says so">
        <div className="w-[52rem]">
          <DiffView
            before={draftBefore}
            after={draftBefore}
            beforeLabel="Draft 3"
            afterLabel="Draft 3, again"
            summary={({ added, removed }) =>
              added === 0 && removed === 0 ? 'identical' : `${added} in, ${removed} out`
            }
          />
        </div>
      </Row>
    </>
  )
}

function DiffLinesSection() {
  const changes = diffLines(draftBefore, draftAfter)
  const paired = diffRows(changes)
  const counts = countChanges(changes)

  return (
    <>
      <Row label="the changes, in order - what the comparison is built from">
        <div className="w-[52rem] font-mono text-xs leading-relaxed text-dim">
          {changes.map((change, at) => (
            <div key={at}>
              <span className="text-faint">{change.kind.padEnd(8)}</span>
              {change.text === '' ? '\u00a0' : change.text}
            </div>
          ))}
        </div>
      </Row>

      <Row label="paired into rows - one object with two sides, which is what keeps two columns in step">
        <div className="w-[52rem] font-mono text-xs leading-relaxed text-dim">
          {paired.map((row, at) => (
            <div key={at}>
              <span className="text-faint">
                {String(row.beforeLine ?? '-').padStart(2)} {String(row.afterLine ?? '-').padStart(2)}{' '}
              </span>
              <span className={row.before === null ? 'text-faint' : undefined}>
                {(row.before ?? '(nothing)').slice(0, 22).padEnd(24)}
              </span>
              <span className={row.after === null ? 'text-faint' : undefined}>
                {(row.after ?? '(nothing)').slice(0, 22)}
              </span>
            </div>
          ))}
        </div>
      </Row>

      <Row label="the counts, for a product that wants the number without the comparison">
        <span className="font-mono text-xs text-dim">
          {counts.added} added, {counts.removed} removed
        </span>
      </Row>
    </>
  )
}

/* A payload with the shapes a viewer has to survive: a large array nobody
 * opened, a number that arrived as a string, a present null, an empty object. */
const payload = {
  event: 'release.published',
  version: '0.25.0',
  retries: 0,
  'user name': 'a stand',
  draft: false,
  published_at: null,
  meta: {},
  totals: { primitives: '76', tests: 2361 },
  assets: Array.from({ length: 1204 }, (_, at) => ({
    name: `asset-${at}.svg`,
    bytes: 1024 + at,
  })),
}

function JsonViewerSection() {
  const [touched, setTouched] = useState('nothing yet')

  return (
    <>
      <Row label="a payload - what fits arrives open, and a 1204-entry array costs one row until asked">
        <JsonViewer
          value={payload}
          label="A webhook payload"
          className="max-h-96 w-[34rem]"
          onActivate={(row) => setTouched(row.path)}
        />
      </Row>

      <Row label="the path of the last row touched - what 'copy this path' hangs on">
        <span className="font-mono text-xs text-dim">{touched}</span>
      </Row>

      <Row label="a number that arrived as a string, beside a real one, and a present null">
        <JsonViewer
          value={{ totals: { primitives: '76', tests: 2361 }, published_at: null }}
          label="Quoted and unquoted"
          className="w-[34rem]"
        />
      </Row>

      <Row label="nothing but a value - a viewer of one leaf is still a viewer">
        <JsonViewer value={null} label="A null" className="w-[34rem]" />
      </Row>
    </>
  )
}

function JsonRowsSection() {
  const open = branchPaths(payload, { depth: 2 })
  const rows = jsonRows(payload, open)

  return (
    <>
      <Row label="the rows a document flattens into - path, depth, and what it is">
        <div className="max-h-96 w-[52rem] overflow-auto font-mono text-xs leading-relaxed text-dim">
          {rows.map((row) => (
            <div key={row.path}>
              <span className="text-faint">{String(row.depth)} </span>
              <span>{row.path.padEnd(28)}</span>
              <span className="text-faint">{row.kind.padEnd(9)}</span>
              <span className="text-faint">{row.size === undefined ? '' : `(${row.size})`}</span>
            </div>
          ))}
        </div>
      </Row>

      <Row label="a key dot notation would break, written so the path still resolves">
        <div className="w-[52rem] font-mono text-xs text-dim">
          {jsonRows({ 'user name': 1, 'a.b': 2 }, new Set(['$'])).map((row) => (
            <div key={row.path}>{row.path}</div>
          ))}
        </div>
      </Row>

      <Row label="how many branches 'expand all' would open, at each bound">
        <span className="font-mono text-xs text-dim">
          {[1, 2, 3, 9]
            .map((depth) => `depth ${depth}: ${branchPaths(payload, { depth }).size}`)
            .join('  ·  ')}
        </span>
      </Row>
    </>
  )
}

function SkeletonSection() {
  return (
    <>
      <Row label="a paragraph - ragged widths, so it reads as text and not as a loading bar">
        <SkeletonText lines={4} className="w-96" />
      </Row>

      <Row label="a list, which is what most screens are waiting for">
        <SkeletonList rows={4} className="w-96 rounded-md border border-line" />
      </Row>

      <Row label="a grid: the cells and the columns are the caller's, and so is their shape">
        <SkeletonGrid cells={8} columns={4} className="w-96" />
        <SkeletonGrid cells={3} columns={3} cellClassName="aspect-video" className="w-64" />
      </Row>

      <Row label="one block, sized by the thing it stands in for">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="size-9 rounded-full" />
        <Skeleton className="h-24 w-64" />
      </Row>
    </>
  )
}

function EmptyStateSection() {
  return (
    <>
      <Row label="nothing here yet, and the one thing worth doing about it">
        <EmptyState
          className="w-96"
          title="No works yet"
          body="Everything you start will show up here."
          action={<Button variant="primary">New work</Button>}
        />
      </Row>

      <Row label="plenty here, none of it matching - the way out is a wider filter">
        <EmptyState
          className="w-96"
          variant="filtered"
          title="Nothing matches"
          body="Three filters are on. Clearing the tier would show 42 works."
          action={<Button variant="ghost">Clear filters</Button>}
        />
      </Row>

      <Row label="nothing is missing - something failed, and the way out is to retry">
        <EmptyState
          className="w-96"
          variant="error"
          title="Could not load"
          body="The server did not answer."
          action={<Button variant="ghost">Try again</Button>}
        />
      </Row>
    </>
  )
}

function ProgressSection() {
  const [value, setValue] = useState(35)

  return (
    <>
      <Row label="a known fraction - the number is shown because there is one">
        <div className="w-96">
          <Progress value={value} label="Uploading">
            Uploading
          </Progress>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setValue((v) => Math.min(100, v + 15))}>
          Advance
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setValue(35)}>
          Reset
        </Button>
      </Row>

      <Row label="not known - it says so, rather than creeping to 90% and waiting">
        <div className="w-96">
          <Progress label="Working">Working</Progress>
        </div>
      </Row>

      <Row label="the tones, and the thin size for a bar under something else">
        <div className="flex w-96 flex-col gap-3">
          <Progress value={70} tone="good" size="sm" label="Good" />
          <Progress value={45} tone="warn" size="sm" label="Warn" />
          <Progress value={20} tone="bad" size="sm" label="Bad" />
        </div>
      </Row>
    </>
  )
}

function QueryStateSection() {
  const [state, setState] = useState<'pending' | 'error' | 'empty' | 'ready'>('pending')

  return (
    <>
      <Row label="the same ladder every list writes - press through it">
        <div className="flex gap-2">
          {(['pending', 'error', 'empty', 'ready'] as const).map((next) => (
            <Button
              key={next}
              variant={state === next ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setState(next)}
            >
              {next}
            </Button>
          ))}
        </div>
      </Row>

      <Row label="pending, then failed, then nothing found, then the content">
        <div className="w-96 rounded-md border border-line p-2">
          <QueryState
            pending={state === 'pending'}
            error={state === 'error' ? { message: 'The server did not answer.' } : null}
            empty={state === 'empty'}
            errorLabels={{ title: 'Could not load' }}
            emptyState={<EmptyState title="No works yet" body="Everything you start shows here." />}
          >
            <KeyValue>
              <KeyValueRow label="Title">Harbour lights</KeyValueRow>
              <KeyValueRow label="Owner">Ines</KeyValueRow>
              <KeyValueRow label="Words">
                <NumberFormat value={4120} />
              </KeyValueRow>
            </KeyValue>
          </QueryState>
        </div>
      </Row>
    </>
  )
}

const boundaryLabels = {
  title: 'Something went wrong',
  body: 'This part of the screen could not be drawn.',
  details: 'Details',
  retry: 'Try again',
}

function Thrower({ failing }: { failing: boolean }) {
  if (failing) throw new Error('A component below this one threw while rendering.')
  return <p className="text-sm text-dim">Nothing is wrong here.</p>
}

function ErrorBoundarySection() {
  const [failing, setFailing] = useState(false)
  /* The key is what clears a caught error. Bumping it is what a router does on
   * navigation - and without it the screen would stay crashed after the cause
   * is gone. */
  const [attempt, setAttempt] = useState(0)

  return (
    <>
      <Row label="break it, then let it recover - retry inside, or a changed key from outside">
        <Button variant="ghost" size="sm" onClick={() => setFailing((f) => !f)}>
          {failing ? 'Stop throwing' : 'Throw'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setAttempt((a) => a + 1)}>
          Change the reset key
        </Button>
      </Row>

      <Row label="the default screen: the message is kept, folded, for whoever files it">
        <div className="w-full">
          <ErrorBoundary labels={boundaryLabels} resetKey={attempt}>
            <Thrower failing={failing} />
          </ErrorBoundary>
        </div>
      </Row>
    </>
  )
}
