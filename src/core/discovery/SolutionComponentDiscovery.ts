import type { IDataverseClient, QueryOptions } from '../dataverse/IDataverseClient.js';
import type { FetchLogger } from '../utils/FetchLogger.js';
import { withAdaptiveBatch } from '../utils/withAdaptiveBatch.js';
import { ComponentType, WorkflowCategory, type ComponentInventory, type ComponentInventoryWithSolutions, type WorkflowInventory, type WorkflowInventoryWithSolutions } from '../types/components.js';

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
          return { ...unmanagedResult, ...mapResult };
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
      const result = await this.client.query<SolutionComponent>('solutioncomponents', {
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
        const objectId = component.objectid.toLowerCase().replace(/[{}]/g, '');
        const componentType = component.componenttype;
        const solutionId = (component._solutionid_value || '').toLowerCase().replace(/[{}]/g, '');

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
          case ComponentType.PluginPackage:
            if (!inventory.pluginPackageIds.includes(objectId)) {
              inventory.pluginPackageIds.push(objectId);
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
          case ComponentType.ConnectionReference:
            if (!inventory.connectionReferenceIds.includes(objectId)) {
              inventory.connectionReferenceIds.push(objectId);
            }
            break;
          case ComponentType.CustomConnector:
            if (!inventory.customConnectorIds.includes(objectId)) {
              inventory.customConnectorIds.push(objectId);
            }
            break;
          case ComponentType.CustomAPI:
            if (!inventory.customApiIds.includes(objectId)) {
              inventory.customApiIds.push(objectId);
            }
            break;
          case ComponentType.EnvironmentVariableDefinition:
            if (!inventory.environmentVariableIds.includes(objectId)) {
              inventory.environmentVariableIds.push(objectId);
            }
            break;
        }
        }

      return {
        ...inventory,
        componentToSolutions,
        solutionComponentMap,
        componentTypes,
        entitiesWithAllSubcomponents,
      } as ComponentInventoryWithSolutions;
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
    const result = await this.client.query<SolutionComponent>('solutioncomponents', {
      select: ['objectid', 'componenttype', '_solutionid_value'],
      filter: solutionFilters,
    });
    this.logger?.log({
      timestamp: new Date(queryStart),
      step: 'Solution Component Discovery',
      entitySet: 'solutioncomponents',
      filterSummary: `${solutionIds.length} specific solution(s) alongside Default`,
      batchIndex: 1,
      batchTotal: 1,
      batchSize: solutionIds.length,
      status: 'success',
      attempts: 1,
      durationMs: Date.now() - queryStart,
      resultCount: result.value.length,
    });

    for (const component of result.value) {
      const objectId = component.objectid.toLowerCase().replace(/[{}]/g, '');
      const solutionId = (component._solutionid_value || '').toLowerCase().replace(/[{}]/g, '');

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
    };

    try {
      const logQuery = async <T extends object>(
        entitySet: string,
        queryOptions: QueryOptions,
        step: string
      ): Promise<{ value: T[] }> => {
        const t0 = Date.now();
        const r = await this.client.query<T>(entitySet, queryOptions);
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
      };

      // Query plugins (SDK Message Processing Steps) - all plugins
      const pluginsResult = await logQuery<{ sdkmessageprocessingstepid: string }>(
        'sdkmessageprocessingsteps',
        { select: ['sdkmessageprocessingstepid'] },
        'Solution Component Discovery'
      );
      inventory.pluginIds = pluginsResult.value.map(p => p.sdkmessageprocessingstepid.toLowerCase().replace(/[{}]/g, ''));

      // Query workflows (all categories) - all workflows
      const workflowsResult = await logQuery<{ workflowid: string }>(
        'workflows',
        { select: ['workflowid'] },
        'Solution Component Discovery'
      );
      inventory.workflowIds = workflowsResult.value.map(w => w.workflowid.toLowerCase().replace(/[{}]/g, ''));

      // Query web resources - all
      const webResourcesResult = await logQuery<{ webresourceid: string }>(
        'webresourceset',
        { select: ['webresourceid'] },
        'Solution Component Discovery'
      );
      inventory.webResourceIds = webResourcesResult.value.map(w => w.webresourceid.toLowerCase().replace(/[{}]/g, ''));

      // Query custom APIs - all
      const customApisResult = await logQuery<{ customapiid: string }>(
        'customapis',
        { select: ['customapiid'] },
        'Solution Component Discovery'
      );
      inventory.customApiIds = customApisResult.value.map(c => c.customapiid.toLowerCase().replace(/[{}]/g, ''));

      // Query environment variables - all
      const envVarsResult = await logQuery<{ environmentvariabledefinitionid: string }>(
        'environmentvariabledefinitions',
        { select: ['environmentvariabledefinitionid'] },
        'Solution Component Discovery'
      );
      inventory.environmentVariableIds = envVarsResult.value.map(e => e.environmentvariabledefinitionid.toLowerCase().replace(/[{}]/g, ''));

      // Query connection references - all
      const connRefsResult = await logQuery<{ connectionreferenceid: string }>(
        'connectionreferences',
        { select: ['connectionreferenceid'] },
        'Solution Component Discovery'
      );
      inventory.connectionReferenceIds = connRefsResult.value.map(c => c.connectionreferenceid.toLowerCase().replace(/[{}]/g, ''));

      // Query custom connectors - all connectors in the environment
      // Note: iscustomizable/Value filter is unreliable (ManagedProperty OData navigation
      // returns 0 results silently in some environments). Fetch all connectors; the connectors
      // table only contains connectors registered in this environment, not built-in platform connectors.
      const customConnectorsResult = await logQuery<{ connectorid: string }>(
        'connectors',
        { select: ['connectorid'] },
        'Solution Component Discovery'
      );
      inventory.customConnectorIds = customConnectorsResult.value.map(c => c.connectorid.toLowerCase().replace(/[{}]/g, ''));

      // Query security roles - all
      const securityRolesResult = await logQuery<{ roleid: string }>(
        'roles',
        { select: ['roleid'] },
        'Solution Component Discovery'
      );
      inventory.securityRoleIds = securityRolesResult.value.map(r => r.roleid.toLowerCase().replace(/[{}]/g, ''));

      // Query field security profiles - all
      const fieldSecurityProfilesResult = await logQuery<{ fieldsecurityprofileid: string }>(
        'fieldsecurityprofiles',
        { select: ['fieldsecurityprofileid'] },
        'Solution Component Discovery'
      );
      inventory.fieldSecurityProfileIds = fieldSecurityProfilesResult.value.map(f => f.fieldsecurityprofileid.toLowerCase().replace(/[{}]/g, ''));

      // Canvas apps and Custom Pages both use component type 300 in solutioncomponents
      // and live in the canvasapps entity. Splitting is done post-retrieval by apptype.
      const canvasAppsResult = await logQuery<{ canvasappid: string }>(
        'canvasapps',
        { select: ['canvasappid'] },
        'Solution Component Discovery'
      );
      inventory.canvasAppIds = canvasAppsResult.value.map(c => c.canvasappid.toLowerCase().replace(/[{}]/g, ''));

      // Model-Driven Apps (appmodules) - all
      const appModulesResult = await logQuery<{ appmoduleid: string }>(
        'appmodules',
        { select: ['appmoduleid'] },
        'Solution Component Discovery'
      );
      inventory.appModuleIds = appModulesResult.value.map(a => a.appmoduleid.toLowerCase().replace(/[{}]/g, ''));

      // Global choices (option sets) - query metadata API for all GlobalOptionSetDefinitions
      const t0GlobalChoices = Date.now();
      const globalChoicesResult = await this.client.queryMetadata<{ MetadataId: string }>(
        'GlobalOptionSetDefinitions',
        { select: ['MetadataId'] }
      );
      this.logger?.log({
        timestamp: new Date(t0GlobalChoices),
        step: 'Solution Component Discovery',
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
      inventory.globalChoiceIds = globalChoicesResult.value.map(g => g.MetadataId.toLowerCase().replace(/[{}]/g, ''));

      // For entities and attributes, we'll use the metadata API via EntityDiscovery
      // These will be handled by the BlueprintGenerator's entity discovery process

      // For Default Solution, we don't have solution membership tracking
      return {
        ...inventory,
        componentToSolutions: new Map(),
        solutionComponentMap: new Map(),
        componentTypes: new Map(),
        entitiesWithAllSubcomponents: new Set(), // Default solution: no rootcomponentbehavior tracking
      } as ComponentInventoryWithSolutions;
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
            const cleanGuid = id.replace(/[{}]/g, '');
            return `workflowid eq ${cleanGuid}`;
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
        const workflowId = workflow.workflowid.toLowerCase().replace(/[{}]/g, '');
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
