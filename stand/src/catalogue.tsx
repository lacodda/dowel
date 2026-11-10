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
export const sections = [
  { id: 'button', title: 'Button', docs: '/dowel/components/button/', render: () => <ButtonSection /> },
  { id: 'input', title: 'Input', docs: '/dowel/components/input/', render: () => <InputSection /> },
  { id: 'textarea', title: 'Textarea', docs: '/dowel/components/textarea/', render: () => <TextareaSection /> },
  {
    id: 'marked-text',
    title: 'MarkedText',
    docs: '/dowel/components/marked-text/',
    render: () => <MarkedTextSection />,
  },
  { id: 'field', title: 'Field', docs: '/dowel/components/field/', render: () => <FieldSection /> },
  {
    id: 'inline-field',
    title: 'InlineField',
    docs: '/dowel/components/inline-field/',
    render: () => <InlineFieldSection />,
  },
  {
    id: 'field-draft',
    title: 'useFieldDraft',
    kind: 'utility',
    docs: '/dowel/components/field-draft/',
    render: () => <FieldDraftSection />,
  },
  {
    id: 'schema-fields',
    title: 'SchemaFields',
    docs: '/dowel/components/schema-fields/',
    render: () => <SchemaFieldsSection />,
  },
  {
    id: 'schema-shape',
    title: 'schema-shape',
    kind: 'utility',
    docs: '/dowel/components/schema-shape/',
    render: () => <SchemaShapeSection />,
  },
  {
    id: 'schema-check',
    title: 'schema-check',
    kind: 'utility',
    docs: '/dowel/components/schema-check/',
    render: () => <SchemaCheckSection />,
  },
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
  {
    id: 'big-calendar',
    title: 'BigCalendar',
    docs: '/dowel/components/big-calendar/',
    render: () => <BigCalendarSection />,
  },
  {
    id: 'big-calendar-item',
    title: 'BigCalendarItem',
    docs: '/dowel/components/big-calendar-item/',
    render: () => <BigCalendarItemSection />,
  },
  { id: 'panel', title: 'Panel', docs: '/dowel/components/panel/', render: () => <PanelSection /> },
  { id: 'badge', title: 'Badge', docs: '/dowel/components/badge/', render: () => <BadgeSection /> },
  { id: 'chip', title: 'Chip', docs: '/dowel/components/chip/', render: () => <ChipSection /> },
  {
    id: 'segmented-control',
    title: 'SegmentedControl',
    docs: '/dowel/components/segmented-control/',
    render: () => <SegmentedControlSection />,
  },
  { id: 'kbd', title: 'Kbd', docs: '/dowel/components/kbd/', render: () => <KbdSection /> },
  { id: 'spinner', title: 'Spinner', docs: '/dowel/components/spinner/', render: () => <SpinnerSection /> },
  { id: 'truncate', title: 'Truncate', docs: '/dowel/components/truncate/', render: () => <TruncateSection /> },
  { id: 'copyable', title: 'Copyable', docs: '/dowel/components/copyable/', render: () => <CopyableSection /> },
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
  { id: 'dialog', title: 'Dialog', docs: '/dowel/components/dialog/', render: () => <DialogSection /> },
  {
    id: 'confirm-dialog',
    title: 'ConfirmDialog',
    docs: '/dowel/components/confirm-dialog/',
    render: () => <ConfirmDialogSection />,
  },
  { id: 'drawer', title: 'Drawer', docs: '/dowel/components/drawer/', render: () => <DrawerSection /> },
  { id: 'layer', title: 'Layer', docs: '/dowel/components/layer/', render: () => <LayerSection /> },
  { id: 'popover', title: 'Popover', docs: '/dowel/components/popover/', render: () => <PopoverSection /> },
  {
    id: 'preview-card',
    title: 'PreviewCard',
    docs: '/dowel/components/preview-card/',
    render: () => <PreviewCardSection />,
  },
  { id: 'tooltip', title: 'Tooltip', docs: '/dowel/components/tooltip/', render: () => <TooltipSection /> },
  /*
   * Menus and choosing.
   *
   * Shown closed, behind their triggers, for the same reason the overlays are:
   * what matters about a menu is the keyboard, and a picture cannot show that.
   * The tests hold the behaviour; these are here to be clicked.
   */
  { id: 'menu', title: 'Menu', docs: '/dowel/components/menu/', render: () => <MenuSection /> },
  {
    id: 'context-menu',
    title: 'ContextMenu',
    docs: '/dowel/components/context-menu/',
    render: () => <ContextMenuSection />,
  },
  { id: 'select', title: 'Select', docs: '/dowel/components/select/', render: () => <SelectSection /> },
  { id: 'combobox', title: 'Combobox', docs: '/dowel/components/combobox/', render: () => <ComboboxSection /> },
  /*
   * Searching, and the shortcut that gets you there.
   *
   * The field's shortcut is a command like any other: press Ctrl+/ (Cmd+/ on a
   * Mac) from anywhere on this page that is not already a field. The palette,
   * the commands and the sheet of shortcuts have sections of their own under
   * sections/.
   */
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
    id: 'shortcuts-dialog',
    title: 'ShortcutsDialog',
    docs: '/dowel/components/shortcuts-dialog/',
    render: () => <ShortcutsDialogSection />,
  },
  {
    id: 'commands',
    title: 'Commands',
    kind: 'utility',
    docs: '/dowel/components/commands/',
    render: () => <CommandsSection />,
  },
  {
    id: 'shortcut',
    title: 'Shortcut',
    kind: 'utility',
    docs: '/dowel/components/shortcut/',
    render: () => <ShortcutSection />,
  },
  /*
   * Saying that something happened.
   *
   * Three components that products keep confusing, so the stand puts them next
   * to each other: a toast goes away, an alert is still true after a reload, and
   * a banner is true on every screen. Anything that needs an answer is a Dialog.
   */
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
  /* The catalogue table's three abilities: a column sized by its edge, rows
   * that drag, and a funnel in a heading. */
  {
    id: 'column-resize-handle',
    title: 'ColumnResizeHandle',
    docs: '/dowel/components/column-resize-handle/',
    render: () => <ColumnResizeHandleSection />,
  },
  {
    id: 'reorderable-list',
    title: 'ReorderableList',
    docs: '/dowel/components/reorderable-list/',
    render: () => <ReorderableListSection />,
  },
  {
    id: 'filter-popover',
    title: 'FilterPopover',
    docs: '/dowel/components/filter-popover/',
    render: () => <FilterPopoverSection />,
  },
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
    id: 'list-row',
    title: 'ListRow',
    docs: '/dowel/components/list-row/',
    render: () => <ListRowSection />,
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
  {
    id: 'app-shell',
    title: 'AppShell',
    docs: '/dowel/components/app-shell/',
    render: () => <AppShellSection />,
  },
  {
    id: 'nav-rail',
    title: 'NavRail',
    docs: '/dowel/components/nav-rail/',
    render: () => <NavRailSection />,
  },
  {
    id: 'page-header',
    title: 'PageHeader',
    docs: '/dowel/components/page-header/',
    render: () => <PageHeaderSection />,
  },
  {
    id: 'breadcrumbs',
    title: 'Breadcrumbs',
    docs: '/dowel/components/breadcrumbs/',
    render: () => <BreadcrumbsSection />,
  },
  {
    id: 'divider',
    title: 'Divider',
    docs: '/dowel/components/divider/',
    render: () => <DividerSection />,
  },
  {
    id: 'section-nav',
    title: 'SectionNav',
    docs: '/dowel/components/section-nav/',
    render: () => <SectionNavSection />,
  },
  {
    id: 'notification-bell',
    title: 'NotificationBell',
    docs: '/dowel/components/notification-bell/',
    render: () => <NotificationBellSection />,
  },
  {
    id: 'tabs',
    title: 'Tabs',
    docs: '/dowel/components/tabs/',
    render: () => <TabsSection />,
  },
  /* Layout: how a screen is divided, and what scrolls. */
  {
    id: 'collapsible',
    title: 'Collapsible',
    docs: '/dowel/components/collapsible/',
    render: () => <CollapsibleSection />,
  },
  {
    id: 'accordion',
    title: 'Accordion',
    docs: '/dowel/components/accordion/',
    render: () => <AccordionSection />,
  },
  {
    id: 'scroll-area',
    title: 'ScrollArea',
    docs: '/dowel/components/scroll-area/',
    render: () => <ScrollAreaSection />,
  },
  {
    id: 'splitter',
    title: 'Splitter',
    docs: '/dowel/components/splitter/',
    render: () => <SplitterSection />,
  },
  { id: 'frame', title: 'Frame', docs: '/dowel/components/frame/', render: () => <FrameSection /> },
  {
    id: 'image',
    title: 'Image',
    docs: '/dowel/components/image/',
    render: () => <ImageSection />,
  },
  {
    id: 'stepper',
    title: 'Stepper',
    docs: '/dowel/components/stepper/',
    render: () => <StepperSection />,
  },
  {
    id: 'wizard',
    title: 'Wizard',
    docs: '/dowel/components/wizard/',
    render: () => <WizardSection />,
  },
  /* The line's own signs: the marks, the About plate, the way between products. */
  {
    id: 'product-mark',
    title: 'ProductMark',
    docs: '/dowel/components/product-mark/',
    render: () => <ProductMarkSection />,
  },
  {
    id: 'about-plate',
    title: 'AboutPlate',
    docs: '/dowel/components/about-plate/',
    render: () => <AboutPlateSection />,
  },
  {
    id: 'product-switcher',
    title: 'ProductSwitcher',
    docs: '/dowel/components/product-switcher/',
    render: () => <ProductSwitcherSection />,
  },
  {
    id: 'window-frame',
    title: 'WindowFrame',
    docs: '/dowel/components/window-frame/',
    render: () => <WindowFrameSection />,
  },
  {
    id: 'splash',
    title: 'Splash',
    docs: '/dowel/components/splash/',
    render: () => <SplashSection />,
  },
  { id: 'avatar', title: 'Avatar', docs: '/dowel/components/avatar/', render: () => <AvatarSection /> },
  {
    id: 'status-dot',
    title: 'StatusDot',
    docs: '/dowel/components/status-dot/',
    render: () => <StatusDotSection />,
  },
  { id: 'tier', title: 'Tier', docs: '/dowel/components/tier/', render: () => <TierSection /> },
  {
    id: 'timeline',
    title: 'Timeline',
    docs: '/dowel/components/timeline/',
    render: () => <TimelineSection />,
  },
  {
    id: 'skeleton-of',
    title: 'SkeletonOf',
    docs: '/dowel/components/skeleton-of/',
    render: () => <SkeletonOfSection />,
  },
  /* Blocks: screens made of the components above, in a group of their own.
   * A block is a starting point a product changes rather than a copy it
   * keeps, and the list says which is which. */
  {
    id: 'list-detail-screen',
    title: 'ListDetailScreen',
    kind: 'block',
    docs: '/dowel/blocks/list-detail-screen/',
    render: () => <ListDetailScreenSection />,
  },
  {
    id: 'settings-screen',
    title: 'SettingsScreen',
    kind: 'block',
    docs: '/dowel/blocks/settings-screen/',
    render: () => <SettingsScreenSection />,
  },
  {
    id: 'login-screen',
    title: 'LoginScreen',
    kind: 'block',
    docs: '/dowel/blocks/login-screen/',
    render: () => <LoginScreenSection />,
  },
  {
    id: 'empty-dashboard-screen',
    title: 'EmptyDashboardScreen',
    kind: 'block',
    docs: '/dowel/blocks/empty-dashboard-screen/',
    render: () => <EmptyDashboardScreenSection />,
  },
]
