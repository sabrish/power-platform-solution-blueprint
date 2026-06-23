/**
 * Registry of all ProcessorStep implementations for BlueprintGenerator.
 *
 * Each step wraps the corresponding processor function with the uniform
 * ProcessorStep interface. Steps write their results into context.acc.
 *
 * Order matters — steps run sequentially and later steps may depend on
 * data written by earlier steps.
 *
 * PATTERN-007: All imports are static. Dynamic import() is forbidden.
 */
import {
  processPlugins,
  processFlows,
  processBusinessRules,
  processWebResources,
  processClassicWorkflows,
  processBusinessProcessFlows,
  processCustomAPIs,
  processEnvironmentVariables,
  processConnectionReferences,
  processGlobalChoices,
  processCustomConnectors,
  processSecurityRoles,
  processFieldSecurityProfiles,
  processColumnSecurity,
  processForms,
  processApps,
  processPcfControls,
  processServiceEndpoints,
  processCopilotAgents,
  processDuplicateDetectionRules,
  processSiteMaps,
  processSlaDefinitions,
  processReports,
  processCharts,
  processViews,
  processDialogs,
  processAiModels,
  processVirtualTableDataSources,
} from './index.js';
import { PluginDiscovery } from '../../discovery/PluginDiscovery.js';
import { FlowDiscovery } from '../../discovery/FlowDiscovery.js';
import {
  groupPluginsByEntity,
  groupFlowsByEntity,
  groupBusinessRulesByEntity,
  groupClassicWorkflowsByEntity,
  groupBusinessProcessFlowsByEntity,
  groupFormsByEntity,
  groupWebResourcesByType,
} from '../../utils/grouping.js';
import type { ProcessorStep, ProcessorContext } from './ProcessorStep.js';

/**
 * Plugins — Step 3
 * Constructs a PluginDiscovery instance and injects it into processPlugins (P6).
 */
