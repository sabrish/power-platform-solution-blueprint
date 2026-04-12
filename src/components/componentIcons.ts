/**
 * Centralized component icon registry.
 *
 * All component-type icons are defined here. Import from this file so that
 * changing an icon requires updating only one place.
 *
 * Icon selection policy (see COMPONENT_ICONS_REFERENCE.md for the full catalogue):
 *   - If Microsoft uses a unique, recognisable icon in the Power Apps solution explorer
 *     → use the matching Fluent UI v9 icon.
 *   - If Microsoft uses a generic folder icon for that component type
 *     → use our own semantically meaningful icon instead.
 *
 * Microsoft icon observations sourced from Power Apps maker portal solution explorer
 * (make.powerapps.com › Solutions › [solution] › Objects panel), captured 2026-03-10.
 *
 * Usage:
 *   import { PluginsIcon } from './componentIcons';
 *   <PluginsIcon style={{ width: '14px', height: '14px' }} />
 */
export {
  // ── Component types ────────────────────────────────────────────────────────

  // Tables — Microsoft: grid table icon. MATCHES Table24Regular.
  Table24Regular as EntitiesIcon,

  // Plugins (Plug-in assemblies) — Microsoft: jigsaw puzzle piece. UPDATED to match.
  PuzzlePiece24Regular as PluginsIcon,

  // Plugin Packages — Microsoft: generic folder. Using Archive24Regular (more informative).
  Archive24Regular as PluginPackagesIcon,

  // Cloud Flows — Microsoft: branching split-arrow / fork icon. CloudFlow24Regular matches.
  CloudFlow24Regular as FlowsIcon,

  // Business Rules — Microsoft groups with Classic Workflows and BPFs under "Processes" (gear icon).
  // No separate icon in solution explorer. Using our own.
  ClipboardTaskListLtr24Regular as BusinessRulesIcon,

  // Classic Workflows — Microsoft groups under "Processes" (document + gear badge icon). Using ClipboardSettings24Regular to match.
  ClipboardSettings24Regular as ClassicWorkflowsIcon,

  // Business Process Flows — Microsoft groups under "Processes". No separate icon. Using our own.
  Flowchart24Regular as BusinessProcessFlowsIcon,

  // Custom API — Microsoft: generic folder. Using our own FlashSettings24Regular (lightning bolt + gear = configurable API trigger).
  FlashSettings24Regular as CustomAPIsIcon,

  // Environment Variables — Microsoft: formula variable box {(v)}. UPDATED to match.
  // BracesVariable24Regular ({x} notation) is the Power Platform variable syntax.
  BracesVariable24Regular as EnvironmentVariablesIcon,

  // Connection References — Microsoft: USB/plug connector (vertical plug with two prongs). UPDATED to match.
  UsbPlug24Regular as ConnectionReferencesIcon,

  // Web Resources — Microsoft: globe with document page. UPDATED to DocumentGlobe24Regular.
  DocumentGlobe24Regular as WebResourcesIcon,

  // Global Choices — Microsoft: three horizontal lines (list). MultiselectLtr24Regular is a reasonable match.
  MultiselectLtr24Regular as GlobalChoicesIcon,

  // Custom Connectors — Microsoft: angled/disconnected plug icon. UPDATED to match.
  PlugDisconnected24Regular as CustomConnectorsIcon,

  // Security Roles — Microsoft: two person silhouettes + lock badge. UPDATED to match.
  PeopleLock24Regular as SecurityRolesIcon,

  // Field Security Profiles (= Column security profiles) — Microsoft: table/grid + lock badge. UPDATED to match.
  TableLock24Regular as FieldSecurityProfilesIcon,

  // Custom Pages (= Pages) — Microsoft: document + pencil icon. UPDATED to match.
  DocumentEdit24Regular as CustomPagesIcon,

  // Canvas Apps — Microsoft: apps list / phone with play. AppsList24Regular matches the 24px size used by all other dashboard icons.
  AppsList24Regular as CanvasAppsIcon,

  // Model-Driven Apps — Microsoft: app module (grid of tiles). AppGeneric24Regular matches the 24px size used by all other dashboard icons.
  AppGeneric24Regular as ModelDrivenAppsIcon,

  // ── Contextual / inline indicators ────────────────────────────────────────

  // PCF Controls — Microsoft: generic folder in solution explorer. Using Braces24Regular
  // (code brackets = custom code/framework control).
  Braces24Regular as PcfControlsIcon,

  // Service Endpoints — Microsoft: generic folder. Using PlugConnected24Regular
  // (connected endpoint = external integration point).
  PlugConnected24Regular as ServiceEndpointsIcon,

  // Copilot Studio Agents — Microsoft: bot/agent icon. Using Bot24Regular.
  Bot24Regular as CopilotAgentsIcon,

  // ── New v1.3.0 component types ─────────────────────────────────────────────

  // Duplicate Detection Rules — table with similarity check. TableSimple24Regular.
  TableSimple24Regular as DuplicateDetectionRulesIcon,

  // Site Maps — navigation map. Map24Regular.
  Map24Regular as SiteMapsIcon,

  // SLA Definitions — service level timer. Timer24Regular.
  Timer24Regular as SlaDefinitionsIcon,

  // Reports — SSRS report / document with chart. ClipboardDataBar24Regular.
  ClipboardDataBar24Regular as ReportsIcon,

  // Charts — data pie visualization. DataPie24Regular.
  DataPie24Regular as ChartsIcon,

  // Views — eye / visibility. Eye24Regular.
  Eye24Regular as ViewsIcon,

  // Dialogs (deprecated) — chat with warning. ChatWarning24Regular.
  ChatWarning24Regular as DialogsIcon,

  // AI Models — AI sparkle / generative indicator. Sparkle24Regular.
  Sparkle24Regular as AiModelsIcon,

  // Virtual Table Data Sources — database with link. DatabaseLink24Regular.
  DatabaseLink24Regular as VirtualTableDataSourcesIcon,

  // ── Navigation tabs ────────────────────────────────────────────────────────

  Grid24Regular as DashboardIcon,
  Organization24Regular as ErdIcon,
  Globe24Regular as ExternalDependenciesIcon,
  DataUsage24Regular as SolutionDistributionIcon,
  ArrowBetweenDown24Regular as CrossEntityAutomationIcon,
  DocumentBulletList24Regular as FetchLogIcon,
} from '@fluentui/react-icons';
