import type { ReactNode } from 'react'
import { ButtonSection } from './sections/button'
import { InputSection } from './sections/input'
import { TextareaSection } from './sections/textarea'
import { MarkedTextSection } from './sections/marked-text'
import { FieldSection } from './sections/field'
import { InlineFieldSection } from './sections/inline-field'
import { FieldDraftSection } from './sections/field-draft'
import {
  SchemaCheckSection,
  SchemaFieldsSection,
  SchemaShapeSection,
} from './sections/schema-fields'
import { CheckboxSection } from './sections/checkbox'
import { RadioGroupSection } from './sections/radio-group'
import { SwitchSection } from './sections/switch'
import { NumberFieldSection } from './sections/number-field'
import { SliderSection } from './sections/slider'
import { RatingScaleSection } from './sections/rating-scale'
import { DurationFieldSection } from './sections/duration-field'
import { PasswordFieldSection } from './sections/password-field'
import { CalendarMathSection } from './sections/calendar-math'
import { CalendarSection } from './sections/calendar'
import { DatePickerSection } from './sections/date-picker'
import { DateRangePickerSection } from './sections/date-range-picker'
import { TimeFieldSection } from './sections/time-field'
import { BigCalendarItemSection, BigCalendarSection } from './sections/big-calendar'
import { PanelSection } from './sections/panel'
import { BadgeSection } from './sections/badge'
import { ChipSection } from './sections/chip'
import { SegmentedControlSection } from './sections/segmented-control'
import { KbdSection } from './sections/kbd'
import { SpinnerSection } from './sections/spinner'
import { TruncateSection } from './sections/truncate'
import { CopyableSection } from './sections/copyable'
import { DialogSection } from './sections/dialog'
import { ConfirmDialogSection } from './sections/confirm-dialog'
import { DrawerSection } from './sections/drawer'
import { LayerSection } from './sections/layer'
import { PopoverSection } from './sections/popover'
import { PreviewCardSection } from './sections/preview-card'
import { TooltipSection } from './sections/tooltip'
import { MenuSection } from './sections/menu'
import { ContextMenuSection } from './sections/context-menu'
import { SelectSection } from './sections/select'
import { ComboboxSection } from './sections/combobox'
import { SearchFieldSection } from './sections/search-field'
import { CommandPaletteSection } from './sections/command-palette'
import { ShortcutsDialogSection } from './sections/shortcuts-dialog'
import { CommandsSection } from './sections/commands'
import { ShortcutSection } from './sections/shortcut'
import { ToastSection } from './sections/toast'
import { AlertSection } from './sections/alert'
import { BannerSection } from './sections/banner'
import { TagInputSection } from './sections/tag-input'
import { FileDropSection } from './sections/file-drop'
import { ColorFieldSection } from './sections/color-field'
import { ActionBarSection } from './sections/action-bar'
import { SaveStateSection } from './sections/save-state'
import { TableSection, TableSortSection } from './sections/table'
import { ColumnResizeHandleSection } from './sections/column-resize-handle'
import { ReorderableListSection } from './sections/reorderable-list'
import { FilterPopoverSection } from './sections/filter-popover'
import { PaginationSection } from './sections/pagination'
import { PageSizeSection } from './sections/page-size'
import { NumberFormatSection } from './sections/number-format'
import { RelativeTimeSection } from './sections/relative-time'
import { VirtualListSection } from './sections/virtual-list'
import { TreeRowsSection, TreeViewSection } from './sections/tree-view'
import { KeyValueSection } from './sections/key-value'
import { ListRowSection } from './sections/list-row'
import { TileButtonSection } from './sections/tile-button'
import { VirtualGridSection } from './sections/virtual-grid'
import { StatTileSection } from './sections/stat-tile'
import { SparklineSection } from './sections/sparkline'
import { TrackSection, TrackSegmentsSection } from './sections/track'
import {
  ActivityHeatmapSection,
  ActivityLegendSection,
  ActivityWeeksSection,
} from './sections/activity-heatmap'
import { BarChartSection } from './sections/bar-chart'
import { LineChartSection, LineScaleSection } from './sections/line-chart'
import { ProseSection } from './sections/prose'
import { CodeBlockSection } from './sections/code-block'
import { CopyButtonSection } from './sections/copy-button'
import { DiffLinesSection, DiffViewSection } from './sections/diff-view'
import { JsonRowsSection, JsonViewerSection } from './sections/json-viewer'
import { SkeletonSection } from './sections/skeleton'
import { EmptyStateSection } from './sections/empty-state'
import { ProgressSection } from './sections/progress'
import { QueryStateSection } from './sections/query-state'
import { ErrorBoundarySection } from './sections/error-boundary'
import { AppShellSection } from './sections/app-shell'
import { NavRailSection } from './sections/nav-rail'
import { PageHeaderSection } from './sections/page-header'
import { BreadcrumbsSection } from './sections/breadcrumbs'
import { DividerSection } from './sections/divider'
import { SectionNavSection } from './sections/section-nav'
import { NotificationBellSection } from './sections/notification-bell'
import { TabsSection } from './sections/tabs'
import { CollapsibleSection } from './sections/collapsible'
import { AccordionSection } from './sections/accordion'
import { ScrollAreaSection } from './sections/scroll-area'
import { SplitterSection } from './sections/splitter'
import { FrameSection } from './sections/frame'
import { ImageSection } from './sections/image'
import { StepperSection } from './sections/stepper'
import { WizardSection } from './sections/wizard'
import { ProductMarkSection } from './sections/product-mark'
import { AboutPlateSection } from './sections/about-plate'
import { ProductSwitcherSection } from './sections/product-switcher'
import { WindowFrameSection } from './sections/window-frame'
import { SplashSection } from './sections/splash'
import { AvatarSection } from './sections/avatar'
import { StatusDotSection } from './sections/status-dot'
import { TierSection } from './sections/tier'
import { TimelineSection } from './sections/timeline'
import { SkeletonOfSection } from './sections/skeleton-of'
import { ListDetailScreenSection } from './sections/list-detail-screen'
import { SettingsScreenSection } from './sections/settings-screen'
import { LoginScreenSection } from './sections/login-screen'
import { EmptyDashboardScreenSection } from './sections/empty-dashboard-screen'