const pluginsStep: ProcessorStep = {
  name: 'Plugins',
  async run(ctx: ProcessorContext): Promise<void> {
    const discoverer = new PluginDiscovery(ctx.client, (current, total) => {
      ctx.onProgress({
        phase: 'plugins',
        entityName: '',
        current,
        total,
        message: `Documenting plugins (${current}/${total})...`,
      });
    }, ctx.logger);

    ctx.acc.plugins = await processPlugins(
      discoverer,
      ctx.inventory.pluginIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
    ctx.acc.pluginsByEntity = groupPluginsByEntity(ctx.acc.plugins);

    if (ctx.inventory.pluginIds.length === 0) {
      ctx.acc.warnings.push('No plugins found');
    }
  },
};

/**
 * Flows — Step 4
 * Constructs a FlowDiscovery instance and injects it into processFlows (P6).
 */
const flowsStep: ProcessorStep = {
  name: 'Flows',
  async run(ctx: ProcessorContext): Promise<void> {
    const discoverer = new FlowDiscovery(ctx.client, (current, total) => {
      ctx.onProgress({
        phase: 'flows',
        entityName: '',
        current,
        total,
        message: `Documenting flows (${current}/${total})...`,
      });
    }, ctx.logger);

    ctx.acc.flows = await processFlows(
      discoverer,
      ctx.workflowInventory.flowIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
    ctx.acc.flowsByEntity = groupFlowsByEntity(ctx.acc.flows);

    if (ctx.workflowInventory.flowIds.length === 0) {
      ctx.acc.warnings.push('No flows found');
    }
  },
};

/**
 * Business Rules — Step 5
 */
const businessRulesStep: ProcessorStep = {
  name: 'Business Rules',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.businessRules = await processBusinessRules(
      ctx.client,
      ctx.workflowInventory.businessRuleIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
    ctx.acc.businessRulesByEntity = groupBusinessRulesByEntity(ctx.acc.businessRules);

    if (ctx.workflowInventory.businessRuleIds.length === 0) {
      ctx.acc.warnings.push('No business rules found');
    }
  },
};

/**
 * Classic Workflows — Step 5.5
 */
const classicWorkflowsStep: ProcessorStep = {
  name: 'Classic Workflows',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.classicWorkflows = await processClassicWorkflows(
      ctx.client,
      ctx.workflowInventory.classicWorkflowIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
    ctx.acc.classicWorkflowsByEntity = groupClassicWorkflowsByEntity(ctx.acc.classicWorkflows);

    if (ctx.workflowInventory.classicWorkflowIds.length > 0) {
      ctx.acc.warnings.push(
        `${ctx.workflowInventory.classicWorkflowIds.length} classic workflow(s) detected - migration to Power Automate recommended`
      );
    }
  },
};

/**
 * Business Process Flows — Step 5.6
 */
const businessProcessFlowsStep: ProcessorStep = {
  name: 'Business Process Flows',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.businessProcessFlows = await processBusinessProcessFlows(
      ctx.client,
      ctx.workflowInventory.businessProcessFlowIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
    ctx.acc.businessProcessFlowsByEntity = groupBusinessProcessFlowsByEntity(ctx.acc.businessProcessFlows);
  },
};

/**
 * Web Resources — Step 6
 */
const webResourcesStep: ProcessorStep = {
  name: 'Web Resources',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.webResources = await processWebResources(
      ctx.client,
      ctx.inventory.webResourceIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
    ctx.acc.webResourcesByType = groupWebResourcesByType(ctx.acc.webResources);

    if (ctx.inventory.webResourceIds.length === 0) {
      ctx.acc.warnings.push('No web resources found');
    }
  },
};

/**
 * Custom APIs — Step 6.5
 */
const customAPIsStep: ProcessorStep = {
  name: 'Custom APIs',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.customAPIs = await processCustomAPIs(
      ctx.client,
      ctx.inventory.customApiIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Environment Variables — Step 6.6
 */
const environmentVariablesStep: ProcessorStep = {
  name: 'Environment Variables',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.environmentVariables = await processEnvironmentVariables(
      ctx.client,
      ctx.inventory.environmentVariableIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Connection References — Step 6.7
 */
const connectionReferencesStep: ProcessorStep = {
  name: 'Connection References',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.connectionReferences = await processConnectionReferences(
      ctx.client,
      ctx.inventory.connectionReferenceIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Global Choices — Step 6.8
 */
const globalChoicesStep: ProcessorStep = {
  name: 'Global Choices',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.globalChoices = await processGlobalChoices(
      ctx.client,
      ctx.inventory.globalChoiceIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Custom Connectors — Step 6.9
 */
const customConnectorsStep: ProcessorStep = {
  name: 'Custom Connectors',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.customConnectors = await processCustomConnectors(
      ctx.client,
      ctx.inventory.customConnectorIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Security Roles — Step 6.10
 */
const securityRolesStep: ProcessorStep = {
  name: 'Security Roles',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.securityRoles = await processSecurityRoles(
      ctx.client,
      ctx.inventory.securityRoleIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Field Security Profiles — Step 6.11
 */
const fieldSecurityProfilesStep: ProcessorStep = {
  name: 'Field Security Profiles',
  async run(ctx: ProcessorContext): Promise<void> {
    const { profiles, fieldSecurityByEntity } = await processFieldSecurityProfiles(
      ctx.client,
      ctx.inventory.fieldSecurityProfileIds,
      ctx.entities.map(e => e.LogicalName),
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
    ctx.acc.fieldSecurityProfiles = profiles;
    ctx.acc.fieldSecurityByEntity = fieldSecurityByEntity;
  },
};

/**
 * Column Security (Attribute Masking + Column Security Profiles) — Step 6.12
 */
const columnSecurityStep: ProcessorStep = {
  name: 'Column Security',
  async run(ctx: ProcessorContext): Promise<void> {
    const { attributeMaskingRules, columnSecurityProfiles } = await processColumnSecurity(
      ctx.client,
      ctx.onProgress,
      ctx.stepWarnings
    );
    ctx.acc.attributeMaskingRules = attributeMaskingRules;
    ctx.acc.columnSecurityProfiles = columnSecurityProfiles;
  },
};

/**
 * Apps (Canvas Apps, Custom Pages, Model-Driven Apps) — Step 6.13
 */
const appsStep: ProcessorStep = {
  name: 'Apps',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.onProgress({
      phase: 'apps',
      entityName: '',
      current: 0,
      total: ctx.inventory.canvasAppIds.length + ctx.inventory.appModuleIds.length,
      message: 'Discovering Canvas Apps, Custom Pages, and Model-Driven Apps...',
    });

    const { canvasApps, customPages, modelDrivenApps } = await processApps(
      ctx.client,
      ctx.inventory.canvasAppIds,
      ctx.inventory.appModuleIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
    ctx.acc.canvasApps = canvasApps;
    ctx.acc.customPages = customPages;
    ctx.acc.modelDrivenApps = modelDrivenApps;
  },
};

/**
 * Forms and JavaScript Event Handlers — Step 7
 */
const formsStep: ProcessorStep = {
  name: 'Forms',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.forms = await processForms(
      ctx.client,
      ctx.entities,
      ctx.inventory.formIds,
      ctx.inventory.entitiesWithAllSubcomponents,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
    ctx.acc.formsByEntity = groupFormsByEntity(ctx.acc.forms);
  },
};

/**
 * PCF Controls — Step 6.14
 */
const pcfControlsStep: ProcessorStep = {
  name: 'PCF Controls',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.pcfControls = await processPcfControls(
      ctx.client,
      ctx.inventory.pcfControlIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Service Endpoints — Step 6.15
 */
const serviceEndpointsStep: ProcessorStep = {
  name: 'Service Endpoints',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.serviceEndpoints = await processServiceEndpoints(
      ctx.client,
      ctx.inventory.serviceEndpointIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Copilot Agents — Step 6.16
 */
const copilotAgentsStep: ProcessorStep = {
  name: 'Copilot Agents',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.copilotAgents = await processCopilotAgents(
      ctx.client,
      ctx.inventory.copilotAgentIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Duplicate Detection Rules — Step 6.17
 */
const duplicateDetectionRulesStep: ProcessorStep = {
  name: 'Duplicate Detection Rules',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.duplicateDetectionRules = await processDuplicateDetectionRules(
      ctx.client,
      ctx.inventory.duplicateDetectionRuleIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Site Maps — Step 6.18
 */
const siteMapsStep: ProcessorStep = {
  name: 'Site Maps',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.siteMaps = await processSiteMaps(
      ctx.client,
      ctx.inventory.siteMapIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * SLA Definitions — Step 6.19
 */
const slaDefinitionsStep: ProcessorStep = {
  name: 'SLA Definitions',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.slaDefinitions = await processSlaDefinitions(
      ctx.client,
      ctx.inventory.slaDefinitionIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Reports — Step 6.20
 */
const reportsStep: ProcessorStep = {
  name: 'Reports',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.reports = await processReports(
      ctx.client,
      ctx.inventory.reportIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Charts — Step 6.21
 */
const chartsStep: ProcessorStep = {
  name: 'Charts',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.charts = await processCharts(
      ctx.client,
      ctx.inventory.chartIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Views — Step 6.22
 */
const viewsStep: ProcessorStep = {
  name: 'Views',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.views = await processViews(
      ctx.client,
      ctx.inventory.viewIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Dialogs — Step 6.23 (reads from workflowInventory.dialogIds)
 */
const dialogsStep: ProcessorStep = {
  name: 'Dialogs',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.dialogs = await processDialogs(
      ctx.client,
      ctx.workflowInventory.dialogIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * AI Models — Step 6.24
 */
const aiModelsStep: ProcessorStep = {
  name: 'AI Models',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.aiModels = await processAiModels(
      ctx.client,
      ctx.inventory.aiModelIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Virtual Table Data Sources — Step 6.25
 */
const virtualTableDataSourcesStep: ProcessorStep = {
  name: 'Virtual Table Data Sources',
  async run(ctx: ProcessorContext): Promise<void> {
    ctx.acc.virtualTableDataSources = await processVirtualTableDataSources(
      ctx.client,
      ctx.inventory.virtualTableDataSourceIds,
      ctx.onProgress,
      ctx.logger,
      ctx.stepWarnings
    );
  },
};

/**
 * Ordered registry of all processor steps.
 * BlueprintGenerator iterates this array sequentially.
 *
 * To add a new component type: implement a ProcessorStep object above
 * and append it to this array — no changes to generate() are required.
 */
export const GENERATOR_STEPS: readonly ProcessorStep[] = [
  pluginsStep,
  flowsStep,
  businessRulesStep,
  classicWorkflowsStep,
  businessProcessFlowsStep,
  webResourcesStep,
  customAPIsStep,
  environmentVariablesStep,
  connectionReferencesStep,
  globalChoicesStep,
  customConnectorsStep,
  securityRolesStep,
  fieldSecurityProfilesStep,
  columnSecurityStep,
  appsStep,
  formsStep,
  pcfControlsStep,
  serviceEndpointsStep,
  copilotAgentsStep,
  duplicateDetectionRulesStep,
  siteMapsStep,
  slaDefinitionsStep,
  reportsStep,
  chartsStep,
  viewsStep,
  dialogsStep,
  aiModelsStep,
  virtualTableDataSourcesStep,
];
