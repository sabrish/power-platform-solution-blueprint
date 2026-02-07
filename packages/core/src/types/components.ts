/**
 * Component inventory types for solution discovery
 */

/**
 * Inventory of components found in solution(s)
 */
export interface ComponentInventory {
  entityIds: string[];
  attributeIds: string[];
  pluginIds: string[];
  workflowIds: string[];
  webResourceIds: string[];
  canvasAppIds: string[];
  customPageIds: string[];
  connectionReferenceIds: string[];
}

/**
 * Classified workflow inventory
 */
export interface WorkflowInventory {
  flowIds: string[];
  businessRuleIds: string[];
  classicWorkflowIds: string[];
  businessProcessFlowIds: string[];
}

/**
 * Solution component type codes
 */
export enum ComponentType {
  Entity = 1,
  Attribute = 2,
  Plugin = 80,
  Workflow = 29,
  WebResource = 61,
  CanvasApp = 300,
  CustomPage = 10004,
  ConnectionReference = 371,
}

/**
 * Workflow category codes
 */
export enum WorkflowCategory {
  ClassicWorkflow = 0,
  BusinessRule = 2,
  BusinessProcessFlow = 4,
  Flow = 5,
}
