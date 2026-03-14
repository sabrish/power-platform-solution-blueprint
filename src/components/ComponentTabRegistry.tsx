/**
 * ComponentTabRegistry — single source of truth for all component browser tabs.
 *
 * Each entry drives:
 *  - The summary card (icon, label, count)
 *  - The component browser tab (icon, label, count badge)
 *  - The tab content panel
 *
 * Add new component types here only — no edits required in ResultsDashboard.
 */
import type { ReactElement, ReactNode } from 'react';
import type { BlueprintResult } from '../core';
import {
  EntitiesIcon,
  PluginsIcon,
  PluginPackagesIcon,
  FlowsIcon,
  BusinessRulesIcon,
  ClassicWorkflowsIcon,
  BusinessProcessFlowsIcon,
  CustomAPIsIcon,
  EnvironmentVariablesIcon,
  ConnectionReferencesIcon,
  WebResourcesIcon,
  GlobalChoicesIcon,
  CustomConnectorsIcon,
  SecurityRolesIcon,
  FieldSecurityProfilesIcon,
  CustomPagesIcon,
  CanvasAppsIcon,
  ModelDrivenAppsIcon,
} from './componentIcons';
import { EntityList } from './EntityList';
import { PluginsList } from './PluginsList';
import { PluginPackagesList } from './PluginPackagesList';
import { FlowsList } from './FlowsList';
import { BusinessRulesList } from './BusinessRulesList';
import { ClassicWorkflowsList } from './ClassicWorkflowsList';
import { BusinessProcessFlowsList } from './BusinessProcessFlowsList';
import { CustomAPIsList } from './CustomAPIsList';
import { EnvironmentVariablesList } from './EnvironmentVariablesList';
import { ConnectionReferencesList } from './ConnectionReferencesList';
import { GlobalChoicesList } from './GlobalChoicesList';
import { CustomConnectorsList } from './CustomConnectorsList';
import { WebResourcesList } from './WebResourcesList';
import { SecurityRolesView } from './SecurityRolesView';
import { FieldSecurityProfilesView } from './FieldSecurityProfilesView';
import { CustomPagesList } from './CustomPagesList';
import { CanvasAppsList } from './CanvasAppsList';
import { ModelDrivenAppsList } from './ModelDrivenAppsList';

export interface ComponentTabDefinition {
  /** Tab value / id — used as React key and TabList value. */
  key: string;
  /** Display name shown in summary cards and expanded tab labels. */
  label: string;
  /**
   * Icon element rendered in summary card and tab.
   * Typed as ReactElement so it is directly compatible with Fluent UI Tab's icon slot.
   */
  icon: ReactElement;
  /** Return the component count derived from BlueprintResult. */
  count: (result: BlueprintResult) => number;
  /** Tab content panel JSX. Only called when the tab is selected. */
  render: (result: BlueprintResult) => ReactNode;
  /**
   * When true, the tab is excluded from the browser list (still shown in summary).
   * Entities tab is never hidden — it provides a stable default TabList option.
   */
  hidden?: (result: BlueprintResult) => boolean;
}

/** Unique plugin package count — reused by two registry entries. */
function uniquePluginPackageCount(result: BlueprintResult): number {
  return new Set(result.plugins.map((p) => p.assemblyName).filter(Boolean)).size;
}

