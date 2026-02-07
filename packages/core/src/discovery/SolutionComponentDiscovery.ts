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
   * @returns Inventory of all component types found
   */
  async discoverComponents(solutionIds: string[]): Promise<ComponentInventory> {
    try {
      const inventory: ComponentInventory = {
        entityIds: [],
        pluginIds: [],
        workflowIds: [],
        webResourceIds: [],
        canvasAppIds: [],
        customPageIds: [],
        connectionReferenceIds: [],
      };

      // Query solution components for each solution
      for (const solutionId of solutionIds) {
        const result = await this.client.query<SolutionComponent>('solutioncomponents', {
          select: ['objectid', 'componenttype'],
          filter: `_solutionid_value eq ${solutionId}`,
        });

        // Group by component type
        for (const component of result.value) {
          const objectId = component.objectid.toLowerCase();

          switch (component.componenttype) {
            case ComponentType.Entity:
              if (!inventory.entityIds.includes(objectId)) {
                inventory.entityIds.push(objectId);
              }
              break;
            case ComponentType.Plugin:
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
          }
        }
      }

      return inventory;
    } catch (error) {
      throw new Error(
        `Failed to discover solution components: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      // Build filter for workflow IDs
      const filters = workflowIds.map(id => `workflowid eq ${id}`).join(' or ');

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