/** One section of the stand, and one page of it. */
export interface Section {
  /** The path the section is at, and the name of its page in the documentation. */
  id: string
  title: string
  /** Not a component: code with no markup, or a screen made of components. */
  kind?: 'utility' | 'block'
  render: () => ReactNode
}

/** Where a section's page is: a block's with the blocks, the rest with the
 * components. Read off the id, so the link cannot name another page. */
export function docsOf(section: Section): string {
  return `/dowel/${section.kind === 'block' ? 'blocks' : 'components'}/${section.id}/`
}

/* The sections of the stand: one per component, in the order a screen is
 * built. Each new component adds an entry here.
 *
 * Some of them are not components at all - `calendar-math` is pure date
 * arithmetic with no React in it, `Shortcut` is a notation and `Commands` a
 * list with hooks into it - and they are marked `utility` so the navigation
 * can say so. They were previously mixed
 * into the same list under names in two different styles, which left a reader
 * to guess why one entry was lowercase; the answer was never "for no reason",
 * but the list gave no way to tell. */
export const sections: Section[] = [
  { id: 'button', title: 'Button', render: () => <ButtonSection /> },
  { id: 'input', title: 'Input', render: () => <InputSection /> },
  { id: 'textarea', title: 'Textarea', render: () => <TextareaSection /> },
  { id: 'marked-text', title: 'MarkedText', render: () => <MarkedTextSection /> },
  { id: 'field', title: 'Field', render: () => <FieldSection /> },
  { id: 'inline-field', title: 'InlineField', render: () => <InlineFieldSection /> },
  { id: 'field-draft', title: 'useFieldDraft', kind: 'utility', render: () => <FieldDraftSection /> },
  { id: 'schema-fields', title: 'SchemaFields', render: () => <SchemaFieldsSection /> },
  { id: 'schema-shape', title: 'schema-shape', kind: 'utility', render: () => <SchemaShapeSection /> },
  { id: 'schema-check', title: 'schema-check', kind: 'utility', render: () => <SchemaCheckSection /> },
  { id: 'checkbox', title: 'Checkbox', render: () => <CheckboxSection /> },
  { id: 'radio-group', title: 'RadioGroup', render: () => <RadioGroupSection /> },
  { id: 'switch', title: 'Switch', render: () => <SwitchSection /> },
  { id: 'number-field', title: 'NumberField', render: () => <NumberFieldSection /> },
  { id: 'slider', title: 'Slider', render: () => <SliderSection /> },
  { id: 'rating-scale', title: 'RatingScale', render: () => <RatingScaleSection /> },
  { id: 'duration-field', title: 'DurationField', render: () => <DurationFieldSection /> },
  { id: 'password-field', title: 'PasswordField', render: () => <PasswordFieldSection /> },
  { id: 'calendar-math', title: 'calendar-math', kind: 'utility', render: () => <CalendarMathSection /> },
  { id: 'calendar', title: 'Calendar', render: () => <CalendarSection /> },
  { id: 'date-picker', title: 'DatePicker', render: () => <DatePickerSection /> },
  { id: 'date-range-picker', title: 'DateRangePicker', render: () => <DateRangePickerSection /> },
  { id: 'time-field', title: 'TimeField', render: () => <TimeFieldSection /> },
  { id: 'big-calendar', title: 'BigCalendar', render: () => <BigCalendarSection /> },
  { id: 'big-calendar-item', title: 'BigCalendarItem', render: () => <BigCalendarItemSection /> },
  { id: 'panel', title: 'Panel', render: () => <PanelSection /> },
  { id: 'badge', title: 'Badge', render: () => <BadgeSection /> },
  { id: 'chip', title: 'Chip', render: () => <ChipSection /> },
  { id: 'segmented-control', title: 'SegmentedControl', render: () => <SegmentedControlSection /> },
  { id: 'kbd', title: 'Kbd', render: () => <KbdSection /> },
  { id: 'spinner', title: 'Spinner', render: () => <SpinnerSection /> },
  { id: 'truncate', title: 'Truncate', render: () => <TruncateSection /> },
  { id: 'copyable', title: 'Copyable', render: () => <CopyableSection /> },
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
  { id: 'dialog', title: 'Dialog', render: () => <DialogSection /> },
  { id: 'confirm-dialog', title: 'ConfirmDialog', render: () => <ConfirmDialogSection /> },
  { id: 'drawer', title: 'Drawer', render: () => <DrawerSection /> },
  { id: 'layer', title: 'Layer', render: () => <LayerSection /> },
  { id: 'popover', title: 'Popover', render: () => <PopoverSection /> },
  { id: 'preview-card', title: 'PreviewCard', render: () => <PreviewCardSection /> },
  { id: 'tooltip', title: 'Tooltip', render: () => <TooltipSection /> },
  /*
   * Menus and choosing.
   *
   * Shown closed, behind their triggers, for the same reason the overlays are:
   * what matters about a menu is the keyboard, and a picture cannot show that.
   * The tests hold the behaviour; these are here to be clicked.
   */
  { id: 'menu', title: 'Menu', render: () => <MenuSection /> },
  { id: 'context-menu', title: 'ContextMenu', render: () => <ContextMenuSection /> },
  { id: 'select', title: 'Select', render: () => <SelectSection /> },
  { id: 'combobox', title: 'Combobox', render: () => <ComboboxSection /> },
  /*
   * Searching, and the shortcut that gets you there.
   *
   * The field's shortcut is a command like any other: press Ctrl+/ (Cmd+/ on a
   * Mac) from anywhere on this page that is not already a field. The palette,
   * the commands and the sheet of shortcuts have sections of their own under
   * sections/.
   */
  { id: 'search-field', title: 'SearchField', render: () => <SearchFieldSection /> },
  { id: 'command-palette', title: 'CommandPalette', render: () => <CommandPaletteSection /> },
  { id: 'shortcuts-dialog', title: 'ShortcutsDialog', render: () => <ShortcutsDialogSection /> },
  { id: 'commands', title: 'Commands', kind: 'utility', render: () => <CommandsSection /> },
  { id: 'shortcut', title: 'Shortcut', kind: 'utility', render: () => <ShortcutSection /> },
  /*
   * Saying that something happened.
   *
   * Three components that products keep confusing, so the stand puts them next
   * to each other: a toast goes away, an alert is still true after a reload, and
   * a banner is true on every screen. Anything that needs an answer is a Dialog.
   */
  { id: 'toast', title: 'Toast', render: () => <ToastSection /> },
  { id: 'alert', title: 'Alert', render: () => <AlertSection /> },
  { id: 'banner', title: 'Banner', render: () => <BannerSection /> },
  { id: 'tag-input', title: 'TagInput', render: () => <TagInputSection /> },
  { id: 'file-drop', title: 'FileDrop', render: () => <FileDropSection /> },
  { id: 'color-field', title: 'ColorField', render: () => <ColorFieldSection /> },
  { id: 'action-bar', title: 'ActionBar', render: () => <ActionBarSection /> },
  { id: 'save-state', title: 'SaveState', render: () => <SaveStateSection /> },
  { id: 'table-sort', title: 'table-sort', kind: 'utility', render: () => <TableSortSection /> },
  { id: 'table', title: 'Table', render: () => <TableSection /> },
  /* The catalogue table's three abilities: a column sized by its edge, rows
   * that drag, and a funnel in a heading. */
  { id: 'column-resize-handle', title: 'ColumnResizeHandle', render: () => <ColumnResizeHandleSection /> },
  { id: 'reorderable-list', title: 'ReorderableList', render: () => <ReorderableListSection /> },
  { id: 'filter-popover', title: 'FilterPopover', render: () => <FilterPopoverSection /> },
  { id: 'pagination', title: 'Pagination', render: () => <PaginationSection /> },
  { id: 'page-size', title: 'PageSize', render: () => <PageSizeSection /> },
  { id: 'number-format', title: 'NumberFormat', render: () => <NumberFormatSection /> },
  { id: 'relative-time', title: 'RelativeTime', render: () => <RelativeTimeSection /> },
  { id: 'virtual-list', title: 'VirtualList', render: () => <VirtualListSection /> },
  { id: 'virtual-grid', title: 'VirtualGrid', render: () => <VirtualGridSection /> },
  { id: 'tree-rows', title: 'tree-rows', kind: 'utility', render: () => <TreeRowsSection /> },
  { id: 'tree-view', title: 'TreeView', render: () => <TreeViewSection /> },
  { id: 'key-value', title: 'KeyValue', render: () => <KeyValueSection /> },
  { id: 'list-row', title: 'ListRow', render: () => <ListRowSection /> },
  { id: 'tile-button', title: 'TileButton', render: () => <TileButtonSection /> },
  { id: 'stat-tile', title: 'StatTile', render: () => <StatTileSection /> },
  { id: 'sparkline', title: 'Sparkline', render: () => <SparklineSection /> },
  { id: 'track-segments', title: 'track-segments', kind: 'utility', render: () => <TrackSegmentsSection /> },
  { id: 'track', title: 'Track', render: () => <TrackSection /> },
  { id: 'activity-weeks', title: 'activity-weeks', kind: 'utility', render: () => <ActivityWeeksSection /> },
  { id: 'activity-heatmap', title: 'ActivityHeatmap', render: () => <ActivityHeatmapSection /> },
  { id: 'activity-legend', title: 'ActivityLegend', render: () => <ActivityLegendSection /> },
  { id: 'bar-chart', title: 'BarChart', render: () => <BarChartSection /> },
  { id: 'line-scale', title: 'line-scale', kind: 'utility', render: () => <LineScaleSection /> },
  { id: 'line-chart', title: 'LineChart', render: () => <LineChartSection /> },
  { id: 'prose', title: 'prose', kind: 'utility', render: () => <ProseSection /> },
  { id: 'code-block', title: 'CodeBlock', render: () => <CodeBlockSection /> },
  { id: 'copy-button', title: 'CopyButton', render: () => <CopyButtonSection /> },
  { id: 'diff-lines', title: 'diff-lines', kind: 'utility', render: () => <DiffLinesSection /> },
  { id: 'diff-view', title: 'DiffView', render: () => <DiffViewSection /> },
  { id: 'json-rows', title: 'json-rows', kind: 'utility', render: () => <JsonRowsSection /> },
  { id: 'json-viewer', title: 'JsonViewer', render: () => <JsonViewerSection /> },
  { id: 'skeleton', title: 'Skeleton', render: () => <SkeletonSection /> },
  { id: 'empty-state', title: 'EmptyState', render: () => <EmptyStateSection /> },
  { id: 'progress', title: 'Progress', render: () => <ProgressSection /> },
  { id: 'query-state', title: 'QueryState', render: () => <QueryStateSection /> },
  { id: 'error-boundary', title: 'ErrorBoundary', render: () => <ErrorBoundarySection /> },
  /* The shell: what a desktop product of the line draws around its screens. */
  /*
   * The frame.
   *
   * Shown at a size, in a box with a border, rather than taking over the page:
   * the shell's whole job is to fill the height it is given, so a
   * demonstration that filled the stand would show nothing and break every
   * section under it. The box is the window; what is inside it is the real
   * component.
   */
  { id: 'app-shell', title: 'AppShell', render: () => <AppShellSection /> },
  { id: 'nav-rail', title: 'NavRail', render: () => <NavRailSection /> },
  { id: 'page-header', title: 'PageHeader', render: () => <PageHeaderSection /> },
  { id: 'breadcrumbs', title: 'Breadcrumbs', render: () => <BreadcrumbsSection /> },
  { id: 'divider', title: 'Divider', render: () => <DividerSection /> },
  { id: 'section-nav', title: 'SectionNav', render: () => <SectionNavSection /> },
  { id: 'notification-bell', title: 'NotificationBell', render: () => <NotificationBellSection /> },
  { id: 'tabs', title: 'Tabs', render: () => <TabsSection /> },
  /* Layout: how a screen is divided, and what scrolls. */
  { id: 'collapsible', title: 'Collapsible', render: () => <CollapsibleSection /> },
  { id: 'accordion', title: 'Accordion', render: () => <AccordionSection /> },
  { id: 'scroll-area', title: 'ScrollArea', render: () => <ScrollAreaSection /> },
  { id: 'splitter', title: 'Splitter', render: () => <SplitterSection /> },
  { id: 'frame', title: 'Frame', render: () => <FrameSection /> },
  { id: 'image', title: 'Image', render: () => <ImageSection /> },
  { id: 'stepper', title: 'Stepper', render: () => <StepperSection /> },
  { id: 'wizard', title: 'Wizard', render: () => <WizardSection /> },
  /* The line's own signs: the marks, the About plate, the way between products. */
  { id: 'product-mark', title: 'ProductMark', render: () => <ProductMarkSection /> },
  { id: 'about-plate', title: 'AboutPlate', render: () => <AboutPlateSection /> },
  { id: 'product-switcher', title: 'ProductSwitcher', render: () => <ProductSwitcherSection /> },
  { id: 'window-frame', title: 'WindowFrame', render: () => <WindowFrameSection /> },
  { id: 'splash', title: 'Splash', render: () => <SplashSection /> },
  { id: 'avatar', title: 'Avatar', render: () => <AvatarSection /> },
  { id: 'status-dot', title: 'StatusDot', render: () => <StatusDotSection /> },
  { id: 'tier', title: 'Tier', render: () => <TierSection /> },
  { id: 'timeline', title: 'Timeline', render: () => <TimelineSection /> },
  { id: 'skeleton-of', title: 'SkeletonOf', render: () => <SkeletonOfSection /> },
  /* Blocks: screens made of the components above, in a group of their own.
   * A block is a starting point a product changes rather than a copy it
   * keeps, and the list says which is which. */
  {
    id: 'list-detail-screen',
    title: 'ListDetailScreen',
    kind: 'block',
    render: () => <ListDetailScreenSection />,
  },
  { id: 'settings-screen', title: 'SettingsScreen', kind: 'block', render: () => <SettingsScreenSection /> },
  { id: 'login-screen', title: 'LoginScreen', kind: 'block', render: () => <LoginScreenSection /> },
  {
    id: 'empty-dashboard-screen',
    title: 'EmptyDashboardScreen',
    kind: 'block',
    render: () => <EmptyDashboardScreenSection />,
  },
]