export const COMPONENT_TABS: ComponentTabDefinition[] = [
  {
    key: 'entities',
    label: 'Entities',
    icon: <EntitiesIcon />,
    count: (r) => r.summary.totalEntities,
    render: (r) => (
      <EntityList
        blueprints={r.entities}
        classicWorkflows={r.classicWorkflows}
        businessProcessFlows={r.businessProcessFlows}
      />
    ),
    // Entities tab is never hidden — stable default tab option.
    hidden: () => false,
  },
  {
    key: 'plugins',
    label: 'Plugins',
    icon: <PluginsIcon />,
    count: (r) => r.summary.totalPlugins,
    render: (r) => <PluginsList plugins={r.plugins} />,
    hidden: (r) => r.summary.totalPlugins === 0,
  },
  {
    key: 'pluginPackages',
    label: 'Plugin Packages',
    icon: <PluginPackagesIcon />,
    count: uniquePluginPackageCount,
    render: (r) => <PluginPackagesList plugins={r.plugins} />,
    hidden: (r) => uniquePluginPackageCount(r) === 0,
  },
  {
    key: 'flows',
    label: 'Flows',
    icon: <FlowsIcon />,
    count: (r) => r.summary.totalFlows,
    render: (r) => <FlowsList flows={r.flows} />,
    hidden: (r) => r.summary.totalFlows === 0,
  },
  {
    key: 'businessRules',
    label: 'Business Rules',
    icon: <BusinessRulesIcon />,
    count: (r) => r.summary.totalBusinessRules,
    render: (r) => <BusinessRulesList businessRules={r.businessRules} />,
    hidden: (r) => r.summary.totalBusinessRules === 0,
  },
  {
    key: 'classicWorkflows',
    label: 'Classic Workflows',
    icon: <ClassicWorkflowsIcon />,
    count: (r) => r.summary.totalClassicWorkflows,
    render: (r) => <ClassicWorkflowsList workflows={r.classicWorkflows} />,
    hidden: (r) => r.summary.totalClassicWorkflows === 0,
  },
  {
    key: 'businessProcessFlows',
    label: 'Business Process Flows',
    icon: <BusinessProcessFlowsIcon />,
    count: (r) => r.summary.totalBusinessProcessFlows,
    render: (r) => <BusinessProcessFlowsList businessProcessFlows={r.businessProcessFlows} />,
    hidden: (r) => r.summary.totalBusinessProcessFlows === 0,
  },
  {
    key: 'customAPIs',
    label: 'Custom APIs',
    icon: <CustomAPIsIcon />,
    count: (r) => r.summary.totalCustomAPIs,
    render: (r) => <CustomAPIsList customAPIs={r.customAPIs} />,
    hidden: (r) => r.summary.totalCustomAPIs === 0,
  },
  {
    key: 'environmentVariables',
    label: 'Environment Variables',
    icon: <EnvironmentVariablesIcon />,
    count: (r) => r.summary.totalEnvironmentVariables,
    render: (r) => <EnvironmentVariablesList environmentVariables={r.environmentVariables} />,
    hidden: (r) => r.summary.totalEnvironmentVariables === 0,
  },
  {
    key: 'connectionReferences',
    label: 'Connection References',
    icon: <ConnectionReferencesIcon />,
    count: (r) => r.summary.totalConnectionReferences,
    render: (r) => <ConnectionReferencesList connectionReferences={r.connectionReferences} />,
    hidden: (r) => r.summary.totalConnectionReferences === 0,
  },
  {
    key: 'globalChoices',
    label: 'Global Choices',
    icon: <GlobalChoicesIcon />,
    count: (r) => r.summary.totalGlobalChoices,
    render: (r) => <GlobalChoicesList globalChoices={r.globalChoices} />,
    hidden: (r) => r.summary.totalGlobalChoices === 0,
  },
  {
    key: 'customConnectors',
    label: 'Custom Connectors',
    icon: <CustomConnectorsIcon />,
    count: (r) => r.summary.totalCustomConnectors,
    render: (r) => <CustomConnectorsList customConnectors={r.customConnectors} />,
    hidden: (r) => r.summary.totalCustomConnectors === 0,
  },
  {
    key: 'webResources',
    label: 'Web Resources',
    icon: <WebResourcesIcon />,
    count: (r) => r.summary.totalWebResources,
    render: (r) => <WebResourcesList webResources={r.webResources} />,
    hidden: (r) => r.summary.totalWebResources === 0,
  },
  {
    key: 'securityRoles',
    label: 'Security Roles',
    icon: <SecurityRolesIcon />,
    count: (r) => r.securityRoles?.length ?? 0,
    render: (r) => <SecurityRolesView securityRoles={r.securityRoles ?? []} />,
    hidden: (r) => (r.securityRoles?.length ?? 0) === 0,
  },
  {
    key: 'fieldSecurityProfiles',
    label: 'Field Security Profiles',
    icon: <FieldSecurityProfilesIcon />,
    count: (r) => r.fieldSecurityProfiles?.length ?? 0,
    render: (r) => (
      <FieldSecurityProfilesView
        profiles={r.fieldSecurityProfiles ?? []}
        attributeMaskingRules={r.attributeMaskingRules}
        columnSecurityProfiles={r.columnSecurityProfiles}
      />
    ),
    hidden: (r) => (r.fieldSecurityProfiles?.length ?? 0) === 0,
  },
  {
    key: 'customPages',
    label: 'Custom Pages',
    icon: <CustomPagesIcon />,
    count: (r) => r.summary.totalCustomPages,
    render: (r) => <CustomPagesList customPages={r.customPages} />,
    hidden: (r) => r.summary.totalCustomPages === 0,
  },
  {
    key: 'canvasApps',
    label: 'Canvas Apps',
    icon: <CanvasAppsIcon />,
    count: (r) => r.summary.totalCanvasApps,
    render: (r) => <CanvasAppsList canvasApps={r.canvasApps} />,
    hidden: (r) => r.summary.totalCanvasApps === 0,
  },
  {
    key: 'modelDrivenApps',
    label: 'Model-Driven Apps',
    icon: <ModelDrivenAppsIcon />,
    count: (r) => r.summary.totalModelDrivenApps,
    render: (r) => <ModelDrivenAppsList modelDrivenApps={r.modelDrivenApps} />,
    hidden: (r) => r.summary.totalModelDrivenApps === 0,
  },
];

/**
 * Compute the default selected browser tab key — first tab with data.
 * Falls back to 'entities' (always the stable default).
 */
export function getDefaultTabKey(result: BlueprintResult): string {
  for (const tab of COMPONENT_TABS) {
    if (tab.count(result) > 0) return tab.key;
  }
  return 'entities';
}
