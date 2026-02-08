import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import { ComponentType, WorkflowCategory, type ComponentInventory, type WorkflowInventory } from '../types/components.js';

/**
 * Solution component record
 */
interface SolutionComponent {
  objectid: string;
  componenttype: number;
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

  constructor(client: IDataverseClient) {
    this.client = client;
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
  ): Promise<ComponentInventory> {
    try {
      const inventory: ComponentInventory = {
        entityIds: [],
        attributeIds: [],
        pluginIds: [],
        workflowIds: [],
        webResourceIds: [],
        canvasAppIds: [],
        customPageIds: [],
        connectionReferenceIds: [],
        customApiIds: [],
        environmentVariableIds: [],
        globalChoiceIds: [],
        customConnectorIds: [],
      };

      // Check if Default Solution is among the selected solutions
      const includesDefaultSolution = solutionUniqueNames?.some(name => name.toLowerCase() === 'default');

      if (includesDefaultSolution) {
        console.log('🔍 Default Solution detected - querying ALL unmanaged components');
        return this.discoverAllUnmanagedComponents();
      }

      // OPTIMIZED: Query all solution components in a single batch query using OR filters
      // This reduces N queries (one per solution) to 1 query for all solutions
      const solutionFilters = solutionIds.map(id => {
        const guidWithBraces = id.startsWith('{') ? id : `{${id}}`;
        return `_solutionid_value eq '${guidWithBraces}'`;
      }).join(' or ');

      const result = await this.client.query<SolutionComponent>('solutioncomponents', {
        select: ['objectid', 'componenttype'],
        filter: solutionFilters,
      });

      console.log(`🔍 Solution Components Discovery: Found ${result.value.length} total components`);

      // Count components by type for debugging
      const typeCounts = new Map<number, number>();
      for (const comp of result.value) {
        typeCounts.set(comp.componenttype, (typeCounts.get(comp.componenttype) || 0) + 1);
      }
      console.log('📊 Components by type:', Object.fromEntries(typeCounts));

      // Group by component type (deduplicates across solutions)
      for (const component of result.value) {
        // Normalize GUID: remove braces and lowercase for consistent comparison
        const objectId = component.objectid.toLowerCase().replace(/[{}]/g, '');

          switch (component.componenttype) {
            case ComponentType.Entity:
              if (!inventory.entityIds.includes(objectId)) {
                inventory.entityIds.push(objectId);
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
            case ComponentType.SdkMessageProcessingStep:
              if (!inventory.pluginIds.includes(objectId)) {
                inventory.pluginIds.push(objectId);
                console.log(`🔌 Found plugin: ${objectId}`);
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
            case ComponentType.CanvasApp:
              if (!inventory.canvasAppIds.includes(objectId)) {
                inventory.canvasAppIds.push(objectId);
              }
              break;
            case ComponentType.CustomPage:
              if (!inventory.customPageIds.includes(objectId)) {
                inventory.customPageIds.push(objectId);
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

      // Log final inventory counts
      console.log('✅ Discovery Results:', {
        entities: inventory.entityIds.length,
        attributes: inventory.attributeIds.length,
        plugins: inventory.pluginIds.length,
        workflows: inventory.workflowIds.length,
        webResources: inventory.webResourceIds.length,
        canvasApps: inventory.canvasAppIds.length,
        customPages: inventory.customPageIds.length,
        connectionRefs: inventory.connectionReferenceIds.length,
        customApis: inventory.customApiIds.length,
        envVars: inventory.environmentVariableIds.length,
        globalChoices: inventory.globalChoiceIds.length,
        customConnectors: inventory.customConnectorIds.length,
      });

      console.log(`🔌 PLUGINS: Found ${inventory.pluginIds.length} plugin(s):`, inventory.pluginIds);

      return inventory;
    } catch (error) {
      throw new Error(
        `Failed to discover solution components: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Discover ALL components (for Default Solution)
   * Queries each component type directly instead of using solutioncomponents table
   */
  private async discoverAllUnmanagedComponents(): Promise<ComponentInventory> {
    const inventory: ComponentInventory = {
      entityIds: [],
      attributeIds: [],
      pluginIds: [],
      workflowIds: [],
      webResourceIds: [],
      canvasAppIds: [],
      customPageIds: [],
      connectionReferenceIds: [],
      customApiIds: [],
      environmentVariableIds: [],
      globalChoiceIds: [],
      customConnectorIds: [],
    };

    console.log('🔍 Querying ALL components across the environment (Default Solution)...');

    try {
      // Query plugins (SDK Message Processing Steps) - all plugins
      const pluginsResult = await this.client.query<{ sdkmessageprocessingstepid: string }>('sdkmessageprocessingsteps', {
        select: ['sdkmessageprocessingstepid'],
      });
      inventory.pluginIds = pluginsResult.value.map(p => p.sdkmessageprocessingstepid.toLowerCase().replace(/[{}]/g, ''));
      console.log(`🔌 Found ${inventory.pluginIds.length} plugins`);

      // Query workflows (all categories) - all workflows
      const workflowsResult = await this.client.query<{ workflowid: string }>('workflows', {
        select: ['workflowid'],
      });
      inventory.workflowIds = workflowsResult.value.map(w => w.workflowid.toLowerCase().replace(/[{}]/g, ''));
      console.log(`📋 Found ${inventory.workflowIds.length} workflows`);

      // Query web resources - all
      const webResourcesResult = await this.client.query<{ webresourceid: string }>('webresourceset', {
        select: ['webresourceid'],
      });
      inventory.webResourceIds = webResourcesResult.value.map(w => w.webresourceid.toLowerCase().replace(/[{}]/g, ''));
      console.log(`📦 Found ${inventory.webResourceIds.length} web resources`);

      // Query custom APIs - all
      const customApisResult = await this.client.query<{ customapiid: string }>('customapis', {
        select: ['customapiid'],
      });
      inventory.customApiIds = customApisResult.value.map(c => c.customapiid.toLowerCase().replace(/[{}]/g, ''));
      console.log(`🔧 Found ${inventory.customApiIds.length} custom APIs`);

      // Query environment variables - all
      const envVarsResult = await this.client.query<{ environmentvariabledefinitionid: string }>('environmentvariabledefinitions', {
        select: ['environmentvariabledefinitionid'],
      });
      inventory.environmentVariableIds = envVarsResult.value.map(e => e.environmentvariabledefinitionid.toLowerCase().replace(/[{}]/g, ''));
      console.log(`🌍 Found ${inventory.environmentVariableIds.length} environment variables`);

      // Query connection references - all
      const connRefsResult = await this.client.query<{ connectionreferenceid: string }>('connectionreferences', {
        select: ['connectionreferenceid'],
      });
      inventory.connectionReferenceIds = connRefsResult.value.map(c => c.connectionreferenceid.toLowerCase().replace(/[{}]/g, ''));
      console.log(`🔗 Found ${inventory.connectionReferenceIds.length} connection references`);

      // Query custom connectors - all customizable
      const customConnectorsResult = await this.client.query<{ connectorid: string }>('connectors', {
        select: ['connectorid'],
        filter: 'iscustomizable/Value eq true',
      });
      inventory.customConnectorIds = customConnectorsResult.value.map(c => c.connectorid.toLowerCase().replace(/[{}]/g, ''));
      console.log(`🔌 Found ${inventory.customConnectorIds.length} custom connectors`);

      // Canvas apps - all
      const canvasAppsResult = await this.client.query<{ canvasappid: string }>('canvasapps', {
        select: ['canvasappid'],
      });
      inventory.canvasAppIds = canvasAppsResult.value.map(c => c.canvasappid.toLowerCase().replace(/[{}]/g, ''));
      console.log(`🎨 Found ${inventory.canvasAppIds.length} canvas apps`);

      // For entities and attributes, we'll use the metadata API via EntityDiscovery
      // These will be handled by the BlueprintGenerator's entity discovery process
      console.log('📊 Entity and attribute discovery will be handled by entity metadata queries');

      console.log('✅ All components discovered for Default Solution');
      return inventory;
    } catch (error) {
      console.error('❌ Error discovering components:', error);
      throw new Error(
        `Failed to discover unmanaged components: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Classify workflows into flows, business rules, classic workflows, and BPFs
   * @param workflowIds Array of workflow IDs to classify
   * @returns Classified workflow inventory
   */
  async classifyWorkflows(workflowIds: string[]): Promise<WorkflowInventory> {
    try {
      if (workflowIds.length === 0) {
        return {
          flowIds: [],
          businessRuleIds: [],
          classicWorkflowIds: [],
          businessProcessFlowIds: [],
        };
      }

      const inventory: WorkflowInventory = {
        flowIds: [],
        businessRuleIds: [],
        classicWorkflowIds: [],
        businessProcessFlowIds: [],
      };

      // Query workflows to get their categories
      // Build filter for workflow IDs (GUIDs need braces and quotes in OData)
      const filters = workflowIds.map(id => {
        const guidWithBraces = id.startsWith('{') ? id : `{${id}}`;
        return `workflowid eq '${guidWithBraces}'`;
      }).join(' or ');

      const result = await this.client.query<WorkflowRecord>('workflows', {
        select: ['workflowid', 'category'],
        filter: filters,
      });

      // Classify by category
      for (const workflow of result.value) {
        const workflowId = workflow.workflowid.toLowerCase();

        switch (workflow.category) {
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

      return inventory;
    } catch (error) {
      throw new Error(
        `Failed to classify workflows: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
