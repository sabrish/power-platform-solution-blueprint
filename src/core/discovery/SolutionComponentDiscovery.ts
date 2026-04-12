import type { IDataverseClient, QueryOptions, QueryResult } from '../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { ComponentType, WorkflowCategory, type ComponentInventory, type ComponentInventoryWithSolutions, type WorkflowInventory, type WorkflowInventoryWithSolutions } from '../types/components.js';
import { normalizeGuid } from '../utils/guid.js';

/**
 * Solution component record
 */
interface SolutionComponent {
  objectid: string;
  componenttype: number;
  _solutionid_value?: string;
  rootcomponentbehavior?: number; // 0 = include all subcomponents, 1 = include root only
}

/**
 * Workflow record for classification
 */
interface WorkflowRecord {
  workflowid: string;
  category: number;
}

/**
 * Discovers all components in selected solution(s)
 */
export class SolutionComponentDiscovery {
  private readonly client: IDataverseClient;
  private logger?: FetchLogger;

  constructor(client: IDataverseClient, logger?: FetchLogger) {
    this.client = client;
    this.logger = logger;
  }

  /**
   * Discover all components in the specified solutions
   * @param solutionIds Array of solution IDs to discover
   * @param solutionUniqueNames Array of solution unique names (to detect Default solution)
   * @returns Inventory of all component types found
   */
  async discoverComponents(
    solutionIds: string[],
    solutionUniqueNames?: string[]
  ): Promise<ComponentInventoryWithSolutions> {
    try {
      const inventory: ComponentInventory = {
        entityIds: [],
        attributeIds: [],
        pluginIds: [],
        pluginPackageIds: [],
        workflowIds: [],
        webResourceIds: [],
        formIds: [],
        canvasAppIds: [],
        customPageIds: [],
        appModuleIds: [],
        connectionReferenceIds: [],
        customApiIds: [],
        environmentVariableIds: [],
        globalChoiceIds: [],
        customConnectorIds: [],
        securityRoleIds: [],
        fieldSecurityProfileIds: [],
        pcfControlIds: [],
        serviceEndpointIds: [],
        copilotAgentIds: [],
      };

      // Tracking maps for solution membership
      const componentToSolutions = new Map<string, string[]>();
      const solutionComponentMap = new Map<string, Set<string>>();
      const componentTypes = new Map<string, number>();

      // Track entities with rootcomponentbehavior = 0 (include all subcomponents)
      const entitiesWithAllSubcomponents = new Set<string>();

      // Check if Default Solution is among the selected solutions
      const includesDefaultSolution = solutionUniqueNames?.some(name => name.toLowerCase() === 'default');

      if (includesDefaultSolution) {
        const unmanagedResult = await this.discoverAllUnmanagedComponents();

        // If specific solutions were also selected alongside Default, query solutioncomponents
        // for those solutions so the solution distribution tab has accurate per-solution counts.
        const specificSolutionIds = solutionIds.filter((_, i) =>
          solutionUniqueNames?.[i]?.toLowerCase() !== 'default'
        );
        if (specificSolutionIds.length > 0) {
          const mapResult = await this.buildSolutionComponentMap(specificSolutionIds);
          // Explicitly reconstruct rather than relying on spread order — ensures
          // entitiesWithAllSubcomponents from unmanagedResult is never silently overwritten.
          return {
            ...unmanagedResult,
            componentToSolutions: mapResult.componentToSolutions,
            solutionComponentMap: mapResult.solutionComponentMap,
            componentTypes: mapResult.componentTypes,
          };
        }

        return unmanagedResult;
      }

      // OPTIMIZED: Query all solution components in a single batch query using OR filters
      // This reduces N queries (one per solution) to 1 query for all solutions
      const solutionFilters = solutionIds.map(id => {
        const guidWithBraces = id.startsWith('{') ? id : `{${id}}`;
        return `_solutionid_value eq '${guidWithBraces}'`;
      }).join(' or ');

      const queryStart = Date.now();
      const result = await this.client.queryAll<SolutionComponent>('solutioncomponents', {
        select: ['objectid', 'componenttype', '_solutionid_value', 'rootcomponentbehavior'],
        filter: solutionFilters,
      });
      this.logger?.log({
        timestamp: new Date(queryStart),
        step: 'Solution Component Discovery',
        entitySet: 'solutioncomponents',
        filterSummary: `${solutionIds.length} solution(s)`,
        batchIndex: 1,
        batchTotal: 1,
        batchSize: solutionIds.length,
        status: 'success',
        attempts: 1,
        durationMs: Date.now() - queryStart,
        resultCount: result.value.length,
      });

      // Group by component type (deduplicates across solutions)
      for (const component of result.value) {
        // Normalize GUID: remove braces and lowercase for consistent comparison
        const objectId = normalizeGuid(component.objectid);
        const componentType = component.componenttype;
        const solutionId = normalizeGuid(component._solutionid_value || '');

        // Track which solutions contain this component
        if (!componentToSolutions.has(objectId)) {
          componentToSolutions.set(objectId, []);
        }
        if (solutionId && !componentToSolutions.get(objectId)!.includes(solutionId)) {
          componentToSolutions.get(objectId)!.push(solutionId);
        }

        // Track components in each solution
        if (solutionId) {
          if (!solutionComponentMap.has(solutionId)) {
            solutionComponentMap.set(solutionId, new Set());
          }
          solutionComponentMap.get(solutionId)!.add(objectId);
        }

        // Track component type
        componentTypes.set(objectId, componentType);

        switch (component.componenttype) {
          case ComponentType.Entity:
            if (!inventory.entityIds.includes(objectId)) {
              inventory.entityIds.push(objectId);
            }
            // Check rootcomponentbehavior: 0 = include all subcomponents (forms, views, etc.)
            if (component.rootcomponentbehavior === 0) {
              entitiesWithAllSubcomponents.add(objectId);
            }
            break;
          case ComponentType.Attribute:
            if (!inventory.attributeIds.includes(objectId)) {
              inventory.attributeIds.push(objectId);
            }
            break;
          case ComponentType.GlobalOptionSet:
            if (!inventory.globalChoiceIds.includes(objectId)) {
              inventory.globalChoiceIds.push(objectId);
            }
            break;
          case ComponentType.SecurityRole:
            if (!inventory.securityRoleIds.includes(objectId)) {
              inventory.securityRoleIds.push(objectId);
            }
            break;
          case ComponentType.FieldSecurityProfile:
            if (!inventory.fieldSecurityProfileIds.includes(objectId)) {
              inventory.fieldSecurityProfileIds.push(objectId);
            }
            break;
          case ComponentType.SdkMessageProcessingStep:
            if (!inventory.pluginIds.includes(objectId)) {
              inventory.pluginIds.push(objectId);
            }
            break;
          case ComponentType.Workflow:
            if (!inventory.workflowIds.includes(objectId)) {
              inventory.workflowIds.push(objectId);
            }
            break;
          case ComponentType.WebResource:
            if (!inventory.webResourceIds.includes(objectId)) {
              inventory.webResourceIds.push(objectId);
            }
            break;
          case ComponentType.SystemForm:
            if (!inventory.formIds.includes(objectId)) {
              inventory.formIds.push(objectId);
            }
            break;
          case ComponentType.CanvasApp:
            if (!inventory.canvasAppIds.includes(objectId)) {
              inventory.canvasAppIds.push(objectId);
            }
            break;
          case ComponentType.AppModule:
            if (!inventory.appModuleIds.includes(objectId)) {
              inventory.appModuleIds.push(objectId);
            }
            break;
          case ComponentType.EnvironmentVariableDefinition:
            if (!inventory.environmentVariableIds.includes(objectId)) {
              inventory.environmentVariableIds.push(objectId);
            }
            break;
          case ComponentType.ConnectionReference:
            // Safety net: type 371 was not observed in solutioncomponents in tested environments,
            // but kept here in case some environments do surface it under this code.
            // The objectid intersection below also handles this case.
            if (!inventory.connectionReferenceIds.includes(objectId)) {
              inventory.connectionReferenceIds.push(objectId);
            }
            break;
          case ComponentType.CustomConnector:
            // Safety net: type 372 was not observed in solutioncomponents in tested environments,
            // but kept here in case some environments do surface it under this code.
            // The objectid intersection below also handles this case.
            if (!inventory.customConnectorIds.includes(objectId)) {
              inventory.customConnectorIds.push(objectId);
            }
            break;
          // NOTE: ComponentType.CustomAPI (10076) has no switch case here.
          // Custom APIs do not appear in solutioncomponents under type code 10076 in practice.
          // They are discovered via objectid intersection below.
          case ComponentType.PluginPackage:
            if (!inventory.pluginPackageIds.includes(objectId)) {
              inventory.pluginPackageIds.push(objectId);
            }
            break;
          case ComponentType.CustomControl:
            if (!inventory.pcfControlIds.includes(objectId)) {
              inventory.pcfControlIds.push(objectId);
            }
            break;
          case ComponentType.ServiceEndpoint:
            if (!inventory.serviceEndpointIds.includes(objectId)) {
              inventory.serviceEndpointIds.push(objectId);
            }
            break;
        }
      }

      // Custom APIs (10076), Connection References (371), and Custom Connectors (372) do not
      // appear in solutioncomponents under their expected type codes in practice. Their objectids
      // DO appear under undocumented type codes. Use objectid intersection: query all records via
      // queryAll (follows @odata.nextLink pagination), keep only those whose primary key appears
      // in the solutioncomponents objectid set for the selected solutions.
      // The tracking maps (componentToSolutions, solutionComponentMap) are already populated
      // for these objectids by the pre-switch tracking code above.
      // Each query is isolated in its own try/catch (PATTERN-012) so a failure on one type
      // does not prevent the other types from being discovered.
      const scObjectIds = new Set(result.value.map(c => normalizeGuid(c.objectid)));

      const t0CustomApis = Date.now();
      try {
        const allCustomApis = await this.client.queryAll<{ customapiid: string }>(
          'customapis', { select: ['customapiid'] }
        );
        this.logger?.log({
          timestamp: new Date(t0CustomApis),
          step: 'Solution Component Discovery — Custom APIs (objectid intersection)',
          entitySet: 'customapis',
          filterSummary: 'objectid intersection',
          batchIndex: 1,
          batchTotal: 1,
          batchSize: 0,
          status: 'success',
          attempts: 1,
          durationMs: Date.now() - t0CustomApis,
          resultCount: allCustomApis.value.length,
        });
        for (const api of allCustomApis.value) {
          const id = normalizeGuid(api.customapiid);
          if (scObjectIds.has(id) && !inventory.customApiIds.includes(id)) {
            inventory.customApiIds.push(id);
            componentTypes.set(id, ComponentType.CustomAPI);
          }
        }
      } catch (error) {
        this.logger?.log({
          timestamp: new Date(t0CustomApis),
          step: 'Solution Component Discovery — Custom APIs (objectid intersection)',
          entitySet: 'customapis',
          filterSummary: 'objectid intersection',
          batchIndex: 1,
          batchTotal: 1,
          batchSize: 0,
          status: 'failed',
          attempts: 1,
          durationMs: Date.now() - t0CustomApis,
          resultCount: 0,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }

      const t0ConnRefs = Date.now();
      try {
        const allConnRefs = await this.client.queryAll<{ connectionreferenceid: string }>(
          'connectionreferences', { select: ['connectionreferenceid'] }
        );
        this.logger?.log({
          timestamp: new Date(t0ConnRefs),
          step: 'Solution Component Discovery — Connection References (objectid intersection)',
          entitySet: 'connectionreferences',
          filterSummary: 'objectid intersection',
          batchIndex: 1,
          batchTotal: 1,
          batchSize: 0,
          status: 'success',
          attempts: 1,
          durationMs: Date.now() - t0ConnRefs,
          resultCount: allConnRefs.value.length,
        });
        for (const ref of allConnRefs.value) {
          const id = normalizeGuid(ref.connectionreferenceid);
          if (scObjectIds.has(id) && !inventory.connectionReferenceIds.includes(id)) {
            inventory.connectionReferenceIds.push(id);
            componentTypes.set(id, ComponentType.ConnectionReference);
          }
        }
      } catch (error) {
        this.logger?.log({
          timestamp: new Date(t0ConnRefs),
          step: 'Solution Component Discovery — Connection References (objectid intersection)',
          entitySet: 'connectionreferences',
          filterSummary: 'objectid intersection',
          batchIndex: 1,
          batchTotal: 1,
          batchSize: 0,
          status: 'failed',
          attempts: 1,
          durationMs: Date.now() - t0ConnRefs,
          resultCount: 0,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }

      // Custom Connectors: same objectid intersection pattern.
      const t0Connectors = Date.now();
      try {
        const allConnectors = await this.client.queryAll<{ connectorid: string }>(
          'connectors', { select: ['connectorid'] }
        );
        this.logger?.log({
          timestamp: new Date(t0Connectors),
          step: 'Solution Component Discovery — Custom Connectors (objectid intersection)',
          entitySet: 'connectors',
          filterSummary: 'objectid intersection',
          batchIndex: 1,
          batchTotal: 1,
          batchSize: 0,
          status: 'success',
          attempts: 1,
          durationMs: Date.now() - t0Connectors,
          resultCount: allConnectors.value.length,
        });
        for (const connector of allConnectors.value) {
          const id = normalizeGuid(connector.connectorid);
          if (scObjectIds.has(id) && !inventory.customConnectorIds.includes(id)) {
            inventory.customConnectorIds.push(id);
            componentTypes.set(id, ComponentType.CustomConnector);
          }
        }
      } catch (error) {
        this.logger?.log({
          timestamp: new Date(t0Connectors),
          step: 'Solution Component Discovery — Custom Connectors (objectid intersection)',
          entitySet: 'connectors',
          filterSummary: 'objectid intersection',
          batchIndex: 1,
          batchTotal: 1,
          batchSize: 0,
          status: 'failed',
          attempts: 1,
          durationMs: Date.now() - t0Connectors,
          resultCount: 0,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }

      // Copilot Studio Agents: bot component type code is not reliably documented.
      // Use Strategy B (objectid intersection): query all bots, keep those whose botid
      // appears in the solutioncomponents objectid set.
      const t0Bots = Date.now();
      try {
        const allBots = await this.client.queryAll<{ botid: string }>(
          'bots', { select: ['botid'] }
        );
        this.logger?.log({
          timestamp: new Date(t0Bots),
          step: 'Solution Component Discovery — Copilot Agents (objectid intersection)',
          entitySet: 'bots',
          filterSummary: 'objectid intersection',
          batchIndex: 1,
          batchTotal: 1,
          batchSize: 0,
          status: 'success',
          attempts: 1,
          durationMs: Date.now() - t0Bots,
          resultCount: allBots.value.length,
        });
        for (const bot of allBots.value) {
          const id = normalizeGuid(bot.botid);
          if (scObjectIds.has(id) && !inventory.copilotAgentIds.includes(id)) {
            inventory.copilotAgentIds.push(id);
          }
        }
      } catch (error) {
        this.logger?.log({
          timestamp: new Date(t0Bots),
          step: 'Solution Component Discovery — Copilot Agents (objectid intersection)',
          entitySet: 'bots',
          filterSummary: 'objectid intersection',
          batchIndex: 1,
          batchTotal: 1,
          batchSize: 0,
          status: 'failed',
          attempts: 1,
          durationMs: Date.now() - t0Bots,
          resultCount: 0,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }

      return {
        ...inventory,
        componentToSolutions,
        solutionComponentMap,
        componentTypes,
        entitiesWithAllSubcomponents,
      };
    } catch (error) {
      throw new Error(
        `Failed to discover solution components: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Query solutioncomponents for specific solution IDs and return only the tracking maps.
   * Used when Default Solution is selected alongside specific solutions, so per-solution
   * component counts are still accurate for the specific solutions.
   */
  private async buildSolutionComponentMap(
    solutionIds: string[]
  ): Promise<Pick<ComponentInventoryWithSolutions, 'componentToSolutions' | 'solutionComponentMap' | 'componentTypes'>> {
    const componentToSolutions = new Map<string, string[]>();
    const solutionComponentMap = new Map<string, Set<string>>();
    const componentTypes = new Map<string, number>();

    const solutionFilters = solutionIds.map(id => {
      const guidWithBraces = id.startsWith('{') ? id : `{${id}}`;
      return `_solutionid_value eq '${guidWithBraces}'`;
    }).join(' or ');

    const queryStart = Date.now();
    const result = await this.client.queryAll<SolutionComponent>('solutioncomponents', {
      select: ['objectid', 'componenttype', '_solutionid_value'],
      filter: solutionFilters,
    });
    this.logger?.log({
      timestamp: new Date(queryStart),
      step: 'Solution Component Discovery — Specific Solutions (alongside Default)',
      entitySet: 'solutioncomponents',
      filterSummary: `${solutionIds.length} specific solution(s) alongside Default Solution`,
      batchIndex: 1,
      batchTotal: 1,
      batchSize: solutionIds.length,
      status: 'success',
      attempts: 1,
      durationMs: Date.now() - queryStart,
      resultCount: result.value.length,
    });

    for (const component of result.value) {
      const objectId = normalizeGuid(component.objectid);
      const solutionId = normalizeGuid(component._solutionid_value || '');

      if (!componentToSolutions.has(objectId)) componentToSolutions.set(objectId, []);
      if (solutionId && !componentToSolutions.get(objectId)!.includes(solutionId)) {
        componentToSolutions.get(objectId)!.push(solutionId);
      }
      if (solutionId) {
        if (!solutionComponentMap.has(solutionId)) solutionComponentMap.set(solutionId, new Set());
        solutionComponentMap.get(solutionId)!.add(objectId);
      }
      componentTypes.set(objectId, component.componenttype);
    }

    return { componentToSolutions, solutionComponentMap, componentTypes };
  }

  /**
   * Discover ALL components (for Default Solution)
   * Queries each component type directly instead of using solutioncomponents table
   */
  private async discoverAllUnmanagedComponents(): Promise<ComponentInventoryWithSolutions> {
    const inventory: ComponentInventory = {
      entityIds: [],
      attributeIds: [],
      pluginIds: [],
      pluginPackageIds: [],
      workflowIds: [],
      webResourceIds: [],
      formIds: [],
      canvasAppIds: [],
      customPageIds: [],
      appModuleIds: [],
      connectionReferenceIds: [],
      customApiIds: [],
      environmentVariableIds: [],
      globalChoiceIds: [],
      customConnectorIds: [],
      securityRoleIds: [],
      fieldSecurityProfileIds: [],
      pcfControlIds: [],
      serviceEndpointIds: [],
      copilotAgentIds: [],
    };

    try {
      // logQuery: fetches ALL pages via queryAll (no top/skip needed) and logs the result.
      // On failure, logs status:'failed' before re-throwing so Fetch Diagnostics stays accurate.
      const logQuery = async <T extends object>(
        entitySet: string,
        queryOptions: Omit<QueryOptions, 'top'>,
        step: string
      ): Promise<QueryResult<T>> => {
        const t0 = Date.now();
        try {
          const r = await this.client.queryAll<T>(entitySet, queryOptions);
          this.logger?.log({
            timestamp: new Date(t0),
            step,
            entitySet,
            filterSummary: '',
            batchIndex: 1,
            batchTotal: 1,
            batchSize: 0,
            status: 'success',
            attempts: 1,
            durationMs: Date.now() - t0,
            resultCount: r.value.length,
          });
          return r;
        } catch (error) {
          this.logger?.log({
            timestamp: new Date(t0),
            step,
            entitySet,
            filterSummary: '',
            batchIndex: 1,
            batchTotal: 1,
            batchSize: 0,
            status: 'failed',
            attempts: 1,
            durationMs: Date.now() - t0,
            resultCount: 0,
            errorMessage: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      };

      // Query plugins (SDK Message Processing Steps) - all plugins
      const pluginsResult = await logQuery<{ sdkmessageprocessingstepid: string }>(
        'sdkmessageprocessingsteps',
        { select: ['sdkmessageprocessingstepid'] },
        'Default Solution — Plugin Steps'
      );
      inventory.pluginIds = pluginsResult.value.map(p => normalizeGuid(p.sdkmessageprocessingstepid));

      // Query workflows (all categories) - all workflows
      const workflowsResult = await logQuery<{ workflowid: string }>(
        'workflows',
        { select: ['workflowid'] },
        'Default Solution — Workflows'
      );
      inventory.workflowIds = workflowsResult.value.map(w => normalizeGuid(w.workflowid));

      // Query web resources - all
      const webResourcesResult = await logQuery<{ webresourceid: string }>(
        'webresourceset',
        { select: ['webresourceid'] },
        'Default Solution — Web Resources'
      );
      inventory.webResourceIds = webResourcesResult.value.map(w => normalizeGuid(w.webresourceid));

      // Query custom APIs - all
      const customApisResult = await logQuery<{ customapiid: string }>(
        'customapis',
        { select: ['customapiid'] },
        'Default Solution — Custom APIs'
      );
      inventory.customApiIds = customApisResult.value.map(c => normalizeGuid(c.customapiid));

      // Query environment variables - all
      const envVarsResult = await logQuery<{ environmentvariabledefinitionid: string }>(
        'environmentvariabledefinitions',
        { select: ['environmentvariabledefinitionid'] },
        'Default Solution — Environment Variables'
      );
      inventory.environmentVariableIds = envVarsResult.value.map(e => normalizeGuid(e.environmentvariabledefinitionid));

      // Query connection references - all
      const connRefsResult = await logQuery<{ connectionreferenceid: string }>(
        'connectionreferences',
        { select: ['connectionreferenceid'] },
        'Default Solution — Connection References'
      );
      inventory.connectionReferenceIds = connRefsResult.value.map(c => normalizeGuid(c.connectionreferenceid));

      // Query custom connectors - all connectors in the environment
      // Note: iscustomizable/Value filter is unreliable (ManagedProperty OData navigation
      // returns 0 results silently in some environments). Fetch all connectors; the connectors
      // table only contains connectors registered in this environment, not built-in platform connectors.
      const customConnectorsResult = await logQuery<{ connectorid: string }>(
        'connectors',
        { select: ['connectorid'] },
        'Default Solution — Custom Connectors'
      );
      inventory.customConnectorIds = customConnectorsResult.value.map(c => normalizeGuid(c.connectorid));

      // Query plugin packages - all
      const pluginPackagesResult = await logQuery<{ pluginpackageid: string }>(
        'pluginpackages',
        { select: ['pluginpackageid'] },
        'Default Solution — Plugin Packages'
      );
      inventory.pluginPackageIds = pluginPackagesResult.value.map(p => normalizeGuid(p.pluginpackageid));

      // Query security roles - all
      const securityRolesResult = await logQuery<{ roleid: string }>(
        'roles',
        { select: ['roleid'] },
        'Default Solution — Security Roles'
      );
      inventory.securityRoleIds = securityRolesResult.value.map(r => normalizeGuid(r.roleid));

      // Query field security profiles - all
      const fieldSecurityProfilesResult = await logQuery<{ fieldsecurityprofileid: string }>(
        'fieldsecurityprofiles',
        { select: ['fieldsecurityprofileid'] },
        'Default Solution — Field Security Profiles'
      );
      inventory.fieldSecurityProfileIds = fieldSecurityProfilesResult.value.map(f => normalizeGuid(f.fieldsecurityprofileid));

      // PCF Controls - all custom controls
      const pcfControlsResult = await logQuery<{ customcontrolid: string }>(
        'customcontrols',
        { select: ['customcontrolid'] },
        'Default Solution — PCF Controls'
      );
      inventory.pcfControlIds = pcfControlsResult.value.map(c => normalizeGuid(c.customcontrolid));

      // Service Endpoints - all service endpoints
      const serviceEndpointsResult = await logQuery<{ serviceendpointid: string }>(
        'serviceendpoints',
        { select: ['serviceendpointid'] },
        'Default Solution — Service Endpoints'
      );
      inventory.serviceEndpointIds = serviceEndpointsResult.value.map(s => normalizeGuid(s.serviceendpointid));

      // Copilot Studio Agents - all bots (wrapped in try/catch — some environments may not have the bots table)
      const t0Bots = Date.now();
      try {
        const botsResult = await this.client.queryAll<{ botid: string }>(
          'bots', { select: ['botid'] }
        );
        this.logger?.log({
          timestamp: new Date(t0Bots),
          step: 'Default Solution — Copilot Agents',
          entitySet: 'bots',
          filterSummary: '',
          batchIndex: 1,
          batchTotal: 1,
          batchSize: 0,
          status: 'success',
          attempts: 1,
          durationMs: Date.now() - t0Bots,
          resultCount: botsResult.value.length,
        });
        inventory.copilotAgentIds = botsResult.value.map(b => normalizeGuid(b.botid));
      } catch (error) {
        this.logger?.log({
          timestamp: new Date(t0Bots),
          step: 'Default Solution — Copilot Agents',
          entitySet: 'bots',
          filterSummary: '',
          batchIndex: 1,
          batchTotal: 1,
          batchSize: 0,
          status: 'failed',
          attempts: 1,
          durationMs: Date.now() - t0Bots,
          resultCount: 0,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        // Continue with empty copilotAgentIds — bots table may not exist in all environments
      }

      // Canvas apps and Custom Pages both use component type 300 in solutioncomponents
      // and live in the canvasapps entity. Splitting is done post-retrieval by apptype.
      const canvasAppsResult = await logQuery<{ canvasappid: string }>(
        'canvasapps',
        { select: ['canvasappid'] },
        'Default Solution — Canvas Apps'
      );
      inventory.canvasAppIds = canvasAppsResult.value.map(c => normalizeGuid(c.canvasappid));

      // Model-Driven Apps (appmodules) - all
      const appModulesResult = await logQuery<{ appmoduleid: string }>(
        'appmodules',
        { select: ['appmoduleid'] },
        'Default Solution — App Modules'
      );
      inventory.appModuleIds = appModulesResult.value.map(a => normalizeGuid(a.appmoduleid));

      // Global choices (option sets) — wrapped in its own try/catch so a metadata API failure
      // does not abort the entire Default Solution discovery (PATTERN-012: continue on item failure).
      const t0GlobalChoices = Date.now();
      try {
        const globalChoicesResult = await this.client.queryMetadata<{ MetadataId: string }>(
          'GlobalOptionSetDefinitions',
          { select: ['MetadataId'] }
        );
        this.logger?.log({
          timestamp: new Date(t0GlobalChoices),
          step: 'Default Solution — Global Choices',
          entitySet: 'GlobalOptionSetDefinitions',
          filterSummary: '',
          batchIndex: 1,
          batchTotal: 1,
          batchSize: 0,
          status: 'success',
          attempts: 1,
          durationMs: Date.now() - t0GlobalChoices,
          resultCount: globalChoicesResult.value.length,
        });
        inventory.globalChoiceIds = globalChoicesResult.value.map(g => normalizeGuid(g.MetadataId));
      } catch (error) {
        // Continue with empty globalChoiceIds rather than aborting all discovery (PATTERN-012)
        this.logger?.log({
          timestamp: new Date(t0GlobalChoices),
          step: 'Default Solution — Global Choices',
          entitySet: 'GlobalOptionSetDefinitions',
          filterSummary: '',
          batchIndex: 1,
          batchTotal: 1,
          batchSize: 0,
          status: 'failed',
          attempts: 1,
          durationMs: Date.now() - t0GlobalChoices,
          resultCount: 0,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      }

      // For entities and attributes, we'll use the metadata API via EntityDiscovery
      // These will be handled by the BlueprintGenerator's entity discovery process

      // For Default Solution, we don't have solution membership tracking
      return {
        ...inventory,
        componentToSolutions: new Map(),
        solutionComponentMap: new Map(),
        componentTypes: new Map(),
        entitiesWithAllSubcomponents: new Set<string>(), // Default solution: no rootcomponentbehavior tracking
      };
    } catch (error) {
      throw new Error(
        `Failed to discover unmanaged components: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Classify workflows into flows, business rules, classic workflows, and BPFs
   * @param workflowIds Array of workflow IDs to classify
   * @param solutionComponentMap Optional solution component map for tracking membership
   * @param componentToSolutions Optional component to solutions map for tracking membership
   * @returns Classified workflow inventory with solution tracking
   */
  async classifyWorkflows(
    workflowIds: string[],
    solutionComponentMap?: Map<string, Set<string>>,
    componentToSolutions?: Map<string, string[]>
  ): Promise<WorkflowInventoryWithSolutions> {
    try {
      if (workflowIds.length === 0) {
        return {
          flowIds: [],
          businessRuleIds: [],
          classicWorkflowIds: [],
          businessProcessFlowIds: [],
          componentToSolutions: componentToSolutions || new Map(),
          solutionComponentMap: solutionComponentMap || new Map(),
        };
      }

      const inventory: WorkflowInventory = {
        flowIds: [],
        businessRuleIds: [],
        classicWorkflowIds: [],
        businessProcessFlowIds: [],
      };

      // BATCH QUERIES to avoid HTTP 414 (URL too long) errors
      // Large solutions can have 100+ workflows
      const { results: allWorkflows } = await withAdaptiveBatch<string, WorkflowRecord>(
        workflowIds,
        async (batch) => {
          const filters = batch.map(id => {
            return `workflowid eq ${normalizeGuid(id)}`;
          }).join(' or ');
          const result = await this.client.query<WorkflowRecord>('workflows', {
            select: ['workflowid', 'category'],
            filter: filters,
          });
          return result.value;
        },
        {
          initialBatchSize: 20,
          step: 'Workflow Classification',
          entitySet: 'workflows',
          logger: this.logger,
        }
      );

      // Classify by category
      for (const workflow of allWorkflows) {
        const workflowId = normalizeGuid(workflow.workflowid);
        const cat = Number(workflow.category); // coerce in case API returns string

        switch (cat) {
          case WorkflowCategory.Flow:
            inventory.flowIds.push(workflowId);
            break;
          case WorkflowCategory.BusinessRule:
            inventory.businessRuleIds.push(workflowId);
            break;
          case WorkflowCategory.ClassicWorkflow:
            inventory.classicWorkflowIds.push(workflowId);
            break;
          case WorkflowCategory.BusinessProcessFlow:
            inventory.businessProcessFlowIds.push(workflowId);
            break;
        }
      }

      return {
        ...inventory,
        componentToSolutions: componentToSolutions || new Map(),
        solutionComponentMap: solutionComponentMap || new Map(),
      };
    } catch (error) {
      throw new Error(
        `Failed to classify workflows: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
