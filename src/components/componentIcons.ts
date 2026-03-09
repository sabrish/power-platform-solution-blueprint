/**
 * Centralized component icon registry.
 *
 * All component-type icons are defined here. Import from this file so that
 * changing an icon requires updating only one place.
 *
 * Usage:
 *   import { ComponentIcons } from './componentIcons';
 *   <ComponentIcons.plugins style={{ width: '14px', height: '14px' }} />
 */
export {
  // Data / entity types
  Table24Regular as EntitiesIcon,
  BracesVariable24Regular as PluginsIcon,
  Archive24Regular as PluginPackagesIcon,
  CloudFlow24Regular as FlowsIcon,
  ClipboardTaskListLtr24Regular as BusinessRulesIcon,
  ArrowCircleRight24Regular as ClassicWorkflowsIcon,
  Flowchart24Regular as BusinessProcessFlowsIcon,
  ArrowSwap24Regular as CustomAPIsIcon,
  Settings24Regular as EnvironmentVariablesIcon,
  Link24Regular as ConnectionReferencesIcon,
  Globe24Regular as WebResourcesIcon,
  MultiselectLtr24Regular as GlobalChoicesIcon,
  PlugConnected24Regular as CustomConnectorsIcon,
  Shield24Regular as SecurityRolesIcon,
  ShieldTask24Regular as FieldSecurityProfilesIcon,
  Document24Regular as CustomPagesIcon,

  // Contextual / inline
  ArrowUpRight24Regular as ExternalCallsIcon,

  // Navigation tabs
  Grid24Regular as DashboardIcon,
  Organization24Regular as ErdIcon,
  Open24Regular as ExternalDependenciesIcon,
  DataUsage24Regular as SolutionDistributionIcon,
  ArrowBetweenDown24Regular as CrossEntityAutomationIcon,
  DocumentBulletList24Regular as FetchLogIcon,
} from '@fluentui/react-icons';
