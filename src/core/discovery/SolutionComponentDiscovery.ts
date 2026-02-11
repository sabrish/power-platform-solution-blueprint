import type { IDataverseClient } from '../dataverse/IDataverseClient.js';
import { ComponentType, WorkflowCategory, type ComponentInventory, type ComponentInventoryWithSolutions, type WorkflowInventory, type WorkflowInventoryWithSolutions } from '../types/components.js';

/**
 * Solution component record
 */
interface SolutionComponent {
  objectid: string;
  componenttype: number;
  _solutionid_value?: string;
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
  ): Promise<ComponentInventoryWithSolutions> {
    try {
      const inventory: ComponentInventory = {
        entityIds: [],
        attributeIds: [],
        pluginIds: [],
        pluginPackageIds: [],
        workflowIds: [],
        webResourceIds: [],
        canvasAppIds: [],
        customPageIds: [],
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

      // Check if Default Solution is among the selected solutions
      const includesDefaultSolution = solutionUniqueNames?.some(name => name.toLowerCase() === 'default');

      if (includesDefaultSolution) {
        return this.discoverAllUnmanagedComponents();
      }

      // OPTIMIZED: Query all solution components in a single batch query using OR filters
      // This reduces N queries (one per solution) to 1 query for all solutions
      const solutionFilters = solutionIds.map(id => {
        const guidWithBraces = id.startsWith('{') ? id : `{${id}}`;
        return `_solutionid_value eq '${guidWithBraces}'`;
      }).join(' or ');

      const result = await this.client.query<SolutionComponent>('solutioncomponents', {
        select: ['objectid', 'componenttype', '_solutionid_value'],
        filter: solutionFilters,
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

      return {
        ...inventory,
        componentToSolutions,
        solutionComponentMap,
        componentTypes,
      } as ComponentInventoryWithSolutions;
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
  private async discoverAllUnmanagedComponents(): Promise<ComponentInventoryWithSolutions> {
    const inventory: ComponentInventory = {
      entityIds: [],
      attributeIds: [],
      pluginIds: [],
      pluginPackageIds: [],
      workflowIds: [],
      webResourceIds: [],
      canvasAppIds: [],
      customPageIds: [],
      connectionReferenceIds: [],
      customApiIds: [],
      environmentVariableIds: [],
      globalChoiceIds: [],
      customConnectorIds: [],
      securityRoleIds: [],
      fieldSecurityProfileIds: [],
    };

    try {
      // Query plugins (SDK Message Processing Steps) - all plugins
      const pluginsResult = await this.client.query<{ sdkmessageprocessingstepid: string }>('sdkmessageprocessingsteps', {
        select: ['sdkmessageprocessingstepid'],
      });
      inventory.pluginIds = pluginsResult.value.map(p => p.sdkmessageprocessingstepid.toLowerCase().replace(/[{}]/g, ''));

      // Query workflows (all categories) - all workflows
      const workflowsResult = await this.client.query<{ workflowid: string }>('workflows', {
        select: ['workflowid'],
      });
      inventory.workflowIds = workflowsResult.value.map(w => w.workflowid.toLowerCase().replace(/[{}]/g, ''));

      // Query web resources - all
      const webResourcesResult = await this.client.query<{ webresourceid: string }>('webresourceset', {
        select: ['webresourceid'],
      });
      inventory.webResourceIds = webResourcesResult.value.map(w => w.webresourceid.toLowerCase().replace(/[{}]/g, ''));

      // Query custom APIs - all
      const customApisResult = await this.client.query<{ customapiid: string }>('customapis', {
        select: ['customapiid'],
      });
      inventory.customApiIds = customApisResult.value.map(c => c.customapiid.toLowerCase().replace(/[{}]/g, ''));

      // Query environment variables - all
      const envVarsResult = await this.client.query<{ environmentvariabledefinitionid: string }>('environmentvariabledefinitions', {
        select: ['environmentvariabledefinitionid'],
      });
      inventory.environmentVariableIds = envVarsResult.value.map(e => e.environmentvariabledefinitionid.toLowerCase().replace(/[{}]/g, ''));

      // Query connection references - all
      const connRefsResult = await this.client.query<{ connectionreferenceid: string }>('connectionreferences', {
        select: ['connectionreferenceid'],
      });
      inventory.connectionReferenceIds = connRefsResult.value.map(c => c.connectionreferenceid.toLowerCase().replace(/[{}]/g, ''));

      // Query custom connectors - all customizable
      const customConnectorsResult = await this.client.query<{ connectorid: string }>('connectors', {
        select: ['connectorid'],
        filter: 'iscustomizable/Value eq true',
      });
      inventory.customConnectorIds = customConnectorsResult.value.map(c => c.connectorid.toLowerCase().replace(/[{}]/g, ''));

      // Query security roles - all
      const securityRolesResult = await this.client.query<{ roleid: string }>('roles', {
        select: ['roleid'],
      });
      inventory.securityRoleIds = securityRolesResult.value.map(r => r.roleid.toLowerCase().replace(/[{}]/g, ''));

      // Query field security profiles - all
      const fieldSecurityProfilesResult = await this.client.query<{ fieldsecurityprofileid: string }>('fieldsecurityprofiles', {
        select: ['fieldsecurityprofileid'],
      });
      inventory.fieldSecurityProfileIds = fieldSecurityProfilesResult.value.map(f => f.fieldsecurityprofileid.toLowerCase().replace(/[{}]/g, ''));

      // Canvas apps - all
      const canvasAppsResult = await this.client.query<{ canvasappid: string }>('canvasapps', {
        select: ['canvasappid'],
      });
      inventory.canvasAppIds = canvasAppsResult.value.map(c => c.canvasappid.toLowerCase().replace(/[{}]/g, ''));

      // For entities and attributes, we'll use the metadata API via EntityDiscovery
      // These will be handled by the BlueprintGenerator's entity discovery process

      // For Default Solution, we don't have solution membership tracking
      return {
        ...inventory,
        componentToSolutions: new Map(),
        solutionComponentMap: new Map(),
        componentTypes: new Map(),
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
      const batchSize = 20;
      const allWorkflows: WorkflowRecord[] = [];

      for (let i = 0; i < workflowIds.length; i += batchSize) {
        const batch = workflowIds.slice(i, i + batchSize);
        const filters = batch.map(id => {
          const guidWithBraces = id.startsWith('{') ? id : `{${id}}`;
          return `workflowid eq '${guidWithBraces}'`;
        }).join(' or ');

        const result = await this.client.query<WorkflowRecord>('workflows', {
          select: ['workflowid', 'category'],
          filter: filters,
        });

        allWorkflows.push(...result.value);
      }

      // Classify by category
      for (const workflow of allWorkflows) {
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
